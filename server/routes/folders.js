const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { folderValidation, uuidValidation } = require('../middleware/validation');

const router = express.Router();

// Get all folders for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM folders WHERE user_id = $1 ORDER BY name',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create folder
router.post('/', authenticateToken, folderValidation, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.user.id;

    const result = await pool.query(`
      INSERT INTO folders (user_id, name, description, color)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, name, description || '', color || '#3B82F6']);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update folder
router.put('/:id', authenticateToken, uuidValidation, folderValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const userId = req.user.id;

    const result = await pool.query(`
      UPDATE folders 
      SET name = $1, description = $2, color = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [name, description || '', color || '#3B82F6', id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete folder
router.delete('/:id', authenticateToken, uuidValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query('BEGIN');

    // Move snippets to uncategorized (set folder_id to null)
    await pool.query(
      'UPDATE snippets SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2',
      [id, userId]
    );

    // Delete folder
    const result = await pool.query(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Folder not found' });
    }

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

module.exports = router;