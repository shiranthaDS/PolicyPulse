require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const fixSecurityManagerPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing Security Manager if exists
    await User.findOneAndDelete({ 
      email: 'admin.security@policypulse.com'
    });
    console.log('🗑️ Deleted existing Security Manager account');

    // New credentials
    const newEmail = 'admin.security@policypulse.com';
    const newPassword = 'SecurePass2024!';

    // Create new security manager user with plain password 
    // (let the pre-save hook handle hashing)
    const securityManager = new User({
      name: 'Security Manager',
      email: newEmail,
      password: newPassword,  // Plain text - will be hashed by pre-save hook
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
    
    // Test password verification
    const isPasswordValid = await securityManager.comparePassword(newPassword);
    console.log('Password verification test:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating Security Manager:', error);
    mongoose.connection.close();
  }
};

fixSecurityManagerPassword();