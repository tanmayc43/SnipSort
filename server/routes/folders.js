const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { folderValidation, uuidValidation } = require('../middleware/validation');

const router = express.Router();

// GET /api/folders - fetch all folders for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM folders WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );

    res.json(result.rows); // return array of folders directly
  }
  catch(error){
    console.error('Get folders error:', error.message);
    res.status(500).json({ message: 'Server error while fetching folders.' });
  }
});

// GET /api/folders/:id - get a single folder by ID
router.get('/:id', authenticateToken, uuidValidation, async (req, res) => {
    try{
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            'SELECT * FROM folders WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if(result.rows.length === 0){
            return res.status(404).json({ message: 'Folder not found or you do not have permission to view it.' });
        }

        res.json(result.rows[0]);
    } 
    catch(error){
        console.error('Get single folder error:', error);
        res.status(500).json({ message: 'Server error while fetching the folder.' });
    }
});

// POST /api/folders - create a new folder
router.post('/', authenticateToken, folderValidation, async (req, res) => {
  try{
    const { name, description, color } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      'INSERT INTO folders (user_id, name, description, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, description || '', color || '#3B82F6']
    );

    res.status(201).json(result.rows[0]);
  }
  catch(error){
    console.error('Create folder error:', error.message);
    res.status(500).json({ message: 'Server error while creating the folder.' });
  }
});

// PUT /api/folders/:id - update an existing folder
router.put('/:id', authenticateToken, uuidValidation, folderValidation, async (req, res) => {
  try{
    const { id } = req.params;
    const { name, description, color } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      'UPDATE folders SET name = $1, description = $2, color = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, description || '', color || '#3B82F6', id, userId]
    );

    if(result.rows.length === 0){
      return res.status(404).json({ message: 'Folder not found or you do not have permission to edit it.' });
    }

    res.json(result.rows[0]);
  } 
  catch(error){
    console.error('Update folder error:', error.message);
    res.status(500).json({ message: 'Server error while updating the folder.' });
  }
});

// DELETE /api/folders/:id - delete a folder
router.delete('/:id', authenticateToken, uuidValidation, async (req, res) => {
  try{
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query('BEGIN');

    // setting folder_id to NULL for snippets that belong to this folder
    await pool.query(
      'UPDATE snippets SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2',
      [id, userId]
    );

    // deleting the folder itself
    const result = await pool.query(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if(result.rows.length === 0){
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Folder not found or you do not have permission to delete it.' });
    }

    await pool.query('COMMIT');

    res.status(204).send();
  } 
  catch(error){
    await pool.query('ROLLBACK');
    console.error('Delete folder error:', error.message);
    res.status(500).json({ message: 'Server error while deleting the folder.' });
  }
});

module.exports = router;