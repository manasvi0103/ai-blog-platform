// scripts/seedDatabase.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('../models/Company');
const BlogData = require('../models/BlogData');
const Keyword = require('../models/Keyword');

dotenv.config();

const sampleCompanies = [
  {
    name: 'WattMonk',
    servicesOffered: [
      { name: 'Solar Design', description: 'Professional solar system design services' },
      { name: 'Engineering Services', description: 'Solar engineering and consultation' },
      { name: 'Permit Services', description: 'Solar permit processing and approval' }
    ],
    serviceOverview: 'WattMonk provides comprehensive solar design, engineering, and permit services for residential and commercial solar installations.',
    aboutCompany: 'WattMonk is a leading provider of solar design and engineering services, helping solar installers and developers streamline their project workflows.',
    tone: 'professional',
    brandVoice: 'Expert, reliable, and innovation-focused. We speak with authority about solar technology while remaining approachable and solution-oriented.',
    targetAudience: ['Solar installers', 'Solar developers', 'EPC companies', 'Property owners'],
    wordpressConfig: {
      baseUrl: process.env.WATTMONK_WORDPRESS_BASE_URL || 'https://www.wattmonk.com',
      username: process.env.WATTMONK_WORDPRESS_USERNAME || '',
      appPassword: process.env.WATTMONK_WORDPRESS_APP_PASSWORD || ''
    }
  },
  {
    name: 'Ensite',
    servicesOffered: [
      { name: 'Site Survey', description: 'Professional solar site survey services' },
      { name: 'Site Assessment', description: 'Comprehensive site assessment and analysis' },
      { name: 'Project Planning', description: 'Solar project planning and optimization' }
    ],
    serviceOverview: 'Ensite specializes in solar site surveys and assessments, providing accurate data for optimal solar project planning and execution.',
    aboutCompany: 'Ensite is a specialized solar site survey and design firm dedicated to streamlining project operations for residential solar installers.',
    tone: 'professional',
    brandVoice: 'Precise, reliable, and detail-oriented. We provide accurate site data and technical expertise for successful solar installations.',
    targetAudience: ['Solar installers', 'Solar contractors', 'Project developers', 'Property owners'],
    wordpressConfig: {
      baseUrl: process.env.ENSITE_WORDPRESS_BASE_URL || 'https://ensite-website.com',
      username: process.env.ENSITE_WORDPRESS_USERNAME || '',
      appPassword: process.env.ENSITE_WORDPRESS_APP_PASSWORD || ''
    }
  }
];

const sampleBlogData = [
  {
    focusKeyword: 'solar panel installation cost',
    articleFormat: 'guide',
    wordCount: 2000,
    targetAudience: 'Homeowners considering solar',
    objective: 'Educate potential customers about solar installation costs and drive qualified leads',
    priority: 1,
    status: 'pending'
  },
  {
    focusKeyword: 'commercial solar design',
    articleFormat: 'how-to',
    wordCount: 1500,
    targetAudience: 'Solar installers and developers',
    objective: 'Establish thought leadership in commercial solar design',
    priority: 2,
    status: 'pending'
  },
  {
    focusKeyword: 'AI development best practices',
    articleFormat: 'listicle',
    wordCount: 1800,
    targetAudience: 'Software developers and tech leads',
    objective: 'Share expertise and attract enterprise clients',
    priority: 1,
    status: 'pending'
  }
];

const sampleKeywords = [
  {
    keyword: 'solar panel installation',
    searchVolume: 12000,
    difficulty: 65,
    cpc: 4.50,
    competition: 'high',
    relatedKeywords: ['solar installation cost', 'residential solar', 'solar panels for home']
  },
  {
    keyword: 'solar design software',
    searchVolume: 2400,
    difficulty: 45,
    cpc: 6.20,
    competition: 'medium',
    relatedKeywords: ['solar design tools', 'PV design', 'solar system design']
  },
  {
    keyword: 'AI development',
    searchVolume: 8900,
    difficulty: 55,
    cpc: 8.75,
    competition: 'high',
    relatedKeywords: ['machine learning development', 'AI programming', 'artificial intelligence']
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Company.deleteMany({});
    await BlogData.deleteMany({});
    await Keyword.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Seed companies
    const companies = await Company.insertMany(sampleCompanies);
    console.log(`✅ Seeded ${companies.length} companies`);

    // Seed blog data with company references
    const blogDataWithCompanies = sampleBlogData.map((blog, index) => ({
      ...blog,
      companyId: companies[index < 2 ? 0 : 1]._id // First 2 blogs for WattMonk, rest for TechFlow
    }));
    
    const blogs = await BlogData.insertMany(blogDataWithCompanies);
    console.log(`✅ Seeded ${blogs.length} blog entries`);

    // Seed keywords
    const keywords = await Keyword.insertMany(sampleKeywords);
    console.log(`✅ Seeded ${keywords.length} keywords`);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
