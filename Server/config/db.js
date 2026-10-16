const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Ensure environment variables are loaded reliably regardless of execution working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let isConnected = false;

/**
 * Connect to MongoDB instance using configured MONGO_URI
 * Exits process with code 1 if connection fails during initial startup.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('Database connection error: MONGO_URI is not defined in environment configuration.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    isConnected = true;
    console.log(`MongoDB connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    // Log actionable error without exposing sensitive connection strings
    console.error('Failed to establish initial MongoDB connection:', error.message);
    process.exit(1);
  }
};

/**
 * Check if database connection is currently active
 */
const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Graceful application shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Gracefully closing MongoDB connection...`);
  try {
    await mongoose.connection.close(false);
    console.log('MongoDB connection closed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB connection shutdown:', err.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

module.exports = {
  connectDB,
  isDbConnected
};
