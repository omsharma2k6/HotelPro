/**
 * Centralized Error Handling Middleware
 * Ensures safe, structured JSON error responses without exposing internal secrets or stack traces.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource identifier format for field '${err.path}'`;
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Handle Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((val) => val.message);
  }

  // Handle JWT specific errors if passed to next(err)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication failed: Invalid token format';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication failed: Token has expired';
  }

  // Build safe JSON response
  const response = {
    success: false,
    message,
    ...(errors ? { errors } : {})
  };

  // Stack traces are strictly hidden in all environments unless explicitly in development debugging
  if (process.env.NODE_ENV === 'development' && process.env.SHOW_DEBUG_STACKS === 'true') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
