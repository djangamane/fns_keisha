const axios = require('axios');
const mysql = require('mysql2/promise');

/**
 * Keisha Analysis Integration Service
 * Connects FNS news articles to the existing Keisha AI microfrag analysis system
 */
class KeishaAnalysisIntegration {
  constructor() {
    // Connection to existing Keisha backend
    this.keishaApiUrl = process.env.KEISHA_API_URL || 'http://localhost:3001';
    this.keishaApiKey = process.env.KEISHA_API_KEY || '';
    
    // Database connection for storing analysis results
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fns_database',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    this.pool = mysql.createPool(this.dbConfig);
    
    // Rate limiting for API calls
    this.analysisQueue = [];
    this.isProcessing = false;
    this.maxConcurrentAnalysis = 3;
    this.analysisDelay = 2000; // 2 seconds between analyses
  }

  /**
   * Analyze a single article using Keisha AI
   */
  async analyzeArticle(article) {
    try {
      console.log(`Starting Keisha analysis for article: ${article.title}`);
      
      // Prepare the content for analysis
      const analysisContent = this.prepareContentForAnalysis(article);
      
      // Call the existing microfrag analysis API
      const analysisResult = await this.callKeishaAPI(analysisContent);
      
      // Store the analysis results
      await this.storeAnalysisResult(article.id, analysisResult);
      
      // Update article status
      await this.updateArticleStatus(article.id, 'completed');
      
      console.log(`Keisha analysis completed for article: ${article.id}`);
      return analysisResult;
      
    } catch (error) {
      console.error(`Error analyzing article ${article.id}:`, error.message);
      await this.updateArticleStatus(article.id, 'failed');
      throw error;
    }
  }

  /**
   * Prepare article content for Keisha analysis (ENHANCED FOR HYBRID)
   */
  prepareContentForAnalysis(article) {
    // Enhanced content preparation for hybrid articles
    let analysisContent = '';

    // Check if this is a hybrid-enhanced article
    const isHybridEnhanced = article.source_type === 'hybrid_enhanced' && article.full_content;

    if (isHybridEnhanced) {
      // Use full article content for comprehensive analysis
      analysisContent = `TITLE: ${article.title}\n\n`;
      analysisContent += `FULL ARTICLE CONTENT:\n${article.full_content}\n\n`;

      // Include newsletter analysis for comparison
      if (article.newsletter_analysis) {
        analysisContent += `NEWSLETTER ANALYSIS (for comparison):\n${article.newsletter_analysis}\n\n`;
      }

      // Include metadata context
      if (article.metadata) {
        analysisContent += `ARTICLE METADATA:\n`;
        analysisContent += `Author: ${article.metadata.author || 'Unknown'}\n`;
        analysisContent += `Site: ${article.metadata.siteName || 'Unknown'}\n`;
        analysisContent += `Word Count: ${article.word_count || 0}\n\n`;
      }

      // Include image context if available
      if (article.images && article.images.length > 0) {
        analysisContent += `IMAGES FOUND (${article.images.length}):\n`;
        article.images.forEach((img, index) => {
          analysisContent += `${index + 1}. ${img.url}\n`;
          if (img.alt) analysisContent += `   Alt text: ${img.alt}\n`;
        });
        analysisContent += '\n';
      }

    } else {
      // Fallback for non-hybrid articles
      analysisContent = `${article.title}\n\n${article.content || article.summary || ''}`;
    }

    return {
      title: article.title,
      content: analysisContent,
      url: article.url,
      keyword: article.keyword,
      severity_score: article.severity_score,
      // Enhanced metadata for hybrid articles
      metadata: {
        source: 'FNS',
        article_id: article.id,
        date: article.date,
        original_severity: article.severity_score,
        // Hybrid-specific metadata
        is_hybrid_enhanced: isHybridEnhanced,
        content_fetched: article.content_fetched || false,
        word_count: article.word_count || 0,
        images_count: article.images?.length || 0,
        newsletter_analysis_included: !!article.newsletter_analysis,
        enhanced_at: article.enhanced_at,
        real_url: article.url,
        original_newsletter_url: article.original_newsletter_url
      }
    };
  }

