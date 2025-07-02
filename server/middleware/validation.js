const { body, param, query, validationResult } = require('express-validator');
const { validatePasswordStrength, validateEmail } = require('./security');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: formattedErrors 
    });
  }
  next();
};

// Custom validators
const customValidators = {
  isStrongPassword: (value) => {
    const result = validatePasswordStrength(value);
    if (!result.isValid) {
      throw new Error(result.errors.join(', '));
    }
    return true;
  },
  
  isValidEmail: (value) => {
    if (!validateEmail(value)) {
      throw new Error('Please provide a valid email address');
    }
    return true;
  },
  
  isValidHexColor: (value) => {
    if (value && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
      throw new Error('Please provide a valid hex color code');
    }
    return true;
  },
  
  isValidRole: (value) => {
    const validRoles = ['owner', 'admin', 'member'];
    if (!validRoles.includes(value)) {
      throw new Error('Role must be one of: owner, admin, member');
    }
    return true;
  },
  
  isValidLanguageId: (value) => {
    const id = parseInt(value);
    if (isNaN(id) || id < 1 || id > 50) { // Assuming max 50 languages
      throw new Error('Please provide a valid language ID');
    }
    return true;
  }
};

// Validation schemas
const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at', 'title', 'name'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  handleValidationErrors
];

const authValidation = {
  register: [
    body('email')
      .custom(customValidators.isValidEmail)
      .normalizeEmail(),
    body('password')
      .custom(customValidators.isStrongPassword),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
    handleValidationErrors
  ],
  
  login: [
    body('email')
      .custom(customValidators.isValidEmail)
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ]
};

const folderValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Folder name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('Folder name can only contain letters, numbers, spaces, hyphens, underscores, and dots'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('color')
    .optional()
    .custom(customValidators.isValidHexColor),
  handleValidationErrors
];

const projectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('Project name can only contain letters, numbers, spaces, hyphens, underscores, and dots'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('color')
    .optional()
    .custom(customValidators.isValidHexColor),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  handleValidationErrors
];

const snippetValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Snippet title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 100000 })
    .withMessage('Code must not exceed 100,000 characters'),
  body('language_id')
    .custom(customValidators.isValidLanguageId),
  body('folder_id')
    .optional()
    .isUUID()
    .withMessage('Invalid folder ID format'),
  body('project_id')
    .optional()
    .isUUID()
    .withMessage('Invalid project ID format'),
  body('is_favorite')
    .optional()
    .isBoolean()
    .withMessage('is_favorite must be a boolean'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 20) {
        throw new Error('Maximum 20 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          throw new Error('Each tag must be a string with maximum 50 characters');
        }
        if (!/^[a-zA-Z0-9\-_#+\.]+$/.test(tag)) {
          throw new Error('Tags can only contain letters, numbers, hyphens, underscores, hash, plus, and dots');
        }
      }
      return true;
    }),
  handleValidationErrors
];

const projectMemberValidation = [
  body('email')
    .custom(customValidators.isValidEmail)
    .normalizeEmail(),
  body('role')
    .custom(customValidators.isValidRole),
  handleValidationErrors
];

const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('language')
    .optional()
    .isAlpha()
    .withMessage('Language filter must contain only letters'),
  query('folder_id')
    .optional()
    .isUUID()
    .withMessage('Invalid folder ID format'),
  query('project_id')
    .optional()
    .isUUID()
    .withMessage('Invalid project ID format'),
  query('favorite')
    .optional()
    .isBoolean()
    .withMessage('Favorite filter must be a boolean'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  uuidValidation,
  paginationValidation,
  authValidation,
  folderValidation,
  projectValidation,
  snippetValidation,
  projectMemberValidation,
  searchValidation,
  customValidators
};