# Keisha AI Backend - Environment Setup Guide

This guide will help you set up the environment configuration for the Keisha AI Backend.

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in the required values** (see sections below)

3. **Start the server:**
   ```bash
   npm run dev
   ```

## Required Environment Variables

The following environment variables **must** be configured for the application to function:

### 🗄️ Database (Supabase)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (not anon key!)

### 🤖 AI Service (Hugging Face)
- `HUGGINGFACE_API_KEY` - API token for Hugging Face Inference API
- `ENCRYPTION_KEY` - 32-character key for message encryption

## Optional Environment Variables

These variables have defaults but can be customized:

### 🌐 Server Configuration
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (default: development)

### 💳 Payment Processing (Coinbase Commerce)
- `COINBASE_COMMERCE_API_KEY` - For payment processing
- `COINBASE_WEBHOOK_SECRET` - For webhook verification

### 🔒 Security Configuration
- `CORS_ORIGINS` - Allowed CORS origins
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

### 📝 Logging Configuration
- `LOG_LEVEL` - Logging level (default: info)
- `LOG_FILE` - Log file path (default: logs/app.log)

## Detailed Setup Instructions

### 1. Supabase Configuration

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your project URL:**
   - Go to Settings > API
   - Copy the "Project URL"
   - Set as `SUPABASE_URL`

3. **Get your service role key:**
   - Go to Settings > API
   - Copy the "service_role" key (NOT the anon key!)
   - Set as `SUPABASE_SERVICE_ROLE_KEY`

4. **Set up database tables:**
   ```sql
   -- Create profiles table
   CREATE TABLE profiles (
     id UUID PRIMARY KEY,
     email TEXT,
     subscription_tier TEXT DEFAULT 'Free',
     subscription_expires_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Create conversation_sessions table
   CREATE TABLE conversation_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     title TEXT,
     message_count INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Create messages table
   CREATE TABLE messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     session_id UUID REFERENCES conversation_sessions(id),
     user_id UUID REFERENCES profiles(id),
     user_prompt TEXT,
     ai_response TEXT,
     model_used TEXT,
     is_encrypted BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### 2. Hugging Face Configuration

1. **Create a Hugging Face account** at [huggingface.co](https://huggingface.co)
2. **Generate an API token:**
   - Go to Settings > Access Tokens
   - Create a new token with "Read" permissions
   - Set as `HUGGINGFACE_API_KEY`

### 3. Encryption Key Generation

Generate a secure 32-character encryption key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Using OpenSSL
openssl rand -hex 16

# Using Python
python -c "import secrets; print(secrets.token_hex(16))"
```

Set the generated key as `ENCRYPTION_KEY`.

### 4. Coinbase Commerce Setup (Optional)

1. **Create a Coinbase Commerce account** at [commerce.coinbase.com](https://commerce.coinbase.com)
2. **Get your API key:**
   - Go to Settings > API keys
   - Create a new API key
   - Set as `COINBASE_COMMERCE_API_KEY`

3. **Set up webhook:**
   - Go to Settings > Webhook endpoints
   - Add endpoint: `https://yourdomain.com/api/payments/coinbase-webhook`
   - Copy the webhook secret
   - Set as `COINBASE_WEBHOOK_SECRET`

## Environment Validation

The application will validate your environment configuration on startup:

- ✅ **Green messages** - Configuration is valid
- ⚠️ **Yellow warnings** - Optional configuration missing
- ❌ **Red errors** - Required configuration missing

### Example Startup Output:
```
Configuration loaded successfully
Environment: development
Port: 3001
Supabase URL: ✓ Set
Hugging Face API: ✓ Set
Encryption Key: ✓ Set
```

## Production Deployment

### Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique values for all secrets
- [ ] Set `CORS_ORIGINS` to your actual domain(s)
- [ ] Use HTTPS URLs for `FRONTEND_URL`
- [ ] Secure your `.env` file (never commit to version control)
- [ ] Use environment-specific configuration management
- [ ] Enable proper firewall rules
- [ ] Set up SSL/TLS certificates

### Recommended Production Values:

```bash
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
LOG_LEVEL=warn
RATE_LIMIT_MAX_REQUESTS=50
```

## Troubleshooting

### Common Issues:

1. **"CRITICAL: Missing required environment variables"**
   - Check that all required variables are set in your `.env` file
   - Ensure there are no typos in variable names

2. **"Supabase configuration missing"**
   - Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Make sure you're using the service role key, not the anon key

3. **"Encryption key not configured or invalid length"**
   - Ensure `ENCRYPTION_KEY` is exactly 32 characters long
   - Generate a new key using the commands above

4. **"Hugging Face API key not configured"**
   - Verify your `HUGGINGFACE_API_KEY` is set correctly
   - Check that your Hugging Face token has the correct permissions

### Getting Help

If you encounter issues:

1. Check the application logs in `logs/app.log`
2. Verify all environment variables are set correctly
3. Ensure all external services (Supabase, Hugging Face) are accessible
4. Check firewall and network connectivity

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Environment mode |
| `SUPABASE_URL` | **Yes** | - | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | - | Supabase service role key |
| `HUGGINGFACE_API_KEY` | **Yes** | - | Hugging Face API token |
| `HUGGINGFACE_MODEL` | No | DJanga24/keisha-qwen3-lora | AI model to use |
| `ENCRYPTION_KEY` | **Yes** | - | 32-character encryption key |
| `COINBASE_COMMERCE_API_KEY` | No | - | Coinbase Commerce API key |
| `COINBASE_WEBHOOK_SECRET` | No | - | Coinbase webhook secret |
| `FRONTEND_URL` | No | http://localhost:3000 | Frontend application URL |
| `CORS_ORIGINS` | No | http://localhost:3000 | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |
| `LOG_LEVEL` | No | info | Logging level |
| `LOG_FILE` | No | logs/app.log | Log file path |