const { body, param, validationResult, checkSchema } = require('express-validator');
const { validatePasswordStrength, validateEmail } = require('./security');
const fs = require('fs');
const path = require('path');

// single, reusable error handler for all validators
const handleValidationErrors = (req, res, next) => {
  console.log('[DEBUG] handleValidationErrors running');
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    const logMsg = `[VALIDATION ERROR] ${JSON.stringify(formattedErrors, null, 2)}\n`;
    console.error(logMsg);
    try{
      fs.appendFileSync(path.join(__dirname, 'validation_errors.log'), logMsg);
    }
    catch(e){
      console.error('Failed to write validation error log:', e);
    }
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: formattedErrors 
    });
  }
  next();
};

// Validator for UUIDs in URL parameters
const uuidValidation = [
  param('id').isUUID(4).withMessage('Invalid ID format in URL.'),
];

const snippetSchema = {
  title: { isString: true, notEmpty: true, errorMessage: 'Title is required.' },
  code: { isString: true, notEmpty: true, errorMessage: 'Code cannot be empty.' },
  language_id: { isInt: { options: { min: 1 } }, errorMessage: 'A valid language must be selected.' },
  description: { optional: true, isString: true },
  folder_id: {
    optional: { options: { nullable: true } },
    custom: {
      options: (value) => value === null || value === undefined || /^[0-9a-fA-F-]{36}$/.test(value),
      errorMessage: 'Invalid folder ID format.'
    }
  },
  project_id: {
    optional: { options: { nullable: true } },
    custom: {
      options: (value) => value === null || value === undefined || /^[0-9a-fA-F-]{36}$/.test(value),
      errorMessage: 'Invalid project ID format.'
    }
  },
  
  // fix for tags validation
  tags: {
    optional: true,
    isArray: { errorMessage: 'Tags must be an array.' },
  },
  'tags.*': { 
    isString: { errorMessage: 'Each tag must be a string.' },
    notEmpty: { errorMessage: 'Tags cannot be empty strings.' },
  },

  is_favorite: { optional: true, isBoolean: true, errorMessage: 'is_favorite must be a boolean.' },
  is_public: { optional: true, isBoolean: true, errorMessage: 'is_public must be a boolean.' }
};

const folderSchema = {
  name: { isString: true, notEmpty: true, errorMessage: 'Folder name is required.' },
  description: { optional: true, isString: true },
  color: { optional: true, isHexColor: true, errorMessage: 'Please provide a valid hex color code.' },
};

const projectSchema = {
  name: { isString: true, notEmpty: true, errorMessage: 'Project name is required.' },
  description: { optional: true, isString: true },
  is_public: { optional: true, isBoolean: true, errorMessage: 'is_public must be a boolean.' }
};

const projectMemberSchema = {
  email: { isEmail: true, normalizeEmail: true, errorMessage: 'A valid email address is required.' },
  role: { isString: true, isIn: { options: [['viewer', 'editor', 'admin']], errorMessage: "Role must be one of 'viewer', 'editor', or 'admin'." } },
};

// middleware to validate request body against schemas
const snippetValidation = checkSchema(snippetSchema);
const folderValidation = checkSchema(folderSchema);
const projectValidation = checkSchema(projectSchema);
const projectMemberValidation = checkSchema(projectMemberSchema);

// export all validators with error handler
module.exports = {
  handleValidationErrors,
  uuidValidation,
  snippetValidation,
  folderValidation,
  projectValidation,
  projectMemberValidation,
};