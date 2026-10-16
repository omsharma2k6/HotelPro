const path = require('path');
const dotenv = require('dotenv');

// Load environment variables reliably from Server/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB, isDbConnected } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const notFoundHandler = require('./middleware/notFoundMiddleware');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedClientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers with sensible limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = isDbConnected() ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    message: 'HotelPro API is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Mount API v1 Routes
app.use('/api/v1/auth', authRoutes);

// Catch-all 404 handler for unrecognized routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 8001;

// Start server only after establishing initial database connection
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`HotelPro backend server is listening on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/api/health`);
    });
    return server;
  } catch (error) {
    console.error('Fatal error during server startup:', error.message);
    process.exit(1);
  }
};

// If executed directly, run the server
if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
