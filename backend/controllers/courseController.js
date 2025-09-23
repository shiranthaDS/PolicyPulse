const Course = require('../models/Course');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (will need authentication later)
const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdAt: new Date()
    };

    // If user authentication is implemented, add instructor
    // courseData.instructor = req.user.id;

    const course = new Course(courseData);
    const savedCourse = await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: savedCourse
    });
  } catch (error) {
    console.error('Error creating course:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error.message
    });
  }
};

// @desc    Get all courses with filtering and pagination
// @route   GET /api/courses
// @access  Public
const getAllCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      difficulty,
      published = 'true',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Filter by published status
    if (published === 'true') {
      filter.isPublished = true;
    } else if (published === 'false') {
      filter.isPublished = false;
    }
    // If published === 'all' or any other value, don't add filter (show all courses)
    
    // Search in course name, description, and category
    if (search) {
      filter.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { courseDescription: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by category
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }
    
    // Filter by difficulty
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const courses = await Course.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('instructor', 'name email') // Uncomment when user model is ready
      .select('-__v');

    // Get total count for pagination
    const totalCourses = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCourses / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCourses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// @desc    Get a single course by ID
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email') // Uncomment when user model is ready
      .select('-__v');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course retrieved successfully',
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (will need authentication later)
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor (when authentication is implemented)
    // if (course.instructor.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this course'
    //   });
    // }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-__v');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (will need authentication later)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor (when authentication is implemented)
    // if (course.instructor.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this course'
    //   });
    // }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// @desc    Publish/Unpublish a course
// @route   PATCH /api/courses/:id/publish
// @access  Private (will need authentication later)
const toggleCoursePublication = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor (when authentication is implemented)
    // if (course.instructor.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to publish/unpublish this course'
    //   });
    // }

    course.isPublished = !course.isPublished;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
      data: {
        id: course._id,
        courseName: course.courseName,
        isPublished: course.isPublished
      }
    });
  } catch (error) {
    console.error('Error toggling course publication:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// @desc    Get course statistics
// @route   GET /api/courses/stats
// @access  Public
const getCourseStats = async (req, res) => {
  try {
    const stats = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          publishedCourses: {
            $sum: { $cond: ['$isPublished', 1, 0] }
          },
          averageRating: { $avg: '$rating.average' },
          totalEnrollments: { $sum: '$enrollmentCount' }
        }
      }
    ]);

    const difficultyStats = await Course.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      message: 'Course statistics retrieved successfully',
      data: {
        overview: stats[0] || {
          totalCourses: 0,
          publishedCourses: 0,
          averageRating: 0,
          totalEnrollments: 0
        },
        byDifficulty: difficultyStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// @desc    Search courses with advanced filters
// @route   POST /api/courses/search
// @access  Public
const searchCourses = async (req, res) => {
  try {
    const {
      searchTerm,
      categories = [],
      difficulties = [],
      minRating = 0,
      maxDuration,
      sortBy = 'relevance',
      page = 1,
      limit = 10
    } = req.body;

    let pipeline = [];

    // Match stage
    const matchStage = {
      isPublished: true
    };

    if (searchTerm) {
      matchStage.$text = { $search: searchTerm };
    }

    if (categories.length > 0) {
      matchStage.category = { $in: categories };
    }

    if (difficulties.length > 0) {
      matchStage.difficulty = { $in: difficulties };
    }

    if (minRating > 0) {
      matchStage['rating.average'] = { $gte: minRating };
    }

    if (maxDuration) {
      matchStage.duration = { $lte: maxDuration };
    }

    pipeline.push({ $match: matchStage });

    // Add score for text search
    if (searchTerm) {
      pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
    }

    // Sort stage
    let sortStage = {};
    switch (sortBy) {
      case 'relevance':
        if (searchTerm) {
          sortStage = { score: { $meta: 'textScore' } };
        } else {
          sortStage = { createdAt: -1 };
        }
        break;
      case 'rating':
        sortStage = { 'rating.average': -1 };
        break;
      case 'enrollment':
        sortStage = { enrollmentCount: -1 };
        break;
      case 'newest':
        sortStage = { createdAt: -1 };
        break;
      case 'oldest':
        sortStage = { createdAt: 1 };
        break;
      default:
        sortStage = { createdAt: -1 };
    }

    pipeline.push({ $sort: sortStage });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Project stage to exclude unnecessary fields
    pipeline.push({
      $project: {
        __v: 0,
        'lecturePages.content': 0 // Exclude content for performance
      }
    });

    const courses = await Course.aggregate(pipeline);

    // Get total count
    const countPipeline = pipeline.slice(0, -3); // Remove skip, limit, and project
    countPipeline.push({ $count: 'total' });
    const countResult = await Course.aggregate(countPipeline);
    const totalCourses = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCourses / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCourses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

module.exports = {
  createCourse,
  getCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  toggleCoursePublication,
  getCourseStats,
  searchCourses
};