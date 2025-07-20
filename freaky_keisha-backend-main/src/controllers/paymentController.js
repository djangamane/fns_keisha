const { Client, resources, Webhook } = require('coinbase-commerce-node');
const { Charge } = resources;
const config = require('../config');
const supabaseService = require('../services/supabaseService');
const { apiRequest, apiResponse, apiError, paymentEvent, securityEvent, info, error: logError } = require('../utils/logger');

/**
 * Payment Controller
 * Handles payment-related API endpoints with Coinbase Commerce integration
 */

class PaymentController {
  constructor() {
    this.isAvailable = false;
    this.initializeCoinbase();
  }

  /**
   * Initialize Coinbase Commerce client
   */
  initializeCoinbase() {
    try {
      if (config.coinbase.apiKey) {
        Client.init(config.coinbase.apiKey);
        this.isAvailable = true;
        info('Coinbase Commerce client initialized successfully');
      } else {
        console.warn('Coinbase Commerce API key not configured - payment functionality will be disabled');
      }
    } catch (error) {
      logError('Failed to initialize Coinbase Commerce client', {
        error: error.message
      });
      this.isAvailable = false;
    }
  }

  /**
   * Get payment service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      available: this.isAvailable,
      coinbaseConfigured: !!config.coinbase.apiKey,
      webhookSecretConfigured: !!config.coinbase.webhookSecret
    };
  }

  /**
   * Create Coinbase Commerce charge
   * POST /api/payments/create-charge
   */
  async createCharge(req, res) {
    try {
      apiRequest(req, { endpoint: 'create-charge' });

      if (!this.isAvailable) {
        return res.status(503).json({
          error: 'Payment service unavailable',
          message: 'Payment processing is currently not available'
        });
      }

      const { tier, userId, userEmail } = req.body;
      const authenticatedUserId = req.user?.id;

      // Validate required fields
      if (!tier || !userId || !userEmail) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Tier, userId, and userEmail are required'
        });
      }

      // Security check: ensure user can only create charges for themselves
      if (authenticatedUserId && authenticatedUserId !== userId) {
        securityEvent('PAYMENT_USER_MISMATCH', 'warn', {
          authenticatedUserId,
          requestedUserId: userId,
          ip: req.ip
        });
        
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only create charges for your own account'
        });
      }

      // Define pricing and charge data based on tier
      const chargeData = this.buildChargeData(tier, userId, userEmail);
      
      if (!chargeData) {
        return res.status(400).json({
          error: 'Invalid tier',
          message: `Unsupported subscription tier: ${tier}`
        });
      }

      paymentEvent('charge_creation_started', userId, chargeData.local_price.amount, 'USD', {
        tier,
        userEmail
      });

      // Create charge with Coinbase Commerce
      const charge = await Charge.create(chargeData);

      paymentEvent('charge_created', userId, chargeData.local_price.amount, 'USD', {
        tier,
        chargeId: charge.id,
        chargeCode: charge.code,
        userEmail
      });

      apiResponse(req, res, Date.now(), {
        tier,
        chargeId: charge.id,
        amount: chargeData.local_price.amount
      });

      res.json({
        success: true,
        charge: {
          id: charge.id,
          code: charge.code,
          hosted_url: charge.hosted_url,
          pricing: charge.pricing,
          created_at: charge.created_at
        },
        tier,
        amount: chargeData.local_price.amount,
        currency: chargeData.local_price.currency
      });

    } catch (error) {
      apiError(req, error, { 
        endpoint: 'create-charge',
        service: 'coinbase'
      });

      paymentEvent('charge_creation_failed', req.body.userId, req.body.tier, 'USD', {
        error: error.message,
        tier: req.body.tier
      });

      // Handle specific Coinbase errors
      if (error.response && error.response.data) {
        const coinbaseError = error.response.data;
        return res.status(500).json({
          error: 'Payment service error',
          message: 'Failed to create payment charge',
          details: coinbaseError.error?.message || 'Unknown payment service error'
        });
      }

      res.status(500).json({
        error: 'Payment processing failed',
        message: 'An error occurred while creating the payment charge',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Handle Coinbase Commerce webhook
   * POST /api/payments/coinbase-webhook
   */
  async handleWebhook(req, res) {
    try {
      const rawBody = req.body;
      const signature = req.headers['x-cc-webhook-signature'];
      const webhookSecret = config.coinbase.webhookSecret;

      // Validate webhook requirements
      if (!webhookSecret) {
        securityEvent('WEBHOOK_SECRET_MISSING', 'error', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(500).json({
          error: 'Webhook configuration error',
          message: 'Webhook secret not configured'
        });
      }

      if (!signature) {
        securityEvent('WEBHOOK_SIGNATURE_MISSING', 'warn', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(400).json({
          error: 'Missing webhook signature',
          message: 'Webhook signature is required'
        });
      }

      if (!rawBody) {
        securityEvent('WEBHOOK_BODY_MISSING', 'warn', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(400).json({
          error: 'Missing request body',
          message: 'Webhook body is required'
        });
      }

      // Verify webhook signature
      let event;
      try {
        event = Webhook.verifyEventBody(rawBody, signature, webhookSecret);
      } catch (verifyError) {
        securityEvent('WEBHOOK_VERIFICATION_FAILED', 'error', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          error: verifyError.message
        });
        return res.status(400).json({
          error: 'Webhook verification failed',
          message: 'Invalid webhook signature'
        });
      }

      info('Webhook event received', {
        eventType: event.type,
        eventId: event.id,
        ip: req.ip
      });

      // Process webhook event
      await this.processWebhookEvent(event);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        eventId: event.id
      });

    } catch (error) {
      logError('Webhook processing error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip
      });

      res.status(500).json({
        error: 'Webhook processing failed',
        message: 'An error occurred while processing the webhook'
      });
    }
  }

  /**
   * Get payment history for user
   * GET /api/payments/history
   */
  async getPaymentHistory(req, res) {
    try {
      apiRequest(req, { endpoint: 'payment-history' });

      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to access payment history'
        });
      }

      // Get user profile with subscription information
      if (!supabaseService.getStatus().connected) {
        return res.status(503).json({
          error: 'Database service unavailable',
          message: 'Cannot retrieve payment history at this time'
        });
      }

      const { data: profile } = await supabaseService.getUserProfile(userId);

      const paymentHistory = {
        currentSubscription: {
          tier: profile?.subscription_tier || 'Free',
          expiresAt: profile?.subscription_expires_at,
          isActive: this.isSubscriptionActive(profile)
        },
        // Note: Coinbase Commerce doesn't provide easy access to historical charges
        // This would need to be enhanced with a local payment tracking system
        transactions: []
      };

      apiResponse(req, res, Date.now(), {
        userId,
        currentTier: paymentHistory.currentSubscription.tier
      });

      res.json({
        success: true,
        paymentHistory
      });

    } catch (error) {
      apiError(req, error, { endpoint: 'payment-history' });

      res.status(500).json({
        error: 'Failed to retrieve payment history',
        message: error.message
      });
    }
  }

  /**
   * Get subscription status
   * GET /api/payments/subscription
   */
  async getSubscriptionStatus(req, res) {
    try {
      apiRequest(req, { endpoint: 'subscription-status' });

      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to check subscription status'
        });
      }

      if (!supabaseService.getStatus().connected) {
        return res.status(503).json({
          error: 'Database service unavailable',
          message: 'Cannot retrieve subscription status at this time'
        });
      }

      const { data: profile } = await supabaseService.getUserProfile(userId);

      const subscription = {
        tier: profile?.subscription_tier || 'Free',
        expiresAt: profile?.subscription_expires_at,
        isActive: this.isSubscriptionActive(profile),
        features: this.getSubscriptionFeatures(profile?.subscription_tier || 'Free')
      };

      apiResponse(req, res, Date.now(), {
        userId,
        tier: subscription.tier,
        isActive: subscription.isActive
      });

      res.json({
        success: true,
        subscription
      });

    } catch (error) {
      apiError(req, error, { endpoint: 'subscription-status' });

      res.status(500).json({
        error: 'Failed to retrieve subscription status',
        message: error.message
      });
    }
  }

  /**
   * Build charge data for Coinbase Commerce
   * @param {string} tier - Subscription tier
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @returns {Object|null} Charge data or null if invalid tier
   */
  buildChargeData(tier, userId, userEmail) {
    const baseChargeData = {
      pricing_type: 'fixed_price',
      metadata: {
        user_id: userId,
        user_email: userEmail,
        tier: tier
      },
      redirect_url: `${config.frontend.url}/payment-success`,
      cancel_url: `${config.frontend.url}/payment-cancelled`
    };

    switch (tier) {
      case 'Starter':
        return {
          ...baseChargeData,
          name: 'Keisha AI - Starter Plan',
          description: 'Monthly subscription to Keisha AI Starter features.',
          local_price: {
            amount: '9.00',
            currency: 'USD'
          }
        };

      case 'Pro':
        return {
          ...baseChargeData,
          name: 'Keisha AI - Pro Plan',
          description: 'Monthly subscription to Keisha AI Pro features.',
          local_price: {
            amount: '59.00',
            currency: 'USD'
          }
        };

      case 'Gold':
        return {
          ...baseChargeData,
          name: 'Keisha AI - Gold Plan',
          description: 'Lifetime access to Keisha AI Gold features.',
          local_price: {
            amount: '99.00',
            currency: 'USD'
          }
        };

      default:
        return null;
    }
  }

  /**
   * Process webhook event
   * @param {Object} event - Coinbase webhook event
   */
  async processWebhookEvent(event) {
    switch (event.type) {
      case 'charge:confirmed':
        await this.handleChargeConfirmed(event.data);
        break;
      
      case 'charge:failed':
        await this.handleChargeFailed(event.data);
        break;
      
      case 'charge:pending':
        await this.handleChargePending(event.data);
        break;
      
      default:
        info('Unhandled webhook event type', {
          eventType: event.type,
          eventId: event.id
        });
    }
  }

  /**
   * Handle confirmed charge
   * @param {Object} charge - Charge data
   */
  async handleChargeConfirmed(charge) {
    const userId = charge.metadata?.user_id;
    const userEmail = charge.metadata?.user_email;
    const tier = charge.metadata?.tier;

    if (!userId || !tier) {
      logError('Charge confirmed but missing metadata', {
        chargeId: charge.id,
        metadata: charge.metadata
      });
      return;
    }

    paymentEvent('charge_confirmed', userId, charge.pricing?.local?.amount, 'USD', {
      tier,
      chargeId: charge.id,
      userEmail
    });

    // Calculate subscription expiry
    let subscriptionExpiresAt = null;
    if (tier === 'Starter') {
      subscriptionExpiresAt = new Date();
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
    } else if (tier === 'Pro') {
      subscriptionExpiresAt = new Date();
      subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);
    } else if (tier === 'Gold') {
      // Lifetime subscription - set to far future or null
      subscriptionExpiresAt = new Date('9999-12-31');
    }

    // Update user subscription in database
    if (supabaseService.getStatus().connected) {
      try {
        await supabaseService.updateUserSubscription(userId, tier, subscriptionExpiresAt);
        
        paymentEvent('subscription_updated', userId, charge.pricing?.local?.amount, 'USD', {
          tier,
          expiresAt: subscriptionExpiresAt?.toISOString(),
          chargeId: charge.id
        });

        info('User subscription updated successfully', {
          userId,
          tier,
          expiresAt: subscriptionExpiresAt?.toISOString()
        });
      } catch (error) {
        logError('Failed to update user subscription', {
          userId,
          tier,
          chargeId: charge.id,
          error: error.message
        });
      }
    }
  }

  /**
   * Handle failed charge
   * @param {Object} charge - Charge data
   */
  async handleChargeFailed(charge) {
    const userId = charge.metadata?.user_id;
    const tier = charge.metadata?.tier;

    paymentEvent('charge_failed', userId, charge.pricing?.local?.amount, 'USD', {
      tier,
      chargeId: charge.id,
      reason: 'Payment failed or expired'
    });

    info('Charge failed', {
      chargeId: charge.id,
      userId,
      tier
    });
  }

  /**
   * Handle pending charge
   * @param {Object} charge - Charge data
   */
  async handleChargePending(charge) {
    const userId = charge.metadata?.user_id;
    const tier = charge.metadata?.tier;

    paymentEvent('charge_pending', userId, charge.pricing?.local?.amount, 'USD', {
      tier,
      chargeId: charge.id
    });

    info('Charge pending', {
      chargeId: charge.id,
      userId,
      tier
    });
  }

  /**
   * Check if subscription is active
   * @param {Object} profile - User profile
   * @returns {boolean} True if subscription is active
   */
  isSubscriptionActive(profile) {
    if (!profile?.subscription_tier || profile.subscription_tier === 'Free') {
      return false;
    }

    if (profile.subscription_tier === 'Gold') {
      return true; // Lifetime subscription
    }

    if (profile.subscription_expires_at) {
      const expiryDate = new Date(profile.subscription_expires_at);
      return expiryDate > new Date();
    }

    return false;
  }

  /**
   * Get subscription features
   * @param {string} tier - Subscription tier
   * @returns {Object} Subscription features
   */
  getSubscriptionFeatures(tier) {
    const features = {
      Free: {
        messagesPerDay: 10,
        conversationHistory: false,
        prioritySupport: false,
        advancedFeatures: false
      },
      Starter: {
        messagesPerDay: 100,
        conversationHistory: true,
        prioritySupport: false,
        advancedFeatures: false
      },
      Pro: {
        messagesPerDay: 1000,
        conversationHistory: true,
        prioritySupport: true,
        advancedFeatures: true
      },
      Gold: {
        messagesPerDay: -1, // Unlimited
        conversationHistory: true,
        prioritySupport: true,
        advancedFeatures: true
      }
    };

    return features[tier] || features.Free;
  }
}

// Export singleton instance
module.exports = new PaymentController();