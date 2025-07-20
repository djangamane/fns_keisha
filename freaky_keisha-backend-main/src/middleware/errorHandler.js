const { error: logError, securityEvent } = require('../utils/logger');
const config = require('../config');

/**
 * Centralized Error Handler Middleware
 * Provides structured error responses with proper status codes and logging
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error class
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * Service unavailable error class
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR');
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * External service error class
 */
class ExternalServiceError extends AppError {
  constructor(service, message, originalError = null) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', {
      service,
      originalError: originalError?.message
    });
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * Database error class
 */
class DatabaseError extends AppError {
  constructor(message, operation = null, table = null) {
    super(`Database error: ${message}`, 500, 'DATABASE_ERROR', {
      operation,
      table
    });
    this.name = 'DatabaseError';
  }
}

/**
 * Main error handler middleware
 */
function errorHandler(error, req, res, next) {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Set default error properties
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
    details = error.details;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry detected';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (error.name === 'SyntaxError' && error.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload too large';
  }

  // Log error with context
  const errorContext = {
    statusCode,
    code,
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  if (statusCode >= 500) {
    logError('Server error occurred', errorContext);
  } else if (statusCode >= 400) {
    logError('Client error occurred', errorContext);
  }

  // Log security events for certain error types
  if (statusCode === 401 || statusCode === 403) {
    securityEvent('AUTHENTICATION_FAILURE', 'warn', {
      statusCode,
      code,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method
    });
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      statusCode
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add details in development or for operational errors
  if (config.server.isDevelopment || (error instanceof AppError && error.isOperational)) {
    if (details) {
      errorResponse.error.details = details;
    }
  }

  // Add stack trace in development
  if (config.server.isDevelopment && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
  next(error);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error helper
 */
function createValidationError(message, details = null) {
  return new ValidationError(message, details);
}

/**
 * Authentication error helper
 */
function createAuthenticationError(message) {
  return new AuthenticationError(message);
}

/**
 * Authorization error helper
 */
function createAuthorizationError(message) {
  return new AuthorizationError(message);
}

/**
 * Not found error helper
 */
function createNotFoundError(message) {
  return new NotFoundError(message);
}

/**
 * Rate limit error helper
 */
function createRateLimitError(message) {
  return new RateLimitError(message);
}

/**
 * Service unavailable error helper
 */
function createServiceUnavailableError(message) {
  return new ServiceUnavailableError(message);
}

/**
 * External service error helper
 */
function createExternalServiceError(service, message, originalError) {
  return new ExternalServiceError(service, message, originalError);
}

/**
 * Database error helper
 */
function createDatabaseError(message, operation, table) {
  return new DatabaseError(message, operation, table);
}

/**
 * Handle uncaught exceptions
 */
function handleUncaughtException(error) {
  logError('Uncaught Exception - Server will exit', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Give time for logging to complete
  setTimeout(() => {
    process.exit(1);
  }, 1000);
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(reason, promise) {
  logError('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  });

  // In production, you might want to exit the process
  if (config.server.isProduction) {
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

// Set up global error handlers
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

module.exports = {
  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  ExternalServiceError,
  DatabaseError,
  
  // Error helpers
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createRateLimitError,
  createServiceUnavailableError,
  createExternalServiceError,
  createDatabaseError
};