const dotenv = require('dotenv');

// Load environment variables
const dotenvResult = dotenv.config();

if (dotenvResult.error) {
  console.error('Error loading .env file:', dotenvResult.error);
}

/**
 * Centralized configuration management
 * Validates and provides access to all environment variables
 */
class Config {
  constructor() {
    this.validateRequiredEnvVars();
  }

  // Server Configuration
  get server() {
    return {
      port: process.env.PORT || 3001,
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };
  }

  // Supabase Configuration
  get supabase() {
    return {
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    };
  }

  // Hugging Face Configuration
  get huggingface() {
    return {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: process.env.HUGGINGFACE_MODEL || 'DJanga24/keisha-qwen3-lora',
      apiUrl: 'https://api-inference.huggingface.co/models'
    };
  }

  // Coinbase Commerce Configuration
  get coinbase() {
    return {
      apiKey: process.env.COINBASE_COMMERCE_API_KEY,
      webhookSecret: process.env.COINBASE_WEBHOOK_SECRET
    };
  }

  // Frontend Configuration
  get frontend() {
    return {
      url: process.env.FRONTEND_URL || 'http://localhost:3000'
    };
  }

  // Encryption Configuration
  get encryption() {
    return {
      key: process.env.ENCRYPTION_KEY,
      algorithm: 'aes-256-gcm'
    };
  }

  // Security Configuration
  get security() {
    return {
      corsOrigins: process.env.CORS_ORIGINS ? 
        process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
        ['http://localhost:3000'],
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    };
  }

  // Logging Configuration
  get logging() {
    return {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || 'logs/app.log'
    };
  }

  /**
   * Validate that all required environment variables are present
   */
  validateRequiredEnvVars() {
    const required = [
      { key: 'SUPABASE_URL', description: 'Supabase project URL' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key' },
      { key: 'HUGGINGFACE_API_KEY', description: 'Hugging Face API token' },
      { key: 'ENCRYPTION_KEY', description: '32-character encryption key' }
    ];

    const missing = required.filter(item => !process.env[item.key]);

    if (missing.length > 0) {
      console.error('🚨 CRITICAL: Missing required environment variables:');
      missing.forEach(item => {
        console.error(`   ❌ ${item.key} - ${item.description}`);
      });
      console.error('');
      console.error('📋 Setup Instructions:');
      console.error('   1. Copy .env.example to .env');
      console.error('   2. Fill in the required values');
      console.error('   3. See ENVIRONMENT_SETUP.md for detailed instructions');
      console.error('');
      
      if (this.server.isProduction) {
        console.error('💥 Exiting in production mode due to missing configuration');
        process.exit(1);
      } else {
        console.warn('⚠️  Running in development mode with missing environment variables. Some features may not work.');
      }
    }

    // Validate encryption key length
    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
      console.error('🚨 CRITICAL: ENCRYPTION_KEY must be exactly 32 characters long');
      console.error('   Generate a new key with: node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))"');
      if (this.server.isProduction) {
        process.exit(1);
      }
    }

    // Validate URL formats
    if (process.env.SUPABASE_URL && !this.isValidUrl(process.env.SUPABASE_URL)) {
      console.error('🚨 CRITICAL: SUPABASE_URL is not a valid URL format');
      if (this.server.isProduction) {
        process.exit(1);
      }
    }

    console.log('✅ Configuration loaded successfully');
    if (!this.server.isProduction) {
      console.log('📊 Environment Status:');
      console.log(`   🌍 Environment: ${this.server.nodeEnv}`);
      console.log(`   🚪 Port: ${this.server.port}`);
      console.log(`   🗄️  Supabase URL: ${this.supabase.url ? '✓ Set' : '✗ Missing'}`);
      console.log(`   🤖 Hugging Face API: ${this.huggingface.apiKey ? '✓ Set' : '✗ Missing'}`);
      console.log(`   🔐 Encryption Key: ${this.encryption.key ? '✓ Set' : '✗ Missing'}`);
      console.log(`   💳 Coinbase Commerce: ${this.coinbase.apiKey ? '✓ Set' : '✗ Missing (Optional)'}`);
    }
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all configuration as a single object (for debugging)
   */
  getAll() {
    return {
      server: this.server,
      supabase: { ...this.supabase, serviceRoleKey: '***' }, // Hide sensitive data
      huggingface: { ...this.huggingface, apiKey: '***' },
      coinbase: { ...this.coinbase, apiKey: '***', webhookSecret: '***' },
      frontend: this.frontend,
      encryption: { ...this.encryption, key: '***' },
      security: this.security,
      logging: this.logging
    };
  }
}

// Export singleton instance
module.exports = new Config();