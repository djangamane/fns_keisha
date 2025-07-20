console.log("--- KEISHA AI BACKEND - MODULAR ARCHITECTURE ---");

// Load configuration first
const config = require('./src/config');
const { info, error: logError } = require('./src/utils/logger');

// Core dependencies
const express = require('express');

// Middleware imports
const { helmet, cors } = require('./src/middleware/security');
const requestLogger = require('./src/middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Route imports
const apiRoutes = require('./src/routes');

const app = express();
const port = config.server.port;

// Initialize services (they handle their own configuration)
info('Initializing Keisha AI Backend Server', {
  environment: config.server.nodeEnv,
  port: config.server.port
});

// Security middleware
app.use(helmet);
app.use(cors);

// Request logging
app.use(requestLogger);

// IMPORTANT: For the Coinbase webhook, we need the raw body, so express.json() must NOT parse it beforehand.
// We will use express.raw() specifically for the webhook route.
app.use('/api/payments/coinbase-webhook', express.raw({type: 'application/json'}));

// For all other routes, use express.json() middleware to parse JSON bodies
app.use(express.json()); 

// Mount API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Keisha AI Backend is running!',
    version: '2.0.0',
    architecture: 'modular',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  info('Keisha AI Backend Server started successfully', {
    port,
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString()
  });
  console.log(`🚀 Keisha AI Backend Server listening on port ${port}`);
  console.log(`📊 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 API Base URL: http://localhost:${port}/api`);
});