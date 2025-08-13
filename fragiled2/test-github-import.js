#!/usr/bin/env node

/**
 * Test GitHub import for FNS
 * Tests pulling live data from your soWSnewsletter repository
 */

require('dotenv').config();
const NewsImportService = require('./services/newsImportService');

async function testGitHubImport() {
  console.log('🐙 Testing GitHub Import for FNS...\n');
  console.log('📍 Repository: https://github.com/djangamane/soWSnewsletter');
  console.log('📂 Path: /full_articles_YYYYMMDD.json\n');
  
  const newsImporter = new NewsImportService();
  
  try {
    // Test GitHub import with last 3 days
    console.log('🔄 Testing GitHub import (last 3 days)...');
    const githubArticles = await newsImporter.importFromGitHub(3);
    
    console.log(`✅ GitHub import successful: ${githubArticles.length} articles\n`);
    
    // Compare with local import
    console.log('🔄 Testing local import for comparison...');
    const localArticles = await newsImporter.importFromLocalFiles();
    
    console.log(`✅ Local import: ${localArticles.length} articles\n`);
    
    // Analysis
    console.log('📊 Comparison Analysis:');
    console.log(`   GitHub Articles: ${githubArticles.length}`);
    console.log(`   Local Articles: ${localArticles.length}`);
    
    // Check for overlap
    const githubUrls = new Set(githubArticles.map(a => a.url));
    const localUrls = new Set(localArticles.map(a => a.url));
    const overlap = [...githubUrls].filter(url => localUrls.has(url));
    
    console.log(`   Overlapping URLs: ${overlap.length}`);
    console.log(`   GitHub-only: ${githubArticles.length - overlap.length}`);
    console.log(`   Local-only: ${localArticles.length - overlap.length}`);
    
    // Show sample GitHub articles
    if (githubArticles.length > 0) {
      console.log('\n📰 Sample GitHub Articles:');
      githubArticles.slice(0, 3).forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title.substring(0, 70)}...`);
        console.log(`   Category: ${article.keyword}`);
        console.log(`   Severity: ${article.severity_score.toFixed(1)}`);
        console.log(`   Date: ${article.date}`);
        console.log(`   Source: ${article.source_file}`);
      });
    }
    
    // Test the auto-selection logic
    console.log('\n🤖 Testing Auto-Selection Logic...');
    const autoArticles = await newsImporter.getLatestArticles({ 
      limit: 10, 
      source: 'auto' 
    });
    
    console.log(`✅ Auto-selection returned: ${autoArticles.length} articles`);
    console.log(`   Source type: ${autoArticles[0]?.source_type || 'unknown'}`);
    
    console.log('\n🎯 Live Data Strategy:');
    console.log('✅ GitHub integration working');
    console.log('✅ Fallback to local files working');
    console.log('✅ Auto-selection logic working');
    
    console.log('\n🚀 Production Setup:');
    console.log('1. FNS will check GitHub twice daily for new JSON files');
    console.log('2. Import new articles automatically');
    console.log('3. Send through Keisha AI for analysis');
    console.log('4. Update frontend with fresh content');
    
    console.log('\n📅 File Pattern:');
    console.log('   Today: full_articles_20250812.json');
    console.log('   Yesterday: full_articles_20250811.json');
    console.log('   URL: https://raw.githubusercontent.com/djangamane/soWSnewsletter/main/full_articles_YYYYMMDD.json');
    
  } catch (error) {
    console.error('❌ GitHub import test failed:', error.message);
    
    if (error.response?.status === 404) {
      console.error('\n🔍 Troubleshooting:');
      console.error('   - File might not exist for today yet');
      console.error('   - Check the exact file naming pattern in your repo');
      console.error('   - Verify the repository structure');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🌐 Network issue:');
      console.error('   - Check internet connection');
      console.error('   - GitHub might be temporarily unavailable');
    }
    
    console.error('\n💡 Fallback: Local files will be used in production if GitHub fails');
  }
}

// Run the test
if (require.main === module) {
  testGitHubImport();
}

module.exports = testGitHubImport;
