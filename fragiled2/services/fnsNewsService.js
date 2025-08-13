const mysql = require('mysql2/promise');
const NewsImportService = require('./newsImportService');

/**
 * FNS News Service - Main service for Fragile News Source
 * Handles database operations and coordinates with import service
 */
class FNSNewsService {
  constructor() {
    this.newsImporter = new NewsImportService();
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
  }

  /**
   * Initialize database with schema
   */
  async initializeDatabase() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const schemaPath = path.join(__dirname, '../database/fns_schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf8');
      
      // Split schema into individual statements
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.pool.execute(statement);
        }
      }
      
      console.log('Database initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Import and store news articles
   */
  async importArticles(options = {}) {
    try {
      const { includeImages = false, batchSize = 50 } = options;
      
      console.log('Starting article import...');
      const articles = await this.newsImporter.getLatestArticles({
        limit: batchSize,
        includeImages
      });
      
      let importedCount = 0;
      let updatedCount = 0;
      
      for (const article of articles) {
        try {
          const result = await this.storeArticle(article);
          if (result.isNew) {
            importedCount++;
          } else {
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error storing article ${article.id}:`, error.message);
        }
      }
      
      console.log(`Import complete: ${importedCount} new, ${updatedCount} updated`);
      return { imported: importedCount, updated: updatedCount, total: articles.length };
      
    } catch (error) {
      console.error('Error importing articles:', error);
      throw error;
    }
  }

  /**
   * Store individual article in database
   */
  async storeArticle(article) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if article already exists
      const [existing] = await connection.execute(
        'SELECT id, updated_at FROM fns_articles WHERE url = ?',
        [article.url]
      );
      
      const isNew = existing.length === 0;
      
      if (isNew) {
        // Insert new article
        await connection.execute(`
          INSERT INTO fns_articles (
            id, title, url, content, summary, keyword, 
            severity_score, sentiment, date, source_file, 
            featured_image, analysis_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          article.id,
          article.title,
          article.url,
          article.content,
          article.summary,
          article.keyword,
          article.severity_score,
          article.sentiment,
          article.date,
          article.source_file,
          article.featured_image,
          article.analysis_status
        ]);
      } else {
        // Update existing article if content has changed
        await connection.execute(`
          UPDATE fns_articles SET 
            title = ?, content = ?, summary = ?, 
            severity_score = ?, sentiment = ?, 
            featured_image = ?, updated_at = CURRENT_TIMESTAMP
          WHERE url = ?
        `, [
          article.title,
          article.content,
          article.summary,
          article.severity_score,
          article.sentiment,
          article.featured_image,
          article.url
        ]);
      }
      
      // Store images if provided
      if (article.images && article.images.length > 0) {
        // Clear existing images
        await connection.execute(
          'DELETE FROM fns_article_images WHERE article_id = ?',
          [article.id]
        );
        
        // Insert new images
        for (let i = 0; i < article.images.length; i++) {
          const imageUrl = article.images[i];
          await connection.execute(`
            INSERT INTO fns_article_images (
              article_id, image_url, is_featured
            ) VALUES (?, ?, ?)
          `, [
            article.id,
            imageUrl,
            i === 0 // First image is featured
          ]);
        }
      }
      
      // Map to category
      if (article.keyword) {
        await this.mapArticleToCategory(connection, article.id, article.keyword);
      }
      
      await connection.commit();
      return { isNew, articleId: article.id };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Map article to category based on keyword
   */
  async mapArticleToCategory(connection, articleId, keyword) {
    try {
      // Find matching category
      const [categories] = await connection.execute(
        'SELECT id FROM fns_categories WHERE name = ?',
        [keyword]
      );
      
      if (categories.length > 0) {
        const categoryId = categories[0].id;
        
        // Insert mapping (ignore if already exists)
        await connection.execute(`
          INSERT IGNORE INTO fns_article_categories (article_id, category_id)
          VALUES (?, ?)
        `, [articleId, categoryId]);
      }
    } catch (error) {
      console.error('Error mapping article to category:', error);
    }
  }

  /**
   * Get articles for news feed
   */
  async getNewsFeed(options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        category = null,
        minSeverity = 0,
        analysisStatus = null,
        includeAnalysis = true
      } = options;
      
      let query = `
        SELECT 
          a.id, a.title, a.url, a.summary, a.keyword,
          a.severity_score, a.sentiment, a.date, a.featured_image,
          a.analysis_status, a.imported_at
      `;
      
      if (includeAnalysis) {
        query += `,
          k.bias_score, k.keisha_translation, k.keisha_summary,
          k.analyzed_at
        `;
      }
      
      query += `
        FROM fns_articles a
      `;
      
      if (includeAnalysis) {
        query += `
          LEFT JOIN fns_keisha_analysis k ON a.id = k.article_id
        `;
      }
      
      const conditions = [];
      const params = [];
      
      if (category) {
        query += `
          JOIN fns_article_categories ac ON a.id = ac.article_id
          JOIN fns_categories c ON ac.category_id = c.id
        `;
        conditions.push('c.name = ?');
        params.push(category);
      }
      
      if (minSeverity > 0) {
        conditions.push('a.severity_score >= ?');
        params.push(minSeverity);
      }
      
      if (analysisStatus) {
        conditions.push('a.analysis_status = ?');
        params.push(analysisStatus);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += `
        ORDER BY a.date DESC, a.imported_at DESC
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const [articles] = await this.pool.execute(query, params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(DISTINCT a.id) as total FROM fns_articles a';
      let countParams = [];
      
      if (category) {
        countQuery += `
          JOIN fns_article_categories ac ON a.id = ac.article_id
          JOIN fns_categories c ON ac.category_id = c.id
        `;
      }
      
      const countConditions = [];
      if (category) {
        countConditions.push('c.name = ?');
        countParams.push(category);
      }
      if (minSeverity > 0) {
        countConditions.push('a.severity_score >= ?');
        countParams.push(minSeverity);
      }
      if (analysisStatus) {
        countConditions.push('a.analysis_status = ?');
        countParams.push(analysisStatus);
      }
      
      if (countConditions.length > 0) {
        countQuery += ' WHERE ' + countConditions.join(' AND ');
      }
      
      const [countResult] = await this.pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      return {
        articles,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
      
    } catch (error) {
      console.error('Error getting news feed:', error);
      throw error;
    }
  }

  /**
   * Get single article with full details
   */
  async getArticleById(articleId) {
    try {
      const [articles] = await this.pool.execute(`
        SELECT 
          a.*,
          k.bias_score, k.fragility_indicators, k.euphemisms_detected,
          k.systemic_patterns, k.keisha_translation, k.keisha_summary,
          k.critical_analysis, k.confidence_score, k.analyzed_at
        FROM fns_articles a
        LEFT JOIN fns_keisha_analysis k ON a.id = k.article_id
        WHERE a.id = ?
      `, [articleId]);
      
      if (articles.length === 0) {
        return null;
      }
      
      const article = articles[0];
      
      // Get images
      const [images] = await this.pool.execute(`
        SELECT image_url, alt_text, is_featured, width, height
        FROM fns_article_images
        WHERE article_id = ?
        ORDER BY is_featured DESC, id ASC
      `, [articleId]);
      
      article.images = images;
      
      // Get categories
      const [categories] = await this.pool.execute(`
        SELECT c.name, c.description, c.color_code
        FROM fns_categories c
        JOIN fns_article_categories ac ON c.id = ac.category_id
        WHERE ac.article_id = ?
      `, [articleId]);
      
      article.categories = categories;
      
      return article;
      
    } catch (error) {
      console.error('Error getting article by ID:', error);
      throw error;
    }
  }

  /**
   * Get articles pending analysis
   */
  async getArticlesPendingAnalysis(limit = 10) {
    try {
      const [articles] = await this.pool.execute(`
        SELECT id, title, url, content, keyword, severity_score
        FROM fns_articles
        WHERE analysis_status = 'pending'
        ORDER BY imported_at ASC
        LIMIT ?
      `, [limit]);
      
      return articles;
      
    } catch (error) {
      console.error('Error getting articles pending analysis:', error);
      throw error;
    }
  }

  /**
   * Update article analysis status
   */
  async updateAnalysisStatus(articleId, status) {
    try {
      await this.pool.execute(`
        UPDATE fns_articles 
        SET analysis_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, articleId]);
      
    } catch (error) {
      console.error('Error updating analysis status:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [stats] = await this.pool.execute(`
        SELECT 
          COUNT(*) as total_articles,
          COUNT(CASE WHEN analysis_status = 'completed' THEN 1 END) as analyzed_articles,
          COUNT(CASE WHEN analysis_status = 'pending' THEN 1 END) as pending_articles,
          AVG(severity_score) as avg_severity,
          MAX(date) as latest_article_date,
          COUNT(CASE WHEN date >= CURDATE() - INTERVAL 7 DAY THEN 1 END) as articles_this_week
        FROM fns_articles
      `);
      
      return stats[0];
      
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

module.exports = FNSNewsService;
