const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  uuidValidation, 
  snippetValidation, 
  handleValidationErrors // Import the shared error handler
} = require('../middleware/validation');

const router = express.Router();

// manage tags within a transaction
const manageTags = async (client, snippetId, tags) => {
  console.log('[DEBUG] manageTags called with:', snippetId, tags);
  await client.query('DELETE FROM snippet_tags WHERE snippet_id = $1', [snippetId]);

  if(tags && tags.length > 0){
    // ensuring tags are unique and lowercase
    const uniqueTags = [...new Set(tags.map(t => String(t).toLowerCase().trim()))];
    console.log('[DEBUG] uniqueTags to insert:', uniqueTags);
    const tagQuery = 'INSERT INTO snippet_tags (snippet_id, tag) SELECT $1, unnest($2::text[])';
    console.log('[DEBUG] tagQuery:', tagQuery);
    const result = await client.query(tagQuery, [snippetId, uniqueTags]);
    console.log('[DEBUG] Insert result:', result);
    console.log('[DEBUG] Tags inserted for snippet:', snippetId);
  } else {
    console.log('[DEBUG] No tags to insert for snippet:', snippetId);
  }
};

// GET /api/snippets - get all snippets user has access to (own + project snippets)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { search, language_slug, sort = 'updated_at', favorite, folder_id, project_id } = req.query;

    let query = `
      SELECT
        s.id, s.title, s.description, s.is_favorite, s.is_public, s.updated_at, s.created_at,
        s.folder_id, s.project_id,
        l.name as language_name,
        l.slug as language_slug,
        f.name as folder_name,
        p.name as project_name,
        COALESCE((SELECT json_agg(st.tag) FROM snippet_tags st WHERE st.snippet_id = s.id), '[]'::json) as tags
      FROM snippets s
      LEFT JOIN languages l ON s.language_id = l.id
      LEFT JOIN folders f ON s.folder_id = f.id
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.id IN (
        -- Select all snippets owned by the user OR in projects the user is a member of
        SELECT id FROM snippets WHERE user_id = $1
        UNION
        SELECT s.id FROM snippets s JOIN project_members pm ON s.project_id = pm.project_id WHERE pm.user_id = $1
      )
    `;

    const params = [userId];
    let paramCount = 1;

    if(search){
      paramCount+=1;
      query += ` AND (s.title ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if(language_slug){
      paramCount+=1;
      query += ` AND l.slug = $${paramCount}`;
      params.push(language_slug);
    }

    if(folder_id){
      paramCount+=1;
      query += ` AND s.folder_id = $${paramCount}`;
      params.push(folder_id);
    }

    if(project_id){
      paramCount+=1;
      query += ` AND s.project_id = $${paramCount}`;
      params.push(project_id);
    }

    if(favorite === 'true'){
      query += ` AND s.is_favorite = true`;
    }

    //sorting the snippets
    const validSorts = ['updated_at', 'created_at', 'title'];
    const sortField = validSorts.includes(sort) ? `s.${sort}` : 's.updated_at';
    query += ` ORDER BY ${sortField} DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  }
  catch(error){
    console.error('Get snippets error:', error.message);
    res.status(500).json({ message: 'Server error while fetching snippets.' });
  }
});

// GET /api/snippets/:id - get a single snippet by ID
router.get('/:id', authenticateToken, uuidValidation, async (req, res) => {
  try{
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        s.*,
        l.name as language_name,
        l.slug as language_slug,
        f.name as folder_name,
        p.name as project_name,
        COALESCE((SELECT json_agg(st.tag) FROM snippet_tags st WHERE st.snippet_id = s.id), '[]'::json) as tags
      FROM snippets s
      LEFT JOIN languages l ON s.language_id = l.id
      LEFT JOIN folders f ON s.folder_id = f.id
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.id = $1 AND (
        s.is_public = true OR 
        s.user_id = $2 OR
        (s.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM project_members pm WHERE pm.project_id = s.project_id AND pm.user_id = $2
        ))
      )
    `, [id, userId]);

    if(result.rows.length === 0){
      return res.status(404).json({ message: 'Snippet not found or you do not have permission to view it.' });
    }

    res.json(result.rows[0]);
  }
  catch(error){
    console.error('Get single snippet error:', error.message);
    res.status(500).json({ message: 'Server error while fetching the snippet.' });
  }
});

// Middleware to coerce tags: {} to tags: [] before validation
const coerceTags = (req, res, next) => {
  if (req.body && typeof req.body.tags === 'object' && !Array.isArray(req.body.tags)) {
    req.body.tags = [];
  }
  next();
};

// POST /api/snippets - create a new snippet
router.post('/', authenticateToken, coerceTags, snippetValidation, async (req, res) => {
  const client = await pool.connect();
  try{
    console.log('[DEBUG] POST /api/snippets payload:', req.body);
    const { title, description, code, language_id, folder_id, project_id, is_favorite, is_public, tags } = req.body;
    const userId = req.user.userId;

    await client.query('BEGIN');

    // if creating in a project, check if user is a member
    if(project_id){
      const memberCheck = await client.query(`
        SELECT role FROM project_members 
        WHERE project_id = $1 AND user_id = $2
      `, [project_id, userId]);

      if(memberCheck.rows.length === 0){
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'You must be a member of the project to create snippets in it.' });
      }
    }

    const snippetResult = await client.query(`
      INSERT INTO snippets (user_id, title, description, code, language_id, folder_id, project_id, is_favorite, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [userId, title, description, code, language_id, folder_id, project_id, is_favorite, is_public]);
    
    const newSnippet = snippetResult.rows[0];

    // helper to add tags
    await manageTags(client, newSnippet.id, tags);

    await client.query('COMMIT');

    // refetch the snippet with all its relations to return to the client
    const finalResult = await client.query('SELECT * FROM snippets WHERE id = $1', [newSnippet.id]);
    res.status(201).json(finalResult.rows[0]);

  }
  catch(error){
    await client.query('ROLLBACK');
    console.error('Create snippet error:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ message: 'Failed to create snippet.', error: error.message, body: req.body });
  } 
  finally{
    client.release();
  }
});

