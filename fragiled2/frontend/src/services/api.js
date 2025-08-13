import axios from 'axios';

/**
 * FNS API Service - Enhanced for Hybrid Articles
 * Connects to the hybrid backend with critical newsletter seeds + full articles
 */
class FNSApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        console.error(`❌ API Error: ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get health status
   */
  async getHealth() {
    const response = await this.api.get('/health');
    return response.data;
  }

  /**
   * Get data source status
   */
  async getDataSourceStatus() {
    const response = await this.api.get('/api/fns/news/data/status');
    return response.data;
  }

  /**
   * Get hybrid-enhanced articles (MAIN FEATURE)
   */
  async getHybridArticles(options = {}) {
    const {
      limit = 20,
      minSeverity = 70,
      enhanceContent = true,
      useLiveData = true  // NEW: Enable live data by default
    } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      minSeverity: minSeverity.toString(),
      enhanceContent: enhanceContent.toString(),
      useLiveData: useLiveData.toString()  // NEW: Add live data parameter
    });

    const response = await this.api.get(`/api/fns/data/hybrid?${params}`);
    return response.data;
  }

  /**
   * Get critical newsletter articles (seeds only)
   */
  async getCriticalArticles(options = {}) {
    const {
      limit = 20,
      minSeverity = 70
    } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      minSeverity: minSeverity.toString()
    });

    const response = await this.api.get(`/api/fns/news/feed?${params}`);
    return response.data;
  }

  /**
   * Get articles ready for Keisha analysis
   */
  async getKeishaReadyArticles(options = {}) {
    const {
      limit = 10,
      minSeverity = 75
    } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      minSeverity: minSeverity.toString()
    });

    const response = await this.api.get(`/api/fns/news/data/keisha-ready?${params}`);
    return response.data;
  }

  /**
   * Get enhancement statistics
   */
  async getEnhancementStats(options = {}) {
    const {
      limit = 20,
      minSeverity = 70
    } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      minSeverity: minSeverity.toString()
    });

    const response = await this.api.get(`/api/fns/news/data/enhancement-stats?${params}`);
    return response.data;
  }

  /**
   * Get daily summary/threat assessment
   */
  async getDailySummary(date = null) {
    const params = date ? new URLSearchParams({ date }) : '';
    const response = await this.api.get(`/api/fns/news/data/summary?${params}`);
    return response.data;
  }

  /**
   * Trigger hybrid Keisha analysis
   */
  async analyzeHybridArticles(options = {}) {
    const {
      limit = 5,
      minSeverity = 80
    } = options;

    const response = await this.api.post('/api/fns/news/keisha/analyze-hybrid', {
      limit,
      minSeverity
    });
    return response.data;
  }

  /**
   * Get Keisha status
   */
  async getKeishaStatus() {
    const response = await this.api.get('/api/fns/news/keisha/status');
    return response.data;
  }

  /**
   * Get articles by severity range
   */
  async getArticlesBySeverity(minSeverity = 70, maxSeverity = 100, options = {}) {
    const articles = await this.getHybridArticles({
      ...options,
      minSeverity
    });

    // Filter by max severity on frontend
    const filteredArticles = articles.data.filter(
      article => article.severity_score <= maxSeverity
    );

    return {
      ...articles,
      data: filteredArticles,
      count: filteredArticles.length
    };
  }

  /**
   * Get articles by keyword
   */
  async getArticlesByKeyword(keyword, options = {}) {
    const articles = await this.getHybridArticles(options);

    // Filter by keyword on frontend
    const filteredArticles = articles.data.filter(article =>
      article.keyword?.toLowerCase().includes(keyword.toLowerCase()) ||
      article.title?.toLowerCase().includes(keyword.toLowerCase()) ||
      article.summary?.toLowerCase().includes(keyword.toLowerCase())
    );

    return {
      ...articles,
      data: filteredArticles,
      count: filteredArticles.length
    };
  }

  /**
   * Get threat level color
   */
  getThreatLevelColor(severity) {
    if (severity >= 90) return '#ff0000'; // Critical - Red
    if (severity >= 80) return '#ff6600'; // High - Orange
    if (severity >= 70) return '#ffcc00'; // Moderate - Yellow
    if (severity >= 60) return '#00ff00'; // Low - Green
    return '#00ffff'; // Very Low - Cyan
  }

  /**
   * Get threat level text
   */
  getThreatLevelText(severity) {
    if (severity >= 90) return 'CRITICAL';
    if (severity >= 80) return 'HIGH';
    if (severity >= 70) return 'MODERATE';
    if (severity >= 60) return 'LOW';
    return 'VERY LOW';
  }

  /**
   * Format article for display
   */
  formatArticle(article) {
    return {
      ...article,
      threatLevel: this.getThreatLevelText(article.severity_score),
      threatColor: this.getThreatLevelColor(article.severity_score),
      isHybridEnhanced: article.source_type === 'hybrid_enhanced',
      hasFullContent: !!article.full_content,
      hasImages: article.images && article.images.length > 0,
      readyForKeisha: article.ready_for_keisha,
      contentQuality: article.word_count > 500 ? 'EXCELLENT' : 
                     article.word_count > 200 ? 'GOOD' : 'BASIC',
      displayDate: article.date ? new Date(article.date).toLocaleDateString() : 'Unknown',
      shortSummary: article.summary ? 
        (article.summary.length > 150 ? article.summary.substring(0, 150) + '...' : article.summary) : 
        'No summary available'
    };
  }

  /**
   * Batch format articles
   */
  formatArticles(articles) {
    return articles.map(article => this.formatArticle(article));
  }
}

// Create singleton instance
const apiService = new FNSApiService();

export default apiService;
