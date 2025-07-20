const crypto = require('crypto');

/**
 * Simple Encryption Service
 * Provides basic encryption functionality for message privacy
 */

const encryptionService = {
  algorithm: 'aes-256-gcm',
  key: null,
  keyBuffer: null,

  /**
   * Initialize the service
   */
  init() {
    try {
      const config = require('../config');
      this.key = config.encryption?.key || null;
      
      if (this.key && this.key.length === 32) {
        this.keyBuffer = Buffer.from(this.key, 'utf8');
      } else {
        console.warn('Encryption key not configured or invalid length');
      }
    } catch (err) {
      console.warn('Could not load config for encryption service');
    }
  },

  /**
   * Check if encryption is available
   */
  isAvailable() {
    return this.keyBuffer !== null;
  },

  /**
   * Get encryption status
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      algorithm: this.algorithm,
      keyConfigured: !!this.key,
      keyLength: this.key ? this.key.length : 0
    };
  },

  /**
   * Encrypt a message
   */
  encrypt(plaintext, userId = null) {
    if (!this.isAvailable()) {
      throw new Error('Encryption service is not available');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM(this.algorithm, this.keyBuffer, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm
    };
  },

  /**
   * Decrypt a message
   */
  decrypt(encryptedData, userId = null) {
    if (!this.isAvailable()) {
      throw new Error('Encryption service is not available');
    }

    const { encrypted, iv, authTag } = encryptedData;
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');
    
    const decipher = crypto.createDecipherGCM(this.algorithm, this.keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  },

  /**
   * Encrypt message for database storage
   */
  encryptMessage(message, userId) {
    const encryptedData = this.encrypt(message, userId);
    return JSON.stringify(encryptedData);
  },

  /**
   * Decrypt message from database
   */
  decryptMessage(encryptedMessage, userId) {
    const encryptedData = JSON.parse(encryptedMessage);
    return this.decrypt(encryptedData, userId);
  },

  /**
   * Generate session key
   */
  generateSessionKey() {
    return crypto.randomBytes(32).toString('hex');
  }
};

// Initialize the service
encryptionService.init();

module.exports = encryptionService;