require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkSecurityManager = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const securityManager = await User.findOne({ 
      email: 'admin.security@policypulse.com' 
    });

    if (securityManager) {
      console.log('✅ Security Manager found in database:');
      console.log('Email:', securityManager.email);
      console.log('Role:', securityManager.role);
      console.log('Name:', securityManager.name);
      console.log('Active:', securityManager.isActive);
      console.log('Email Verified:', securityManager.emailVerified);
    } else {
      console.log('❌ Security Manager not found in database');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error checking Security Manager:', error);
    mongoose.connection.close();
  }
};

checkSecurityManager();