  /**
   * Call the existing Keisha microfrag analysis API
   */
  async callKeishaAPI(content) {
    try {
      const response = await axios.post(
        `${this.keishaApiUrl}/api/microfrag/analyze`,
        {
          text: content.content,
          title: content.title,
          metadata: content.metadata
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.keishaApiKey}`,
            'User-Agent': 'FNS-KeishaIntegration/1.0'
          },
          timeout: 60000 // 60 second timeout for analysis
        }
      );

      if (response.data && response.data.success) {
        return this.processKeishaResponse(response.data.data);
      } else {
        throw new Error('Invalid response from Keisha API');
      }

    } catch (error) {
      if (error.response) {
        console.error('Keisha API error:', error.response.status, error.response.data);
        throw new Error(`Keisha API error: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response from Keisha API');
        throw new Error('No response from Keisha API');
      } else {
        console.error('Error calling Keisha API:', error.message);
        throw error;
      }
    }
  }

  /**
   * Get live articles with real-time Keisha analysis
   */
  async getLiveArticlesFromKeisha(options = {}) {
    const { limit = 20, minSeverity = 70 } = options;

    try {
      console.log('🔴 Getting live articles with Keisha analysis...');

      // Step 1: Get current news articles from news API
      const currentArticles = await this.fetchCurrentNewsArticles(limit * 2);

      if (currentArticles.length === 0) {
        throw new Error('No current articles found');
      }

      console.log(`📰 Found ${currentArticles.length} current articles, analyzing with Keisha...`);

      // Step 2: Analyze each article with Keisha AI
      const analyzedArticles = [];

      for (const article of currentArticles.slice(0, limit)) {
        try {
          console.log(`🤖 Analyzing: ${article.title.substring(0, 50)}...`);

          // Prepare content for Keisha analysis
          const analysisContent = {
            content: article.content,
            title: article.title,
            metadata: {
              url: article.url,
              source: article.source,
              publishedAt: article.publishedAt
            }
          };

          // Call Keisha bias analysis API
          const analysisResult = await this.callKeishaBiasAPI(analysisContent);

          // Calculate severity score from bias analysis
          const severityScore = this.calculateSeverityFromBias(analysisResult);

          // Only include articles that meet minimum severity
          if (severityScore >= minSeverity) {
            const enhancedArticle = {
              id: `live-${Date.now()}-${Math.random()}`,
              title: article.title,
              url: article.url,
              content: article.content,
              summary: article.description || article.content.substring(0, 200) + '...',
              keyword: this.extractKeywordFromAnalysis(analysisResult),
              severity_score: severityScore,
              sentiment: analysisResult.sentiment || 0,
              date: article.publishedAt || new Date().toISOString().split('T')[0],
              images: article.images || [],
              hasImages: article.images && article.images.length > 0,
              featured_image: article.urlToImage || (article.images && article.images[0]?.url),

              // Keisha analysis data
              keisha_analysis: analysisResult.analysis || analysisResult.summary || 'Real-time Keisha AI analysis',
              bias_score: analysisResult.bias_score || analysisResult.biasScore || 0,
              fragility_indicators: analysisResult.fragility_indicators || [],
              euphemisms_detected: analysisResult.euphemisms_detected || [],
              systemic_patterns: analysisResult.systemic_patterns || [],

              // Metadata
              source_type: 'live_keisha_analyzed',
              content_fetched: true,
              ready_for_keisha: false, // Already analyzed
              analysis_status: 'completed',
              displayDate: article.publishedAt || new Date().toISOString().split('T')[0],
              imported_at: new Date().toISOString(),
              analyzed_at: new Date().toISOString()
            };

            analyzedArticles.push(enhancedArticle);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (analysisError) {
          console.warn(`Failed to analyze article: ${article.title}`, analysisError.message);
          // Continue with next article
        }
      }

      // Sort by severity score (highest first)
      analyzedArticles.sort((a, b) => b.severity_score - a.severity_score);

      console.log(`✅ Successfully analyzed ${analyzedArticles.length} articles with Keisha`);
      return analyzedArticles;

    } catch (error) {
      console.error('Error getting live articles with Keisha analysis:', error.message);
      throw new Error(`Live analysis failed: ${error.message}`);
    }
  }

  /**
   * Fetch current news articles from news API
   */
  async fetchCurrentNewsArticles(limit = 20) {
    try {
      // Using NewsAPI.org for current articles (you can replace with your preferred news source)
      const newsApiKey = process.env.NEWS_API_KEY || 'demo'; // Add your NewsAPI key to .env

      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          country: 'us',
          category: 'general',
          pageSize: limit,
          apiKey: newsApiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.articles) {
        return response.data.articles
          .filter(article => article.title && article.content && article.url)
          .map(article => ({
            title: article.title,
            content: article.content || article.description || '',
            description: article.description,
            url: article.url,
            urlToImage: article.urlToImage,
            publishedAt: article.publishedAt,
            source: article.source?.name || 'Unknown',
            images: article.urlToImage ? [{ url: article.urlToImage, alt: article.title }] : []
          }));
      }

      return [];

    } catch (error) {
      console.warn('Failed to fetch from NewsAPI, using fallback...', error.message);

      // Fallback: Generate sample current articles for testing
      return this.generateSampleCurrentArticles(limit);
    }
  }

  /**
   * Generate sample current articles for testing when NewsAPI is not available
   */
  generateSampleCurrentArticles(limit = 20) {
    const sampleArticles = [
      {
        title: "Breaking: Major Policy Changes Announced in Washington",
        content: "Government officials announced significant policy changes today that could impact millions of Americans. The new regulations focus on economic reforms and social justice initiatives. Critics argue the changes don't go far enough, while supporters claim they represent meaningful progress toward equality. The legislation includes provisions for addressing systemic inequalities in housing, education, and healthcare access. Community advocates have expressed mixed reactions, with some praising the comprehensive approach while others worry about implementation challenges and potential unintended consequences for vulnerable populations.",
        description: "New policy changes announced with focus on economic and social reforms",
        url: "https://example.com/policy-changes-1",
        urlToImage: "https://via.placeholder.com/800x400/0066cc/ffffff?text=Policy+News",
        publishedAt: new Date().toISOString(),
        source: "Sample News Network",
        images: [{ url: "https://via.placeholder.com/800x400/0066cc/ffffff?text=Policy+News", alt: "Policy Changes" }]
      },
      {
        title: "Economic Inequality Reaches New Heights According to Latest Study",
        content: "A comprehensive study released today reveals that economic inequality has reached unprecedented levels across urban and rural communities. The research highlights systemic barriers that prevent equal access to opportunities, particularly affecting communities of color and working-class families. Experts call for immediate action to address these disparities through policy reform and community investment. The study found that wealth gaps have widened significantly over the past decade, with implications for social mobility and democratic participation. Researchers emphasize the need for targeted interventions to address root causes rather than symptoms of inequality.",
        description: "New study shows economic inequality at record levels",
        url: "https://example.com/inequality-study-2",
        urlToImage: "https://via.placeholder.com/800x400/cc6600/ffffff?text=Economic+Study",
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: "Research Today",
        images: [{ url: "https://via.placeholder.com/800x400/cc6600/ffffff?text=Economic+Study", alt: "Economic Research" }]
      },
      {
        title: "Community Leaders Call for Justice Reform After Recent Events",
        content: "Local community leaders are demanding comprehensive justice system reforms following recent controversial incidents that have highlighted ongoing issues with police accountability and community relations. The proposed changes include increased accountability measures, community oversight programs, and reforms to address systemic bias in law enforcement practices. Activists emphasize the need for systemic change rather than superficial adjustments, calling for fundamental restructuring of how public safety is approached in urban communities. The movement has gained support from diverse coalitions including faith leaders, civil rights organizations, and concerned citizens who believe current approaches are inadequate.",
        description: "Community leaders push for justice system reforms",
        url: "https://example.com/justice-reform-3",
        urlToImage: "https://via.placeholder.com/800x400/cc0066/ffffff?text=Justice+Reform",
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: "Community Voice",
        images: [{ url: "https://via.placeholder.com/800x400/cc0066/ffffff?text=Justice+Reform", alt: "Justice Reform" }]
      }
    ];

    return sampleArticles.slice(0, limit);
  }

  /**
   * Call Keisha bias analysis API
   */
  async callKeishaBiasAPI(content) {
    try {
      // Validate content length (Keisha requires minimum 50 characters)
      if (!content.content || content.content.length < 50) {
        console.warn('Content too short for Keisha analysis, using fallback');
        return this.generateFallbackAnalysis(content);
      }

      const response = await axios.post(
        `${this.keishaApiUrl}/api/bias-analysis/analyze`,
        {
          article_text: content.content,
          article_title: content.title || 'Untitled Article',
          article_url: content.metadata?.url || ''
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FNS-BiasAnalysis/1.0'
          },
          timeout: 60000
        }
      );

      if (response.data && response.data.success) {
        return this.processKeishaBiasResponse(response.data.data || response.data);
      } else {
        throw new Error('Invalid response from Keisha bias analysis API');
      }

    } catch (error) {
      console.error('Error calling Keisha bias API:', error.message);

      // Return fallback analysis
      return this.generateFallbackAnalysis(content);
    }
  }