// Middleware to coerce tags: {} to tags: [] before validation
router.put('/:id', authenticateToken, (req, res, next) => {
  console.log('[DEBUG] PUT /api/snippets/:id - coerceTags middleware running');
  if (req.body && typeof req.body.tags === 'object' && !Array.isArray(req.body.tags)) {
    req.body.tags = [];
  }
  next();
}, snippetValidation, handleValidationErrors, async (req, res) => {
  console.log('[DEBUG] PUT /api/snippets/:id - handler running');
  // This code will now only run if ALL validation passes.
  console.log('[DEBUG] PUT /api/snippets/:id payload:', req.body);
  const client = await pool.connect();
  try{
    const { id } = req.params;
    const { title, description, code, language_id, folder_id, project_id, is_favorite, is_public, tags } = req.body;
    const userId = req.user.userId;

    await client.query('BEGIN');

    // getting the snippet to check permissions
    const snippetCheck = await client.query(`
      SELECT s.*, pm.role as user_role
      FROM snippets s
      LEFT JOIN project_members pm ON s.project_id = pm.project_id AND pm.user_id = $1
      WHERE s.id = $2
    `, [userId, id]);

    if(snippetCheck.rows.length === 0){
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Snippet not found.' });
    }

    const snippet = snippetCheck.rows[0];
    const userRole = snippet.user_role;

    // check whether user can edit: owner of snippet OR admin/owner of project
    const canEdit = snippet.user_id === userId || (snippet.project_id && userRole && ['owner', 'admin'].includes(userRole));

    if(!canEdit){
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'You do not have permission to edit this snippet.' });
    }

    // 1. Update the main snippet data
    await client.query(`
      UPDATE snippets 
      SET title = $1, description = $2, code = $3, language_id = $4, 
          folder_id = $5, project_id = $6, is_favorite = $7, is_public = $8, updated_at = NOW()
      WHERE id = $9
    `, [title, description, code, language_id, folder_id, project_id, is_favorite, is_public, id]);

    // 2. Update the tags using your helper
    await manageTags(client, id, tags);
    
    // 3. Commit the transaction
    await client.query('COMMIT');
    
    // **FIXED**: 4. Refetch the complete snippet with all relations to send back to the client
    const finalResult = await client.query(`
      SELECT 
        s.*,
        l.name as language_name,
        l.slug as language_slug,
        f.name as folder_name,
        p.name as project_name,
        COALESCE((SELECT json_agg(st.tag) FROM snippet_tags st WHERE st.snippet_id = s.id), '[]'::json) as tags
      FROM snippets s
      LEFT JOIN languages l ON s.language_id = l.id
      LEFT JOIN folders f ON s.folder_id = f.id
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.id = $1
    `, [id]);

    res.json(finalResult.rows[0]);

  }
  catch(error){
    await client.query('ROLLBACK');
    console.error('Update snippet error:', error);
    res.status(500).json({ message: 'Failed to update snippet.' });
  }
  finally{
    client.release();
  }
});

// DELETE /api/snippets/:id - delete a snippet
router.delete('/:id', authenticateToken, uuidValidation, async (req, res) => {
  try{
    const { id } = req.params;
    const userId = req.user.userId;

    // get the snippet to check permissions
    const snippetCheck = await pool.query(`
      SELECT s.*, pm.role as user_role
      FROM snippets s
      LEFT JOIN project_members pm ON s.project_id = pm.project_id AND pm.user_id = $1
      WHERE s.id = $2
    `, [userId, id]);

    if(snippetCheck.rows.length === 0){
      return res.status(404).json({ message: 'Snippet not found.' });
    }

    const snippet = snippetCheck.rows[0];
    const userRole = snippet.user_role;

    // check whether user can delete: owner of snippet OR admin/owner of project
    const canDelete = snippet.user_id === userId || (snippet.project_id && userRole && ['owner', 'admin'].includes(userRole));

    if(!canDelete){
      return res.status(403).json({ message: 'You do not have permission to delete this snippet.' });
    }

    const result = await pool.query(
      'DELETE FROM snippets WHERE id = $1 RETURNING id',
      [id]
    );

    res.status(204).send();
  }
  catch(error){
    console.error('Delete snippet error:', error);
    res.status(500).json({ message: 'Failed to delete snippet.' });
  }
});

// PATCH /api/snippets/:id/remove-from-folder - remove snippet from folder (set folder_id to NULL)
router.patch('/:id/remove-from-folder', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check permissions (reuse your existing logic)
    const snippetCheck = await client.query(
      `SELECT * FROM snippets WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (snippetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Snippet not found or no permission.' });
    }
    await client.query(
      `UPDATE snippets SET folder_id = NULL, updated_at = NOW() WHERE id = $1`,
      [id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Snippet removed from folder.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to remove snippet from folder.' });
  } finally {
    client.release();
  }
});

module.exports = router;