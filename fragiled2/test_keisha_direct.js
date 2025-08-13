const axios = require('axios');

async function testKeishaDirectConnection() {
  console.log('🧪 Testing direct Keisha connection...');
  
  try {
    // Test 1: Health check
    console.log('\n📊 Step 1: Testing Keisha health...');
    const healthResponse = await axios.get('http://localhost:3001/api/health', {
      timeout: 5000
    });
    console.log('✅ Keisha health:', healthResponse.data);
    
    // Test 2: Bias analysis status
    console.log('\n📊 Step 2: Testing bias analysis status...');
    const statusResponse = await axios.get('http://localhost:3001/api/bias-analysis/status', {
      timeout: 5000
    });
    console.log('✅ Bias analysis status:', statusResponse.data);
    
    // Test 3: Analyze sample article
    console.log('\n🤖 Step 3: Testing bias analysis...');
    const analysisResponse = await axios.post(
      'http://localhost:3001/api/bias-analysis/analyze',
      {
        article_text: "Government officials announced significant policy changes today that could impact millions of Americans. The new regulations focus on economic reforms and social justice initiatives. Critics argue the changes don't go far enough, while supporters claim they represent meaningful progress toward equality.",
        article_title: "Policy Changes Announced",
        article_url: "https://example.com/test"
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );
    
    console.log('✅ Analysis successful!');
    console.log('Score:', analysisResponse.data.analysis?.score || 'N/A');
    console.log('Detected terms:', analysisResponse.data.analysis?.detected_terms?.length || 0);
    
    // Test 4: Create live article with analysis
    console.log('\n📰 Step 4: Creating live article...');
    const analysisData = analysisResponse.data.analysis || analysisResponse.data.data;
    const biasScore = analysisData.score || 50;
    
    let analysis = 'Live Keisha AI analysis completed';
    if (analysisData.detected_terms && analysisData.detected_terms.length > 0) {
      const terms = analysisData.detected_terms.map(term => 
        `• ${term.term}: ${term.rationale}`
      ).join('\n');
      analysis = `Live Keisha AI Analysis (Score: ${biasScore}/100)\n\nDetected Issues:\n${terms}`;
    }
    
    const liveArticle = {
      id: `live-${Date.now()}`,
      title: "Policy Changes Announced",
      url: "https://example.com/test",
      content: "Government officials announced significant policy changes today...",
      summary: "New policy changes announced with focus on reforms",
      keyword: 'live analysis',
      severity_score: biasScore,
      date: new Date().toISOString().split('T')[0],
      images: [{ url: "https://via.placeholder.com/800x400/0066cc/ffffff?text=Live+News", alt: "Live News" }],
      hasImages: true,
      featured_image: "https://via.placeholder.com/800x400/0066cc/ffffff?text=Live+News",
      keisha_analysis: analysis,
      bias_score: biasScore,
      source_type: 'live_keisha_direct',
      content_fetched: true,
      analysis_status: 'completed',
      displayDate: new Date().toISOString().split('T')[0],
      imported_at: new Date().toISOString()
    };
    
    console.log('✅ Live article created:');
    console.log(`   Title: ${liveArticle.title}`);
    console.log(`   Severity: ${liveArticle.severity_score}%`);
    console.log(`   Images: ${liveArticle.hasImages ? 'Yes' : 'No'}`);
    console.log(`   Analysis: ${liveArticle.keisha_analysis.substring(0, 80)}...`);
    console.log(`   Source: ${liveArticle.source_type}`);
    
    console.log('\n🎉 All tests passed! Keisha connection is working perfectly!');
    return liveArticle;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testKeishaDirectConnection()
    .then(() => {
      console.log('\n✅ Direct Keisha test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Direct Keisha test failed:', error.message);
      process.exit(1);
    });
}

module.exports = testKeishaDirectConnection;
