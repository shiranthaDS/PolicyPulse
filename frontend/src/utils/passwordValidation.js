// Password validation utility functions

export const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const isValid = Object.values(requirements).every(req => req);

  return {
    isValid,
    requirements,
    score: Object.values(requirements).filter(req => req).length
  };
};

export const getPasswordStrength = (score) => {
  if (score <= 2) return { level: 'weak', color: '#e53e3e', text: 'Weak' };
  if (score <= 3) return { level: 'fair', color: '#dd6b20', text: 'Fair' };
  if (score <= 4) return { level: 'good', color: '#38a169', text: 'Good' };
  return { level: 'strong', color: '#00a86b', text: 'Strong' };
};

export const getPasswordRequirementsText = () => {
  return [
    'At least 8 characters long',
    'Contains uppercase letter (A-Z)',
    'Contains lowercase letter (a-z)', 
    'Contains number (0-9)',
    'Contains special character (!@#$%^&*)'
  ];
};