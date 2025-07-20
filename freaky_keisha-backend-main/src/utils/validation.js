/**
 * Validation utilities for configuration and environment setup
 */

/**
 * Generate a secure 32-character encryption key
 * @returns {string} Random 32-character string suitable for AES-256
 */
function generateEncryptionKey() {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Validate encryption key format
 * @param {string} key - The encryption key to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateEncryptionKey(key) {
  return typeof key === 'string' && key.length === 32;
}

/**
 * Validate URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email, false otherwise
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  generateEncryptionKey,
  validateEncryptionKey,
  validateUrl,
  validateEmail
};