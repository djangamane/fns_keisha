const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { paymentRateLimit, createIPWhitelist } = require('../middleware/security');
const requestLogger = require('../middleware/requestLogger');

/**
 * Payment Routes
 * Defines all payment-related API endpoints with proper middleware
 */

const router = express.Router();

// Apply request logging to all payment routes
router.use(requestLogger);

/**
 * POST /api/payments/create-charge
 * Create Coinbase Commerce charge for subscription
 * Requires authentication and strict rate limiting
 */
router.post('/create-charge',
  paymentRateLimit, // Strict rate limiting for payment endpoints
  authenticateToken,
  paymentController.createCharge.bind(paymentController)
);

/**
 * POST /api/payments/coinbase-webhook
 * Handle Coinbase Commerce webhook events
 * Uses raw body parsing and IP whitelist (if configured)
 * Note: This endpoint uses express.raw() middleware in server.js
 */
router.post('/coinbase-webhook',
  // Optional IP whitelist - uncomment and configure if needed
  // createIPWhitelist(['*']), // Allow all IPs for now, configure specific Coinbase IPs in production
  paymentController.handleWebhook.bind(paymentController)
);

/**
 * GET /api/payments/history
 * Get user's payment history
 * Requires authentication
 */
router.get('/history',
  authenticateToken,
  paymentController.getPaymentHistory.bind(paymentController)
);

/**
 * GET /api/payments/subscription
 * Get user's current subscription status and features
 * Requires authentication
 */
router.get('/subscription',
  authenticateToken,
  paymentController.getSubscriptionStatus.bind(paymentController)
);

/**
 * GET /api/payments/status
 * Get payment service status
 * Optional authentication - provides more details if authenticated
 */
router.get('/status',
  optionalAuth,
  (req, res) => {
    const status = paymentController.getStatus();
    
    // Provide basic status to unauthenticated users
    if (!req.user) {
      return res.json({
        available: status.available,
        timestamp: new Date().toISOString()
      });
    }

    // Provide detailed status to authenticated users
    res.json({
      status,
      timestamp: new Date().toISOString()
    });
  }
);

module.exports = router;