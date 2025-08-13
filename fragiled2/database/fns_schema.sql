-- Fragile News Source (FNS) Database Schema
-- This schema stores news articles and their Keisha AI analysis results

-- News Articles Table
CREATE TABLE IF NOT EXISTS fns_articles (
    id VARCHAR(50) PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    content TEXT,
    summary TEXT,
    keyword VARCHAR(100),
    severity_score DECIMAL(5,2) DEFAULT 50.00,
    sentiment DECIMAL(3,2) DEFAULT 0.00,
    date DATE,
    source_file VARCHAR(100),
    featured_image TEXT,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    analysis_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    
    -- Indexes for performance
    INDEX idx_date (date),
    INDEX idx_keyword (keyword),
    INDEX idx_severity (severity_score),
    INDEX idx_analysis_status (analysis_status),
    INDEX idx_imported_at (imported_at)
);

-- Article Images Table (for multiple images per article)
CREATE TABLE IF NOT EXISTS fns_article_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    width INT,
    height INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (article_id) REFERENCES fns_articles(id) ON DELETE CASCADE,
    INDEX idx_article_id (article_id),
    INDEX idx_featured (is_featured)
);

-- Keisha AI Analysis Results Table
CREATE TABLE IF NOT EXISTS fns_keisha_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id VARCHAR(50) NOT NULL,
    
    -- Original Keisha analysis fields
    bias_score DECIMAL(5,2),
    fragility_indicators JSON,
    euphemisms_detected JSON,
    systemic_patterns JSON,
    
    -- Keisha's translation/analysis text
    keisha_translation TEXT,
    keisha_summary TEXT,
    critical_analysis TEXT,
    
    -- Analysis metadata
    analysis_version VARCHAR(20) DEFAULT '1.0',
    processing_time_ms INT,
    confidence_score DECIMAL(3,2),
    
    -- Timestamps
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (article_id) REFERENCES fns_articles(id) ON DELETE CASCADE,
    INDEX idx_article_id (article_id),
    INDEX idx_bias_score (bias_score),
    INDEX idx_analyzed_at (analyzed_at)
);

-- News Categories/Keywords Table
CREATE TABLE IF NOT EXISTS fns_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7), -- Hex color for UI
    severity_weight DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name)
);

-- Article-Category Mapping (many-to-many)
CREATE TABLE IF NOT EXISTS fns_article_categories (
    article_id VARCHAR(50) NOT NULL,
    category_id INT NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 1.00,
    
    PRIMARY KEY (article_id, category_id),
    FOREIGN KEY (article_id) REFERENCES fns_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES fns_categories(id) ON DELETE CASCADE
);

-- User Interactions Table (for future features)
CREATE TABLE IF NOT EXISTS fns_user_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50), -- Can be null for anonymous users
    interaction_type ENUM('view', 'share', 'bookmark', 'report') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (article_id) REFERENCES fns_articles(id) ON DELETE CASCADE,
    INDEX idx_article_id (article_id),
    INDEX idx_interaction_type (interaction_type),
    INDEX idx_created_at (created_at)
);

-- System Configuration Table
CREATE TABLE IF NOT EXISTS fns_config (
    key_name VARCHAR(100) PRIMARY KEY,
    key_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default categories based on your newsletter keywords
INSERT INTO fns_categories (name, description, color_code, severity_weight) VALUES
('systemic racism', 'Articles about institutional and systemic racism', '#FF4444', 1.2),
('white supremacy', 'Direct white supremacy content and analysis', '#FF0000', 1.5),
('MAGA', 'MAGA movement and related political content', '#FF6666', 1.1),
('anti-racism', 'Anti-racism efforts and resistance movements', '#00AA00', 0.8),
('christian nationalism', 'Christian nationalism and religious extremism', '#FF8800', 1.3),
('great replacement theory', 'Great replacement theory and related conspiracies', '#CC0000', 1.4),
('racism', 'General racism and discriminatory content', '#FF7777', 1.0)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert default configuration
INSERT INTO fns_config (key_name, key_value, description) VALUES
('import_frequency_hours', '12', 'How often to import new articles (in hours)'),
('max_articles_per_import', '100', 'Maximum articles to import per batch'),
('analysis_batch_size', '10', 'Number of articles to analyze in parallel'),
('image_extraction_enabled', 'true', 'Whether to extract images from articles'),
('auto_analysis_enabled', 'true', 'Whether to automatically analyze imported articles')
ON DUPLICATE KEY UPDATE key_value = VALUES(key_value);

-- Views for common queries

-- Latest analyzed articles with Keisha analysis
CREATE OR REPLACE VIEW fns_latest_analyzed AS
SELECT 
    a.id,
    a.title,
    a.url,
    a.summary,
    a.keyword,
    a.severity_score,
    a.date,
    a.featured_image,
    k.bias_score,
    k.keisha_translation,
    k.keisha_summary,
    k.analyzed_at
FROM fns_articles a
JOIN fns_keisha_analysis k ON a.id = k.article_id
WHERE a.analysis_status = 'completed'
ORDER BY a.date DESC, k.analyzed_at DESC;

-- Articles pending analysis
CREATE OR REPLACE VIEW fns_pending_analysis AS
SELECT 
    id,
    title,
    url,
    keyword,
    severity_score,
    date,
    imported_at
FROM fns_articles
WHERE analysis_status = 'pending'
ORDER BY imported_at ASC;

-- Daily article statistics
CREATE OR REPLACE VIEW fns_daily_stats AS
SELECT 
    DATE(date) as article_date,
    COUNT(*) as total_articles,
    AVG(severity_score) as avg_severity,
    COUNT(CASE WHEN analysis_status = 'completed' THEN 1 END) as analyzed_count,
    COUNT(CASE WHEN analysis_status = 'pending' THEN 1 END) as pending_count
FROM fns_articles
GROUP BY DATE(date)
ORDER BY article_date DESC;
