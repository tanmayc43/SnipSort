const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { snippetValidation, uuidValidation } = require('../middleware/validation');

const router = express.Router();

// Get all snippets for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, language, sort = 'updated_at' } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT 
        s.*,
        f.name as folder_name,
        f.color as folder_color,
        p.name as project_name,
        p.color as project_color,
        COALESCE(
          json_agg(
            CASE WHEN st.tag IS NOT NULL 
            THEN json_build_object('tag', st.tag)
            ELSE NULL END
          ) FILTER (WHERE st.tag IS NOT NULL), 
          '[]'
        ) as snippet_tags
      FROM snippets s
      LEFT JOIN folders f ON s.folder_id = f.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      WHERE s.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (
        s.title ILIKE $${paramCount} OR 
        s.description ILIKE $${paramCount} OR 
        s.code ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    // Add language filter
    if (language && language !== 'all') {
      paramCount++;
      query += ` AND s.language = $${paramCount}`;
      params.push(language);
    }

    query += ` GROUP BY s.id, f.name, f.color, p.name, p.color`;

    // Add sorting
    const validSorts = ['updated_at', 'created_at', 'title', 'language'];
    const sortField = validSorts.includes(sort) ? sort : 'updated_at';
    query += ` ORDER BY s.${sortField} DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get snippets error:', error);
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});

// Get single snippet
router.get('/:id', authenticateToken, uuidValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        s.*,
        f.name as folder_name,
        f.color as folder_color,
        p.name as project_name,
        p.color as project_color,
        COALESCE(
          json_agg(
            CASE WHEN st.tag IS NOT NULL 
            THEN json_build_object('tag', st.tag)
            ELSE NULL END
          ) FILTER (WHERE st.tag IS NOT NULL), 
          '[]'
        ) as snippet_tags
      FROM snippets s
      LEFT JOIN folders f ON s.folder_id = f.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      WHERE s.id = $1 AND (
        s.user_id = $2 OR 
        s.is_public = true OR
        (s.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = s.project_id AND pm.user_id = $2
        ))
      )
      GROUP BY s.id, f.name, f.color, p.name, p.color
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get snippet error:', error);
    res.status(500).json({ error: 'Failed to fetch snippet' });
  }
});

// Create snippet
router.post('/', authenticateToken, snippetValidation, async (req, res) => {
  try {
    const { title, description, code, language, folder_id, project_id, is_favorite, is_public } = req.body;
    const userId = req.user.id;

    // Validate folder/project ownership
    if (folder_id) {
      const folderCheck = await pool.query(
        'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
        [folder_id, userId]
      );
      if (folderCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid folder' });
      }
    }

    if (project_id) {
      const projectCheck = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [project_id, userId]
      );
      if (projectCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid project or no access' });
      }
    }

    const result = await pool.query(`
      INSERT INTO snippets (user_id, title, description, code, language, folder_id, project_id, is_favorite, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [userId, title, description || '', code, language, folder_id, project_id, is_favorite || false, is_public || false]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create snippet error:', error);
    res.status(500).json({ error: 'Failed to create snippet' });
  }
});

// Update snippet
router.put('/:id', authenticateToken, uuidValidation, snippetValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, code, language, folder_id, project_id, is_favorite, is_public } = req.body;
    const userId = req.user.id;

    // Check ownership or project access
    const snippetCheck = await pool.query(`
      SELECT s.* FROM snippets s
      WHERE s.id = $1 AND (
        s.user_id = $2 OR
        (s.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = s.project_id AND pm.user_id = $2
        ))
      )
    `, [id, userId]);

    if (snippetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found or no access' });
    }

    const result = await pool.query(`
      UPDATE snippets 
      SET title = $1, description = $2, code = $3, language = $4, 
          folder_id = $5, project_id = $6, is_favorite = $7, is_public = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, description || '', code, language, folder_id, project_id, is_favorite || false, is_public || false, id]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update snippet error:', error);
    res.status(500).json({ error: 'Failed to update snippet' });
  }
});

// Delete snippet
router.delete('/:id', authenticateToken, uuidValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM snippets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    res.json({
      success: true,
      message: 'Snippet deleted successfully'
    });
  } catch (error) {
    console.error('Delete snippet error:', error);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

// Add tags to snippet
router.post('/:id/tags', authenticateToken, uuidValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'Tags array is required' });
    }

    // Check snippet ownership
    const snippetCheck = await pool.query(
      'SELECT id FROM snippets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (snippetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    // Remove existing tags
    await pool.query('DELETE FROM snippet_tags WHERE snippet_id = $1', [id]);

    // Add new tags
    if (tags.length > 0) {
      const tagValues = tags.map((tag, index) => `($1, $${index + 2})`).join(', ');
      const tagParams = [id, ...tags];
      
      await pool.query(
        `INSERT INTO snippet_tags (snippet_id, tag) VALUES ${tagValues}`,
        tagParams
      );
    }

    res.json({
      success: true,
      message: 'Tags updated successfully'
    });
  } catch (error) {
    console.error('Update tags error:', error);
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

module.exports = router;