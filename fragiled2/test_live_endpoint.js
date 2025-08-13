const axios = require('axios');

async function testLiveEndpoint() {
  console.log('🧪 Testing live FNS endpoint...');
  
  try {
    // Test the live data endpoint
    console.log('\n🔴 Testing live data endpoint...');
    
    const response = await axios.get('http://localhost:3002/api/fns/data/hybrid', {
      params: {
        useLiveData: 'true',
        limit: 2,
        minSeverity: 40
      },
      timeout: 45000
    });
    
    console.log('✅ Response received!');
    console.log('Success:', response.data.success);
    console.log('Source:', response.data.source);
    console.log('Count:', response.data.count);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📰 Articles received:');
      
      response.data.data.forEach((article, index) => {
        console.log(`\n📄 Article ${index + 1}:`);
        console.log(`   Title: ${article.title}`);
        console.log(`   Severity: ${article.severity_score}%`);
        console.log(`   Images: ${article.hasImages ? 'Yes' : 'No'}`);
        console.log(`   Date: ${article.displayDate}`);
        console.log(`   Source: ${article.source_type}`);
        console.log(`   Analysis: ${article.keisha_analysis ? article.keisha_analysis.substring(0, 80) + '...' : 'None'}`);
        
        if (article.images && article.images.length > 0) {
          console.log(`   Image URL: ${article.images[0].url}`);
        }
      });
      
      // Check if we got live data or cached data
      const isLiveData = response.data.source === 'live_keisha_direct';
      const hasImages = response.data.data.some(article => article.hasImages);
      const hasCurrentDate = response.data.data.some(article => 
        article.displayDate === new Date().toISOString().split('T')[0]
      );
      
      console.log('\n🔍 Data Analysis:');
      console.log(`   Live Data: ${isLiveData ? '✅ YES' : '❌ NO (cached)'}`);
      console.log(`   Has Images: ${hasImages ? '✅ YES' : '❌ NO'}`);
      console.log(`   Current Date: ${hasCurrentDate ? '✅ YES' : '❌ NO'}`);
      
      if (isLiveData && hasImages && hasCurrentDate) {
        console.log('\n🎉 SUCCESS! Live data with images is working!');
      } else {
        console.log('\n⚠️  Still using cached data. Server may need restart.');
      }
      
    } else {
      console.log('❌ No articles received');
    }
    
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
  testLiveEndpoint()
    .then(() => {
      console.log('\n✅ Live endpoint test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Live endpoint test failed:', error.message);
      process.exit(1);
    });
}

module.exports = testLiveEndpoint;
