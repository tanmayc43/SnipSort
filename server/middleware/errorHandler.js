const fs = require('fs');
const path = require('path');

function errorHandler(err, req, res, next) {
  const logMsg = `[GLOBAL ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl}\n${err.stack || err}\nRequest body: ${JSON.stringify(req.body)}\n\n`;
  console.error(logMsg);
  try {
    fs.appendFileSync(path.join(__dirname, 'global_errors.log'), logMsg);
  } catch (e) {
    console.error('Failed to write global error log:', e);
  }
  res.status(500).json({ message: 'Server error', error: err.message });
}

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  asyncHandler
};