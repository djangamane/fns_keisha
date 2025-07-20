const express = require('express');
const chatRoutes = require('./chatRoutes');
const paymentRoutes = require('./paymentRoutes');
const { generalRateLimit, securityHeaders, sanitizeRequest } = require('../middleware/security');
const { info } = require('../utils/logger');

/**
 * Main Routes Index
 * Configures and exports all API routes with global middleware
 */

const router = express.Router();

// Apply global security middleware
router.use(securityHeaders);
router.use(sanitizeRequest);
router.use(generalRateLimit);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API version endpoint
router.get('/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    apiVersion: '1.0',
    name: 'Keisha AI Backend',
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/chat', chatRoutes);
router.use('/payments', paymentRoutes);

// 404 handler for API routes
router.use((req, res) => {
  info('API endpoint not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} was not found`,
    availableEndpoints: {
      chat: [
        'POST /api/chat',
        'GET /api/chat/status',
        'GET /api/chat/sessions',
        'POST /api/chat/sessions',
        'GET /api/chat/history/:sessionId',
        'PUT /api/chat/sessions/:sessionId',
        'DELETE /api/chat/sessions/:sessionId'
      ],
      payments: [
        'POST /api/payments/create-charge',
        'POST /api/payments/coinbase-webhook',
        'GET /api/payments/history',
        'GET /api/payments/subscription',
        'GET /api/payments/status'
      ],
      general: [
        'GET /api/health',
        'GET /api/version'
      ]
    }
  });
});

module.exports = router;