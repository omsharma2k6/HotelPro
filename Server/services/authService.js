const User = require('../models/User');

/**
 * Authentication Business Logic Service
 */
class AuthService {
  /**
   * Find active user by email with passwordHash selected
   */
  static async findUserWithPasswordByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    return await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  }

  /**
   * Find safe user by ID
   */
  static async findSafeUserById(userId) {
    return await User.findById(userId);
  }

  /**
   * Check if email is already taken
   */
  static async isEmailTaken(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    return Boolean(existing);
  }
}

module.exports = AuthService;