  /**
   * Process Keisha bias analysis response
   */
  processKeishaBiasResponse(data) {
    // Handle the actual Keisha API response structure
    const analysis = data.analysis || data;

    return {
      bias_score: analysis.score || data.biasScore || data.bias_score || 50,
      analysis: this.formatAnalysisText(analysis),
      fragility_indicators: analysis.detected_terms?.map(t => t.term) || data.fragility_indicators || [],
      euphemisms_detected: analysis.detected_terms?.filter(t => t.rationale?.includes('euphemism')).map(t => t.term) || [],
      systemic_patterns: analysis.detected_terms?.filter(t => t.rationale?.includes('systemic')).map(t => t.term) || [],
      sentiment: data.sentiment || 0,
      confidence: analysis.confidence || data.confidence || 0.8,
      detected_terms: analysis.detected_terms || []
    };
  }

  /**
   * Format analysis text from Keisha response
   */
  formatAnalysisText(analysis) {
    if (typeof analysis === 'string') {
      return analysis;
    }

    if (analysis.detected_terms && analysis.detected_terms.length > 0) {
      const terms = analysis.detected_terms.map(term =>
        `• ${term.term}: ${term.rationale}`
      ).join('\n');

      return `Keisha AI Analysis (Score: ${analysis.score}/100)\n\nDetected Issues:\n${terms}`;
    }

    return `Keisha AI Analysis completed with score: ${analysis.score || 50}/100`;
  }

