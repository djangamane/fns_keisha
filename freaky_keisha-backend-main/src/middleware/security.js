const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const config = require('../config');
const { securityEvent, rateLimitHit } = require('../utils/logger');

/**
 * Security Middleware Configuration
 * Implements comprehensive security measures including headers, rate limiting, and CORS
 */

/**
 * Helmet.js configuration for security headers
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api-inference.huggingface.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'same-origin' }
});

/**
 * CORS configuration
 */
const corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (config.security.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      securityEvent('CORS_VIOLATION', 'warn', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
});

/**
 * Rate limiting configuration
 */
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      rateLimitHit(req.ip, req.path, {
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });
      
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/';
    }
  });
};

/**
 * General API rate limiting
 */
const generalRateLimit = createRateLimit(
  config.security.rateLimitWindowMs,
  config.security.rateLimitMaxRequests,
  'Too many requests from this IP, please try again later.'
);

/**
 * Strict rate limiting for authentication endpoints
 */
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.',
  true // Skip successful requests
);

/**
 * Chat endpoint rate limiting (more restrictive)
 */
const chatRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 requests per minute
  'Too many chat requests, please slow down.'
);

/**
 * Payment endpoint rate limiting (very restrictive)
 */
const paymentRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  3, // 3 requests per minute
  'Too many payment requests, please try again later.'
);

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Additional custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Powered-By', 'Keisha-AI');
  
  // Remove Express signature
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ];
  
  const checkForSuspiciousContent = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(obj)) {
          securityEvent('SUSPICIOUS_INPUT', 'warn', {
            path,
            content: obj.substring(0, 100),
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          break;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        checkForSuspiciousContent(value, path ? `${path}.${key}` : key);
      }
    }
  };
  
  // Check request body for suspicious content
  if (req.body) {
    checkForSuspiciousContent(req.body, 'body');
  }
  
  // Check query parameters
  if (req.query) {
    checkForSuspiciousContent(req.query, 'query');
  }
  
  next();
};

/**
 * IP whitelist middleware (for webhooks)
 */
const createIPWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.includes(clientIP) || allowedIPs.includes('*')) {
      next();
    } else {
      securityEvent('IP_BLOCKED', 'warn', {
        ip: clientIP,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      
      res.status(403).json({ error: 'Access denied' });
    }
  };
};

module.exports = {
  helmet: helmetConfig,
  cors: corsConfig,
  generalRateLimit,
  authRateLimit,
  chatRateLimit,
  paymentRateLimit,
  securityHeaders,
  sanitizeRequest,
  createIPWhitelist
};