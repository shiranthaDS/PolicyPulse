const express = require('express');
const router = express.Router();

// Import controllers
const {
  createCourse,
  getCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  toggleCoursePublication,
  getCourseStats,
  searchCourses
} = require('../controllers/courseController');

// Import validation middleware
const {
  validateCourseCreation,
  validateCourseUpdate,
  validateCourseId,
  validateSearchQuery,
  handleValidationErrors,
  checkDuplicateCourseName,
  sanitizeCourseData
} = require('../middleware/validation');

// @route   GET /api/courses/stats
// @desc    Get course statistics
// @access  Public
router.get('/stats', getCourseStats);

// @route   POST /api/courses/search
// @desc    Advanced search for courses
// @access  Public
router.post('/search', 
  validateSearchQuery,
  handleValidationErrors,
  searchCourses
);

// @route   GET /api/courses
// @desc    Get all courses with filtering and pagination
// @access  Public
router.get('/', getAllCourses);

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (will need authentication middleware later)
router.post('/',
  validateCourseCreation,
  handleValidationErrors,
  checkDuplicateCourseName,
  sanitizeCourseData,
  createCourse
);

// @route   GET /api/courses/:id
// @desc    Get a single course by ID
// @access  Public
router.get('/:id',
  validateCourseId,
  handleValidationErrors,
  getCourse
);

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (will need authentication middleware later)
router.put('/:id',
  validateCourseId,
  validateCourseUpdate,
  handleValidationErrors,
  checkDuplicateCourseName,
  sanitizeCourseData,
  updateCourse
);

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (will need authentication middleware later)
router.delete('/:id',
  validateCourseId,
  handleValidationErrors,
  deleteCourse
);

// @route   PATCH /api/courses/:id/publish
// @desc    Publish/Unpublish a course
// @access  Private (will need authentication middleware later)
router.patch('/:id/publish',
  validateCourseId,
  handleValidationErrors,
  toggleCoursePublication
);

module.exports = router;