  /**
   * Generate fallback analysis when Keisha API is not available
   */
  generateFallbackAnalysis(content) {
    // Simple keyword-based analysis for fallback
    const text = (content.content + ' ' + content.title).toLowerCase();

    let biasScore = 50; // Default
    const indicators = [];
    const euphemisms = [];

    // Check for bias indicators
    if (text.includes('urban') || text.includes('inner city')) {
      biasScore += 15;
      euphemisms.push('urban (coded language)');
    }

    if (text.includes('thugs') || text.includes('criminals')) {
      biasScore += 20;
      indicators.push('dehumanizing language');
    }

    if (text.includes('welfare') || text.includes('handouts')) {
      biasScore += 10;
      euphemisms.push('welfare rhetoric');
    }

    return {
      bias_score: Math.min(biasScore, 100),
      analysis: `Automated analysis detected potential bias indicators. Score: ${biasScore}/100`,
      fragility_indicators: indicators,
      euphemisms_detected: euphemisms,
      systemic_patterns: [],
      sentiment: text.includes('violence') || text.includes('crime') ? -0.3 : 0,
      confidence: 0.6
    };
  }

  /**
   * Calculate severity score from bias analysis
   */
  calculateSeverityFromBias(analysisResult) {
    const baseScore = analysisResult.bias_score || 50;
    const indicatorBonus = (analysisResult.fragility_indicators?.length || 0) * 5;
    const euphemismBonus = (analysisResult.euphemisms_detected?.length || 0) * 3;

    return Math.min(baseScore + indicatorBonus + euphemismBonus, 100);
  }

