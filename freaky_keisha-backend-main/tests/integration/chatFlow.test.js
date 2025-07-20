/**
 * End-to-End Chat Flow Integration Tests
 * Tests the complete chat flow from user message to AI response
 */

const request = require('supertest');
const express = require('express');

// Mock all external services
jest.mock('../../src/services/huggingfaceService');
jest.mock('../../src/services/conversationService');
jest.mock('../../src/services/encryptionService');
jest.mock('@supabase/supabase-js');

const huggingfaceService = require('../../src/services/huggingfaceService');
const conversationService = require('../../src/services/conversationService');
const encryptionService = require('../../src/services/encryptionService');

// Import the app components
const chatController = require('../../src/controllers/chatController');
const { authenticateToken } = require('../../src/middleware/auth');

describe('End-to-End Chat Flow', () => {
  let app;
  let mockUser;

  beforeAll(() => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.HUGGINGFACE_API_KEY = 'test-hf-key';
    process.env.ENCRYPTION_KEY = 'abcdef1234567890abcdef1234567890';

    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Set up chat routes
    app.post('/api/chat', chatController.handleChatMessage.bind(chatController));
    app.get('/api/chat/sessions', chatController.getConversationSessions.bind(chatController));
    app.post('/api/chat/sessions', chatController.createConversationSession.bind(chatController));
    app.get('/api/chat/status', chatController.getServiceStatus.bind(chatController));

    // Mock user for tests
    mockUser = {
      id: 'test-user-123',
      email: 'test@example.com'
    };
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up default mock responses
    huggingfaceService.getStatus.mockReturnValue({
      available: true,
      model: 'test-model',
      apiKeyConfigured: true
    });

    conversationService.getStatus.mockReturnValue({
      available: true,
      supabaseConfigured: true,
      encryptionAvailable: true
    });

    encryptionService.getStatus.mockReturnValue({
      available: true,
      keyConfigured: true
    });

    encryptionService.isAvailable.mockReturnValue(true);
  });

  describe('Complete Chat Flow', () => {
    test('should handle complete chat conversation flow', async () => {
      // Mock service responses
      huggingfaceService.generateChatResponse.mockResolvedValue(
        'Hello! I am Keisha, and I am here to help you grow and learn. How can I assist you today?'
      );

      conversationService.getUserSessions.mockResolvedValue([]);
      conversationService.createSession.mockResolvedValue({
        sessionId: 'test-session-123',
        title: 'Test Chat',
        createdAt: '2025-01-19T12:00:00Z'
      });

      conversationService.getRecentContext.mockResolvedValue([]);
      conversationService.saveConversationExchange.mockResolvedValue({
        messageId: 'test-message-123',
        sessionId: 'test-session-123',
        timestamp: '2025-01-19T12:00:00Z',
        isEncrypted: true
      });

      // Send chat message
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello Keisha, how are you today?',
          sessionId: 'test-session-123'
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('userMessage');
      expect(response.body).toHaveProperty('aiMessage');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('metadata');

      // Verify user message
      expect(response.body.userMessage).toMatchObject({
        text: 'Hello Keisha, how are you today?',
        sender: 'user',
        sessionId: 'test-session-123'
      });

      // Verify AI message
      expect(response.body.aiMessage).toMatchObject({
        text: expect.stringContaining('Hello! I am Keisha'),
        sender: 'ai',
        sessionId: 'test-session-123'
      });

      // Verify metadata
      expect(response.body.metadata).toMatchObject({
        model: 'huggingface',
        encrypted: true,
        contextUsed: false
      });

      // Verify service calls
      expect(huggingfaceService.generateChatResponse).toHaveBeenCalledWith(
        'Hello Keisha, how are you today?',
        'test-user-123',
        []
      );

      expect(conversationService.saveConversationExchange).toHaveBeenCalledWith(
        'test-session-123',
        'test-user-123',
        'Hello Keisha, how are you today?',
        expect.stringContaining('Hello! I am Keisha'),
        'huggingface'
      );
    });

    test('should handle chat with conversation context', async () => {
      // Mock conversation history
      const mockHistory = [
        {
          userMessage: 'What is your name?',
          aiResponse: 'I am Keisha, your AI companion.'
        }
      ];

      conversationService.getRecentContext.mockResolvedValue(mockHistory);
      huggingfaceService.generateChatResponse.mockResolvedValue(
        'As I mentioned, I am Keisha. I am here to help you with whatever you need!'
      );

      conversationService.saveConversationExchange.mockResolvedValue({
        messageId: 'test-message-456',
        sessionId: 'test-session-123',
        timestamp: '2025-01-19T12:05:00Z',
        isEncrypted: true
      });

      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Can you remind me of your name?',
          sessionId: 'test-session-123'
        })
        .expect(200);

      // Verify context was used
      expect(response.body.metadata.contextUsed).toBe(true);
      
      // Verify Hugging Face was called with context
      expect(huggingfaceService.generateChatResponse).toHaveBeenCalledWith(
        'Can you remind me of your name?',
        'test-user-123',
        mockHistory
      );
    });
  });

  describe('Session Management Flow', () => {
    test('should create and manage conversation sessions', async () => {
      // Mock session creation
      conversationService.createSession.mockResolvedValue({
        sessionId: 'new-session-789',
        title: 'New Chat Session',
        createdAt: '2025-01-19T12:00:00Z',
        updatedAt: '2025-01-19T12:00:00Z'
      });

      // Create new session
      const createResponse = await request(app)
        .post('/api/chat/sessions')
        .send({
          title: 'New Chat Session'
        })
        .expect(201);

      expect(createResponse.body.session).toMatchObject({
        sessionId: 'new-session-789',
        title: 'New Chat Session'
      });

      // Mock getting user sessions
      conversationService.getUserSessions.mockResolvedValue([
        {
          sessionId: 'new-session-789',
          title: 'New Chat Session',
          createdAt: '2025-01-19T12:00:00Z',
          updatedAt: '2025-01-19T12:00:00Z',
          messageCount: 0
        }
      ]);

      // Get user sessions
      const sessionsResponse = await request(app)
        .get('/api/chat/sessions')
        .expect(200);

      expect(sessionsResponse.body.sessions).toHaveLength(1);
      expect(sessionsResponse.body.sessions[0]).toMatchObject({
        sessionId: 'new-session-789',
        title: 'New Chat Session',
        messageCount: 0
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing message in chat request', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          sessionId: 'test-session-123'
          // Missing message
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid request',
        message: 'Message is required and must be a string'
      });
    });

    test('should handle AI service unavailable', async () => {
      huggingfaceService.getStatus.mockReturnValue({
        available: false,
        apiKeyConfigured: false
      });

      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          sessionId: 'test-session-123'
        })
        .expect(503);

      expect(response.body).toMatchObject({
        error: 'AI service unavailable',
        message: 'AI service is currently not available. Please try again later.'
      });
    });

    test('should handle AI response generation failure', async () => {
      huggingfaceService.generateChatResponse.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          sessionId: 'test-session-123'
        })
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'AI response generation failed',
        message: 'API rate limit exceeded'
      });
    });

    test('should continue even if conversation saving fails', async () => {
      huggingfaceService.generateChatResponse.mockResolvedValue('Test response');
      conversationService.saveConversationExchange.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          sessionId: 'test-session-123'
        })
        .expect(200);

      // Should still return the AI response even if saving failed
      expect(response.body.aiMessage.text).toBe('Test response');
    });
  });

  describe('Service Status', () => {
    test('should return comprehensive service status', async () => {
      const response = await request(app)
        .get('/api/chat/status')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('healthy');
      expect(response.body.status).toHaveProperty('huggingface');
      expect(response.body.status).toHaveProperty('conversation');
      expect(response.body.status).toHaveProperty('encryption');
    });
  });
});