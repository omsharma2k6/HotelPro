const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT token with user id and role payload
 * 
 * @param {Object} user - User document containing _id and role
 * @returns {string} Signed JWT
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
};

module.exports = {
  generateToken
};
