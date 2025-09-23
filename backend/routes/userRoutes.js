const express = require('express');
const router = express.Router();

// Import controllers
const {
  registerUser,
  loginUser,
  getUserProfile,
  enrollInCourse,
  updateProgress,
  submitQuiz,
  getCourseProgress,
  // Admin endpoints
  getAllUsers,
  getUserAnalytics,
  deleteUser
} = require('../controllers/userController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { validatePasswordStrength } = require('../utils/passwordValidation');
const { requireAdmin } = require('../middleware/adminAuth');
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    
  body('password')
    .custom((password) => {
      const validation = validatePasswordStrength(password);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }
      return true;
    }),
    
  body('role')
    .optional()
    .isIn(['employee', 'instructor', 'admin', 'securitymanager', 'auditor'])
    .withMessage('Role must be employee, instructor, admin, securitymanager, or auditor')
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Course ID validation
const validateCourseId = [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID format')
];

// Progress validation
const validateProgress = [
  body('pageId')
    .notEmpty()
    .withMessage('Page ID is required'),
    
  body('action')
    .isIn(['complete_page', 'start_page'])
    .withMessage('Action must be complete_page or start_page')
];

// Quiz submission validation
const validateQuizSubmission = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers array is required'),
    
  body('answers.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required for each answer'),
    
  body('answers.*.selectedAnswer')
    .isInt({ min: 0, max: 3 })
    .withMessage('Selected answer must be between 0 and 3')
];

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  validateRegistration, 
  handleValidationErrors, 
  registerUser
);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', 
  validateLogin, 
  handleValidationErrors, 
  loginUser
);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   POST /api/users/enroll/:courseId
// @desc    Enroll in a course
// @access  Private
router.post('/enroll/:courseId', 
  protect,
  validateCourseId,
  handleValidationErrors,
  enrollInCourse
);

// @route   PUT /api/users/progress/:courseId
// @desc    Update course progress
// @access  Private
router.put('/progress/:courseId',
  protect,
  validateCourseId,
  validateProgress,
  handleValidationErrors,
  updateProgress
);

// @route   POST /api/users/quiz/:courseId/:quizId
// @desc    Submit quiz answers
// @access  Private
router.post('/quiz/:courseId/:quizId',
  protect,
  validateCourseId,
  [param('quizId').notEmpty().withMessage('Quiz ID is required')],
  validateQuizSubmission,
  handleValidationErrors,
  submitQuiz
);

// @route   GET /api/users/progress/:courseId
// @desc    Get user's course progress
// @access  Private
router.get('/progress/:courseId',
  protect,
  validateCourseId,
  handleValidationErrors,
  getCourseProgress
);

// ========== ADMIN ROUTES ==========

// @route   GET /api/users/admin/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/admin/users', requireAdmin, getAllUsers);

// @route   GET /api/users/admin/analytics
// @desc    Get user analytics (Admin only)
// @access  Private (Admin)
router.get('/admin/analytics', requireAdmin, getUserAnalytics);

// @route   DELETE /api/users/admin/users/:userId
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/admin/users/:userId',
  requireAdmin,
  [param('userId').isMongoId().withMessage('Invalid user ID')],
  handleValidationErrors,
  deleteUser
);

module.exports = router;