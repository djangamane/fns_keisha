const express = require('express');
const chatController = require('../controllers/chatController');
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const { chatRateLimit } = require('../middleware/security');
const requestLogger = require('../middleware/requestLogger');

/**
 * Chat Routes
 * Defines all chat-related API endpoints with proper middleware
 */

const router = express.Router();

// Apply request logging to all chat routes
router.use(requestLogger);

// Apply chat-specific rate limiting
router.use(chatRateLimit);

/**
 * POST /api/chat
 * Main chat endpoint - send message and get AI response
 * Requires authentication and applies subscription-based rate limiting
 */
router.post('/', 
  authenticateToken,
  requireSubscription('Free'), // Even free users can chat with limits
  chatController.handleChatMessage.bind(chatController)
);

/**
 * GET /api/chat/status
 * Get chat service status
 * Public endpoint for health checking
 */
router.get('/status', 
  chatController.getServiceStatus.bind(chatController)
);

/**
 * GET /api/chat/sessions
 * Get user's conversation sessions
 * Requires authentication
 */
router.get('/sessions',
  authenticateToken,
  chatController.getConversationSessions.bind(chatController)
);

/**
 * POST /api/chat/sessions
 * Create new conversation session
 * Requires authentication
 */
router.post('/sessions',
  authenticateToken,
  chatController.createConversationSession.bind(chatController)
);

/**
 * GET /api/chat/history/:sessionId
 * Get conversation history for a specific session
 * Requires authentication and Starter subscription or higher
 */
router.get('/history/:sessionId',
  authenticateToken,
  requireSubscription('Starter'), // History requires paid subscription
  chatController.getConversationHistory.bind(chatController)
);

/**
 * PUT /api/chat/sessions/:sessionId
 * Update conversation session (e.g., change title)
 * Requires authentication
 */
router.put('/sessions/:sessionId',
  authenticateToken,
  chatController.updateConversationSession.bind(chatController)
);

/**
 * DELETE /api/chat/sessions/:sessionId
 * Delete conversation session and all its messages
 * Requires authentication
 */
router.delete('/sessions/:sessionId',
  authenticateToken,
  chatController.deleteConversationSession.bind(chatController)
);

module.exports = router;