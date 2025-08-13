const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

// Import services
const FNSNewsService = require('./services/fnsNewsService');
const KeishaAnalysisIntegration = require('./services/keishaAnalysisIntegration');
const EnhancedDataService = require('./services/enhancedDataService');

// Import routes
const fnsNewsRoutes = require('./routes/fnsNewsRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize services
const newsService = new FNSNewsService();
const keishaIntegration = new KeishaAnalysisIntegration();
const enhancedDataService = new EnhancedDataService();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FNS News Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/fns/news', fnsNewsRoutes);

// Enhanced data service endpoints
app.get('/api/fns/data/status', async (req, res) => {
  try {
    const status = await enhancedDataService.getDataSourceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get data source status',
      message: error.message
    });
  }
});

app.get('/api/fns/data/critical', async (req, res) => {
  try {
    const { limit = 20, minSeverity = 70 } = req.query;
    const articles = await enhancedDataService.getArticles({
      source: 'critical',
      limit: parseInt(limit),
      minSeverity: parseFloat(minSeverity)
    });

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      source: 'critical_newsletter'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get critical articles',
      message: error.message
    });
  }
});

app.get('/api/fns/data/summary', async (req, res) => {
  try {
    const { date } = req.query;
    const summary = await enhancedDataService.getDailySummary(date);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get summary',
      message: error.message
    });
  }
});

// HYBRID enhancement endpoints
app.get('/api/fns/data/hybrid', async (req, res) => {
  try {
    const { limit = 10, minSeverity = 75, enhanceContent = 'true' } = req.query;

    const articles = await enhancedDataService.getArticles({
      source: 'hybrid',
      limit: parseInt(limit),
      minSeverity: parseFloat(minSeverity),
      enhanceContent: enhanceContent === 'true'
    });

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      source: 'hybrid_enhanced',
      note: 'Critical newsletter seeds enhanced with full article content'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get hybrid articles',
      message: error.message
    });
  }
});

app.get('/api/fns/data/keisha-ready', async (req, res) => {
  try {
    const { limit = 10, minSeverity = 75 } = req.query;

    const articles = await enhancedDataService.getArticlesForKeishaAnalysis({
      limit: parseInt(limit),
      minSeverity: parseFloat(minSeverity)
    });

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      note: 'Articles with full content ready for Keisha AI analysis'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Keisha-ready articles',
      message: error.message
    });
  }
});

app.get('/api/fns/data/enhancement-stats', async (req, res) => {
  try {
    const { limit = 20, minSeverity = 70 } = req.query;

    const stats = await enhancedDataService.getEnhancementStats({
      limit: parseInt(limit),
      minSeverity: parseFloat(minSeverity)
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get enhancement stats',
      message: error.message
    });
  }
});

