const CriticalNewsletterParser = require('./criticalNewsletterParser');
const HybridNewsService = require('./hybridNewsService');
const fs = require('fs').promises;
const path = require('path');

/**
 * Enhanced Data Service for FNS
 * Combines critical newsletter data with local fallback
 */
class EnhancedDataService {
  constructor() {
    this.criticalParser = new CriticalNewsletterParser();
    this.hybridService = new HybridNewsService();
    this.localDataPath = path.join(__dirname, '../data');
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.cache = new Map();
  }

  /**
   * Get articles with multi-source strategy (HYBRID ENHANCED)
   */
  async getArticles(options = {}) {
    const {
      source = 'auto', // 'auto', 'hybrid', 'critical', 'local'
      limit = 50,
      minSeverity = 70,
      useCache = true,
      enhanceContent = true // NEW: Whether to fetch full articles
    } = options;

    const cacheKey = `articles_${source}_${limit}_${minSeverity}_${enhanceContent}`;

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📋 Using cached articles');
        return cached.data;
      }
    }

    let articles = [];

    try {
      if (source === 'auto' || source === 'hybrid') {
        console.log('🎯 Using HYBRID approach (critical seeds + full content)...');

        if (enhanceContent) {
          articles = await this.hybridService.getEnhancedArticles({
            limit,
            minSeverity,
            daysBack: 3,
            includeImages: true,
            allowPartial: true // Include articles even if some enhancement failed
          });
        } else {
          // Just get the seeds without enhancement
          articles = await this.criticalParser.getLatestCriticalArticles({
            limit,
            minSeverity
          });
        }

        if (articles.length > 0) {
          console.log(`✅ Successfully loaded ${articles.length} hybrid articles`);
          this.cacheArticles(cacheKey, articles);
          return articles;
        }
      }

      if (source === 'auto' || source === 'critical') {
        console.log('🎯 Falling back to critical newsletter seeds only...');
        articles = await this.criticalParser.getLatestCriticalArticles({
          limit,
          minSeverity
        });

        if (articles.length > 0) {
          console.log(`✅ Successfully loaded ${articles.length} critical seed articles`);
          this.cacheArticles(cacheKey, articles);
          return articles;
        }
      }

      if (source === 'auto' || source === 'local') {
        console.log('📁 Falling back to local data...');
        articles = await this.getLocalArticles({ limit, minSeverity });

        if (articles.length > 0) {
          console.log(`✅ Successfully loaded ${articles.length} local articles`);
          this.cacheArticles(cacheKey, articles);
          return articles;
        }
      }

      console.warn('⚠️ No articles found from any source');
      return [];

    } catch (error) {
      console.error('Error in getArticles:', error);

      // Always try local as final fallback
      if (source !== 'local') {
        console.log('🔄 Final fallback to local data...');
        try {
          articles = await this.getLocalArticles({ limit, minSeverity });
          this.cacheArticles(cacheKey, articles);
          return articles;
        } catch (fallbackError) {
          console.error('Local fallback also failed:', fallbackError);
        }
      }

      throw error;
    }
  }

  /**
   * Get local articles from JSON files
   */
  async getLocalArticles(options = {}) {
    const { limit = 50, minSeverity = 70 } = options;
    
    try {
      const files = await fs.readdir(this.localDataPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      let allArticles = [];
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.localDataPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          
          if (Array.isArray(data)) {
            allArticles.push(...data);
          } else if (data.articles && Array.isArray(data.articles)) {
            allArticles.push(...data.articles);
          }
        } catch (fileError) {
          console.warn(`Error reading ${file}:`, fileError.message);
        }
      }
      
      // Filter by severity and sort
      const filteredArticles = allArticles
        .filter(article => 
          article.severity_score && 
          article.severity_score >= minSeverity
        )
        .sort((a, b) => b.severity_score - a.severity_score)
        .slice(0, limit);
      
      return filteredArticles;
      
    } catch (error) {
      console.error('Error loading local articles:', error);
      return [];
    }
  }

  /**
   * Cache articles with timestamp
   */
  cacheArticles(key, articles) {
    this.cache.set(key, {
      data: articles,
      timestamp: Date.now()
    });
  }

  /**
   * Get data source status
   */
  async getDataSourceStatus() {
    const status = {
      critical_newsletter: { available: false, count: 0, last_updated: null },
      local_files: { available: false, count: 0, last_updated: null }
    };

    // Check critical newsletter availability
    try {
      const criticalArticles = await this.criticalParser.getLatestCriticalArticles({ limit: 1 });
      status.critical_newsletter.available = criticalArticles.length > 0;
      status.critical_newsletter.count = criticalArticles.length;
      if (criticalArticles.length > 0) {
        status.critical_newsletter.last_updated = criticalArticles[0].date;
      }
    } catch (error) {
      console.log('Critical newsletter not available:', error.message);
    }

    // Check local files
    try {
      const localArticles = await this.getLocalArticles({ limit: 1000 });
      status.local_files.available = localArticles.length > 0;
      status.local_files.count = localArticles.length;
      if (localArticles.length > 0) {
        status.local_files.last_updated = localArticles[0].date || localArticles[0].imported_at;
      }
    } catch (error) {
      console.log('Local files not available:', error.message);
    }

    return status;
  }

  /**
   * Get articles by severity range
   */
  async getArticlesBySeverity(minSeverity = 70, maxSeverity = 100, options = {}) {
    const articles = await this.getArticles(options);
    
    return articles.filter(article => 
      article.severity_score >= minSeverity && 
      article.severity_score <= maxSeverity
    );
  }

  /**
   * Get articles by keyword
   */
  async getArticlesByKeyword(keyword, options = {}) {
    const articles = await this.getArticles(options);
    
    return articles.filter(article => 
      article.keyword?.toLowerCase().includes(keyword.toLowerCase()) ||
      article.title?.toLowerCase().includes(keyword.toLowerCase()) ||
      article.summary?.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Get daily summary statistics
   */
  async getDailySummary(date = null) {
    const articles = await this.getArticles({ limit: 1000 });
    
    if (date) {
      const targetDate = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
      const dailyArticles = articles.filter(article => 
        article.date === targetDate
      );
      
      return this.calculateSummaryStats(dailyArticles);
    }
    
    return this.calculateSummaryStats(articles);
  }

  /**
   * Calculate summary statistics
   */
  calculateSummaryStats(articles) {
    if (articles.length === 0) {
      return {
        total_articles: 0,
        average_severity: 0,
        max_severity: 0,
        min_severity: 0,
        keywords: {},
        overall_threat_level: 'LOW'
      };
    }

    const severityScores = articles.map(a => a.severity_score).filter(s => s);
    const avgSeverity = severityScores.reduce((sum, score) => sum + score, 0) / severityScores.length;
    
    // Count keywords
    const keywords = {};
    articles.forEach(article => {
      if (article.keyword) {
        keywords[article.keyword] = (keywords[article.keyword] || 0) + 1;
      }
    });

    // Determine threat level
    let threatLevel = 'LOW';
    if (avgSeverity >= 80) threatLevel = 'CRITICAL';
    else if (avgSeverity >= 70) threatLevel = 'HIGH';
    else if (avgSeverity >= 60) threatLevel = 'MODERATE';

    return {
      total_articles: articles.length,
      average_severity: Math.round(avgSeverity * 10) / 10,
      max_severity: Math.max(...severityScores),
      min_severity: Math.min(...severityScores),
      keywords,
      overall_threat_level: threatLevel,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Get articles ready for Keisha analysis (HYBRID)
   */
  async getArticlesForKeishaAnalysis(options = {}) {
    const { limit = 10, minSeverity = 75 } = options;

    return await this.hybridService.getArticlesForKeishaAnalysis({
      limit,
      minSeverity,
      daysBack: 2,
      includeImages: true
    });
  }

  /**
   * Get enhancement statistics
   */
  async getEnhancementStats(options = {}) {
    return await this.hybridService.getEnhancementStats(options);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }
}

module.exports = EnhancedDataService;
