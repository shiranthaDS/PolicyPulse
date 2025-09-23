const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const createSecurityManager = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if security manager already exists
    const existingSecurityManager = await User.findOne({ 
      email: 'securitymanager@PolicyPulse.com' 
    });

    if (existingSecurityManager) {
      console.log('Security Manager account already exists!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('sm@1234', 10);

    // Create security manager user
    const securityManager = new User({
      name: 'Security Manager',
      email: 'securitymanager@PolicyPulse.com',
      password: hashedPassword,
      role: 'securitymanager',
      isActive: true,
      emailVerified: true,
      preferences: {
        notifications: {
          email: true,
          courseUpdates: false,
          newCourses: false
        },
        theme: 'light'
      }
    });

    await securityManager.save();
    
    console.log('✅ Security Manager account created successfully!');
    console.log('Email: securitymanager@PolicyPulse.com');
    console.log('Password: sm@1234');
    console.log('Role: securitymanager');
    
  } catch (error) {
    console.error('❌ Error creating Security Manager:', error);
  } finally {
    mongoose.connection.close();
  }
};

createSecurityManager();