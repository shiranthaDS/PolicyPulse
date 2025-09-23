/**
 * Backend Password Validation Utility
 * Validates password strength requirements on the server side
 */

const validatePasswordStrength = (password) => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const isValid = Object.values(checks).every(check => check);

  return {
    isValid,
    checks,
    errors: getPasswordErrors(checks)
  };
};

const getPasswordErrors = (checks) => {
  const errors = [];
  
  if (!checks.minLength) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!checks.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!checks.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!checks.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!checks.hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

module.exports = {
  validatePasswordStrength,
  getPasswordErrors
};