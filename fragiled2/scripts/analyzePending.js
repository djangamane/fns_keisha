#!/usr/bin/env node

/**
 * Keisha Analysis Script for FNS
 * Analyzes pending articles using Keisha AI
 */

require('dotenv').config();
const KeishaAnalysisIntegration = require('../services/keishaAnalysisIntegration');

async function analyzePending() {
  console.log('🤖 Starting Keisha AI Analysis...\n');
  
  const keishaIntegration = new KeishaAnalysisIntegration();
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let limit = 10;
    
    const limitIndex = args.indexOf('--limit');
    if (limitIndex !== -1 && args[limitIndex + 1]) {
      limit = parseInt(args[limitIndex + 1]);
    }
    
    console.log('⚙️  Analysis Configuration:');
    console.log(`   - Batch Limit: ${limit}`);
    console.log(`   - Keisha API: ${process.env.KEISHA_API_URL || 'http://localhost:3001'}\n`);
    
    // Test Keisha connection first
    console.log('🔗 Testing Keisha AI connection...');
    const connectionTest = await keishaIntegration.testKeishaConnection();
    
    if (!connectionTest.connected) {
      console.error('❌ Cannot connect to Keisha AI:', connectionTest.error);
      console.error('\nTroubleshooting:');
      console.error('1. Ensure Keisha AI backend is running');
      console.error('2. Check KEISHA_API_URL in .env file');
      console.error('3. Verify KEISHA_API_KEY if authentication is required');
      process.exit(1);
    }
    
    console.log('✅ Keisha AI connection successful\n');
    
    // Get queue status
    const queueStatus = keishaIntegration.getQueueStatus();
    console.log('📊 Current Queue Status:');
    console.log(`   - Queue Length: ${queueStatus.queue_length}`);
    console.log(`   - Processing: ${queueStatus.is_processing ? 'Yes' : 'No'}`);
    console.log(`   - Max Concurrent: ${queueStatus.max_concurrent}`);
    
    // Start analysis
    console.log('\n🔄 Queuing articles for analysis...');
    const startTime = Date.now();
    
    const result = await keishaIntegration.analyzePendingArticles(limit);
    
    console.log(`✅ Queued ${result.queued} articles for analysis`);
    console.log(`📋 Total in queue: ${result.total_in_queue}`);
    
    if (result.queued > 0) {
      console.log('\n⏳ Processing analysis queue...');
      
      // Monitor progress
      let lastQueueLength = result.total_in_queue;
      const progressInterval = setInterval(async () => {
        try {
          const status = keishaIntegration.getQueueStatus();
          if (status.queue_length !== lastQueueLength) {
            const processed = lastQueueLength - status.queue_length;
            console.log(`   Processed: ${processed}, Remaining: ${status.queue_length}`);
            lastQueueLength = status.queue_length;
          }
          
          if (status.queue_length === 0 && !status.is_processing) {
            clearInterval(progressInterval);
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`\n🎉 Analysis completed in ${duration} seconds!`);
            
            // Show final statistics
            await showFinalStats(keishaIntegration);
            process.exit(0);
          }
        } catch (error) {
          console.error('Error monitoring progress:', error.message);
        }
      }, 5000); // Check every 5 seconds
      
      // Set timeout to prevent hanging
      setTimeout(() => {
        clearInterval(progressInterval);
        console.log('\n⏰ Analysis timeout reached. Some articles may still be processing.');
        console.log('   Check the queue status with: curl http://localhost:3002/api/fns/keisha/status');
        process.exit(0);
      }, 300000); // 5 minute timeout
      
    } else {
      console.log('\n✨ No articles pending analysis!');
      await showFinalStats(keishaIntegration);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check Keisha AI service is running');
    console.error('2. Verify database connection');
    console.error('3. Check API rate limits');
    process.exit(1);
  }
}

async function showFinalStats(keishaIntegration) {
  try {
    console.log('\n📈 Final Statistics:');
    
    // Get database stats
    const [stats] = await keishaIntegration.pool.execute(`
      SELECT 
        COUNT(*) as total_articles,
        COUNT(CASE WHEN analysis_status = 'completed' THEN 1 END) as analyzed,
        COUNT(CASE WHEN analysis_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN analysis_status = 'failed' THEN 1 END) as failed,
        AVG(CASE WHEN analysis_status = 'completed' THEN severity_score END) as avg_severity
      FROM fns_articles
    `);
    
    const stat = stats[0];
    console.log(`   - Total Articles: ${stat.total_articles}`);
    console.log(`   - Analyzed: ${stat.analyzed}`);
    console.log(`   - Pending: ${stat.pending}`);
    console.log(`   - Failed: ${stat.failed}`);
    console.log(`   - Avg Severity: ${stat.avg_severity?.toFixed(1) || 'N/A'}`);
    
    // Get recent analysis results
    const [recent] = await keishaIntegration.pool.execute(`
      SELECT 
        a.title,
        k.bias_score,
        k.analyzed_at
      FROM fns_articles a
      JOIN fns_keisha_analysis k ON a.id = k.article_id
      ORDER BY k.analyzed_at DESC
      LIMIT 3
    `);
    
    if (recent.length > 0) {
      console.log('\n🔍 Recent Analysis Results:');
      recent.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title.substring(0, 60)}...`);
        console.log(`      Bias Score: ${article.bias_score}`);
        console.log(`      Analyzed: ${new Date(article.analyzed_at).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error getting final stats:', error.message);
  }
}

// Show help
function showHelp() {
  console.log('FNS Keisha Analysis Script\n');
  console.log('Usage: npm run analyze:pending [options]\n');
  console.log('Options:');
  console.log('  --limit N          Number of articles to analyze (default: 10)');
  console.log('  --help             Show this help message\n');
  console.log('Examples:');
  console.log('  npm run analyze:pending');
  console.log('  npm run analyze:pending -- --limit 25');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  analyzePending();
}

module.exports = analyzePending;
