const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const { dbQuery, dbError, info, error: logError } = require('../utils/logger');

/**
 * Supabase Database Service
 * Provides a wrapper around Supabase client with enhanced error handling and connection management
 */

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    
    this.initialize();
  }

  /**
   * Initialize Supabase client
   */
  initialize() {
    try {
      if (!config.supabase.url || !config.supabase.serviceRoleKey) {
        console.warn('Supabase configuration missing - database service will not be available');
        return;
      }

      this.client = createClient(config.supabase.url, config.supabase.serviceRoleKey);
      this.isConnected = true;
      
      info('Supabase service initialized successfully', {
        url: config.supabase.url.substring(0, 30) + '...',
        keyConfigured: !!config.supabase.serviceRoleKey
      });
    } catch (error) {
      logError('Failed to initialize Supabase service', {
        error: error.message,
        url: config.supabase.url
      });
      this.isConnected = false;
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      connected: this.isConnected,
      clientAvailable: !!this.client,
      urlConfigured: !!config.supabase.url,
      keyConfigured: !!config.supabase.serviceRoleKey,
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    if (!this.client) {
      return false;
    }

    try {
      // Simple query to test connection
      const { data, error } = await this.client
        .from('profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        logError('Database connection test failed', {
          error: error.message,
          code: error.code
        });
        return false;
      }

      info('Database connection test successful');
      return true;
    } catch (error) {
      logError('Database connection test error', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Execute a database query with retry logic
   * @param {Function} queryFunction - Function that returns a Supabase query
   * @param {string} operation - Operation name for logging
   * @param {Object} context - Additional context for logging
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(queryFunction, operation, context = {}) {
    if (!this.client) {
      throw new Error('Database service is not available');
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        dbQuery(operation, context.table || 'unknown', {
          attempt,
          ...context
        });

        const result = await queryFunction(this.client);
        
        if (result.error) {
          throw new Error(result.error.message);
        }

        return result;
      } catch (error) {
        lastError = error;
        
        dbError(operation, context.table || 'unknown', error, {
          attempt,
          maxRetries: this.maxRetries,
          ...context
        });

        // Don't retry on certain types of errors
        if (this.isNonRetryableError(error)) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if an error should not be retried
   * @param {Error} error - The error to check
   * @returns {boolean} True if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryablePatterns = [
      'duplicate key',
      'foreign key',
      'check constraint',
      'not null',
      'invalid input',
      'permission denied',
      'row level security'
    ];

    const errorMessage = error.message.toLowerCase();
    return nonRetryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId) {
    return this.executeQuery(
      (client) => client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      'select',
      { table: 'profiles', userId }
    );
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateUserProfile(userId, updates) {
    return this.executeQuery(
      (client) => client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single(),
      'update',
      { table: 'profiles', userId, updates: Object.keys(updates) }
    );
  }

  /**
   * Create user profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created profile
   */
  async createUserProfile(profileData) {
    return this.executeQuery(
      (client) => client
        .from('profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
      'insert',
      { table: 'profiles', userId: profileData.id }
    );
  }

  /**
   * Get conversation sessions for user
   * @param {string} userId - User ID
   * @param {number} limit - Limit
   * @param {number} offset - Offset
   * @returns {Promise<Array>} Conversation sessions
   */
  async getConversationSessions(userId, limit = 20, offset = 0) {
    return this.executeQuery(
      (client) => client
        .from('conversation_sessions')
        .select('id, title, created_at, updated_at, message_count')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1),
      'select',
      { table: 'conversation_sessions', userId, limit, offset }
    );
  }

  /**
   * Create conversation session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  async createConversationSession(sessionData) {
    return this.executeQuery(
      (client) => client
        .from('conversation_sessions')
        .insert({
          ...sessionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
      'insert',
      { table: 'conversation_sessions', sessionId: sessionData.id }
    );
  }

  /**
   * Update conversation session
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Updates
   * @returns {Promise<Object>} Updated session
   */
  async updateConversationSession(sessionId, updates) {
    return this.executeQuery(
      (client) => client
        .from('conversation_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single(),
      'update',
      { table: 'conversation_sessions', sessionId }
    );
  }

  /**
   * Delete conversation session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID for security
   * @returns {Promise<void>}
   */
  async deleteConversationSession(sessionId, userId) {
    return this.executeQuery(
      (client) => client
        .from('conversation_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId),
      'delete',
      { table: 'conversation_sessions', sessionId, userId }
    );
  }

  /**
   * Save message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Saved message
   */
  async saveMessage(messageData) {
    return this.executeQuery(
      (client) => client
        .from('messages')
        .insert({
          ...messageData,
          created_at: new Date().toISOString()
        })
        .select()
        .single(),
      'insert',
      { table: 'messages', messageId: messageData.id }
    );
  }

  /**
   * Get messages for session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID for security
   * @param {number} limit - Limit
   * @param {number} offset - Offset
   * @returns {Promise<Array>} Messages
   */
  async getMessages(sessionId, userId, limit = 50, offset = 0) {
    return this.executeQuery(
      (client) => client
        .from('messages')
        .select('id, user_prompt, ai_response, model_used, is_encrypted, created_at')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1),
      'select',
      { table: 'messages', sessionId, userId, limit, offset }
    );
  }

  /**
   * Delete messages for session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID for security
   * @returns {Promise<void>}
   */
  async deleteMessages(sessionId, userId) {
    return this.executeQuery(
      (client) => client
        .from('messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId),
      'delete',
      { table: 'messages', sessionId, userId }
    );
  }

  /**
   * Count messages in session
   * @param {string} sessionId - Session ID
   * @returns {Promise<number>} Message count
   */
  async countMessages(sessionId) {
    const result = await this.executeQuery(
      (client) => client
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId),
      'count',
      { table: 'messages', sessionId }
    );

    return result.count || 0;
  }

  /**
   * Update user subscription
   * @param {string} userId - User ID
   * @param {string} tier - Subscription tier
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} Updated profile
   */
  async updateUserSubscription(userId, tier, expiresAt = null) {
    return this.updateUserProfile(userId, {
      subscription_tier: tier,
      subscription_expires_at: expiresAt ? expiresAt.toISOString() : null
    });
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User profile
   */
  async getUserByEmail(email) {
    return this.executeQuery(
      (client) => client
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single(),
      'select',
      { table: 'profiles', email }
    );
  }

  /**
   * Execute raw SQL query (use with caution)
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async executeRawQuery(query, params = []) {
    if (!this.client) {
      throw new Error('Database service is not available');
    }

    try {
      const { data, error } = await this.client.rpc('execute_sql', {
        query,
        params
      });

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    } catch (error) {
      logError('Raw query execution failed', {
        query: query.substring(0, 100),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get database schema information
   * @returns {Promise<Object>} Schema information
   */
  async getSchemaInfo() {
    try {
      const tables = ['profiles', 'conversation_sessions', 'messages'];
      const schemaInfo = {};

      for (const table of tables) {
        try {
          const { data, error } = await this.client
            .from(table)
            .select('*')
            .limit(0);

          schemaInfo[table] = {
            exists: !error,
            error: error?.message
          };
        } catch (err) {
          schemaInfo[table] = {
            exists: false,
            error: err.message
          };
        }
      }

      return schemaInfo;
    } catch (error) {
      logError('Failed to get schema information', {
        error: error.message
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new SupabaseService();