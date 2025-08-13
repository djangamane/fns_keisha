#!/usr/bin/env node

/**
 * News Import Script for FNS
 * Imports articles from soWSnewsletter system
 */

require('dotenv').config();
const FNSNewsService = require('../services/fnsNewsService');

async function importNews() {
  console.log('📰 Starting FNS News Import...\n');
  
  const newsService = new FNSNewsService();
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
      includeImages: args.includes('--images'),
      batchSize: 100
    };
    
    // Check for custom batch size
    const batchIndex = args.indexOf('--batch-size');
    if (batchIndex !== -1 && args[batchIndex + 1]) {
      options.batchSize = parseInt(args[batchIndex + 1]);
    }
    
    console.log('⚙️  Import Configuration:');
    console.log(`   - Batch Size: ${options.batchSize}`);
    console.log(`   - Include Images: ${options.includeImages ? 'Yes' : 'No'}`);
    console.log(`   - Source: ${process.env.LOCAL_NEWS_PATH || '../news_project'}\n`);
    
    // Start import
    console.log('🔄 Importing articles...');
    const startTime = Date.now();
    
    const result = await newsService.importArticles(options);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ Import completed successfully!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Results:`);
    console.log(`   - New Articles: ${result.imported}`);
    console.log(`   - Updated Articles: ${result.updated}`);
    console.log(`   - Total Processed: ${result.total}`);
    
    // Get updated statistics
    console.log('\n📈 Updated Database Statistics:');
    const stats = await newsService.getDashboardStats();
    console.log(`   - Total Articles: ${stats.total_articles}`);
    console.log(`   - Pending Analysis: ${stats.pending_articles}`);
    console.log(`   - Average Severity: ${stats.avg_severity?.toFixed(1) || 'N/A'}`);
    console.log(`   - Latest Article: ${stats.latest_article_date || 'N/A'}`);
    
    if (stats.pending_articles > 0) {
      console.log('\n🤖 Next step: Run analysis on pending articles');
      console.log('   Command: npm run analyze:pending');
    }
    
  } catch (error) {
    console.error('❌ News import failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check that news_project directory exists and contains JSON files');
    console.error('2. Verify database connection');
    console.error('3. Ensure sufficient disk space');
    process.exit(1);
  } finally {
    await newsService.pool.end();
  }
}

// Show help
function showHelp() {
  console.log('FNS News Import Script\n');
  console.log('Usage: npm run import:news [options]\n');
  console.log('Options:');
  console.log('  --images           Include image extraction (slower)');
  console.log('  --batch-size N     Set batch size (default: 100)');
  console.log('  --help             Show this help message\n');
  console.log('Examples:');
  console.log('  npm run import:news');
  console.log('  npm run import:news -- --images');
  console.log('  npm run import:news -- --batch-size 50 --images');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  importNews();
}

module.exports = importNews;
