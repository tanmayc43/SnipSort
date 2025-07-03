const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeProjectRole } = require('../middleware/auth');
const { projectValidation, uuidValidation, projectMemberValidation } = require('../middleware/validation');

const router = express.Router();

// GET /api/projects - fetch all projects the user is a member of
router.get('/', authenticateToken, async (req, res) => {
  try{
    const userId = req.user.userId;
    const result = await pool.query(`
      SELECT p.*, pm.role as role
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
      ORDER BY p.name ASC
    `, [userId]);
    res.json(result.rows);
  }
  catch(error){
    console.error('Get projects error:', error.message);
    res.status(500).json({ message: 'Server error while fetching projects.' });
  }
});

// GET /api/projects/:id - get a single project with its members
router.get('/:id', authenticateToken, uuidValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const result = await pool.query(`
            SELECT p.*,
                (SELECT json_agg(
                    json_build_object(
                        'userId', m.user_id,
                        'role', m.role,
                        'email', u.email,
                        'fullName', pr.full_name
                    )
                )
                FROM project_members m
                JOIN auth_users u ON m.user_id = u.id
                JOIN profiles pr ON m.user_id = pr.id
                WHERE m.project_id = p.id
            ) as members
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE p.id = $1 AND pm.user_id = $2
        `, [id, userId]);
        if(result.rows.length === 0){
            return res.status(404).json({ message: 'Project not found or you are not a member.' });
        }
        res.json(result.rows[0]);
    } 
    catch(error){
        console.error('Get single project error:', error.message);
        res.status(500).json({ message: 'Server error while fetching the project.' });
    }
});

// POST /api/projects - create a new project
router.post('/', authenticateToken, projectValidation, async (req, res) => {
  try{
    const { name, description, color, is_public } = req.body;
    const userId = req.user.userId;
    await pool.query('BEGIN');
    const projectResult = await pool.query(
      'INSERT INTO projects (owner_id, name, description, color, is_public) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, description || '', color || '#10B981', is_public || false]
    );
    const project = projectResult.rows[0];
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, \'owner\')',
      [project.id, userId]
    );
    await pool.query('COMMIT');
    res.status(201).json(project);
  }
  catch(error){
    await pool.query('ROLLBACK');
    console.error('Create project error:', error.message);
    res.status(500).json({ message: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id - update project's details
router.put('/:id', authenticateToken, uuidValidation, authorizeProjectRole(['owner', 'admin']), projectValidation, async (req, res) => {
  try{
    const { id } = req.params;
    const { name, description, color, is_public } = req.body;
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2, color = $3, is_public = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, description || '', color || '#10B981', is_public || false, id]
    );
    res.json(result.rows[0]);
  } 
  catch(error){
    console.error('Update project error:', error.message);
    res.status(500).json({ message: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id - delete project
router.delete('/:id', authenticateToken, uuidValidation, authorizeProjectRole(['owner']), async (req, res) => {
  try{
    const { id } = req.params;
    await pool.query('BEGIN');
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    await pool.query('COMMIT');
    res.status(204).send();
  }
  catch(error){
    await pool.query('ROLLBACK');
    console.error('Delete project error:', error.message);
    res.status(500).json({ message: 'Failed to delete project.' });
  }
});

// POST /api/projects/:id/members - adding user to a project
router.post('/:id/members', authenticateToken, uuidValidation, authorizeProjectRole(['owner', 'admin']), projectMemberValidation, async (req, res) => {
    try{
        const { id: projectId } = req.params;
        const { email, role } = req.body;
        const userToAddResult = await pool.query('SELECT id FROM auth_users WHERE LOWER(email) = LOWER($1)', [email]);
        if (userToAddResult.rows.length === 0) {
            return res.status(404).json({ message: 'User with that email not found.' });
        }
        const userToAddId = userToAddResult.rows[0].id;
        const newMemberResult = await pool.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
            [projectId, userToAddId, role]
        );
        res.status(201).json(newMemberResult.rows[0]);
    } 
    catch(error){
        if(error.code === '23505'){
            return res.status(409).json({ message: 'User is already a member of this project.' });
        }
        console.error('Add member error:', error.message);
        res.status(500).json({ message: 'Failed to add member to project.' });
    }
});

// DELETE /api/projects/:id/members/:memberId - remove a user from a project
router.delete('/:id/members/:memberId', authenticateToken, uuidValidation, authorizeProjectRole(['owner', 'admin']), async (req, res) => {
    try{
        const { id: projectId, memberId } = req.params;
        const requesterId = req.user.userId;
        if(memberId === requesterId){
            return res.status(400).json({ message: 'You cannot remove yourself from a project.' });
        }
        const result = await pool.query(
            'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id',
            [projectId, memberId]
        );
        if(result.rowCount === 0){
            return res.status(404).json({ message: 'Member not found in this project.' });
        }
        res.status(204).send();
    }
    catch(error){
        console.error('Remove member error:', error.message);
        res.status(500).json({ message: 'Failed to remove member from project.' });
    }
});

module.exports = router;