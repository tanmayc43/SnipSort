import { useState, useCallback, useMemo } from 'react';

// Validation rules
const validationRules = {
  required: (value, message = 'This field is required') => {
    if (typeof value === 'string') {
      return value.trim().length > 0 || message;
    }
    return value != null || message;
  },
  
  email: (value, message = 'Please enter a valid email address') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value || emailRegex.test(value) || message;
  },
  
  minLength: (min, message) => (value) => {
    return !value || value.length >= min || message || `Must be at least ${min} characters`;
  },
  
  maxLength: (max, message) => (value) => {
    return !value || value.length <= max || message || `Must be no more than ${max} characters`;
  },
  
  password: (value, message = 'Password must be at least 8 characters with uppercase, lowercase, number and special character') => {
    if (!value) return true;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const isLongEnough = value.length >= 8;
    
    return (hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough) || message;
  },
  
  hexColor: (value, message = 'Please enter a valid hex color (e.g., #FF0000)') => {
    if (!value) return true;
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(value) || message;
  },
  
  url: (value, message = 'Please enter a valid URL') => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return message;
    }
  }
};

export const useFormValidation = (initialValues = {}, validationSchema = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const fieldRules = validationSchema[name];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const result = rule(value);
      if (result !== true) {
        return result;
      }
    }
    return null;
  }, [validationSchema]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationSchema]);

  // Handle field change
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Handle field blur
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationSchema).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const isValid = validateForm();
    
    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      }
    }
    
    setIsSubmitting(false);
    return isValid;
  }, [values, validateForm, validationSchema]);

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set field error manually
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(validationSchema).every(name => !validateField(name, values[name]));
  }, [values, validationSchema, validateField]);

  // Check if form has been modified
  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => values[key] !== initialValues[key]);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldError,
    validateField,
    validateForm
  };
};

// Export validation rules for reuse
export { validationRules };

// Common validation schemas
export const commonSchemas = {
  auth: {
    email: [validationRules.required, validationRules.email],
    password: [validationRules.required, validationRules.password],
    fullName: [validationRules.required, validationRules.minLength(2)]
  },
  
  snippet: {
    title: [validationRules.required, validationRules.maxLength(200)],
    description: [validationRules.maxLength(500)],
    code: [validationRules.required],
    language_id: [validationRules.required]
  },
  
  folder: {
    name: [validationRules.required, validationRules.maxLength(100)],
    description: [validationRules.maxLength(300)],
    color: [validationRules.hexColor]
  },
  
  project: {
    name: [validationRules.required, validationRules.maxLength(100)],
    description: [validationRules.maxLength(300)],
    color: [validationRules.hexColor]
  }
};