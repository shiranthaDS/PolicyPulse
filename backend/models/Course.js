const mongoose = require('mongoose');

// Question Schema for MCQ
const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 4;
      },
      message: 'Each question must have exactly 4 options'
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  }
}, { _id: false });

// Quiz Schema
const quizSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Quiz must have at least one question'
    }
  }
}, { _id: false });

// Lecture Page Schema
// Includes optional `videoUrl` kept raw (watch / youtu.be / shorts / embed). Frontend
// normalizes to an embed URL. This keeps backend free from provider-specific logic.
const lecturePageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  // Optional YouTube video URL for this lecture page (validated in middleware).
  videoUrl: {
    type: String,
    trim: true,
    maxlength: [500, 'Video URL cannot exceed 500 characters']
  },
  pageNumber: {
    type: Number,
    required: true
  }
}, { _id: false });

// Main Course Schema
const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  courseDescription: {
    type: String,
    trim: true,
    maxlength: [1000, 'Course description cannot exceed 1000 characters']
  },
  duration: {
    type: Number,
    min: [1, 'Duration must be at least 1 hour']
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  lecturePages: {
    type: [lecturePageSchema],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Course must have at least one lecture page'
    }
  },
  quizzes: {
    type: [quizSchema],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Course must have at least one quiz'
    }
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true // Uncomment when user authentication is implemented
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: {
    type: String, // URL to course thumbnail image
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better query performance
courseSchema.index({ courseName: 'text', courseDescription: 'text', category: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ 'rating.average': -1 });

// Virtual for total quiz questions
courseSchema.virtual('totalQuestions').get(function() {
  return this.quizzes.reduce((total, quiz) => total + quiz.questions.length, 0);
});

// Virtual for total lecture pages
courseSchema.virtual('totalPages').get(function() {
  return this.lecturePages.length;
});

// Pre-save middleware to auto-assign page numbers
courseSchema.pre('save', function(next) {
  // Auto-assign page numbers to lecture pages
  this.lecturePages.forEach((page, index) => {
    page.pageNumber = index + 1;
  });
  next();
});

// Static method to get courses by difficulty
courseSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty, isPublished: true });
};

// Static method to get courses by category
courseSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: new RegExp(category, 'i'), 
    isPublished: true 
  });
};

// Instance method to calculate completion rate
courseSchema.methods.getCompletionRate = function(completedPages, completedQuizzes) {
  const totalItems = this.lecturePages.length + this.quizzes.length;
  const completedItems = completedPages + completedQuizzes;
  return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
};

// Instance method to publish course
courseSchema.methods.publish = function() {
  this.isPublished = true;
  return this.save();
};

// Instance method to unpublish course
courseSchema.methods.unpublish = function() {
  this.isPublished = false;
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);