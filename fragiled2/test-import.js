#!/usr/bin/env node

/**
 * Test script for FNS News Import
 * Tests the news import service without database
 */

require('dotenv').config();
const NewsImportService = require('./services/newsImportService');

async function testImport() {
  console.log('🧪 Testing FNS News Import Service...\n');
  
  const newsImporter = new NewsImportService();
  
  try {
    console.log('📂 Testing local file import...');
    const articles = await newsImporter.importFromLocalFiles();
    
    console.log(`✅ Successfully imported ${articles.length} articles\n`);
    
    // Show some statistics
    const categories = {};
    const severityLevels = { low: 0, medium: 0, high: 0, critical: 0 };
    
    articles.forEach(article => {
      // Count categories
      categories[article.keyword] = (categories[article.keyword] || 0) + 1;
      
      // Count severity levels
      const severity = article.severity_score;
      if (severity < 50) severityLevels.low++;
      else if (severity < 70) severityLevels.medium++;
      else if (severity < 85) severityLevels.high++;
      else severityLevels.critical++;
    });
    
    console.log('📊 Import Statistics:');
    console.log(`   Total Articles: ${articles.length}`);
    console.log(`   Average Severity: ${(articles.reduce((sum, a) => sum + a.severity_score, 0) / articles.length).toFixed(1)}`);
    
    console.log('\n📋 Categories:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} articles`);
    });
    
    console.log('\n🎯 Severity Distribution:');
    console.log(`   Low (0-49): ${severityLevels.low}`);
    console.log(`   Medium (50-69): ${severityLevels.medium}`);
    console.log(`   High (70-84): ${severityLevels.high}`);
    console.log(`   Critical (85+): ${severityLevels.critical}`);
    
    // Show sample articles
    console.log('\n📰 Sample Articles:');
    articles.slice(0, 3).forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title.substring(0, 80)}...`);
      console.log(`   Category: ${article.keyword}`);
      console.log(`   Severity: ${article.severity_score.toFixed(1)}`);
      console.log(`   Date: ${article.date}`);
      console.log(`   URL: ${article.url.substring(0, 60)}...`);
    });
    
    // Test article ID generation
    console.log('\n🔑 Testing Article ID Generation:');
    const sampleArticle = articles[0];
    const generatedId = newsImporter.generateArticleId(sampleArticle.url, sampleArticle.date);
    console.log(`   Sample ID: ${generatedId}`);
    
    // Test image extraction (just the logic, not actual HTTP requests)
    console.log('\n🖼️  Testing Image URL Validation:');
    const testUrls = [
      'https://example.com/news-image.jpg',
      'https://example.com/icon.png',
      'https://example.com/ad-banner.gif',
      'https://example.com/article-photo.jpeg'
    ];
    
    testUrls.forEach(url => {
      const isValid = newsImporter.isValidNewsImage(url);
      console.log(`   ${url}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });
    
    console.log('\n🎉 News Import Test Completed Successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up database connection');
    console.log('2. Run: npm run setup');
    console.log('3. Run: npm run import:news');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testImport();
}

module.exports = testImport;
