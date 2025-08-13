const HybridNewsService = require('./services/hybridNewsService');
const EnhancedDataService = require('./services/enhancedDataService');

/**
 * Test script for hybrid enhancement (critical seeds + full articles)
 */
async function testHybridEnhancement() {
  console.log('🧪 Testing HYBRID Enhancement (Critical Seeds + Full Articles)\n');
  
  const hybridService = new HybridNewsService();
  const dataService = new EnhancedDataService();
  
  try {
    // Test 1: Test URL extraction
    console.log('🔗 Testing URL extraction...');
    const googleUrl = 'https://www.google.com/url?rct=j&sa=t&url=https://baptistnews.com/article/united-methodists-commitment-to-overcoming-racism-still-rising/&ct=ga&cd=CAIyHGMzM2Q0MWQxMjg3MGVkYTA6Y29tOmVuOlVTOlI&usg=AOvVaw3kfgo2pD4jEHGOD1vZ7PuE';
    const realUrl = hybridService.extractRealUrl(googleUrl);
    console.log('Google URL:', googleUrl.substring(0, 80) + '...');
    console.log('Real URL:', realUrl);
    console.log('');
    
    // Test 2: Fetch one full article
    console.log('📄 Testing full article fetch...');
    const testUrl = 'https://baptistnews.com/article/united-methodists-commitment-to-overcoming-racism-still-rising/';
    const fullArticle = await hybridService.fetchFullArticle(testUrl, 'Test Article');
    
    console.log('Article fetch result:');
    console.log(`- Success: ${fullArticle.success}`);
    console.log(`- Word count: ${fullArticle.wordCount}`);
    console.log(`- Images found: ${fullArticle.images.length}`);
    console.log(`- Content preview: ${fullArticle.content.substring(0, 200)}...`);
    if (fullArticle.images.length > 0) {
      console.log(`- Sample image: ${fullArticle.images[0].url}`);
    }
    console.log('');
    
    // Test 3: Small hybrid enhancement test (2 articles)
    console.log('🎯 Testing hybrid enhancement (2 articles)...');
    const enhancedArticles = await hybridService.enhanceCriticalArticles({
      limit: 2,
      minSeverity: 90,
      daysBack: 2,
      includeImages: true
    });
    
    console.log(`Enhanced ${enhancedArticles.length} articles:`);
    enhancedArticles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`);
      console.log(`   Severity: ${article.severity_score}%`);
      console.log(`   Content fetched: ${article.content_fetched}`);
      console.log(`   Word count: ${article.word_count || 0}`);
      console.log(`   Images: ${article.images?.length || 0}`);
      console.log(`   Ready for Keisha: ${article.ready_for_keisha}`);
      console.log(`   Real URL: ${article.url}`);
      
      if (article.full_content) {
        console.log(`   Full content preview: ${article.full_content.substring(0, 150)}...`);
      }
      
      if (article.fetch_error) {
        console.log(`   ⚠️ Fetch error: ${article.fetch_error}`);
      }
    });
    console.log('');
    
    // Test 4: Get enhancement stats
    console.log('📊 Testing enhancement statistics...');
    const stats = await hybridService.getEnhancementStats({
      limit: 5,
      minSeverity: 80,
      daysBack: 2
    });
    
    console.log('Enhancement Stats:', JSON.stringify(stats, null, 2));
    console.log('');
    
    // Test 5: Test enhanced data service integration
    console.log('🚀 Testing enhanced data service with hybrid mode...');
    const hybridArticles = await dataService.getArticles({
      source: 'hybrid',
      limit: 3,
      minSeverity: 85,
      enhanceContent: true
    });
    
    console.log(`Hybrid mode returned ${hybridArticles.length} articles:`);
    hybridArticles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title.substring(0, 60)}...`);
      console.log(`   Source: ${article.source_type}`);
      console.log(`   Severity: ${article.severity_score}%`);
      console.log(`   Has full content: ${!!article.full_content}`);
      console.log(`   Ready for Keisha: ${article.ready_for_keisha}`);
    });
    
    console.log('\n✅ Hybrid enhancement test completed!');
    console.log('\n🎯 SUMMARY:');
    console.log('- Critical newsletters provide HIGH-SEVERITY seeds');
    console.log('- Full articles are fetched for complete context');
    console.log('- Images and metadata are extracted');
    console.log('- Articles are ready for REAL Keisha analysis');
    console.log('- Fallback systems ensure reliability');
    
  } catch (error) {
    console.error('❌ Hybrid test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testHybridEnhancement();
}

module.exports = testHybridEnhancement;
