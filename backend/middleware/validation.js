const { body, validationResult, param } = require('express-validator');

// Validation rules for creating a course
const validateCourseCreation = [
  body('courseName')
    .notEmpty()
    .withMessage('Course name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Course name must be between 3 and 200 characters')
    .trim(),
    
  body('courseDescription')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Course description cannot exceed 1000 characters')
    .trim(),
    
  body('duration')
    .optional()
    .isNumeric()
    .withMessage('Duration must be a number')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 hour'),
    
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters')
    .trim(),
    
  // Validate lecture pages
  body('lecturePages')
    .isArray({ min: 1 })
    .withMessage('Course must have at least one lecture page'),
    
  body('lecturePages.*.id')
    .notEmpty()
    .withMessage('Each lecture page must have an ID'),
    
  body('lecturePages.*.title')
    .notEmpty()
    .withMessage('Each lecture page must have a title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Lecture page title must be between 1 and 200 characters')
    .trim(),
    
  body('lecturePages.*.content')
    .notEmpty()
    .withMessage('Each lecture page must have content'),
  
  // Optional video URL (YouTube) for lecture pages
  body('lecturePages.*.videoUrl')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Video URL cannot exceed 500 characters')
    .matches(/^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.*/)
    .withMessage('Video URL must be a valid YouTube link'),
    
  // Validate quizzes
  body('quizzes')
    .isArray({ min: 1 })
    .withMessage('Course must have at least one quiz'),
    
  body('quizzes.*.id')
    .notEmpty()
    .withMessage('Each quiz must have an ID'),
    
  body('quizzes.*.title')
    .notEmpty()
    .withMessage('Each quiz must have a title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Quiz title must be between 1 and 200 characters')
    .trim(),
    
  body('quizzes.*.questions')
    .isArray({ min: 1 })
    .withMessage('Each quiz must have at least one question'),
    
  // Validate quiz questions
  body('quizzes.*.questions.*.id')
    .notEmpty()
    .withMessage('Each question must have an ID'),
    
  body('quizzes.*.questions.*.question')
    .notEmpty()
    .withMessage('Each question must have text')
    .isLength({ min: 5, max: 500 })
    .withMessage('Question text must be between 5 and 500 characters')
    .trim(),
    
  body('quizzes.*.questions.*.options')
    .isArray({ min: 4, max: 4 })
    .withMessage('Each question must have exactly 4 options'),
    
  body('quizzes.*.questions.*.options.*')
    .notEmpty()
    .withMessage('All answer options must be provided')
    .isLength({ min: 1, max: 200 })
    .withMessage('Each option must be between 1 and 200 characters')
    .trim(),
    
  body('quizzes.*.questions.*.correctAnswer')
    .isInt({ min: 0, max: 3 })
    .withMessage('Correct answer must be a number between 0 and 3')
];

// Validation rules for updating a course
const validateCourseUpdate = [
  body('courseName')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Course name must be between 3 and 200 characters')
    .trim(),
    
  body('courseDescription')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Course description cannot exceed 1000 characters')
    .trim(),
    
  body('duration')
    .optional()
    .isNumeric()
    .withMessage('Duration must be a number')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 hour'),
    
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters')
    .trim()
];

// Validation for course ID parameter
const validateCourseId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid course ID format')
];

// Validation for pagination query parameters
const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for search query
const validateSearchQuery = [
  body('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
    
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category filter cannot exceed 100 characters')
    .trim(),
    
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty filter must be beginner, intermediate, or advanced')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Custom validation for duplicate course names
const checkDuplicateCourseName = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const { courseName } = req.body;
    const courseId = req.params.id;
    
    if (courseName) {
      const existingCourse = await Course.findOne({ 
        courseName: new RegExp(`^${courseName}$`, 'i'),
        _id: { $ne: courseId } // Exclude current course when updating
      });
      
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'A course with this name already exists',
          field: 'courseName'
        });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to sanitize course data
const sanitizeCourseData = (req, res, next) => {
  if (req.body.lecturePages) {
    req.body.lecturePages = req.body.lecturePages.map(page => ({
      ...page,
      title: page.title?.trim(),
      content: page.content?.trim(),
      videoUrl: page.videoUrl ? page.videoUrl.trim() : undefined
    }));
  }
  
  if (req.body.quizzes) {
    req.body.quizzes = req.body.quizzes.map(quiz => ({
      ...quiz,
      title: quiz.title?.trim(),
      questions: quiz.questions?.map(question => ({
        ...question,
        question: question.question?.trim(),
        options: question.options?.map(option => option?.trim())
      }))
    }));
  }
  
  next();
};

module.exports = {
  validateCourseCreation,
  validateCourseUpdate,
  validateCourseId,
  validatePagination,
  validateSearchQuery,
  handleValidationErrors,
  checkDuplicateCourseName,
  sanitizeCourseData
};