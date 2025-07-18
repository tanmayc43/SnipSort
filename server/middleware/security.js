const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

// rate limiting config
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests, increased currently for easier dev experience 
  'Too many API requests, please try again later.'
);

const strictLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 requests
  'Rate limit exceeded, please slow down.'
);

// input sanitization
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value, key) => {
    if (typeof value === 'string') {
      // not messing with code or description fields
      if (key === 'code' || key === 'description') {
        return value;
      }
      return validator.escape(value.trim());
    }
    if (Array.isArray(value)) {
      // sanitize each item in the array other than code or description
      return value.map((v) => sanitizeValue(v, key));
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [k, val] of Object.entries(value)) {
        sanitized[k] = sanitizeValue(val, k);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body, null);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Password strength validation
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpper) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLower) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecial) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
const validateEmail = (email) => {
  return validator.isEmail(email) && email.length <= 254;
};

// SQL injection protection (additional layer)
const detectSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/,
    /(\bOR\b|\bAND\b).*?[=<>]/i
  ];

  const checkValue = (value, key) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).some(([k, v]) => {
        // Skip SQLi check for 'code' and 'description' fields
        // surely this wont lead to sql injection attacks
        if (k === 'code' || k === 'description') return false;
        return checkValue(v, k);
      });
    }
    return false;
  };

  const hasSQLInjection = 
    checkValue(req.body) || 
    checkValue(req.query) || 
    checkValue(req.params);

  if (hasSQLInjection) {
    return res.status(400).json({
      message: 'Invalid input detected'
    });
  }

  next();
};

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      message: 'Request entity too large'
    });
  }
  
  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  strictLimiter,
  sanitizeInput,
  securityHeaders,
  validatePasswordStrength,
  validateEmail,
  detectSQLInjection,
  requestSizeLimiter
};