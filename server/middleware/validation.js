const { body, param, validationResult } = require('express-validator');

// helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const uuidValidation = [
  param('id').isUUID().withMessage('Invalid UUID format.'),
  handleValidationErrors
];

const folderValidation = [
  body('name').notEmpty().withMessage('Folder name is required.'),
  handleValidationErrors
];

const projectValidation = [
    body('name').notEmpty().withMessage('Project name is required.'),
    handleValidationErrors
];

const snippetValidation = [
    body('title').notEmpty().withMessage('Snippet title is required.'),
    body('code').notEmpty().withMessage('Snippet code is required.'),
    body('language_id').isInt().withMessage('A valid language ID is required.'),
    handleValidationErrors
];

const projectMemberValidation = [
    body('email').isEmail().withMessage('A valid user email is required.'),
    body('role').isIn(['admin', 'member']).withMessage('Role must be either "admin" or "member".'),
    handleValidationErrors
];


module.exports = {
  handleValidationErrors,
  uuidValidation,
  folderValidation,
  projectValidation,
  snippetValidation,
  projectMemberValidation
};