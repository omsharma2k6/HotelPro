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

const seedAdmin = async () => {
  console.log('--- HotelPro Admin Seeding Utility ---');

  let name = process.env.ADMIN_NAME;
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  let phone = process.env.ADMIN_PHONE;

  // Interactively prompt for missing values if not provided via environment
  if (!name) {
    name = await askQuestion('Enter Admin Name: ');
  }
  if (!email) {
    email = await askQuestion('Enter Admin Email: ');
  }
  if (!phone) {
    phone = await askQuestion('Enter Admin Phone Number: ');
  }
  if (!password) {
    password = await askQuestion('Enter Admin Password (min 8 characters): ');
  }

  // Validate fields
  if (!name || name.length < 2) {
    console.error('Validation Error: Admin name must be at least 2 characters long.');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.error('Validation Error: A valid email address is required.');
    process.exit(1);
  }

  if (!phone || phone.length < 7) {
    console.error('Validation Error: Phone number must be at least 7 characters.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('Validation Error: Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      console.log(`User with email '${normalizedEmail}' already exists (Current Role: ${existingUser.role}).`);
      console.log('To prevent accidental security overrides, existing administrator passwords were not altered.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const passwordHash = await User.hashPassword(password);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: 'admin',
      isActive: true
    });

    console.log(`Success: Initial administrator account '${normalizedEmail}' successfully created with role 'admin'.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding administrator account:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
