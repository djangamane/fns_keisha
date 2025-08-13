const EnhancedDataService = require('./services/enhancedDataService');

/**
 * Test script for critical newsletter import
 */
async function testCriticalImport() {
  console.log('🧪 Testing Critical Newsletter Import\n');
  
  const dataService = new EnhancedDataService();
  
  try {
    // Test 1: Check data source status
    console.log('📊 Testing data source status...');
    const status = await dataService.getDataSourceStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    console.log('');
    
    // Test 2: Get critical articles
    console.log('🎯 Testing critical article import...');
    const criticalArticles = await dataService.getArticles({
      source: 'critical',
      limit: 5,
      minSeverity: 70
    });
    
    console.log(`Found ${criticalArticles.length} critical articles:`);
    criticalArticles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`);
      console.log(`   Severity: ${article.severity_score}%`);
      console.log(`   Keyword: ${article.keyword}`);
      console.log(`   Date: ${article.date}`);
      console.log(`   URL: ${article.url}`);
      if (article.keisha_analysis) {
        console.log(`   Analysis: ${article.keisha_analysis.substring(0, 100)}...`);
      }
    });
    console.log('');
    
    // Test 3: Get daily summary
    console.log('📈 Testing daily summary...');
    const summary = await dataService.getDailySummary();
    console.log('Summary:', JSON.stringify(summary, null, 2));
    console.log('');
    
    // Test 4: Test fallback to local
    console.log('📁 Testing local fallback...');
    const localArticles = await dataService.getArticles({
      source: 'local',
      limit: 3
    });
    console.log(`Found ${localArticles.length} local articles`);
    console.log('');
    
    // Test 5: Test auto mode (primary strategy)
    console.log('🚀 Testing auto mode (production strategy)...');
    const autoArticles = await dataService.getArticles({
      source: 'auto',
      limit: 10,
      minSeverity: 75
    });
    
    console.log(`Auto mode returned ${autoArticles.length} articles`);
    if (autoArticles.length > 0) {
      console.log('Sample article:');
      const sample = autoArticles[0];
      console.log(`- Title: ${sample.title}`);
      console.log(`- Severity: ${sample.severity_score}%`);
      console.log(`- Source: ${sample.source_type || 'unknown'}`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testCriticalImport();
}

module.exports = testCriticalImport;
