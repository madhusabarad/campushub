/**
 * Centralized error handling for all routes.
 */
const errorHandler = (err, req, res, next) => {
  // Let Express handle errors if the response has already started.
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.status) &&
      err.status >= 400 &&
      err.status <= 599
      ? err.status
      : 500;

  // Avoid exposing unexpected internal error details in production.
  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('Server error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;