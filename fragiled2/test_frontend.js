const { spawn } = require('child_process');
const path = require('path');

/**
 * Test script to start both backend and frontend
 */
async function testFrontend() {
  console.log('🎯 STARTING FULL STACK TEST\n');
  
  console.log('📋 INSTRUCTIONS:');
  console.log('1. Make sure your backend is running: node server.js');
  console.log('2. Navigate to frontend directory: cd frontend');
  console.log('3. Install dependencies: npm install');
  console.log('4. Start frontend: npm start');
  console.log('5. Open browser to: http://localhost:3000');
  console.log('');
  
  console.log('🎯 FRONTEND FEATURES TO TEST:');
  console.log('✅ Matrix-themed UI with animated background');
  console.log('✅ Threat Level Dashboard with real-time stats');
  console.log('✅ Hybrid Article Cards showing full content vs newsletter summaries');
  console.log('✅ Enhancement performance metrics');
  console.log('✅ Data source status indicators');
  console.log('✅ Keisha analysis readiness status');
  console.log('✅ Severity filtering and source selection');
  console.log('✅ Image galleries from enhanced articles');
  console.log('✅ Content quality indicators');
  console.log('✅ Real-time system status monitoring');
  console.log('');
  
  console.log('🔗 API ENDPOINTS BEING USED:');
  console.log('- GET /api/fns/data/hybrid (main hybrid articles)');
  console.log('- GET /api/fns/data/status (data source status)');
  console.log('- GET /api/fns/data/summary (daily threat assessment)');
  console.log('- GET /api/fns/data/enhancement-stats (performance metrics)');
  console.log('- GET /api/fns/data/keisha-ready (articles ready for analysis)');
  console.log('- POST /api/fns/keisha/analyze-hybrid (trigger analysis)');
  console.log('');
  
  console.log('🎪 WHAT YOU\'LL SEE:');
  console.log('1. Matrix rain background animation');
  console.log('2. System status header with real-time indicators');
  console.log('3. Threat level dashboard showing CRITICAL status');
  console.log('4. Filter controls for severity and data source');
  console.log('5. Enhanced article cards with:');
  console.log('   - Threat level indicators (color-coded)');
  console.log('   - Enhancement status badges');
  console.log('   - Image galleries');
  console.log('   - Content comparison (newsletter vs full article)');
  console.log('   - Analysis status (newsletter vs Keisha ready)');
  console.log('   - Word count and quality metrics');
  console.log('6. Performance statistics');
  console.log('7. Keisha analysis trigger button');
  console.log('');
  
  console.log('🚀 READY TO START FRONTEND!');
  console.log('');
  console.log('Run these commands:');
  console.log('cd frontend');
  console.log('npm install');
  console.log('npm start');
}

// Run the instructions
if (require.main === module) {
  testFrontend();
}

module.exports = testFrontend;
