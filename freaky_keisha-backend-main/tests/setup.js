/**
 * Jest Test Setup
 * Global test configuration and setup for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.HUGGINGFACE_API_KEY = 'test-huggingface-api-key';
process.env.HUGGINGFACE_MODEL = 'test-model';
process.env.ENCRYPTION_KEY = 'abcdef1234567890abcdef1234567890'; // 32 characters
process.env.COINBASE_COMMERCE_API_KEY = 'test-coinbase-api-key';
process.env.COINBASE_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  /**
   * Create a mock user for testing
   */
  createMockUser: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    created_at: '2025-01-19T12:00:00Z',
    ...overrides
  }),

  /**
   * Create a mock user profile for testing
   */
  createMockProfile: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    subscription_tier: 'Free',
    subscription_expires_at: null,
    created_at: '2025-01-19T12:00:00Z',
    updated_at: '2025-01-19T12:00:00Z',
    ...overrides
  }),

  /**
   * Create a mock conversation session
   */
  createMockSession: (overrides = {}) => ({
    id: 'test-session-123',
    user_id: 'test-user-123',
    title: 'Test Chat Session',
    message_count: 0,
    created_at: '2025-01-19T12:00:00Z',
    updated_at: '2025-01-19T12:00:00Z',
    ...overrides
  }),

  /**
   * Create a mock message
   */
  createMockMessage: (overrides = {}) => ({
    id: 'test-message-123',
    session_id: 'test-session-123',
    user_id: 'test-user-123',
    user_prompt: 'Hello, how are you?',
    ai_response: 'I am doing well, thank you!',
    model_used: 'huggingface',
    is_encrypted: false,
    created_at: '2025-01-19T12:00:00Z',
    ...overrides
  }),

  /**
   * Wait for a specified amount of time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate a random test ID
   */
  generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Restore console methods
  global.console = require('console');
});