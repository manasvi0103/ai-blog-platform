// __tests__/services.test.js
const geminiService = require('../services/geminiService');
const trendService = require('../services/trendService');

describe('Services', () => {
  describe('Gemini Service', () => {
    test('should build contextual prompt', () => {
      const prompt = 'Write about solar panels';
      const context = {
        name: 'WattMonk',
        tone: 'professional',
        brandVoice: 'Expert and reliable'
      };

      const contextualPrompt = geminiService.buildContextualPrompt(prompt, context);
      
      expect(contextualPrompt).toContain('Company: WattMonk');
      expect(contextualPrompt).toContain('Tone: professional');
      expect(contextualPrompt).toContain('Write about solar panels');
    });

    test('should extract keywords from text', () => {
      const text = 'Solar panels are great for renewable energy and solar power generation';
      const keywords = geminiService.extractKeywords(text);
      
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords).toContain('solar');
    });
  });

  describe('Trend Service', () => {
    test('should calculate relevance score', () => {
      const text = 'Solar panel installation costs and solar energy benefits';
      const keyword = 'solar panel';
      
      const score = trendService.calculateRelevanceScore(text, keyword);
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

// scripts/testConnection.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function testDatabaseConnection() {
  try {
    console.log('🔗 Testing MongoDB connection...');
    console.log('Connection URI:', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':****@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Database name:', mongoose.connection.name);
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure MongoDB is running locally');
      console.log('2. Check if MongoDB service is started');
      console.log('3. Verify the connection URI in .env file');
      console.log('4. For MongoDB Atlas, check network access settings');
    }
    
    process.exit(1);
  }
}

testDatabaseConnection();

// scripts/testAPIs.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function testExternalAPIs() {
  console.log('🔗 Testing external API connections...\n');

  // Test Gemini API
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      console.log('Testing Gemini API...');
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: 'Say hello in one word'
            }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      console.log('✅ Gemini API: Connected successfully');
      console.log('Response:', response.data.candidates[0].content.parts[0].text.trim());
    } catch (error) {
      console.log('❌ Gemini API: Failed');
      console.log('Error:', error.response?.data?.error?.message || error.message);
    }
  } else {
    console.log('⚠️  Gemini API: Not configured (update GEMINI_API_KEY in .env)');
  }

  // Test GNews API
  if (process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== 'your_gnews_api_key_here') {
    try {
      console.log('\nTesting GNews API...');
      const response = await axios.get('https://gnews.io/api/v4/search', {
        params: {
          q: 'technology',
          token: process.env.GNEWS_API_KEY,
          lang: 'en',
          max: 1
        },
        timeout: 10000
      });
      console.log('✅ GNews API: Connected successfully');
      console.log('Articles found:', response.data.totalArticles);
    } catch (error) {
      console.log('❌ GNews API: Failed');
      console.log('Error:', error.response?.data?.errors?.[0] || error.message);
    }
  } else {
    console.log('⚠️  GNews API: Not configured (update GNEWS_API_KEY in .env)');
  }

  // Test NewsData API
  if (process.env.NEWSDATA_API_KEY && process.env.NEWSDATA_API_KEY !== 'your_newsdata_api_key_here') {
    try {
      console.log('\nTesting NewsData API...');
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: process.env.NEWSDATA_API_KEY,
          q: 'technology',
          language: 'en',
          size: 1
        },
        timeout: 10000
      });
      console.log('✅ NewsData API: Connected successfully');
      console.log('Articles found:', response.data.totalResults);
    } catch (error) {
      console.log('❌ NewsData API: Failed');
      console.log('Error:', error.response?.data?.results?.message || error.message);
    }
  } else {
    console.log('⚠️  NewsData API: Not configured (update NEWSDATA_API_KEY in .env)');
  }

  console.log('\n🎉 API testing completed!');
  console.log('\n💡 To configure missing APIs:');
  console.log('1. Get API keys from respective providers');
  console.log('2. Update the .env file with actual keys');
  console.log('3. Run this test again to verify connections');
}

testAPIs().catch(console.error);

// scripts/quickStart.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('../models/Company');
const BlogData = require('../models/BlogData');
const Keyword = require('../models/Keyword');

dotenv.config();

async function quickStart() {
  try {
    console.log('🚀 Quick Start: Setting up AI Blog Platform Backend\n');

    // Connect to database
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check existing data
    const existingCompanies = await Company.countDocuments();
    const existingBlogs = await BlogData.countDocuments();
    const existingKeywords = await Keyword.countDocuments();

    console.log('📊 Current Database Status:');
    console.log(`   Companies: ${existingCompanies}`);
    console.log(`   Blogs: ${existingBlogs}`);
    console.log(`   Keywords: ${existingKeywords}\n`);

    if (existingCompanies === 0) {
      console.log('2. Creating sample company...');
      const sampleCompany = await Company.create({
        name: 'Demo Company',
        servicesOffered: [
          { name: 'Content Marketing', description: 'Professional content creation' },
          { name: 'SEO Services', description: 'Search engine optimization' }
        ],
        serviceOverview: 'We provide comprehensive digital marketing services including content creation and SEO optimization.',
        aboutCompany: 'A leading digital marketing agency specializing in content-driven growth strategies.',
        tone: 'professional',
        brandVoice: 'Professional, knowledgeable, and results-oriented. We communicate with authority while remaining approachable.',
        targetAudience: ['Business owners', 'Marketing managers', 'Entrepreneurs']
      });
      console.log('✅ Sample company created:', sampleCompany.name);

      console.log('3. Creating sample blog entries...');
      const sampleBlogs = await BlogData.insertMany([
        {
          focusKeyword: 'content marketing strategy',
          articleFormat: 'guide',
          wordCount: 2000,
          targetAudience: 'Marketing professionals',
          objective: 'Educate about content marketing best practices',
          companyId: sampleCompany._id,
          priority: 1
        },
        {
          focusKeyword: 'SEO best practices',
          articleFormat: 'listicle',
          wordCount: 1500,
          targetAudience: 'Business owners',
          objective: 'Generate leads for SEO services',
          companyId: sampleCompany._id,
          priority: 2
        }
      ]);
      console.log(`✅ Created ${sampleBlogs.length} sample blog entries`);

      console.log('4. Adding sample keywords...');
      const sampleKeywords = await Keyword.insertMany([
        {
          keyword: 'content marketing',
          searchVolume: 8100,
          difficulty: 72,
          competition: 'high',
          relatedKeywords: ['content strategy', 'content creation', 'digital marketing']
        },
        {
          keyword: 'SEO optimization',
          searchVolume: 5400,
          difficulty: 65,
          competition: 'high',
          relatedKeywords: ['search engine optimization', 'SEO tips', 'website optimization']
        }
      ]);
      console.log(`✅ Added ${sampleKeywords.length} sample keywords\n`);
    } else {
      console.log('✅ Database already contains data, skipping sample data creation\n');
    }

    console.log('🎉 Quick start completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Test the API: curl http://localhost:5000/health');
    console.log('3. View companies: curl http://localhost:5000/api/companies');
    console.log('4. Configure API keys in .env for full functionality');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Quick start failed:', error.message);
    process.exit(1);
  }
}

quickStart();