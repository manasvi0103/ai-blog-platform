// scripts/testWordPressConfig.js
require('dotenv').config();

console.log('🔍 WordPress Environment Configuration Check:');
console.log('='.repeat(50));

const config = {
  WORDPRESS_URL: process.env.WORDPRESS_URL || 'NOT SET',
  WORDPRESS_USERNAME: process.env.WORDPRESS_USERNAME || 'NOT SET', 
  WORDPRESS_PASSWORD: process.env.WORDPRESS_PASSWORD || 'NOT SET',
  WORDPRESS_API_ENDPOINT: process.env.WORDPRESS_API_ENDPOINT || 'NOT SET',
  WORDPRESS_API_USERNAME: process.env.WORDPRESS_API_USERNAME || 'NOT SET',
  WORDPRESS_API_PASSWORD: process.env.WORDPRESS_API_PASSWORD || 'NOT SET'
};

Object.entries(config).forEach(([key, value]) => {
  const status = value === 'NOT SET' ? '❌' : '✅';
  const displayValue = value === 'NOT SET' ? 'NOT SET' : 
                      key.includes('PASSWORD') ? '*'.repeat(8) : value;
  console.log(`${status} ${key}: ${displayValue}`);
});

console.log('='.repeat(50));

// Test the WordPress service directly
async function testWordPressService() {
  try {
    const wordpressService = require('../services/wordpressService');
    
    console.log('\n🔄 Testing WordPress Service...');
    
    // Test with no company ID (should use environment variables)
    const result = await wordpressService.testConnection(null);
    
    console.log('\n📊 Test Results:');
    console.log('Overall Success:', result.overall?.success ? '✅' : '❌');
    console.log('Method Used:', result.overall?.method || 'none');
    
    if (result.n8n) {
      console.log('N8N Status:', result.n8n.success ? '✅' : '❌');
      if (!result.n8n.success) console.log('N8N Error:', result.n8n.error);
    }
    
    if (result.direct) {
      console.log('Direct API Status:', result.direct.success ? '✅' : '❌');
      if (!result.direct.success) {
        console.log('Direct API Error:', result.direct.error);
        console.log('Error Details:', result.direct.details);
      } else {
        console.log('User Info:', result.direct.userInfo?.name || 'No user info');
        console.log('API Info:', result.direct.apiInfo?.version || 'No API info');
      }
    }
    
  } catch (error) {
    console.error('❌ WordPress Service Test Failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testWordPressService();
}

module.exports = { testWordPressService };