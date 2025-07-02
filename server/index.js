const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { 
  apiLimiter, 
  securityHeaders, 
  sanitizeInput, 
  detectSQLInjection,
  requestSizeLimiter 
} = require('./middleware/security');

const authRoutes = require('./routes/auth');
const snippetRoutes = require('./routes/snippets');
const folderRoutes = require('./routes/folders');
const projectRoutes = require('./routes/projects');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(requestSizeLimiter);

// CORS configuration
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(sanitizeInput);
app.use(detectSQLInjection);

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/projects', projectRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

// Testing the database connection before starting the server
const startServer = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully!');
    client.release();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database.');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();