import ApiError from '../utils/apiError.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ApiError(400, `Resource not found`);
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(400, `${field} already exists`);
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    error = new ApiError(400, message);
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') error = new ApiError(401, 'Invalid token');
  if (err.name === 'TokenExpiredError') error = new ApiError(401, 'Token expired');

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
