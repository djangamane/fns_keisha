const KeishaAnalysisIntegration = require('./services/keishaAnalysisIntegration');

async function testLiveKeishaConnection() {
  console.log('🧪 Testing live Keisha connection...');
  
  const keishaIntegration = new KeishaAnalysisIntegration();
  
  try {
    // Test 1: Check if we can get sample articles
    console.log('\n📰 Step 1: Testing sample article generation...');
    const sampleArticles = keishaIntegration.generateSampleCurrentArticles(2);
    console.log(`✅ Generated ${sampleArticles.length} sample articles`);
    console.log('Sample article:', sampleArticles[0].title);
    
    // Test 2: Test bias analysis with sample content
    console.log('\n🤖 Step 2: Testing Keisha bias analysis...');
    const testContent = {
      content: sampleArticles[0].content,
      title: sampleArticles[0].title,
      metadata: { url: sampleArticles[0].url }
    };
    
    const analysisResult = await keishaIntegration.callKeishaBiasAPI(testContent);
    console.log('✅ Bias analysis result:', {
      bias_score: analysisResult.bias_score,
      analysis: typeof analysisResult.analysis === 'string' ?
        analysisResult.analysis.substring(0, 100) + '...' :
        JSON.stringify(analysisResult.analysis).substring(0, 100) + '...',
      indicators: analysisResult.fragility_indicators,
      euphemisms: analysisResult.euphemisms_detected,
      detected_terms: analysisResult.detected_terms?.length || 0
    });
    
    // Test 3: Test full live articles flow
    console.log('\n🔴 Step 3: Testing full live articles flow...');
    const liveArticles = await keishaIntegration.getLiveArticlesFromKeisha({
      limit: 2,
      minSeverity: 50
    });
    
    console.log(`✅ Successfully got ${liveArticles.length} live analyzed articles!`);
    
    liveArticles.forEach((article, index) => {
      console.log(`\n📄 Article ${index + 1}:`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Severity: ${article.severity_score}%`);
      console.log(`   Images: ${article.hasImages ? 'Yes' : 'No'}`);
      console.log(`   Analysis: ${article.keisha_analysis.substring(0, 80)}...`);
      console.log(`   Source: ${article.source_type}`);
    });
    
    console.log('\n🎉 All tests passed! Live Keisha integration is working!');
    return liveArticles;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testLiveKeishaConnection()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = testLiveKeishaConnection;
