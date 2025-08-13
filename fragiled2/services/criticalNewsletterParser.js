const axios = require('axios');

/**
 * Critical Newsletter Parser for FNS
 * Parses the curated critical newsletter files from GitHub docs folder
 */
class CriticalNewsletterParser {
  constructor() {
    this.githubBaseUrl = 'https://raw.githubusercontent.com/djangamane/soWSnewsletter/main/docs';
  }

  /**
   * Parse critical newsletter text format
   */
  parseCriticalNewsletter(content, date) {
    try {
      const articles = [];
      
      // Extract overall severity from the meter
      const severityMatch = content.match(/Current Level: ([\d.]+)%/);
      const overallSeverity = severityMatch ? parseFloat(severityMatch[1]) : 75;
      
      // Split content into individual stories
      const storyPattern = /(\d+)\.\s+(.+?)\nSeverity Score:\s+([\d.]+)\n\nSummary:\n(.+?)\n\nCritical Analysis:\n(.+?)\n\n🔗 Read more:\s+(.+?)\n---/gs;
      
      let match;
      while ((match = storyPattern.exec(content)) !== null) {
        const [, storyNumber, title, severityScore, summary, analysis, url] = match;
        
        // Clean up the extracted text
        const cleanTitle = this.cleanText(title);
        const cleanSummary = this.cleanText(summary);
        const cleanAnalysis = this.cleanText(analysis);
        const cleanUrl = this.cleanUrl(url);
        
        const article = {
          id: this.generateArticleId(cleanUrl, date),
          title: cleanTitle,
          url: cleanUrl,
          content: `${cleanSummary}\n\n${cleanAnalysis}`,
          summary: cleanSummary,
          keyword: this.extractKeyword(cleanTitle, cleanSummary),
          severity_score: parseFloat(severityScore),
          sentiment: this.calculateSentiment(cleanSummary),
          date: this.formatDate(date),
          source_file: `critical_newsletter_${date}.txt`,
          source_type: 'critical_newsletter',
          story_number: parseInt(storyNumber),
          keisha_analysis: cleanAnalysis,
          overall_severity: overallSeverity,
          imported_at: new Date().toISOString(),
          analysis_status: 'completed' // Already analyzed by Keisha
        };
        
        articles.push(article);
      }
      
      return articles;
      
    } catch (error) {
      console.error('Error parsing critical newsletter:', error);
      return [];
    }
  }

  /**
   * Clean extracted text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clean and validate URL
   */
  cleanUrl(url) {
    if (!url) return '';
    
    // Handle Google redirect URLs
    if (url.includes('google.com/url')) {
      const urlMatch = url.match(/url=([^&]+)/);
      if (urlMatch) {
        return decodeURIComponent(urlMatch[1]);
      }
    }
    
    return url.trim();
  }

  /**
   * Extract keyword/category from title and summary
   */
  extractKeyword(title, summary) {
    const content = `${title} ${summary}`.toLowerCase();
    
    // Priority order for keyword detection
    const keywords = [
      'white supremacy',
      'systemic racism', 
      'christian nationalism',
      'great replacement theory',
      'MAGA',
      'anti-racism',
      'racism'
    ];
    
    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    
    // Default fallback
    return 'systemic racism';
  }

  /**
   * Calculate sentiment from summary text
   */
  calculateSentiment(text) {
    if (!text) return 0;
    
    const negativeWords = ['violence', 'attack', 'hate', 'threat', 'kill', 'racist', 'discrimination'];
    const positiveWords = ['justice', 'equality', 'progress', 'reform', 'support'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (negativeWords.some(neg => word.includes(neg))) score -= 0.1;
      if (positiveWords.some(pos => word.includes(pos))) score += 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Generate article ID
   */
  generateArticleId(url, date) {
    const crypto = require('crypto');
    const urlHash = crypto
      .createHash('md5')
      .update(url)
      .digest('hex')
      .substring(0, 8);
    
    return `fns_critical_${date}_${urlHash}`;
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
   * Import critical newsletters from GitHub
   */
  async importCriticalNewsletters(daysBack = 7) {
    try {
      console.log('📰 Importing critical newsletters from GitHub...');
      
      const allArticles = [];
      const today = new Date();
      
      for (let i = 0; i < daysBack; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
        
        try {
          const fileUrl = `${this.githubBaseUrl}/critical_newsletter_${dateString}.txt`;
          console.log(`Fetching critical newsletter: ${dateString}`);
          
          const response = await axios.get(fileUrl, {
            timeout: 30000,
            headers: {
              'User-Agent': 'FNS-CriticalNewsImporter/1.0'
            }
          });
          
          const articles = this.parseCriticalNewsletter(response.data, dateString);
          allArticles.push(...articles);
          
          console.log(`✅ Imported ${articles.length} critical stories from ${dateString}`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`📅 No critical newsletter for ${dateString}`);
          } else {
            console.error(`Error fetching critical newsletter ${dateString}:`, error.message);
          }
        }
      }
      
      console.log(`📊 Total critical articles imported: ${allArticles.length}`);
      return allArticles;
      
    } catch (error) {
      console.error('Error importing critical newsletters:', error);
      throw error;
    }
  }

  /**
   * Get latest critical articles
   */
  async getLatestCriticalArticles(options = {}) {
    const { limit = 50, minSeverity = 70 } = options;
    
    try {
      const articles = await this.importCriticalNewsletters();
      
      // Filter by minimum severity
      const filteredArticles = articles.filter(article => 
        article.severity_score >= minSeverity
      );
      
      // Sort by severity score (highest first)
      filteredArticles.sort((a, b) => b.severity_score - a.severity_score);
      
      return filteredArticles.slice(0, limit);
      
    } catch (error) {
      console.error('Error getting latest critical articles:', error);
      throw error;
    }
  }
}

module.exports = CriticalNewsletterParser;
