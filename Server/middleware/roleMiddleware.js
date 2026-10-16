/**
 * Role-Based Authorization Middleware Factory
 * Restricts access to routes based on user role.
 * Must be mounted AFTER authMiddleware.protect.
 * 
 * @param  {...string} allowedRoles - List of allowed roles ('guest', 'staff', 'admin')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization check'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Requires one of [${allowedRoles.join(', ')}] permissions`
      });
    }

    next();
  };
};

// Role convenience shortcuts
const isGuest = authorize('guest');
const isStaff = authorize('staff', 'admin');
const isAdmin = authorize('admin');

module.exports = {
  authorize,
  isGuest,
  isStaff,
  isAdmin
};
