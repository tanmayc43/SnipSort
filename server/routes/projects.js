const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { projectValidation, uuidValidation } = require('../middleware/validation');

const router = express.Router();

// Get all projects for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        p.*,
        pm.role,
        json_agg(
          json_build_object(
            'user_id', pm2.user_id,
            'role', pm2.role
          )
        ) as project_members
      FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      WHERE pm.user_id = $1
      GROUP BY p.id, pm.role
      ORDER BY p.name
    `, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', authenticateToken, projectValidation, async (req, res) => {
  try {
    const { name, description, color, is_public } = req.body;
    const userId = req.user.id;

    await pool.query('BEGIN');

    // Create project
    const projectResult = await pool.query(`
      INSERT INTO projects (owner_id, name, description, color, is_public)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, name, description || '', color || '#10B981', is_public || false]);

    const project = projectResult.rows[0];

    // Add owner as member
    await pool.query(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES ($1, $2, 'owner')
    `, [project.id, userId]);

    await pool.query('COMMIT');

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, uuidValidation, projectValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, is_public } = req.body;
    const userId = req.user.id;

    const result = await pool.query(`
      UPDATE projects 
      SET name = $1, description = $2, color = $3, is_public = $4, updated_at = NOW()
      WHERE id = $5 AND owner_id = $6
      RETURNING *
    `, [name, description || '', color || '#10B981', is_public || false, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or no permission' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, uuidValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query('BEGIN');

    // Move snippets to uncategorized (set project_id to null)
    await pool.query(
      'UPDATE snippets SET project_id = NULL WHERE project_id = $1',
      [id]
    );

    // Delete project (cascade will handle project_members)
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found or no permission' });
    }

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;