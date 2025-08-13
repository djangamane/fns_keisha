#!/usr/bin/env node

/**
 * Database Initialization Script for FNS
 * Sets up the database schema and initial data
 */

require('dotenv').config();
const FNSNewsService = require('../services/fnsNewsService');

async function initializeDatabase() {
  console.log('🗄️  Initializing FNS Database...\n');
  
  const newsService = new FNSNewsService();
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await newsService.pool.execute('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Initialize schema
    console.log('🏗️  Creating database schema...');
    await newsService.initializeDatabase();
    console.log('✅ Database schema created successfully\n');
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const [tables] = await newsService.pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'fns_%'
    `, [process.env.DB_NAME || 'fns_database']);
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    // Get initial statistics
    console.log('\n📊 Database Statistics:');
    const stats = await newsService.getDashboardStats();
    console.log(`   - Total Articles: ${stats.total_articles}`);
    console.log(`   - Analyzed Articles: ${stats.analyzed_articles}`);
    console.log(`   - Pending Articles: ${stats.pending_articles}`);
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run import:news');
    console.log('2. Run: npm run analyze:pending');
    console.log('3. Start the server: npm start');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your database connection settings in .env');
    console.error('2. Ensure MySQL/MariaDB is running');
    console.error('3. Verify database user has CREATE privileges');
    process.exit(1);
  } finally {
    await newsService.pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
