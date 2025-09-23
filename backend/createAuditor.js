require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAuditor = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if auditor already exists
    const existingAuditor = await User.findOne({ 
      email: 'auditor@policypulse.com' 
    });

    if (existingAuditor) {
      console.log('Auditor account already exists!');
      console.log('Email:', existingAuditor.email);
      console.log('Role:', existingAuditor.role);
      process.exit(0);
    }

    // New credentials
    const email = 'auditor@policypulse.com';
    const password = 'auditor@1234';

    // Create new auditor user with plain password 
    // (let the pre-save hook handle hashing)
    const auditor = new User({
      name: 'System Auditor',
      email: email,
      password: password,  // Plain text - will be hashed by pre-save hook
      role: 'auditor',
      isActive: true,
      emailVerified: true,
      preferences: {
        notifications: {
          email: true,
          courseUpdates: false,
          newCourses: false
        },
        theme: 'light',
        language: 'en'
      },
      profile: {
        bio: 'System Auditor responsible for monitoring and auditing user activities',
        avatar: '',
        location: 'Audit Department',
        website: ''
      },
      createdAt: new Date(),
      lastLogin: null
    });

    await auditor.save();
    
    console.log('✅ Auditor account created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', auditor.role);
    
    // Test password verification
    const isPasswordValid = await auditor.comparePassword(password);
    console.log('Password verification test:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating Auditor:', error);
    mongoose.connection.close();
  }
};

createAuditor();