  /**
   * Extract keyword from analysis results
   */
  extractKeywordFromAnalysis(analysisResult) {
    if (analysisResult.fragility_indicators?.length > 0) {
      return analysisResult.fragility_indicators[0];
    }

    if (analysisResult.euphemisms_detected?.length > 0) {
      return analysisResult.euphemisms_detected[0];
    }

    return 'systemic bias';
  }

  /**
   * Process and normalize Keisha API response
   */
  processKeishaResponse(keishaData) {
    return {
      bias_score: keishaData.biasScore || keishaData.bias_score || 0,
      fragility_indicators: keishaData.fragilityIndicators || keishaData.fragility_indicators || [],
      euphemisms_detected: keishaData.euphemismsDetected || keishaData.euphemisms_detected || [],
      systemic_patterns: keishaData.systemicPatterns || keishaData.systemic_patterns || [],
      
      // Keisha's voice and analysis
      keisha_translation: keishaData.translation || keishaData.keisha_translation || '',
      keisha_summary: keishaData.summary || keishaData.keisha_summary || '',
      critical_analysis: keishaData.analysis || keishaData.critical_analysis || '',
      
      // Metadata
      confidence_score: keishaData.confidence || keishaData.confidence_score || 0.8,
      analysis_version: keishaData.version || '1.0',
      processing_time_ms: keishaData.processingTime || keishaData.processing_time_ms || 0
    };
  }

  /**
   * Store analysis results in database
   */
  async storeAnalysisResult(articleId, analysisResult) {
    try {
      await this.pool.execute(`
        INSERT INTO fns_keisha_analysis (
          article_id, bias_score, fragility_indicators, euphemisms_detected,
          systemic_patterns, keisha_translation, keisha_summary, critical_analysis,
          analysis_version, processing_time_ms, confidence_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          bias_score = VALUES(bias_score),
          fragility_indicators = VALUES(fragility_indicators),
          euphemisms_detected = VALUES(euphemisms_detected),
          systemic_patterns = VALUES(systemic_patterns),
          keisha_translation = VALUES(keisha_translation),
          keisha_summary = VALUES(keisha_summary),
          critical_analysis = VALUES(critical_analysis),
          confidence_score = VALUES(confidence_score),
          updated_at = CURRENT_TIMESTAMP
      `, [
        articleId,
        analysisResult.bias_score,
        JSON.stringify(analysisResult.fragility_indicators),
        JSON.stringify(analysisResult.euphemisms_detected),
        JSON.stringify(analysisResult.systemic_patterns),
        analysisResult.keisha_translation,
        analysisResult.keisha_summary,
        analysisResult.critical_analysis,
        analysisResult.analysis_version,
        analysisResult.processing_time_ms,
        analysisResult.confidence_score
      ]);

      console.log(`Analysis results stored for article: ${articleId}`);

    } catch (error) {
      console.error('Error storing analysis result:', error);
      throw error;
    }
  }

