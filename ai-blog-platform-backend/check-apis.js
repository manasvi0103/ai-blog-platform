// check-apis.js - Quick diagnostic tool for API configuration
require('dotenv').config();

async function checkAPIConfiguration() {
  console.log('🔍 Checking News API Configuration...\n');

  // Check environment variables
  console.log('1. Environment Variables:');
  const apis = {
    'GNEWS_API_KEY': process.env.GNEWS_API_KEY,
    'NEWSDATA_API_KEY': process.env.NEWSDATA_API_KEY,
    'RAPIDAPI_KEY': process.env.RAPIDAPI_KEY,
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY
  };

  Object.entries(apis).forEach(([key, value]) => {
    if (value) {
      console.log(`   ✅ ${key}: Set (${value.substring(0, 8)}...)`);
    } else {
      console.log(`   ❌ ${key}: Not set`);
    }
  });

  // Test individual APIs
  console.log('\n2. Testing Individual APIs:');
  
  const trendService = require('./services/trendService');
  
  // Test GNews
  console.log('\n   📰 Testing GNews API:');
  try {
    if (!process.env.GNEWS_API_KEY) {
      console.log('   ❌ GNews API key not configured');
    } else {
      const gnewsData = await trendService.fetchTrendData('solar energy', 'gnews', 2);
      console.log(`   ✅ GNews: ${gnewsData.length} articles fetched`);
      if (gnewsData.length > 0) {
        console.log(`   📄 Sample: "${gnewsData[0].title}"`);
      }
    }
  } catch (error) {
    console.log(`   ❌ GNews Error: ${error.message}`);
  }

  // Test NewsData
  console.log('\n   📊 Testing NewsData API:');
  try {
    if (!process.env.NEWSDATA_API_KEY) {
      console.log('   ❌ NewsData API key not configured');
    } else {
      const newsdataData = await trendService.fetchTrendData('solar energy', 'newsdata', 2);
      console.log(`   ✅ NewsData: ${newsdataData.length} articles fetched`);
      if (newsdataData.length > 0) {
        console.log(`   📄 Sample: "${newsdataData[0].title}"`);
      }
    }
  } catch (error) {
    console.log(`   ❌ NewsData Error: ${error.message}`);
  }

  // Test RapidAPI
  console.log('\n   ⚡ Testing RapidAPI:');
  try {
    if (!process.env.RAPIDAPI_KEY) {
      console.log('   ❌ RapidAPI key not configured');
    } else {
      const rapidData = await trendService.fetchTrendData('solar energy', 'rapidapi', 2);
      console.log(`   ✅ RapidAPI: ${rapidData.length} articles fetched`);
      if (rapidData.length > 0) {
        console.log(`   📄 Sample: "${rapidData[0].title}"`);
      }
    }
  } catch (error) {
    console.log(`   ❌ RapidAPI Error: ${error.message}`);
  }

  // Test combined fetch
  console.log('\n3. Testing Combined Fetch:');
  try {
    const allData = await trendService.fetchTrendData('solar energy', 'all', 6);
    console.log(`   ✅ Combined: ${allData.length} total articles from all sources`);
    
    if (allData.length > 0) {
      console.log('\n   📋 Sample Articles:');
      allData.slice(0, 3).forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}" (${article.source || 'unknown source'})`);
        console.log(`      🔗 ${article.url || 'No URL'}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Combined fetch error: ${error.message}`);
  }

  // Recommendations
  console.log('\n4. Recommendations:');
  
  const missingKeys = Object.entries(apis).filter(([key, value]) => !value && key !== 'GEMINI_API_KEY');
  
  if (missingKeys.length > 0) {
    console.log('   📝 Missing API Keys:');
    missingKeys.forEach(([key]) => {
      console.log(`   - Add ${key} to your .env file`);
    });
    console.log('\n   📖 See NEWS_API_SETUP.md for detailed setup instructions');
  } else {
    console.log('   ✅ All API keys are configured!');
  }

  if (!process.env.GEMINI_API_KEY) {
    console.log('   ⚠️ GEMINI_API_KEY is required for content generation');
  }

  console.log('\n🎯 Quick Setup Links:');
  console.log('   • GNews: https://gnews.io/');
  console.log('   • NewsData: https://newsdata.io/');
  console.log('   • RapidAPI: https://rapidapi.com/');
  
  console.log('\n✨ Once all APIs are configured, your blog will have real reference links!');
}

// Run the check
checkAPIConfiguration().catch(console.error);
