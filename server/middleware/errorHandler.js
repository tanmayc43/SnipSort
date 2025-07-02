const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation failed',
      status: 400,
      details: err.details
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401
    };
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    error = {
      message: 'Resource already exists',
      status: 409
    };
  }

  if (err.code === '23503') { // Foreign key constraint violation
    error = {
      message: 'Referenced resource not found',
      status: 400
    };
  }

  if (err.code === '23502') { // Not null constraint violation
    error = {
      message: 'Required field missing',
      status: 400
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = {
      message: 'Too many requests',
      status: 429,
      retryAfter: err.retryAfter
    };
  }

  // Custom application errors
  if (err.isOperational) {
    error = {
      message: err.message,
      status: err.status || 500
    };
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    delete error.stack;
    if (error.status === 500) {
      error.message = 'Internal server error';
    }
  } else {
    error.stack = err.stack;
  }

  res.status(error.status).json(error);
};

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