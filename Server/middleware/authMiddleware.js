const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Validates Bearer token in Authorization header and attaches active user to req.user.
 */
const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Authentication token required'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Server configuration error: JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Internal server configuration error'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    // Verify user exists and is active
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User no longer exists'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Account has been deactivated'
      });
    }

    // Attach safe user instance to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Token has expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Invalid or malformed token'
    });
  }
};

module.exports = {
  protect
};
