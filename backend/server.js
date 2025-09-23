const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');

// Import middleware
const { globalErrorHandler, handleNotFound } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for course content
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PolicyPulse Course API is running!',
    version: '1.0.0',
    endpoints: {
      courses: '/api/courses',
      users: '/api/users',
      stats: '/api/courses/stats',
      search: '/api/courses/search'
    }
  });
});

// API Routes
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);

// Handle undefined routes
app.use((req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  next(err);
});

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    // Start server after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
