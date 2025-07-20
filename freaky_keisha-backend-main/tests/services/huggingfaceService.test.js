/**
 * Hugging Face Service Tests
 * Tests for AI model integration and response generation
 */

const huggingfaceService = require('../../src/services/huggingfaceService');

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  post: jest.fn()
}));

const axios = require('axios');

describe('Hugging Face Service', () => {
  beforeAll(() => {
    // Set up test configuration
    process.env.HUGGINGFACE_API_KEY = 'test-api-key';
    process.env.HUGGINGFACE_MODEL = 'test-model';
  });

  afterAll(() => {
    // Clean up
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.HUGGINGFACE_MODEL;
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Service Status', () => {
    test('should report correct status when configured', () => {
      const status = huggingfaceService.getStatus();
      
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('model');
      expect(status).toHaveProperty('baseUrl');
      expect(status).toHaveProperty('apiKeyConfigured');
      expect(status.available).toBe(true);
      expect(status.apiKeyConfigured).toBe(true);
    });
  });

  describe('Response Generation', () => {
    test('should generate AI response successfully', async () => {
      const mockResponse = {
        data: [
          {
            generated_text: 'This is a test AI response from Keisha.'
          }
        ]
      };

      axios.post.mockResolvedValue({ data: mockResponse.data });

      const prompt = 'Hello, how are you?';
      const userId = 'test-user-123';

      const response = await huggingfaceService.generateResponse(prompt, {
        userId,
        maxTokens: 100,
        temperature: 0.8
      });

      expect(response).toBe('This is a test AI response from Keisha.');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('test-model'),
        expect.objectContaining({
          inputs: prompt,
          parameters: expect.objectContaining({
            max_new_tokens: 100,
            temperature: 0.8
          })
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should generate chat response with Keisha personality', async () => {
      const mockResponse = {
        data: [
          {
            generated_text: 'Hey there! I am Keisha, and I am here to help you grow and learn.'
          }
        ]
      };

      axios.post.mockResolvedValue({ data: mockResponse.data });

      const userMessage = 'Hi Keisha!';
      const userId = 'test-user-456';
      const conversationHistory = [
        { userMessage: 'Previous message', aiResponse: 'Previous response' }
      ];

      const response = await huggingfaceService.generateChatResponse(
        userMessage,
        userId,
        conversationHistory
      );

      expect(response).toBe('Hey there! I am Keisha, and I am here to help you grow and learn.');
      
      // Verify that the system prompt was included
      const callArgs = axios.post.mock.calls[0];
      const requestData = callArgs[1];
      expect(requestData.inputs).toContain('You are Keisha');
      expect(requestData.inputs).toContain(userMessage);
    });
  });

  describe('Error Handling', () => {
    test('should handle API authentication errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { error: 'Invalid API key' }
        }
      };

      axios.post.mockRejectedValue(mockError);

      await expect(
        huggingfaceService.generateResponse('Test prompt')
      ).rejects.toThrow('Hugging Face API authentication failed');
    });

    test('should handle rate limit errors', async () => {
      const mockError = {
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' }
        }
      };

      axios.post.mockRejectedValue(mockError);

      await expect(
        huggingfaceService.generateResponse('Test prompt')
      ).rejects.toThrow('Hugging Face API rate limit exceeded');
    });

    test('should handle model loading errors', async () => {
      const mockError = {
        response: {
          status: 503,
          data: { error: 'Model is loading' }
        }
      };

      axios.post.mockRejectedValue(mockError);

      await expect(
        huggingfaceService.generateResponse('Test prompt')
      ).rejects.toThrow('Hugging Face model is currently loading');
    });

    test('should handle network timeout errors', async () => {
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded'
      };

      axios.post.mockRejectedValue(mockError);

      await expect(
        huggingfaceService.generateResponse('Test prompt')
      ).rejects.toThrow('Hugging Face API request timeout');
    });

    test('should handle invalid response format', async () => {
      const mockResponse = {
        data: null // Invalid response
      };

      axios.post.mockResolvedValue({ data: mockResponse.data });

      await expect(
        huggingfaceService.generateResponse('Test prompt')
      ).rejects.toThrow('Invalid response format from Hugging Face API');
    });

    test('should throw error when service is not available', async () => {
      // Create service without API key
      delete process.env.HUGGINGFACE_API_KEY;
      const unavailableService = require('../../src/services/huggingfaceService');

      await expect(
        unavailableService.generateResponse('Test prompt')
      ).rejects.toThrow('Hugging Face service is not available');

      // Restore API key
      process.env.HUGGINGFACE_API_KEY = 'test-api-key';
    });
  });

  describe('Model Status Checking', () => {
    test('should check if model is ready', async () => {
      const mockResponse = {
        status: 200,
        data: [{ generated_text: 'test' }]
      };

      axios.post.mockResolvedValue(mockResponse);

      const isReady = await huggingfaceService.checkModelStatus();
      
      expect(isReady).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('test-model'),
        expect.objectContaining({
          inputs: 'Hello',
          parameters: { max_new_tokens: 1 }
        }),
        expect.objectContaining({
          timeout: 5000
        })
      );
    });

    test('should detect when model is loading', async () => {
      const mockError = {
        response: { status: 503 }
      };

      axios.post.mockRejectedValue(mockError);

      const isReady = await huggingfaceService.checkModelStatus();
      
      expect(isReady).toBe(false);
    });
  });

  describe('Configuration Options', () => {
    test('should use custom generation parameters', async () => {
      const mockResponse = {
        data: [{ generated_text: 'Custom response' }]
      };

      axios.post.mockResolvedValue({ data: mockResponse.data });

      await huggingfaceService.generateResponse('Test prompt', {
        maxTokens: 256,
        temperature: 0.9,
        topP: 0.95,
        repetitionPenalty: 1.2
      });

      const callArgs = axios.post.mock.calls[0];
      const requestData = callArgs[1];
      
      expect(requestData.parameters).toEqual({
        max_new_tokens: 256,
        temperature: 0.9,
        top_p: 0.95,
        repetition_penalty: 1.2,
        return_full_text: false,
        do_sample: true
      });
    });
  });
});