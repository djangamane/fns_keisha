/**
 * Encryption Service Tests
 * Tests for message encryption and decryption functionality
 */

const encryptionService = require('../../src/services/encryptionService');

describe('Encryption Service', () => {
  beforeAll(() => {
    // Set up test encryption key
    process.env.ENCRYPTION_KEY = 'abcdef1234567890abcdef1234567890'; // 32 characters
    // Reinitialize service with test key
    encryptionService.init();
  });

  afterAll(() => {
    // Clean up
    delete process.env.ENCRYPTION_KEY;
  });

  describe('Service Status', () => {
    test('should report correct status when key is configured', () => {
      const status = encryptionService.getStatus();
      
      expect(status.available).toBe(true);
      expect(status.algorithm).toBe('aes-256-gcm');
      expect(status.keyConfigured).toBe(true);
      expect(status.keyLength).toBe(32);
    });

    test('should be available when properly configured', () => {
      expect(encryptionService.isAvailable()).toBe(true);
    });
  });

  describe('Message Encryption', () => {
    test('should encrypt and decrypt a simple message', () => {
      const originalMessage = 'Hello, this is a test message!';
      const userId = 'test-user-123';

      // Encrypt the message
      const encrypted = encryptionService.encrypt(originalMessage, userId);
      
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('algorithm');
      expect(encrypted.algorithm).toBe('aes-256-gcm');

      // Decrypt the message
      const decrypted = encryptionService.decrypt(encrypted, userId);
      
      expect(decrypted).toBe(originalMessage);
    });

    test('should encrypt and decrypt messages with special characters', () => {
      const originalMessage = 'Special chars: 🚀 ñáéíóú @#$%^&*()';
      const userId = 'test-user-456';

      const encrypted = encryptionService.encrypt(originalMessage, userId);
      const decrypted = encryptionService.decrypt(encrypted, userId);
      
      expect(decrypted).toBe(originalMessage);
    });

    test('should produce different encrypted output for same message', () => {
      const message = 'Same message';
      const userId = 'test-user-789';

      const encrypted1 = encryptionService.encrypt(message, userId);
      const encrypted2 = encryptionService.encrypt(message, userId);
      
      // Should be different due to random IV
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      
      // But both should decrypt to the same message
      expect(encryptionService.decrypt(encrypted1, userId)).toBe(message);
      expect(encryptionService.decrypt(encrypted2, userId)).toBe(message);
    });
  });

  describe('Message Storage Format', () => {
    test('should encrypt and decrypt messages for database storage', () => {
      const originalMessage = 'Database storage test message';
      const userId = 'test-user-db';

      // Encrypt for storage
      const encryptedForStorage = encryptionService.encryptMessage(originalMessage, userId);
      
      expect(typeof encryptedForStorage).toBe('string');
      expect(() => JSON.parse(encryptedForStorage)).not.toThrow();

      // Decrypt from storage
      const decryptedFromStorage = encryptionService.decryptMessage(encryptedForStorage, userId);
      
      expect(decryptedFromStorage).toBe(originalMessage);
    });
  });

  describe('Session Key Generation', () => {
    test('should generate unique session keys', () => {
      const key1 = encryptionService.generateSessionKey();
      const key2 = encryptionService.generateSessionKey();
      
      expect(key1).not.toBe(key2);
      expect(key1).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(key2).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(key1)).toBe(true); // Should be hex
      expect(/^[a-f0-9]+$/.test(key2)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when encrypting non-string input', () => {
      expect(() => {
        encryptionService.encrypt(123, 'user-id');
      }).toThrow('Plaintext must be a string');
    });

    test('should throw error when decrypting invalid data', () => {
      expect(() => {
        encryptionService.decrypt(null, 'user-id');
      }).toThrow('Invalid encrypted data format');

      expect(() => {
        encryptionService.decrypt({}, 'user-id');
      }).toThrow('Missing required encryption components');
    });

    test('should throw error when decrypting with wrong algorithm', () => {
      const validEncrypted = {
        encrypted: 'test',
        iv: 'test',
        authTag: 'test',
        algorithm: 'wrong-algorithm'
      };

      expect(() => {
        encryptionService.decrypt(validEncrypted, 'user-id');
      }).toThrow('Algorithm mismatch');
    });
  });
});

// Test without encryption key
describe('Encryption Service - No Key', () => {
  let originalKey;

  beforeAll(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    // Create a new instance without key
    const encryptionServiceNoKey = require('../../src/services/encryptionService');
    encryptionServiceNoKey.init();
  });

  afterAll(() => {
    if (originalKey) {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  test('should report unavailable when no key is configured', () => {
    const encryptionServiceNoKey = require('../../src/services/encryptionService');
    const status = encryptionServiceNoKey.getStatus();
    
    expect(status.available).toBe(false);
    expect(status.keyConfigured).toBe(false);
  });
});