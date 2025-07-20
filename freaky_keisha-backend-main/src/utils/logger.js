const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

/**
 * Winston Logger Configuration
 * Provides structured logging with different levels and outputs
 */

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: fileFormat,
  defaultMeta: { service: 'keisha-backend' },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate file for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport for non-production environments
if (!config.server.isProduction) {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Enhanced logging methods with context
 */
const enhancedLogger = {
  // Standard logging methods
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // API-specific logging
  apiRequest: (req, meta = {}) => {
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      ...meta
    });
  },

  apiResponse: (req, res, responseTime, meta = {}) => {
    logger.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id,
      ...meta
    });
  },

  apiError: (req, error, meta = {}) => {
    logger.error('API Error', {
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ...meta
    });
  },

  // Authentication logging
  authSuccess: (userId, method = 'jwt', meta = {}) => {
    logger.info('Authentication Success', {
      userId,
      method,
      ...meta
    });
  },

  authFailure: (reason, meta = {}) => {
    logger.warn('Authentication Failure', {
      reason,
      ...meta
    });
  },

  // Database logging
  dbQuery: (operation, table, meta = {}) => {
    logger.debug('Database Query', {
      operation,
      table,
      ...meta
    });
  },

  dbError: (operation, table, error, meta = {}) => {
    logger.error('Database Error', {
      operation,
      table,
      error: error.message,
      ...meta
    });
  },

  // External API logging
  externalApiCall: (service, endpoint, meta = {}) => {
    logger.info('External API Call', {
      service,
      endpoint,
      ...meta
    });
  },

  externalApiError: (service, endpoint, error, meta = {}) => {
    logger.error('External API Error', {
      service,
      endpoint,
      error: error.message,
      ...meta
    });
  },

  // Security logging
  securityEvent: (event, severity = 'info', meta = {}) => {
    logger.log(severity, 'Security Event', {
      event,
      timestamp: new Date().toISOString(),
      ...meta
    });
  },

  // Rate limiting
  rateLimitHit: (ip, endpoint, meta = {}) => {
    logger.warn('Rate Limit Hit', {
      ip,
      endpoint,
      ...meta
    });
  },

  // Payment logging
  paymentEvent: (event, userId, amount, currency, meta = {}) => {
    logger.info('Payment Event', {
      event,
      userId,
      amount,
      currency,
      ...meta
    });
  },

  // Encryption logging
  encryptionEvent: (operation, success, meta = {}) => {
    logger.debug('Encryption Event', {
      operation,
      success,
      ...meta
    });
  }
};

// Export both the raw winston logger and enhanced logger
module.exports = {
  logger,
  ...enhancedLogger
};