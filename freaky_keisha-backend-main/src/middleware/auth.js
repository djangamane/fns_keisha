const config = require('../config');
const { createClient } = require('@supabase/supabase-js');
const { authSuccess, authFailure, securityEvent } = require('../utils/logger');

// Initialize Supabase client for authentication
let supabase = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
} else {
  console.warn('Supabase configuration missing - authentication middleware will not function properly');
}

/**
 * Authentication Middleware
 * Handles JWT token validation and user context injection
 */

/**
 * Main authentication middleware
 * Validates JWT tokens and injects user context into requests
 */
async function authenticateToken(req, res, next) {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Authentication service unavailable',
        message: 'Authentication is not properly configured'
      });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      authFailure('Missing token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Validate token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      authFailure('Token validation error', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Token validation failed'
      });
    }

    if (!user) {
      authFailure('No user found for token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'No user associated with token'
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      authFailure('Profile fetch error', {
        error: profileError.message,
        userId: user.id,
        ip: req.ip
      });
    }

    // Inject user and profile into request
    req.user = user;
    req.userProfile = profile;

    authSuccess(user.id, 'jwt', {
      email: user.email,
      ip: req.ip,
      path: req.path
    });

    next();
  } catch (error) {
    authFailure('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
}

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token is provided
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || !supabase) {
    // No token provided or Supabase not configured, continue without authentication
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      req.user = user;
      req.userProfile = profile;

      authSuccess(user.id, 'jwt-optional', {
        email: user.email,
        ip: req.ip,
        path: req.path
      });
    }
  } catch (error) {
    // Log error but don't fail the request
    authFailure('Optional auth error', {
      error: error.message,
      ip: req.ip,
      path: req.path
    });
  }

  next();
}

/**
 * Subscription tier validation middleware
 * Checks if user has required subscription tier
 */
function requireSubscription(requiredTier = 'Starter') {
  const tierHierarchy = {
    'Free': 0,
    'Starter': 1,
    'Pro': 2,
    'Gold': 3
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this feature'
      });
    }

    const userTier = req.userProfile?.subscription_tier || 'Free';
    const userTierLevel = tierHierarchy[userTier] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      securityEvent('SUBSCRIPTION_TIER_INSUFFICIENT', 'warn', {
        userId: req.user.id,
        userTier,
        requiredTier,
        path: req.path
      });

      return res.status(403).json({
        error: 'Subscription upgrade required',
        message: `This feature requires ${requiredTier} subscription or higher`,
        currentTier: userTier,
        requiredTier
      });
    }

    // Check subscription expiry (except for Gold/lifetime)
    if (userTier !== 'Gold' && req.userProfile?.subscription_expires_at) {
      const expiryDate = new Date(req.userProfile.subscription_expires_at);
      const now = new Date();

      if (expiryDate < now) {
        securityEvent('SUBSCRIPTION_EXPIRED', 'warn', {
          userId: req.user.id,
          userTier,
          expiryDate: expiryDate.toISOString(),
          path: req.path
        });

        return res.status(403).json({
          error: 'Subscription expired',
          message: 'Your subscription has expired. Please renew to continue using this feature.',
          expiredOn: expiryDate.toISOString()
        });
      }
    }

    next();
  };
}

/**
 * Admin role validation middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this feature'
    });
  }

  const isAdmin = req.userProfile?.role === 'admin' || req.userProfile?.is_admin === true;

  if (!isAdmin) {
    securityEvent('ADMIN_ACCESS_DENIED', 'warn', {
      userId: req.user.id,
      email: req.user.email,
      path: req.path,
      ip: req.ip
    });

    return res.status(403).json({
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges'
    });
  }

  next();
}

/**
 * Rate limiting bypass for authenticated users
 */
function authRateLimitBypass(req, res, next) {
  if (req.user && req.userProfile?.subscription_tier === 'Gold') {
    // Gold users get higher rate limits
    req.rateLimitBypass = true;
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireSubscription,
  requireAdmin,
  authRateLimitBypass
};