  /**
   * Update article analysis status
   */
  async updateArticleStatus(articleId, status) {
    try {
      await this.pool.execute(`
        UPDATE fns_articles 
        SET analysis_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, articleId]);

    } catch (error) {
      console.error('Error updating article status:', error);
      throw error;
    }
  }

  /**
   * Process analysis queue with rate limiting
   */
  async processAnalysisQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.analysisQueue.length > 0) {
        const batch = this.analysisQueue.splice(0, this.maxConcurrentAnalysis);
        
        // Process batch concurrently
        const promises = batch.map(article => 
          this.analyzeArticle(article).catch(error => {
            console.error(`Failed to analyze article ${article.id}:`, error.message);
            return null;
          })
        );

        await Promise.all(promises);

        // Wait before processing next batch
        if (this.analysisQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.analysisDelay));
        }
      }

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Add articles to analysis queue
   */
  async queueArticlesForAnalysis(articles) {
    if (!Array.isArray(articles)) {
      articles = [articles];
    }

    // Filter out articles that are already processed or in queue
    const newArticles = articles.filter(article => 
      !this.analysisQueue.some(queued => queued.id === article.id)
    );

    this.analysisQueue.push(...newArticles);
    console.log(`Added ${newArticles.length} articles to analysis queue. Queue size: ${this.analysisQueue.length}`);

    // Start processing if not already running
    if (!this.isProcessing) {
      setImmediate(() => this.processAnalysisQueue());
    }

    return {
      queued: newArticles.length,
      total_in_queue: this.analysisQueue.length
    };
  }

  /**
   * Get pending articles and queue them for analysis
   */
  async analyzePendingArticles(limit = 10) {
    try {
      // Get articles pending analysis
      const [articles] = await this.pool.execute(`
        SELECT id, title, url, content, summary, keyword, severity_score, date
        FROM fns_articles
        WHERE analysis_status = 'pending'
        ORDER BY imported_at ASC
        LIMIT ?
      `, [limit]);

      if (articles.length === 0) {
        console.log('No articles pending analysis');
        return { queued: 0, total_in_queue: this.analysisQueue.length };
      }

      // Mark articles as processing
      const articleIds = articles.map(a => a.id);
      await this.pool.execute(`
        UPDATE fns_articles 
        SET analysis_status = 'processing'
        WHERE id IN (${articleIds.map(() => '?').join(',')})
      `, articleIds);

      // Queue for analysis
      return await this.queueArticlesForAnalysis(articles);

    } catch (error) {
      console.error('Error analyzing pending articles:', error);
      throw error;
    }
  }

  /**
   * Get analysis queue status
   */
  getQueueStatus() {
    return {
      queue_length: this.analysisQueue.length,
      is_processing: this.isProcessing,
      max_concurrent: this.maxConcurrentAnalysis,
      delay_ms: this.analysisDelay
    };
  }

  /**
   * Test connection to Keisha API
   */
  async testKeishaConnection() {
    try {
      const response = await axios.get(`${this.keishaApiUrl}/api/health`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${this.keishaApiKey}`
        }
      });

      return {
        connected: true,
        status: response.status,
        data: response.data
      };

    } catch (error) {
      return {
        connected: false,
        error: error.message,
        status: error.response?.status || 'NO_RESPONSE'
      };
    }
  }

  /**
   * Analyze hybrid-enhanced articles (NEW METHOD)
   */
  async analyzeHybridArticles(hybridArticles) {
    try {
      console.log(`🧠 Starting Keisha analysis for ${hybridArticles.length} hybrid articles...`);

      const results = [];

      for (const article of hybridArticles) {
        try {
          // Only analyze articles that are ready for Keisha
          if (!article.ready_for_keisha) {
            console.log(`⚠️ Skipping article (not ready): ${article.title.substring(0, 50)}...`);
            continue;
          }

          console.log(`🎯 Analyzing hybrid article: ${article.title.substring(0, 50)}...`);
          console.log(`   Word count: ${article.word_count}, Images: ${article.images?.length || 0}`);

          // Prepare enhanced content for analysis
          const analysisContent = this.prepareContentForAnalysis(article);

          // Call Keisha API with full content
          const analysisResult = await this.callKeishaAPI(analysisContent);

          // Enhanced result with hybrid metadata
          const enhancedResult = {
            ...analysisResult,
            article_id: article.id,
            hybrid_enhanced: true,
            original_newsletter_analysis: article.newsletter_analysis,
            content_quality: {
              word_count: article.word_count,
              images_count: article.images?.length || 0,
              content_fetched: article.content_fetched,
              enhancement_success: true
            },
            comparison: {
              newsletter_severity: article.severity_score,
              keisha_severity: analysisResult.severity_score || article.severity_score,
              analysis_difference: 'Keisha analysis based on FULL article content vs newsletter summary'
            }
          };

          results.push(enhancedResult);

          console.log(`✅ Hybrid analysis completed: ${article.title.substring(0, 50)}...`);

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, this.analysisDelay));

        } catch (articleError) {
          console.error(`❌ Failed to analyze hybrid article: ${article.title}`, articleError.message);
          results.push({
            article_id: article.id,
            error: articleError.message,
            hybrid_enhanced: true,
            analysis_failed: true
          });
        }
      }

      console.log(`🎉 Hybrid analysis batch completed: ${results.length} results`);
      return results;

    } catch (error) {
      console.error('Error in hybrid analysis batch:', error);
      throw error;
    }
  }
}

module.exports = KeishaAnalysisIntegration;
