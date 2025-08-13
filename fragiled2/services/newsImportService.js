const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * News Import Service for Fragile News Source (FNS)
 * Imports news stories from soWSnewsletter system
 */
class NewsImportService {
  constructor() {
    // GitHub repository for live data
    this.githubBaseUrl = 'https://raw.githubusercontent.com/djangamane/soWSnewsletter/main';
    this.localNewsPath = process.env.LOCAL_NEWS_PATH || '../news_project';

    // Rate limiting to be respectful to GitHub API
    this.requestDelay = 1000; // 1 second between requests
  }

  /**
   * Import news stories from local news_project files
   * This reads from your existing full_articles_*.json files
   */
  async importFromLocalFiles() {
    try {
      const newsDir = path.resolve(__dirname, this.localNewsPath);
      console.log(`Looking for news files in: ${newsDir}`);
      const files = await fs.readdir(newsDir);
      
      // Find all full_articles_*.json files
      const articleFiles = files.filter(file => 
        file.startsWith('full_articles_') && file.endsWith('.json')
      );

      let allArticles = [];
      
      for (const file of articleFiles) {
        try {
          const filePath = path.join(newsDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const jsonData = JSON.parse(fileContent);

          // Extract articles array from the JSON structure
          const articles = jsonData.articles || [];

          // Extract date from filename (full_articles_20250121.json)
          const dateMatch = file.match(/full_articles_(\d{8})\.json/);
          const fileDate = dateMatch ? dateMatch[1] : null;

          // Process each article
          const processedArticles = articles.map(article => ({
            id: this.generateArticleId(article.url, fileDate),
            title: article.title,
            url: article.url,
            content: article.full_text || article.summary || '',
            summary: article.summary || '',
            keyword: article.keyword,
            severity_score: article.severity_score || 50,
            sentiment: article.sentiment || 0,
            date: fileDate ? this.formatDate(fileDate) : article.date,
            source_file: file,
            imported_at: new Date().toISOString(),
            analysis_status: 'pending' // Will be updated after Keisha analysis
          }));
          
          allArticles = allArticles.concat(processedArticles);
          console.log(`Imported ${processedArticles.length} articles from ${file}`);
          
        } catch (error) {
          console.error(`Error processing file ${file}:`, error.message);
        }
      }
      
      // Remove duplicates based on URL
      const uniqueArticles = this.removeDuplicates(allArticles);
      console.log(`Total unique articles imported: ${uniqueArticles.length}`);
      
      return uniqueArticles;
      
    } catch (error) {
      console.error('Error importing from local files:', error);
      throw error;
    }
  }

  /**
   * Import news stories from GitHub repository
   * Pulls latest JSON files from your soWSnewsletter repo
   */
  async importFromGitHub(daysBack = 7) {
    try {
      console.log(`Importing from GitHub: ${this.githubBaseUrl}`);

      const allArticles = [];
      const today = new Date();

      // Try to get files from the last N days
      for (let i = 0; i < daysBack; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');

        try {
          const fileUrl = `${this.githubBaseUrl}/full_articles_${dateString}.json`;
          console.log(`Fetching: ${fileUrl}`);

          const response = await axios.get(fileUrl, {
            timeout: 30000,
            headers: {
              'User-Agent': 'FNS-GitHubImporter/1.0'
            }
          });

          const jsonData = response.data;
          const articles = jsonData.articles || [];

          // Process articles
          const processedArticles = articles.map(article => ({
            id: this.generateArticleId(article.url, dateString),
            title: article.title,
            url: article.url,
            content: article.full_text || article.content || '',
            summary: article.summary || '',
            keyword: article.keyword,
            severity_score: article.severity_score || 50,
            sentiment: article.sentiment || 0,
            date: this.formatDate(dateString),
            source_file: `full_articles_${dateString}.json`,
            source_type: 'github',
            imported_at: new Date().toISOString(),
            analysis_status: 'pending'
          }));

          allArticles.push(...processedArticles);
          console.log(`✅ Imported ${processedArticles.length} articles from ${dateString}`);

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));

        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`📅 No file found for ${dateString} (this is normal)`);
          } else {
            console.error(`Error fetching ${dateString}:`, error.message);
          }
        }
      }

      // Remove duplicates
      const uniqueArticles = this.removeDuplicates(allArticles);
      console.log(`Total unique articles from GitHub: ${uniqueArticles.length}`);

      return uniqueArticles;

    } catch (error) {
      console.error('Error importing from GitHub:', error);
      throw error;
    }
  }

  /**
   * Import news stories from remote newsletter API
   * This would hit your Render-hosted newsletter service
   */
  async importFromRemoteAPI() {
    try {
      // This assumes your newsletter service has an API endpoint
      // You might need to add this to your soWSnewsletter system
      const response = await axios.get(`${this.newsletterBaseUrl}/api/articles`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'FNS-NewsImporter/1.0'
        }
      });
      
      const articles = response.data;
      
      const processedArticles = articles.map(article => ({
        id: this.generateArticleId(article.url, article.date),
        title: article.title,
        url: article.url,
        content: article.full_text || article.content || '',
        summary: article.summary || '',
        keyword: article.keyword,
        severity_score: article.severity_score || 50,
        sentiment: article.sentiment || 0,
        date: article.date,
        imported_at: new Date().toISOString(),
        analysis_status: 'pending'
      }));
      
      console.log(`Imported ${processedArticles.length} articles from remote API`);
      return processedArticles;
      
    } catch (error) {
      console.error('Error importing from remote API:', error.message);
      // Fallback to local files if remote fails
      console.log('Falling back to local file import...');
      return await this.importFromLocalFiles();
    }
  }

  /**
   * Extract images from article content or fetch from URL
   */
  async extractArticleImages(article) {
    try {
      // Try to extract images from the article URL
      const response = await axios.get(article.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FNS-ImageExtractor/1.0)'
        }
      });
      
      const html = response.data;
      const imageUrls = this.extractImageUrls(html);
      
      return {
        ...article,
        images: imageUrls,
        featured_image: imageUrls[0] || null
      };
      
    } catch (error) {
      console.error(`Error extracting images for ${article.url}:`, error.message);
      return {
        ...article,
        images: [],
        featured_image: null
      };
    }
  }

  /**
   * Extract image URLs from HTML content
   */
  extractImageUrls(html) {
    const imageRegex = /<img[^>]+src="([^">]+)"/gi;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(html)) !== null) {
      const imageUrl = match[1];
      // Filter out small images, icons, and ads
      if (this.isValidNewsImage(imageUrl)) {
        images.push(imageUrl);
      }
    }
    
    return images.slice(0, 5); // Limit to 5 images per article
  }

  /**
   * Check if image URL is likely a valid news image
   */
  isValidNewsImage(url) {
    const invalidPatterns = [
      /icon/i,
      /logo/i,
      /avatar/i,
      /ad[s]?[_-]/i,
      /banner/i,
      /pixel/i,
      /tracking/i,
      /1x1/i,
      /\.gif$/i
    ];
    
    return !invalidPatterns.some(pattern => pattern.test(url)) && 
           url.length > 20; // Reasonable URL length
  }

  /**
   * Generate unique article ID
   */
  generateArticleId(url, date) {
    const urlHash = crypto
      .createHash('md5')
      .update(url)
      .digest('hex')
      .substring(0, 8);

    return `fns_${date || 'unknown'}_${urlHash}`;
  }

  /**
   * Format date from YYYYMMDD to YYYY-MM-DD
   */
  formatDate(dateString) {
    if (dateString.length === 8) {
      return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
    }
    return dateString;
  }

  /**
   * Remove duplicate articles based on URL
   */
  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      if (seen.has(article.url)) {
        return false;
      }
      seen.add(article.url);
      return true;
    });
  }

  /**
   * Get latest articles with optional filtering
   */
  async getLatestArticles(options = {}) {
    const {
      limit = 50,
      keyword = null,
      minSeverity = 0,
      includeImages = false,
      source = 'auto' // 'auto', 'github', 'local'
    } = options;

    try {
      let articles;

      if (source === 'github') {
        articles = await this.importFromGitHub();
      } else if (source === 'local') {
        articles = await this.importFromLocalFiles();
      } else {
        // Auto: try GitHub first, fallback to local
        try {
          articles = await this.importFromGitHub();
          console.log('✅ Using live GitHub data');
        } catch (error) {
          console.log('⚠️ GitHub import failed, using local files');
          articles = await this.importFromLocalFiles();
        }
      }
      
      // Apply filters
      if (keyword) {
        articles = articles.filter(article => 
          article.keyword.toLowerCase().includes(keyword.toLowerCase())
        );
      }
      
      if (minSeverity > 0) {
        articles = articles.filter(article => 
          article.severity_score >= minSeverity
        );
      }
      
      // Sort by date (newest first)
      articles.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Limit results
      articles = articles.slice(0, limit);
      
      // Extract images if requested
      if (includeImages) {
        const articlesWithImages = [];
        for (const article of articles) {
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));
          const articleWithImages = await this.extractArticleImages(article);
          articlesWithImages.push(articleWithImages);
        }
        return articlesWithImages;
      }
      
      return articles;
      
    } catch (error) {
      console.error('Error getting latest articles:', error);
      throw error;
    }
  }
}

module.exports = NewsImportService;
