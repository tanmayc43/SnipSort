const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().withMessage('A valid email is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  handleValidationErrors
], async (req, res) => {
  try{
    const { email, password, fullName } = req.body;

    // checking if user exists already (case-insensitive)
    const existingUser = await pool.query(
      'SELECT id FROM auth_users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if(existingUser.rows.length > 0){
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // hashing the password with bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // using transaction to ensure atomicity
    await pool.query('BEGIN');
    
    // inserting into auth_users and then get the new user's ID
    const newUserResult = await pool.query(
      'INSERT INTO auth_users (email, encrypted_password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    const userId = newUserResult.rows[0].id;

    // now inserting into profiles table (email is no longer here)
    await pool.query(
      'INSERT INTO profiles (id, full_name) VALUES ($1, $2)',
      [userId, fullName] // fullName can be null if not provided
    );

    await pool.query('COMMIT');

    // generating jwt and sending the response
    const token = generateToken(userId);

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: userId, email, fullName }
    });
  }
  catch(error){
    await pool.query('ROLLBACK');
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('A valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // finding the user by email (case-insensitive)
    const userResult = await pool.query(
      'SELECT id, email, encrypted_password FROM auth_users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if(userResult.rows.length === 0){
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];

    // verifying the password
    const isValidPassword = await bcrypt.compare(password, user.encrypted_password);
    if(!isValidPassword){
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // fetch the user's profile information to return
    const profileResult = await pool.query(
        'SELECT full_name, avatar_url FROM profiles WHERE id = $1',
        [user.id]
    );
    const profile = profileResult.rows[0] || {};

    // generating jwt and sending the response along with user data
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful.',
      token,
      user: { 
        id: user.id, 
        email: user.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url
      }
    });
  }
  catch(error){
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;