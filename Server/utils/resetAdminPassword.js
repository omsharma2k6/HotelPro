const path = require('path');
const dotenv = require('dotenv');
const readline = require('readline');
const mongoose = require('mongoose');

// Load environment variables reliably
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../config/db');
const User = require('../models/User');

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

const resetAdminPassword = async () => {
  console.log('--- HotelPro Administrator Password Reset Utility ---');

  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;

  if (!email) {
    email = await askQuestion('Enter Administrator Email to reset: ');
  }

  if (!password) {
    password = await askQuestion('Enter New Administrator Password (min 8 characters): ');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.error('Validation Error: A valid email address is required.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('Validation Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const adminUser = await User.findOne({ email: normalizedEmail });

    if (!adminUser) {
      console.error(`Error: User with email '${normalizedEmail}' was not found in the database.`);
      await mongoose.connection.close();
      process.exit(1);
    }

    if (adminUser.role !== 'admin') {
      console.error(`Error: User '${normalizedEmail}' does not have the 'admin' role (Current Role: ${adminUser.role}).`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Securely hash the new password exactly once
    const passwordHash = await User.hashPassword(password);

    // Update only the targeted administrator account
    await User.updateOne(
      { _id: adminUser._id },
      { $set: { passwordHash, isActive: true } }
    );

    console.log(`Success: Password for administrator '${normalizedEmail}' has been securely updated.`);
    console.log('You can now log in at http://localhost:5173/login using this email and new password.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting administrator password:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

resetAdminPassword();
