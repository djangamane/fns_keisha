#!/usr/bin/env node

/**
 * Test server for FNS - No database required
 * Tests the API endpoints with in-memory data
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NewsImportService = require('./services/newsImportService');

const app = express();
const PORT = process.env.PORT || 3002;

// In-memory storage for testing
let articlesCache = [];
let lastImport = null;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize news service
const newsImporter = new NewsImportService();

// Load articles into memory
async function loadArticles() {
  try {
    console.log('📰 Loading articles into memory...');
    articlesCache = await newsImporter.getLatestArticles({ limit: 100 });
    lastImport = new Date();
    console.log(`✅ Loaded ${articlesCache.length} articles`);
  } catch (error) {
    console.error('❌ Error loading articles:', error.message);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FNS Test Server',
    timestamp: new Date().toISOString(),
    articles_loaded: articlesCache.length,
    last_import: lastImport
  });
});

// Get news feed
app.get('/api/fns/news/feed', (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      category,
      minSeverity = 0
    } = req.query;

    let filteredArticles = [...articlesCache];

    // Apply filters
    if (category) {
      filteredArticles = filteredArticles.filter(article => 
        article.keyword.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (minSeverity > 0) {
      filteredArticles = filteredArticles.filter(article => 
        article.severity_score >= parseFloat(minSeverity)
      );
    }

    // Sort by severity and date
    filteredArticles.sort((a, b) => {
      if (b.severity_score !== a.severity_score) {
        return b.severity_score - a.severity_score;
      }
      return new Date(b.date) - new Date(a.date);
    });

    // Paginate
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedArticles,
      pagination: {
        total: filteredArticles.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < filteredArticles.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news feed',
      message: error.message
    });
  }
});

// Get single article
app.get('/api/fns/news/article/:id', (req, res) => {
  try {
    const { id } = req.params;
    const article = articlesCache.find(a => a.id === id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    
    // Add mock Keisha analysis for testing
    const mockAnalysis = {
      keisha_translation: `Keisha's Analysis: This article about "${article.title.substring(0, 50)}..." reveals systemic patterns of white supremacist messaging. The language used perpetuates harmful narratives while appearing neutral to unconscious readers.`,
      bias_score: article.severity_score + Math.random() * 10,
      fragility_indicators: ['defensive language', 'victim blaming', 'false equivalency'],
      analyzed_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: { ...article, ...mockAnalysis }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article',
      message: error.message
    });
  }
});

// Search articles
app.get('/api/fns/news/search', (req, res) => {
  try {
    const { q: query, limit = 20, category, minSeverity = 0 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }
    
    const searchTerm = query.toLowerCase();
    let results = articlesCache.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.content.toLowerCase().includes(searchTerm) ||
      article.summary.toLowerCase().includes(searchTerm)
    );
    
    // Apply additional filters
    if (category) {
      results = results.filter(article => 
        article.keyword.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (minSeverity > 0) {
      results = results.filter(article => 
        article.severity_score >= parseFloat(minSeverity)
      );
    }
    
    // Sort by relevance (severity score)
    results.sort((a, b) => b.severity_score - a.severity_score);
    
    // Limit results
    results = results.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: results,
      query,
      total: results.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

// Get statistics
app.get('/api/fns/news/stats', (req, res) => {
  try {
    const categories = {};
    const severityLevels = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalSeverity = 0;
    
    articlesCache.forEach(article => {
      categories[article.keyword] = (categories[article.keyword] || 0) + 1;
      
      const severity = article.severity_score;
      totalSeverity += severity;
      
      if (severity < 50) severityLevels.low++;
      else if (severity < 70) severityLevels.medium++;
      else if (severity < 85) severityLevels.high++;
      else severityLevels.critical++;
    });
    
    const stats = {
      total_articles: articlesCache.length,
      analyzed_articles: articlesCache.length, // Mock: all analyzed
      pending_articles: 0,
      avg_severity: articlesCache.length > 0 ? totalSeverity / articlesCache.length : 0,
      latest_article_date: articlesCache.length > 0 ? 
        Math.max(...articlesCache.map(a => new Date(a.date))) : null,
      categories,
      severity_distribution: severityLevels,
      last_import: lastImport
    };
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Refresh articles
app.post('/api/fns/news/refresh', async (req, res) => {
  try {
    await loadArticles();
    res.json({
      success: true,
      message: 'Articles refreshed',
      count: articlesCache.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh articles',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 FNS Test Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📰 News feed: http://localhost:${PORT}/api/fns/news/feed`);
  console.log(`📊 Statistics: http://localhost:${PORT}/api/fns/news/stats`);
  
  // Load articles on startup
  await loadArticles();
  
  console.log('\n🎬 Ready for testing!');
  console.log('Try these commands:');
  console.log(`curl http://localhost:${PORT}/health`);
  console.log(`curl http://localhost:${PORT}/api/fns/news/feed?limit=5`);
  console.log(`curl "http://localhost:${PORT}/api/fns/news/search?q=trump&limit=3"`);
});

module.exports = app;
