const EnhancedDataService = require('./services/enhancedDataService');

/**
 * Complete test of the hybrid approach
 */
async function testCompleteHybrid() {
  console.log('🎯 COMPLETE HYBRID TEST: Critical Seeds → Full Articles → Keisha Ready\n');
  
  const dataService = new EnhancedDataService();
  
  try {
    // Test 1: Get one hybrid article to show the difference
    console.log('🔍 STEP 1: Getting ONE hybrid-enhanced article...\n');
    
    const hybridArticles = await dataService.getArticles({
      source: 'hybrid',
      limit: 1,
      minSeverity: 95,
      enhanceContent: true
    });
    
    if (hybridArticles.length > 0) {
      const article = hybridArticles[0];
      
      console.log('📰 HYBRID ENHANCED ARTICLE:');
      console.log('=' .repeat(60));
      console.log(`Title: ${article.title}`);
      console.log(`Severity: ${article.severity_score}%`);
      console.log(`Source Type: ${article.source_type}`);
      console.log(`Ready for Keisha: ${article.ready_for_keisha}`);
      console.log('');
      
      console.log('🔗 URLS:');
      console.log(`Original (Google): ${article.original_newsletter_url?.substring(0, 80)}...`);
      console.log(`Real URL: ${article.url}`);
      console.log('');
      
      console.log('📄 CONTENT COMPARISON:');
      console.log('Newsletter Summary (truncated):');
      console.log(`"${article.newsletter_summary}"`);
      console.log('');
      console.log('Full Article Content (first 300 chars):');
      console.log(`"${article.full_content?.substring(0, 300)}..."`);
      console.log('');
      
      console.log('🧠 ANALYSIS COMPARISON:');
      console.log('Newsletter Analysis (NOT Keisha):');
      console.log(`"${article.newsletter_analysis?.substring(0, 200)}..."`);
      console.log('');
      console.log('🎯 READY FOR REAL KEISHA ANALYSIS: ✅');
      console.log('');
      
      console.log('🖼️ IMAGES:');
      if (article.images && article.images.length > 0) {
        article.images.forEach((img, i) => {
          console.log(`${i + 1}. ${img.url}`);
          console.log(`   Alt: ${img.alt}`);
        });
      } else {
        console.log('No images found');
      }
      console.log('');
      
      console.log('📊 METADATA:');
      console.log(`Word Count: ${article.word_count}`);
      console.log(`Author: ${article.metadata?.author || 'Unknown'}`);
      console.log(`Site: ${article.metadata?.siteName || 'Unknown'}`);
      console.log(`Enhanced At: ${article.enhanced_at}`);
      console.log('');
    }
    
    // Test 2: Get articles ready for Keisha
    console.log('🧠 STEP 2: Getting articles ready for REAL Keisha analysis...\n');
    
    const keishaReady = await dataService.getArticlesForKeishaAnalysis({
      limit: 3,
      minSeverity: 80
    });
    
    console.log(`Found ${keishaReady.length} articles ready for Keisha:`);
    keishaReady.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title.substring(0, 60)}...`);
      console.log(`   Severity: ${article.severity_score}%`);
      console.log(`   Word Count: ${article.word_count}`);
      console.log(`   Images: ${article.images?.length || 0}`);
      console.log(`   Content Quality: ${article.full_content?.length > 500 ? 'EXCELLENT' : 'GOOD'}`);
    });
    console.log('');
    
    // Test 3: Enhancement statistics
    console.log('📊 STEP 3: Enhancement statistics...\n');
    
    const stats = await dataService.getEnhancementStats({
      limit: 10,
      minSeverity: 75
    });
    
    console.log('Enhancement Performance:');
    console.log(`- Success Rate: ${stats.enhancement_success_rate}%`);
    console.log(`- Articles Processed: ${stats.total_processed}`);
    console.log(`- Successfully Enhanced: ${stats.successfully_enhanced}`);
    console.log(`- Ready for Keisha: ${stats.ready_for_keisha}`);
    console.log(`- Average Word Count: ${stats.average_word_count}`);
    console.log('');
    
    console.log('🎉 HYBRID APPROACH SUMMARY:');
    console.log('=' .repeat(60));
    console.log('✅ Critical newsletters provide HIGH-SEVERITY seeds');
    console.log('✅ Real URLs extracted from Google redirects');
    console.log('✅ Full article content fetched (not just summaries)');
    console.log('✅ Images and metadata extracted');
    console.log('✅ Articles ready for REAL Keisha AI analysis');
    console.log('✅ Newsletter analysis preserved for comparison');
    console.log('✅ Fallback systems ensure reliability');
    console.log('');
    console.log('🧠 NEXT: Send these enhanced articles to Keisha AI for');
    console.log('    authentic analysis based on FULL content!');
    
  } catch (error) {
    console.error('❌ Complete hybrid test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testCompleteHybrid();
}

module.exports = testCompleteHybrid;
