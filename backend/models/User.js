const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['employee', 'instructor', 'admin', 'securitymanager', 'auditor'],
    default: 'employee'
  },
  enrolledCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      completedPages: [{
        pageId: String,
        completedAt: {
          type: Date,
          default: Date.now
        }
      }],
      completedQuizzes: [{
        quizId: String,
        score: Number,
        totalQuestions: Number,
        answers: [{
          questionId: String,
          selectedAnswer: Number,
          isCorrect: Boolean
        }],
        completedAt: {
          type: Date,
          default: Date.now
        },
        attempts: {
          type: Number,
          default: 1
        }
      }],
      overallProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      currentPage: {
        type: String,
        default: ''
      }
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    certificateIssued: {
      type: Boolean,
      default: false
    }
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      courseUpdates: {
        type: Boolean,
        default: true
      },
      newCourses: {
        type: Boolean,
        default: false
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ 'enrolledCourses.course': 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to enroll in a course
userSchema.methods.enrollInCourse = function(courseId) {
  const isEnrolled = this.enrolledCourses.some(
    enrollment => enrollment.course.toString() === courseId.toString()
  );

  if (!isEnrolled) {
    this.enrolledCourses.push({
      course: courseId,
      progress: {
        completedPages: [],
        completedQuizzes: [],
        overallProgress: 0,
        currentPage: ''
      }
    });
  }

  return this.save();
};

// Instance method to update course progress
userSchema.methods.updateCourseProgress = function(courseId, progressData) {
  const enrollment = this.enrolledCourses.find(
    enrollment => enrollment.course.toString() === courseId.toString()
  );

  if (enrollment) {
    Object.assign(enrollment.progress, progressData);
    return this.save();
  }

  throw new Error('User is not enrolled in this course');
};

// Instance method to complete a page
userSchema.methods.completePage = function(courseId, pageId) {
  const enrollment = this.enrolledCourses.find(
    enrollment => enrollment.course.toString() === courseId.toString()
  );

  if (enrollment) {
    const pageAlreadyCompleted = enrollment.progress.completedPages.some(
      page => page.pageId === pageId
    );

    if (!pageAlreadyCompleted) {
      enrollment.progress.completedPages.push({
        pageId,
        completedAt: new Date()
      });
    }

    enrollment.progress.currentPage = pageId;
    return this.save();
  }

  throw new Error('User is not enrolled in this course');
};

// Instance method to submit quiz
userSchema.methods.submitQuiz = function(courseId, quizId, answers, score, totalQuestions) {
  const enrollment = this.enrolledCourses.find(
    enrollment => enrollment.course.toString() === courseId.toString()
  );

  if (enrollment) {
    const existingQuizIndex = enrollment.progress.completedQuizzes.findIndex(
      quiz => quiz.quizId === quizId
    );

    const quizResult = {
      quizId,
      score,
      totalQuestions,
      answers,
      completedAt: new Date(),
      attempts: 1
    };

    if (existingQuizIndex !== -1) {
      // Update existing quiz result
      quizResult.attempts = enrollment.progress.completedQuizzes[existingQuizIndex].attempts + 1;
      enrollment.progress.completedQuizzes[existingQuizIndex] = quizResult;
    } else {
      // Add new quiz result
      enrollment.progress.completedQuizzes.push(quizResult);
    }

    return this.save();
  }

  throw new Error('User is not enrolled in this course');
};

// Instance method to calculate overall progress
userSchema.methods.calculateProgress = function(courseId, totalPages, totalQuizzes) {
  const enrollment = this.enrolledCourses.find(
    enrollment => enrollment.course.toString() === courseId.toString()
  );

  if (enrollment) {
    const completedPages = enrollment.progress.completedPages.length;
    const completedQuizzes = enrollment.progress.completedQuizzes.length;
    const totalItems = totalPages + totalQuizzes;
    const completedItems = completedPages + completedQuizzes;
    
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    enrollment.progress.overallProgress = progressPercentage;

    // Mark course as completed if 100% progress
    if (progressPercentage === 100 && !enrollment.isCompleted) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();
    }

    return this.save();
  }

  throw new Error('User is not enrolled in this course');
};

// Static method to find users by course
userSchema.statics.findByCourse = function(courseId) {
  return this.find({ 'enrolledCourses.course': courseId });
};

// Virtual for total enrolled courses
userSchema.virtual('totalEnrolledCourses').get(function() {
  return this.enrolledCourses.length;
});

// Virtual for completed courses
userSchema.virtual('completedCourses').get(function() {
  return this.enrolledCourses.filter(enrollment => enrollment.isCompleted).length;
});

module.exports = mongoose.model('User', userSchema);