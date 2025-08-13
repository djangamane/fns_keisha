const axios = require('axios');
const cheerio = require('cheerio');
const CriticalNewsletterParser = require('./criticalNewsletterParser');

/**
 * Hybrid News Service for FNS
 * Uses critical newsletters as seeds, then fetches full articles
 */
class HybridNewsService {
  constructor() {
    this.criticalParser = new CriticalNewsletterParser();
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Extract real URL from Google redirect
   */
  extractRealUrl(googleUrl) {
    try {
      if (!googleUrl.includes('google.com/url')) {
        return googleUrl;
      }
      
      const urlMatch = googleUrl.match(/url=([^&]+)/);
      if (urlMatch) {
        return decodeURIComponent(urlMatch[1]);
      }
      
      return googleUrl;
    } catch (error) {
      console.warn('Error extracting real URL:', error.message);
      return googleUrl;
    }
  }

  /**
   * Fetch full article content from URL
   */
  async fetchFullArticle(url, title) {
    try {
      console.log(`📄 Fetching full article: ${title.substring(0, 50)}...`);
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, .advertisement, .ads, .social-share').remove();
      
      // Try multiple selectors for article content
      const contentSelectors = [
        'article',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        'main',
        '.story-body',
        '.article-body',
        '[role="main"]'
      ];
      
      let fullContent = '';
      let articleElement = null;
      
      for (const selector of contentSelectors) {
        articleElement = $(selector).first();
        if (articleElement.length > 0) {
          fullContent = articleElement.text().trim();
          if (fullContent.length > 200) { // Minimum content threshold
            break;
          }
        }
      }
      
      // Fallback: get all paragraph text
      if (fullContent.length < 200) {
        fullContent = $('p').map((i, el) => $(el).text().trim()).get().join('\n');
      }
      
      // Extract images
      const images = [];
      $('img').each((i, img) => {
        const src = $(img).attr('src');
        const alt = $(img).attr('alt') || '';
        
        if (src && !src.includes('data:') && !src.includes('logo') && !src.includes('icon')) {
          // Convert relative URLs to absolute
          let fullSrc = src;
          if (src.startsWith('//')) {
            fullSrc = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(url);
            fullSrc = `${urlObj.protocol}//${urlObj.host}${src}`;
          }
          
          images.push({
            url: fullSrc,
            alt: alt,
            caption: alt
          });
        }
      });
      
      // Extract metadata
      const metadata = {
        title: $('title').text() || title,
        description: $('meta[name="description"]').attr('content') || '',
        author: $('meta[name="author"]').attr('content') || 
                $('.author').first().text() || 
                $('[rel="author"]').first().text() || '',
        publishDate: $('meta[property="article:published_time"]').attr('content') ||
                    $('time').first().attr('datetime') || '',
        siteName: $('meta[property="og:site_name"]').attr('content') || ''
      };
      
      return {
        success: true,
        content: fullContent,
        images: images.slice(0, 5), // Limit to 5 images
        metadata,
        wordCount: fullContent.split(/\s+/).length,
        fetchedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.warn(`Failed to fetch article from ${url}:`, error.message);
      return {
        success: false,
        error: error.message,
        content: '',
        images: [],
        metadata: {},
        wordCount: 0
      };
    }
  }

  /**
   * Enhance critical newsletter articles with full content
   */
  async enhanceCriticalArticles(options = {}) {
    const { 
      limit = 20, 
      minSeverity = 70, 
      daysBack = 3,
      includeImages = true 
    } = options;
    
    try {
      console.log('🎯 Starting hybrid news enhancement process...');
      
      // Step 1: Get critical newsletter seeds
      console.log('📰 Getting critical newsletter seeds...');
      const criticalSeeds = await this.criticalParser.importCriticalNewsletters(daysBack);
      
      if (criticalSeeds.length === 0) {
        throw new Error('No critical newsletter seeds found');
      }
      
      // Filter by severity and limit
      const filteredSeeds = criticalSeeds
        .filter(seed => seed.severity_score >= minSeverity)
        .sort((a, b) => b.severity_score - a.severity_score)
        .slice(0, limit);
      
      console.log(`🔍 Processing ${filteredSeeds.length} high-severity seeds...`);
      
      // Step 2: Enhance each seed with full content
      const enhancedArticles = [];
      
      for (const seed of filteredSeeds) {
        try {
          // Extract real URL
          const realUrl = this.extractRealUrl(seed.url);
          
          // Fetch full article
          const fullArticle = await this.fetchFullArticle(realUrl, seed.title);
          
          // Create enhanced article
          const enhancedArticle = {
            ...seed,
            url: realUrl, // Use the real URL
            original_newsletter_url: seed.url, // Keep original for reference
            full_content: fullArticle.content,
            newsletter_summary: seed.summary, // Keep original summary
            newsletter_analysis: seed.keisha_analysis, // Keep original analysis (but rename it)
            images: includeImages ? fullArticle.images : [],
            metadata: fullArticle.metadata,
            word_count: fullArticle.wordCount,
            content_fetched: fullArticle.success,
            fetch_error: fullArticle.error || null,
            enhanced_at: new Date().toISOString(),
            ready_for_keisha: fullArticle.success, // Flag for Keisha analysis
            source_type: 'hybrid_enhanced'
          };
          
          // Update content field with full article if available
          if (fullArticle.success && fullArticle.content.length > 200) {
            enhancedArticle.content = fullArticle.content;
          }
          
          enhancedArticles.push(enhancedArticle);
          
          console.log(`✅ Enhanced: ${seed.title.substring(0, 50)}... (${fullArticle.success ? 'SUCCESS' : 'FAILED'})`);
          
          // Rate limiting to be respectful
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.warn(`Failed to enhance article: ${seed.title}`, error.message);
          
          // Add the seed anyway, but mark it as not enhanced
          enhancedArticles.push({
            ...seed,
            full_content: '',
            content_fetched: false,
            fetch_error: error.message,
            enhanced_at: new Date().toISOString(),
            ready_for_keisha: false,
            source_type: 'hybrid_seed_only'
          });
        }
      }
      
      console.log(`🎉 Enhancement complete! ${enhancedArticles.length} articles processed`);
      console.log(`📊 Successfully enhanced: ${enhancedArticles.filter(a => a.content_fetched).length}`);
      console.log(`⚠️ Failed to enhance: ${enhancedArticles.filter(a => !a.content_fetched).length}`);
      
      return enhancedArticles;
      
    } catch (error) {
      console.error('Error in hybrid enhancement:', error);
      throw error;
    }
  }

  /**
   * Get articles ready for Keisha analysis
   */
  async getArticlesForKeishaAnalysis(options = {}) {
    const { limit = 10 } = options;
    
    const enhancedArticles = await this.enhanceCriticalArticles(options);
    
    // Return only articles that were successfully enhanced and ready for Keisha
    return enhancedArticles
      .filter(article => article.ready_for_keisha && article.full_content.length > 200)
      .slice(0, limit);
  }

  /**
   * Get enhanced articles with fallback to newsletter-only
   */
  async getEnhancedArticles(options = {}) {
    const { allowPartial = true } = options;
    
    const enhancedArticles = await this.enhanceCriticalArticles(options);
    
    if (allowPartial) {
      // Return all articles, even if some enhancement failed
      return enhancedArticles;
    } else {
      // Return only fully enhanced articles
      return enhancedArticles.filter(article => article.content_fetched);
    }
  }

  /**
   * Get enhancement statistics
   */
  async getEnhancementStats(options = {}) {
    const articles = await this.enhanceCriticalArticles(options);
    
    const stats = {
      total_processed: articles.length,
      successfully_enhanced: articles.filter(a => a.content_fetched).length,
      failed_enhancement: articles.filter(a => !a.content_fetched).length,
      ready_for_keisha: articles.filter(a => a.ready_for_keisha).length,
      average_word_count: 0,
      enhancement_success_rate: 0
    };
    
    const enhancedArticles = articles.filter(a => a.content_fetched);
    if (enhancedArticles.length > 0) {
      stats.average_word_count = Math.round(
        enhancedArticles.reduce((sum, a) => sum + (a.word_count || 0), 0) / enhancedArticles.length
      );
      stats.enhancement_success_rate = Math.round(
        (stats.successfully_enhanced / stats.total_processed) * 100
      );
    }
    
    return stats;
  }
}

module.exports = HybridNewsService;
