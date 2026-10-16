const path = require('path');
const dotenv = require('dotenv');

// Load environment variables for test suites reliably
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/HotelPro_test';

const setupTestDB = () => {
  beforeAll(async () => {
    // Safety check: NEVER connect to or clean the production HotelPro database during tests
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(TEST_DB_URI);
    if (mongoose.connection.name !== 'HotelPro_test') {
      throw new Error(`CRITICAL TEST SAFETY ERROR: Test database name must be 'HotelPro_test', but was '${mongoose.connection.name}'`);
    }
  });

  afterEach(async () => {
    if (mongoose.connection.name !== 'HotelPro_test') {
      throw new Error('Refusing to clear non-test database!');
    }
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.name === 'HotelPro_test') {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.connection.close();
  });
};

module.exports = {
  setupTestDB,
  TEST_DB_URI
};
