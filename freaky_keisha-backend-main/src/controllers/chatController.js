const { v4: uuidv4 } = require('uuid');
const huggingfaceService = require('../services/huggingfaceService');
const conversationService = require('../services/conversationService');
const encryptionService = require('../services/encryptionService');
const { apiRequest, apiResponse, apiError, info, error: logError } = require('../utils/logger');

/**
 * Chat Controller
 * Handles chat-related API endpoints with AI integration, encryption, and conversation history
 */

class ChatController {
  /**
   * Handle chat message endpoint
   * POST /api/chat
   */
  async handleChatMessage(req, res) {
    const startTime = Date.now();
    
    try {
      apiRequest(req, { endpoint: 'chat' });

      const { message, sessionId: incomingSessionId, model: requestedModel } = req.body;
      const userId = req.user?.id;

      // Validate required fields
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Message is required and must be a string'
        });
      }

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to send messages'
        });
      }

      // Check if Hugging Face service is available
      if (!huggingfaceService.getStatus().available) {
        return res.status(503).json({
          error: 'AI service unavailable',
          message: 'AI service is currently not available. Please try again later.'
        });
      }

      // Generate or use existing session ID
      const currentSessionId = incomingSessionId || uuidv4();
      let sessionExists = false;

      // Check if session exists or create new one
      if (incomingSessionId) {
        try {
          const sessions = await conversationService.getUserSessions(userId, 1, 0);
          sessionExists = sessions.some(session => session.sessionId === incomingSessionId);
        } catch (error) {
          logError('Failed to check session existence', {
            sessionId: incomingSessionId,
            userId,
            error: error.message
          });
        }
      }

      // Create session if it doesn't exist
      if (!sessionExists && conversationService.getStatus().available) {
        try {
          await conversationService.createSession(userId, `Chat ${new Date().toLocaleDateString()}`);
          info('New conversation session created', {
            sessionId: currentSessionId,
            userId
          });
        } catch (error) {
          logError('Failed to create conversation session', {
            sessionId: currentSessionId,
            userId,
            error: error.message
          });
          // Continue without session - we can still provide AI response
        }
      }

      // Get conversation context for better AI responses
      let conversationContext = [];
      if (conversationService.getStatus().available) {
        try {
          conversationContext = await conversationService.getRecentContext(currentSessionId, userId, 5);
        } catch (error) {
          logError('Failed to get conversation context', {
            sessionId: currentSessionId,
            userId,
            error: error.message
          });
          // Continue without context
        }
      }

      // Generate AI response
      let aiResponse;
      try {
        aiResponse = await huggingfaceService.generateChatResponse(
          message,
          userId,
          conversationContext
        );

        info('AI response generated successfully', {
          sessionId: currentSessionId,
          userId,
          messageLength: message.length,
          responseLength: aiResponse.length,
          model: requestedModel || 'default'
        });
      } catch (error) {
        apiError(req, error, { 
          sessionId: currentSessionId,
          service: 'huggingface'
        });

        return res.status(500).json({
          error: 'AI response generation failed',
          message: error.message,
          sessionId: currentSessionId
        });
      }

      // Save conversation exchange if service is available
      let messageId = null;
      if (conversationService.getStatus().available) {
        try {
          const savedMessage = await conversationService.saveConversationExchange(
            currentSessionId,
            userId,
            message,
            aiResponse,
            'huggingface'
          );
          messageId = savedMessage.messageId;

          info('Conversation exchange saved', {
            messageId,
            sessionId: currentSessionId,
            userId,
            encrypted: savedMessage.isEncrypted
          });
        } catch (error) {
          logError('Failed to save conversation exchange', {
            sessionId: currentSessionId,
            userId,
            error: error.message
          });
          // Continue - we can still return the response
        }
      }

      // Construct response messages for client
      const timestamp = new Date().toISOString();
      
      const userMessageForClient = {
        id: messageId ? `${messageId}_user` : `${uuidv4()}_user`,
        text: message,
        sender: 'user',
        timestamp,
        sessionId: currentSessionId
      };

      const aiMessageForClient = {
        id: messageId ? `${messageId}_ai` : `${uuidv4()}_ai`,
        text: aiResponse,
        sender: 'ai',
        timestamp,
        sessionId: currentSessionId
      };

      const responseTime = Date.now() - startTime;
      
      apiResponse(req, res, responseTime, {
        sessionId: currentSessionId,
        messageId,
        aiService: 'huggingface'
      });

      // Send response
      res.json({
        userMessage: userMessageForClient,
        aiMessage: aiMessageForClient,
        sessionId: currentSessionId,
        messageId,
        metadata: {
          model: 'huggingface',
          responseTime: `${responseTime}ms`,
          encrypted: encryptionService.isAvailable(),
          contextUsed: conversationContext.length > 0
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      apiError(req, error, {
        responseTime,
        endpoint: 'chat'
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get conversation history endpoint
   * GET /api/chat/history/:sessionId
   */
  async getConversationHistory(req, res) {
    try {
      apiRequest(req, { endpoint: 'chat-history' });

      const { sessionId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to access conversation history'
        });
      }

      if (!sessionId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Session ID is required'
        });
      }

      if (!conversationService.getStatus().available) {
        return res.status(503).json({
          error: 'Conversation service unavailable',
          message: 'Conversation history service is currently not available'
        });
      }

      // Get conversation history
      const history = await conversationService.getConversationHistory(
        sessionId,
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      // Transform history for client
      const messages = [];
      for (const exchange of history) {
        messages.push({
          id: `${exchange.messageId}_user`,
          text: exchange.userMessage,
          sender: 'user',
          timestamp: exchange.timestamp,
          sessionId
        });
        messages.push({
          id: `${exchange.messageId}_ai`,
          text: exchange.aiResponse,
          sender: 'ai',
          timestamp: exchange.timestamp,
          sessionId
        });
      }

      apiResponse(req, res, Date.now(), {
        sessionId,
        messageCount: messages.length
      });

      res.json({
        sessionId,
        messages,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: messages.length
        },
        metadata: {
          encrypted: history.length > 0 ? history[0].isEncrypted : false
        }
      });

    } catch (error) {
      apiError(req, error, { endpoint: 'chat-history' });

      res.status(500).json({
        error: 'Failed to retrieve conversation history',
        message: error.message
      });
    }
  }

  /**
   * Get user's conversation sessions endpoint
   * GET /api/chat/sessions
   */
  async getConversationSessions(req, res) {
    try {
      apiRequest(req, { endpoint: 'chat-sessions' });

      const { limit = 20, offset = 0 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to access conversation sessions'
        });
      }

      if (!conversationService.getStatus().available) {
        return res.status(503).json({
          error: 'Conversation service unavailable',
          message: 'Conversation service is currently not available'
        });
      }

      const sessions = await conversationService.getUserSessions(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      apiResponse(req, res, Date.now(), {
        sessionCount: sessions.length
      });

      res.json({
        sessions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: sessions.length
        }
      });

    } catch (error) {
      apiError(req, error, { endpoint: 'chat-sessions' });

      res.status(500).json({
        error: 'Failed to retrieve conversation sessions',
        message: error.message
      });
    }
  }

  /**
   * Create new conversation session endpoint
   * POST /api/chat/sessions
   */
  async createConversationSession(req, res) {
    try {
      apiRequest(req, { endpoint: 'create-session' });

      const { title } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to create conversation sessions'
        });
      }

      if (!conversationService.getStatus().available) {
        return res.status(503).json({
          error: 'Conversation service unavailable',
          message: 'Conversation service is currently not available'
        });
      }

      const session = await conversationService.createSession(userId, title);

      apiResponse(req, res, Date.now(), {
        sessionId: session.sessionId
      });

      res.status(201).json({
        session,
        message: 'Conversation session created successfully'
      });

    } catch (error) {
      apiError(req, error, { endpoint: 'create-session' });

      res.status(500).json({
        error: 'Failed to create conversation session',
        message: error.message
      });
    }
  }

  /**
   * Delete conversation session endpoint
   * DELETE /api/chat/sessions/:sessionId
   */
  async deleteConversationSession(req, res) {
    try {
      apiRequest(req, { endpoint: 'delete-session' });

      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to delete conversation sessions'
        });
      }

      if (!sessionId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Session ID is required'
        });
      }

      if (!conversationService.getStatus().available) {
        return res.status(503).json({
          error: 'Conversation service unavailable',
          message: 'Conversation service is currently not available'
        });
      }

      await conversationService.deleteSession(sessionId, userId);

      apiResponse(req, res, Date.now(), {
        sessionId,
        action: 'deleted'
      });

      res.json({
        message: 'Conversation session deleted successfully',
        sessionId
      });

    } catch (error) {
      apiError(req, error, { endpoint: 'delete-session' });

      res.status(500).json({
        error: 'Failed to delete conversation session',
        message: error.message
      });
    }
  }

  /**
   * Update conversation session title endpoint
   * PUT /api/chat/sessions/:sessionId
   */
  async updateConversationSession(req, res) {
    try {
      apiRequest(req, { endpoint: 'update-session' });

      const { sessionId } = req.params;
      const { title } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to update conversation sessions'
        });
      }

      if (!sessionId || !title) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Session ID and title are required'
        });
      }

      if (!conversationService.getStatus().available) {
        return res.status(503).json({
          error: 'Conversation service unavailable',
          message: 'Conversation service is currently not available'
        });
      }

      await conversationService.updateSessionTitle(sessionId, userId, title);

      apiResponse(req, res, Date.now(), {
        sessionId,
        action: 'updated'
      });

      res.json({
        message: 'Conversation session updated successfully',
        sessionId,
        title
      });

    } catch (error) {
      apiError(req, error, { endpoint: 'update-session' });

      res.status(500).json({
        error: 'Failed to update conversation session',
        message: error.message
      });
    }
  }

  /**
   * Get service status endpoint
   * GET /api/chat/status
   */
  async getServiceStatus(req, res) {
    try {
      const status = {
        huggingface: huggingfaceService.getStatus(),
        conversation: conversationService.getStatus(),
        encryption: encryptionService.getStatus(),
        timestamp: new Date().toISOString()
      };

      res.json({
        status,
        healthy: status.huggingface.available && status.conversation.available
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to get service status',
        message: error.message
      });
    }
  }
}

// Export singleton instance
module.exports = new ChatController();