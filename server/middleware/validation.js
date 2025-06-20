const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const snippetValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('language').trim().notEmpty().withMessage('Language is required'),
  body('description').optional().trim(),
  body('folder_id').optional().isUUID().withMessage('Invalid folder ID'),
  body('project_id').optional().isUUID().withMessage('Invalid project ID'),
  body('is_favorite').optional().isBoolean(),
  body('is_public').optional().isBoolean(),
  handleValidationErrors
];

const folderValidation = [
  body('name').trim().notEmpty().withMessage('Folder name is required'),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  handleValidationErrors
];

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  body('is_public').optional().isBoolean(),
  handleValidationErrors
];

const uuidValidation = [
  param('id').isUUID().withMessage('Invalid ID format'),
  handleValidationErrors
];

module.exports = {
  snippetValidation,
  folderValidation,
  projectValidation,
  uuidValidation,
  handleValidationErrors
};