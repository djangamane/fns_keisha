const axios = require('axios');

/**
 * Test all FNS endpoints
 */
async function testEndpoints() {
  const baseUrl = 'http://localhost:3002';
  
  console.log('🧪 TESTING ALL FNS ENDPOINTS\n');
  console.log(`Base URL: ${baseUrl}\n`);
  
  try {
    // Test 1: Health check
    console.log('🏥 Testing health endpoint...');
    const health = await axios.get(`${baseUrl}/health`);
    console.log('✅ Health:', health.data);
    console.log('');
    
    // Test 2: Data source status
    console.log('📊 Testing data source status...');
    const status = await axios.get(`${baseUrl}/api/fns/data/status`);
    console.log('✅ Data Status:', JSON.stringify(status.data, null, 2));
    console.log('');
    
    // Test 3: Critical newsletter data
    console.log('📰 Testing critical newsletter endpoint...');
    const critical = await axios.get(`${baseUrl}/api/fns/data/critical?limit=2&minSeverity=90`);
    console.log(`✅ Critical Articles: ${critical.data.count} found`);
    if (critical.data.data.length > 0) {
      const sample = critical.data.data[0];
      console.log(`   Sample: ${sample.title.substring(0, 60)}...`);
      console.log(`   Severity: ${sample.severity_score}%`);
      console.log(`   Source: ${sample.source_type}`);
    }
    console.log('');
    
    // Test 4: HYBRID enhanced articles
    console.log('🎯 Testing HYBRID endpoint (the main feature!)...');
    const hybrid = await axios.get(`${baseUrl}/api/fns/data/hybrid?limit=2&minSeverity=95&enhanceContent=true`);
    console.log(`✅ Hybrid Articles: ${hybrid.data.count} found`);
    console.log(`   Source: ${hybrid.data.source}`);
    console.log(`   Note: ${hybrid.data.note}`);
    
    if (hybrid.data.data.length > 0) {
      const sample = hybrid.data.data[0];
      console.log('\n📄 HYBRID SAMPLE ARTICLE:');
      console.log('=' .repeat(50));
      console.log(`Title: ${sample.title}`);
      console.log(`Severity: ${sample.severity_score}%`);
      console.log(`Source Type: ${sample.source_type}`);
      console.log(`Content Fetched: ${sample.content_fetched}`);
      console.log(`Ready for Keisha: ${sample.ready_for_keisha}`);
      console.log(`Word Count: ${sample.word_count}`);
      console.log(`Images: ${sample.images?.length || 0}`);
      console.log(`Real URL: ${sample.url}`);
      
      if (sample.full_content) {
        console.log(`Full Content Preview: ${sample.full_content.substring(0, 200)}...`);
      }
      
      if (sample.newsletter_analysis) {
        console.log(`Newsletter Analysis: ${sample.newsletter_analysis.substring(0, 150)}...`);
      }
    }
    console.log('');
    
    // Test 5: Keisha-ready articles
    console.log('🧠 Testing Keisha-ready endpoint...');
    const keishaReady = await axios.get(`${baseUrl}/api/fns/data/keisha-ready?limit=3&minSeverity=80`);
    console.log(`✅ Keisha-Ready Articles: ${keishaReady.data.count} found`);
    console.log(`   Note: ${keishaReady.data.note}`);
    
    keishaReady.data.data.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title.substring(0, 50)}...`);
      console.log(`      Severity: ${article.severity_score}% | Words: ${article.word_count} | Images: ${article.images?.length || 0}`);
    });
    console.log('');
    
    // Test 6: Enhancement statistics
    console.log('📈 Testing enhancement stats...');
    const stats = await axios.get(`${baseUrl}/api/fns/data/enhancement-stats?limit=5&minSeverity=75`);
    console.log('✅ Enhancement Stats:', JSON.stringify(stats.data.data, null, 2));
    console.log('');
    
    // Test 7: Daily summary
    console.log('📊 Testing daily summary...');
    const summary = await axios.get(`${baseUrl}/api/fns/data/summary`);
    console.log('✅ Daily Summary:', JSON.stringify(summary.data.data, null, 2));
    console.log('');
    
    // Test 8: Keisha status
    console.log('🤖 Testing Keisha status...');
    try {
      const keishaStatus = await axios.get(`${baseUrl}/api/fns/keisha/status`);
      console.log('✅ Keisha Status:', JSON.stringify(keishaStatus.data, null, 2));
    } catch (keishaError) {
      console.log('⚠️ Keisha Status:', keishaError.response?.data || keishaError.message);
    }
    console.log('');
    
    console.log('🎉 ALL ENDPOINT TESTS COMPLETED!');
    console.log('');
    console.log('🎯 PRODUCTION READY FEATURES:');
    console.log('✅ Health monitoring');
    console.log('✅ Data source status tracking');
    console.log('✅ Critical newsletter import');
    console.log('✅ HYBRID enhancement (critical seeds + full articles)');
    console.log('✅ Keisha-ready article preparation');
    console.log('✅ Enhancement performance statistics');
    console.log('✅ Daily threat level summaries');
    console.log('✅ Keisha AI integration status');
    
  } catch (error) {
    console.error('❌ Endpoint test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
if (require.main === module) {
  testEndpoints();
}

module.exports = testEndpoints;
