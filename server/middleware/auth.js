const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if(token == null){
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if(err){
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user; // adding { userId: '...' } to the request object so that next middleware can access it
    next();
  });
};


const authorizeProjectRole = (allowedRoles) => {
  return async (req, res, next) => {
    try{
      const { id: projectId } = req.params;
      const { userId } = req.user;

      if(!projectId){
        return res.status(400).json({ message: 'Project ID is missing from the request.' });
      }

      const memberResult = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );

      if(memberResult.rows.length === 0){
        return res.status(403).json({ message: 'You are not a member of this project.' });
      }

      const userRole = memberResult.rows[0].role;

      if(!allowedRoles.includes(userRole)){
        return res.status(403).json({ message: `Permission denied. Required role: ${allowedRoles.join(' or ')}.` });
      }
      // proceed to the next middleware when all checks pass
      next();
    }
    catch(error){
      console.error('Authorization error:', error.message);
      res.status(500).json({ message: 'Server error during authorization.' });
    }
  };
};


module.exports = {
  authenticateToken,
  authorizeProjectRole 
};