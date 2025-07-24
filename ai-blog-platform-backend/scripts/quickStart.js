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
        targetAudience: ['Business owners', 'Marketing managers', 'Entrepreneurs'],
        wordpressConfig: {
          baseUrl: 'https://demo-site.com',
          username: 'demo-user',
          appPassword: 'demo-password-change-this',
          isActive: false
        }
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
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Quick start failed:', error.message);
    process.exit(1);
  }
}

quickStart();