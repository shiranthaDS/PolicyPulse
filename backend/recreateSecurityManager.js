require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const recreateSecurityManager = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing Security Manager if exists
    const deletedUser = await User.findOneAndDelete({ 
      email: { $in: ['securitymanager@policypulse.com', 'securitymanager@PolicyPulse.com'] }
    });

    if (deletedUser) {
      console.log('🗑️ Deleted existing Security Manager account');
    }

    // New credentials
    const newEmail = 'admin.security@policypulse.com';
    const newPassword = 'SecurePass2024!';

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Create new security manager user
    const securityManager = new User({
      name: 'Security Manager',
      email: newEmail,
      password: hashedPassword,
      role: 'securitymanager',
      isActive: true,
      emailVerified: true,
      preferences: {
        notifications: {
          email: true,
          courseUpdates: true,
          newCourses: false
        },
        theme: 'light',
        language: 'en'
      },
      profile: {
        bio: 'Security Manager responsible for user management and system security',
        avatar: '',
        location: 'System Admin',
        website: ''
      },
      createdAt: new Date(),
      lastLogin: null
    });

    await securityManager.save();
    
    console.log('✅ New Security Manager account created successfully!');
    console.log('Email:', newEmail);
    console.log('Password:', newPassword);
    console.log('Role:', securityManager.role);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating Security Manager:', error);
    mongoose.connection.close();
  }
};

recreateSecurityManager();