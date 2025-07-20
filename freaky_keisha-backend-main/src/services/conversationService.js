const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { createClient } = require('@supabase/supabase-js');
const encryptionService = require('./encryptionService');
const { dbQuery, dbError, info, error: logError } = require('../utils/logger');

/**
 * Conversation History Service
 * Manages conversation sessions and encrypted message history
 */

class ConversationService {
  constructor() {
    // Initialize Supabase client
    if (config.supabase.url && config.supabase.serviceRoleKey) {
      this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
      this.isAvailable = true;
    } else {
      console.warn('Supabase configuration missing - conversation service will not function properly');
      this.supabase = null;
      this.isAvailable = false;
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      available: this.isAvailable,
      supabaseConfigured: !!this.supabase,
      encryptionAvailable: encryptionService.isAvailable()
    };
  }

  /**
   * Create a new conversation session
   * @param {string} userId - User ID
   * @param {string} title - Optional session title
   * @returns {Promise<Object>} Session information
   */
  async createSession(userId, title = null) {
    if (!this.isAvailable) {
      throw new Error('Conversation service is not available');
    }

    const sessionId = uuidv4();
    const sessionTitle = title || `Chat ${new Date().toLocaleDateString()}`;

    try {
      dbQuery('insert', 'conversation_sessions', { userId, sessionId });

      const { data, error } = await this.supabase
        .from('conversation_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          title: sessionTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        dbError('insert', 'conversation_sessions', error, { userId, sessionId });
        throw new Error(`Failed to create conversation session: ${error.message}`);
      }

      info('Conversation session created', {
        sessionId,
        userId,
        title: sessionTitle
      });

      return {
        sessionId: data.id,
        title: data.title,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      logError('Failed to create conversation session', {
        userId,
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user's conversation sessions
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of sessions to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} List of conversation sessions
   */
  async getUserSessions(userId, limit = 20, offset = 0) {
    if (!this.isAvailable) {
      throw new Error('Conversation service is not available');
    }

    try {
      dbQuery('select', 'conversation_sessions', { userId, limit, offset });

      const { data, error } = await this.supabase
        .from('conversation_sessions')
        .select('id, title, created_at, updated_at, message_count')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        dbError('select', 'conversation_sessions', error, { userId, limit, offset });
        throw new Error(`Failed to fetch conversation sessions: ${error.message}`);
      }

      return data.map(session => ({
        sessionId: session.id,
        title: session.title,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        messageCount: session.message_count || 0
      }));
    } catch (error) {
      logError('Failed to fetch user sessions', {
        userId,
        limit,
        offset,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save a conversation exchange (user message + AI response)
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {string} userMessage - User's message
   * @param {string} aiResponse - AI's response
   * @param {string} modelUsed - Model used for the response
   * @returns {Promise<Object>} Saved message information
   */
  async saveConversationExchange(sessionId, userId, userMessage, aiResponse, modelUsed = 'huggingface') {
    if (!this.isAvailable) {
      throw new Error('Conversation service is not available');
    }

    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      // Encrypt messages if encryption is available
      let encryptedUserMessage = userMessage;
      let encryptedAiResponse = aiResponse;
      let isEncrypted = false;

      if (encryptionService.isAvailable()) {
        try {
          encryptedUserMessage = encryptionService.encryptMessage(userMessage, userId);
          encryptedAiResponse = encryptionService.encryptMessage(aiResponse, userId);
          isEncrypted = true;
        } catch (encryptError) {
          logError('Failed to encrypt messages, storing in plaintext', {
            sessionId,
            userId,
            error: encryptError.message
          });
        }
      }

      dbQuery('insert', 'messages', { sessionId, userId, messageId });

      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          id: messageId,
          session_id: sessionId,
          user_id: userId,
          user_prompt: encryptedUserMessage,
          ai_response: encryptedAiResponse,
          model_used: modelUsed,
          is_encrypted: isEncrypted,
          created_at: timestamp
        })
        .select()
        .single();

      if (error) {
        dbError('insert', 'messages', error, { sessionId, userId, messageId });
        throw new Error(`Failed to save conversation exchange: ${error.message}`);
      }

      // Update session's updated_at and message count
      await this.updateSessionActivity(sessionId);

      info('Conversation exchange saved', {
        messageId,
        sessionId,
        userId,
        isEncrypted,
        modelUsed
      });

      return {
        messageId: data.id,
        sessionId: data.session_id,
        timestamp: data.created_at,
        isEncrypted: data.is_encrypted
      };
    } catch (error) {
      logError('Failed to save conversation exchange', {
        sessionId,
        userId,
        messageId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID (for security)
   * @param {number} limit - Maximum number of messages to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Conversation history
   */
  async getConversationHistory(sessionId, userId, limit = 50, offset = 0) {
    if (!this.isAvailable) {
      throw new Error('Conversation service is not available');
    }

    try {
      dbQuery('select', 'messages', { sessionId, userId, limit, offset });

      const { data, error } = await this.supabase
        .from('messages')
        .select('id, user_prompt, ai_response, model_used, is_encrypted, created_at')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        dbError('select', 'messages', error, { sessionId, userId, limit, offset });
        throw new Error(`Failed to fetch conversation history: ${error.message}`);
      }

      // Decrypt messages if they are encrypted
      const decryptedHistory = [];
      for (const message of data) {
        let userMessage = message.user_prompt;
        let aiResponse = message.ai_response;

        if (message.is_encrypted && encryptionService.isAvailable()) {
          try {
            userMessage = encryptionService.decryptMessage(message.user_prompt, userId);
            aiResponse = encryptionService.decryptMessage(message.ai_response, userId);
          } catch (decryptError) {
            logError('Failed to decrypt message', {
              messageId: message.id,
              sessionId,
              userId,
              error: decryptError.message
            });
            // Continue with encrypted data rather than failing
          }
        }

        decryptedHistory.push({
          messageId: message.id,
          userMessage,
          aiResponse,
          modelUsed: message.model_used,
          timestamp: message.created_at,
          isEncrypted: message.is_encrypted
        });
      }

      return decryptedHistory;
    } catch (error) {
      logError('Failed to fetch conversation history', {
        sessionId,
        userId,
        limit,
        offset,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update session activity (last updated time and message count)
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async updateSessionActivity(sessionId) {
    if (!this.isAvailable) {
      return;
    }

    try {
      // Get current message count
      const { count, error: countError } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (countError) {
        logError('Failed to count messages for session', {
          sessionId,
          error: countError.message
        });
      }

      // Update session
      const { error } = await this.supabase
        .from('conversation_sessions')
        .update({
          updated_at: new Date().toISOString(),
          message_count: count || 0
        })
        .eq('id', sessionId);

      if (error) {
        logError('Failed to update session activity', {
          sessionId,
          error: error.message
        });
      }
    } catch (error) {
      logError('Failed to update session activity', {
        sessionId,
        error: error.message
      });
    }
  }

  /**
   * Delete a conversation session and all its messages
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId, userId) {
    if (!this.isAvailable) {
      throw new Error('Conversation service is not available');
    }

    try {
      // First delete all messages in the session
      const { error: messagesError } = await this.supabase
        .from('messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (messagesError) {
        dbError('delete', 'messages', messagesError, { sessionId, userId });
        throw new Error(`Failed to delete session messages: ${messagesError.message}`);
      }

      // Then delete the session
      const { error: sessionError } = await this.supabase
        .from('conversation_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (sessionError) {
        dbError('delete', 'conversation_sessions', sessionError, { sessionId, userId });
        throw new Error(`Failed to delete session: ${sessionError.message}`);
      }

      info('Conversation session deleted', {
        sessionId,
        userId
      });
    } catch (error) {
      logError('Failed to delete conversation session', {
        sessionId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update session title
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID (for security)
   * @param {string} newTitle - New title for the session
   * @returns {Promise<void>}
   */
  async updateSessionTitle(sessionId, userId, newTitle) {
    if (!this.isAvailable) {
      throw new Error('Conversation service is not available');
    }

    try {
      const { error } = await this.supabase
        .from('conversation_sessions')
        .update({
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        dbError('update', 'conversation_sessions', error, { sessionId, userId });
        throw new Error(`Failed to update session title: ${error.message}`);
      }

      info('Session title updated', {
        sessionId,
        userId,
        newTitle
      });
    } catch (error) {
      logError('Failed to update session title', {
        sessionId,
        userId,
        newTitle,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recent conversation context for AI (last N exchanges)
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {number} contextLength - Number of recent exchanges to include
   * @returns {Promise<Array>} Recent conversation context
   */
  async getRecentContext(sessionId, userId, contextLength = 5) {
    const history = await this.getConversationHistory(sessionId, userId, contextLength);
    
    return history.map(exchange => ({
      userMessage: exchange.userMessage,
      aiResponse: exchange.aiResponse
    }));
  }
}

// Export singleton instance
module.exports = new ConversationService();