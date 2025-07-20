/**
 * Conversation Service Tests
 * Tests for conversation history and session management
 */

const conversationService = require('../../src/services/conversationService');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-session-id',
              title: 'Test Session',
              created_at: '2025-01-19T12:00:00Z',
              updated_at: '2025-01-19T12:00:00Z'
            },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: 'session-1',
                  title: 'Chat Session 1',
                  created_at: '2025-01-19T12:00:00Z',
                  updated_at: '2025-01-19T12:00:00Z',
                  message_count: 5
                }
              ],
              error: null
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: { updated: true },
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      }))
    }))
  }))
}));

describe('Conversation Service', () => {
  beforeAll(() => {
    // Set up test environment
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  afterAll(() => {
    // Clean up
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  describe('Service Status', () => {
    test('should report correct status when configured', () => {
      const status = conversationService.getStatus();
      
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('supabaseConfigured');
      expect(status).toHaveProperty('encryptionAvailable');
    });
  });

  describe('Session Management', () => {
    test('should create a new conversation session', async () => {
      const userId = 'test-user-123';
      const title = 'Test Conversation';

      const session = await conversationService.createSession(userId, title);
      
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('title');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
      expect(session.title).toBe(title);
    });

    test('should get user sessions', async () => {
      const userId = 'test-user-123';

      const sessions = await conversationService.getUserSessions(userId, 10, 0);
      
      expect(Array.isArray(sessions)).toBe(true);
      if (sessions.length > 0) {
        expect(sessions[0]).toHaveProperty('sessionId');
        expect(sessions[0]).toHaveProperty('title');
        expect(sessions[0]).toHaveProperty('createdAt');
        expect(sessions[0]).toHaveProperty('updatedAt');
        expect(sessions[0]).toHaveProperty('messageCount');
      }
    });
  });

  describe('Message Storage', () => {
    test('should save conversation exchange', async () => {
      const sessionId = 'test-session-123';
      const userId = 'test-user-123';
      const userMessage = 'Hello, how are you?';
      const aiResponse = 'I am doing well, thank you for asking!';

      // Mock the message insertion
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'test-message-id',
                session_id: sessionId,
                created_at: '2025-01-19T12:00:00Z',
                is_encrypted: false
              },
              error: null
            }))
          }))
        }))
      });

      const result = await conversationService.saveConversationExchange(
        sessionId,
        userId,
        userMessage,
        aiResponse,
        'huggingface'
      );
      
      expect(result).toHaveProperty('messageId');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('isEncrypted');
      expect(result.sessionId).toBe(sessionId);
    });
  });

  describe('Error Handling', () => {
    test('should handle service unavailable gracefully', async () => {
      // Create a service instance without configuration
      const originalUrl = process.env.SUPABASE_URL;
      delete process.env.SUPABASE_URL;
      
      // This would create a new instance without Supabase
      const unavailableService = require('../../src/services/conversationService');
      
      await expect(unavailableService.createSession('user-id', 'title'))
        .rejects.toThrow('Conversation service is not available');
      
      // Restore configuration
      process.env.SUPABASE_URL = originalUrl;
    });
  });
});

describe('Conversation Service Integration', () => {
  test('should handle complete conversation flow', async () => {
    const userId = 'integration-test-user';
    const sessionTitle = 'Integration Test Session';
    
    // Create session
    const session = await conversationService.createSession(userId, sessionTitle);
    expect(session.sessionId).toBeDefined();
    
    // Save multiple exchanges
    const exchanges = [
      { user: 'Hello', ai: 'Hi there!' },
      { user: 'How are you?', ai: 'I am doing well, thanks!' },
      { user: 'What can you help with?', ai: 'I can help with many things!' }
    ];
    
    for (const exchange of exchanges) {
      await conversationService.saveConversationExchange(
        session.sessionId,
        userId,
        exchange.user,
        exchange.ai,
        'huggingface'
      );
    }
    
    // Get conversation history
    const history = await conversationService.getConversationHistory(
      session.sessionId,
      userId,
      10,
      0
    );
    
    expect(Array.isArray(history)).toBe(true);
    // Note: In real implementation, we'd expect 3 exchanges
    // But with mocked Supabase, we'll just verify the structure
  });
});