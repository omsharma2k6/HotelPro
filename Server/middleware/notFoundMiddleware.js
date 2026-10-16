/**
 * 404 Not Found Middleware
 * Returns consistent structured JSON error when requested resource does not exist.
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = notFoundHandler;
