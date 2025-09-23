require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'admin.security@policypulse.com';
    const password = 'SecurePass2024!';

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
    console.log('Email Verified:', user.emailVerified);

    // Test password verification
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    if (!isPasswordValid) {
      console.log('Stored password hash:', user.password);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error testing login:', error);
    mongoose.connection.close();
  }
};

testLogin();