// Keisha integration endpoints
app.get('/api/fns/keisha/status', async (req, res) => {
  try {
    const queueStatus = keishaIntegration.getQueueStatus();
    const connectionTest = await keishaIntegration.testKeishaConnection();
    
    res.json({
      success: true,
      data: {
        queue: queueStatus,
        keisha_connection: connectionTest
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Keisha status',
      message: error.message
    });
  }
});

app.post('/api/fns/keisha/analyze-pending', async (req, res) => {
  try {
    const { limit = 10 } = req.body;
    const result = await keishaIntegration.analyzePendingArticles(limit);

    res.json({
      success: true,
      message: 'Articles queued for analysis',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to queue articles for analysis',
      message: error.message
    });
  }
});

// NEW: Hybrid Keisha analysis endpoint
app.post('/api/fns/keisha/analyze-hybrid', async (req, res) => {
  try {
    const { limit = 5, minSeverity = 80 } = req.body;

    // Get hybrid articles ready for Keisha analysis
    const hybridArticles = await enhancedDataService.getArticlesForKeishaAnalysis({
      limit: parseInt(limit),
      minSeverity: parseFloat(minSeverity)
    });

    if (hybridArticles.length === 0) {
      return res.json({
        success: true,
        message: 'No hybrid articles ready for analysis',
        data: []
      });
    }

    // Analyze with enhanced Keisha integration
    const analysisResults = await keishaIntegration.analyzeHybridArticles(hybridArticles);

    res.json({
      success: true,
      message: `Analyzed ${analysisResults.length} hybrid articles with full content`,
      data: analysisResults,
      summary: {
        articles_processed: hybridArticles.length,
        successful_analyses: analysisResults.filter(r => !r.analysis_failed).length,
        failed_analyses: analysisResults.filter(r => r.analysis_failed).length,
        average_word_count: hybridArticles.reduce((sum, a) => sum + (a.word_count || 0), 0) / hybridArticles.length,
        total_images: hybridArticles.reduce((sum, a) => sum + (a.images?.length || 0), 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze hybrid articles',
      message: error.message
    });
  }
});

// Serve static files (for Matrix video and other assets)
app.use('/static', express.static(path.join(__dirname, 'public')));

// Serve React app (when built)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Automated tasks
function setupAutomatedTasks() {
  console.log('Setting up automated tasks...');
  
  // HYBRID import twice daily (6 AM and 6 PM)
  cron.schedule('0 6,18 * * *', async () => {
    console.log('🎯 Starting automated HYBRID enhancement...');
    try {
      // Get hybrid enhanced articles (critical seeds + full content)
      const hybridArticles = await enhancedDataService.getArticles({
        source: 'hybrid',
        limit: 20,
        minSeverity: 75,
        enhanceContent: true
      });

      if (hybridArticles.length > 0) {
        console.log(`✅ Enhanced ${hybridArticles.length} hybrid articles`);

        // Save enhanced articles to local storage as backup (if database available)
        try {
          await newsService.saveArticlesToLocal(hybridArticles);
        } catch (saveError) {
          console.warn('Could not save to database, but hybrid articles are available:', saveError.message);
        }

        // Queue articles with full content for REAL Keisha analysis
        const keishaReadyArticles = hybridArticles.filter(a => a.ready_for_keisha);
        if (keishaReadyArticles.length > 0) {
          console.log(`🧠 Queuing ${keishaReadyArticles.length} articles for REAL Keisha analysis...`);
          const analysisResult = await keishaIntegration.analyzePendingArticles(keishaReadyArticles.length);
          console.log('Articles queued for Keisha analysis:', analysisResult);
        }

      } else {
        console.log('⚠️ No hybrid articles found, falling back to critical seeds only');

        // Fallback to critical seeds without enhancement
        const criticalSeeds = await enhancedDataService.getArticles({
          source: 'critical',
          limit: 50,
          minSeverity: 70,
          enhanceContent: false
        });
        console.log(`Fallback: ${criticalSeeds.length} critical seeds imported`);
      }

    } catch (error) {
      console.error('Automated hybrid import failed:', error);
    }
  });
  
  // Process analysis queue every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      const queueStatus = keishaIntegration.getQueueStatus();
      if (queueStatus.queue_length > 0 && !queueStatus.is_processing) {
        console.log('Processing analysis queue...');
        await keishaIntegration.processAnalysisQueue();
      }
    } catch (error) {
      console.error('Queue processing failed:', error);
    }
  });
  
  // Analyze pending articles every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await keishaIntegration.analyzePendingArticles(20);
    } catch (error) {
      console.error('Pending analysis failed:', error);
    }
  });
  
  console.log('Automated tasks configured:');
  console.log('- News import: 6 AM and 6 PM daily');
  console.log('- Queue processing: Every 30 minutes');
  console.log('- Pending analysis: Every hour');
}

// Initialize application
async function initializeApp() {
  try {
    console.log('Initializing FNS News Service...');

    // Test database connection (optional for hybrid mode)
    try {
      await newsService.pool.execute('SELECT 1');
      console.log('✓ Database connection established');
    } catch (dbError) {
      console.warn('⚠ Database connection failed:', dbError.message);
      console.warn('  Database features will be limited, but hybrid mode will work');
    }

    // Test Keisha connection
    try {
      const keishaStatus = await keishaIntegration.testKeishaConnection();
      if (keishaStatus.connected) {
        console.log('✓ Keisha AI connection established');
      } else {
        console.warn('⚠ Keisha AI connection failed:', keishaStatus.error);
        console.warn('  Analysis features will be limited');
      }
    } catch (keishaError) {
      console.warn('⚠ Keisha connection test failed:', keishaError.message);
    }

    // Setup automated tasks
    setupAutomatedTasks();

    console.log('✓ FNS News Service initialized successfully');
    console.log('🎯 HYBRID MODE: Critical newsletters + full articles ready!');

  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Don't exit - let hybrid mode work without database
    console.log('🔄 Continuing in hybrid-only mode...');
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 FNS News Service running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📰 News API: http://localhost:${PORT}/api/fns/news/feed`);
  
  // Initialize the application
  await initializeApp();
  
  console.log('\n🎬 Fragile News Source is ready!');
  console.log('   Matrix-themed news with Keisha AI analysis');
  console.log('   Twice-daily updates from soWSnewsletter');
  console.log('   Real-time bias detection and translation\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
