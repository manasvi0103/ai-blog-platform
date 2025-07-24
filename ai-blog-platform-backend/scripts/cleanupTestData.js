// scripts/cleanupTestData.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('../models/Company');
const BlogData = require('../models/BlogData');
const Keyword = require('../models/Keyword');
const Draft = require('../models/Draft');

dotenv.config();

async function cleanupTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Remove test companies (keep only the ones from Google Sheets)
    const testCompanies = await Company.find({
      name: { $in: ['TechFlow Solutions', 'WattMonk'] }
    });
    
    if (testCompanies.length > 0) {
      await Company.deleteMany({
        name: { $in: ['TechFlow Solutions', 'WattMonk'] }
      });
      console.log(`🗑️ Removed ${testCompanies.length} test companies`);
    }

    // Remove test blog data that doesn't match our Google Sheets keywords
    const realKeywords = [
      'solar PTO',
      'photovoltaic software',
      'how to design solar systems',
      'go solo solar'
    ];

    const testBlogs = await BlogData.find({
      focusKeyword: { $nin: realKeywords }
    });

    if (testBlogs.length > 0) {
      await BlogData.deleteMany({
        focusKeyword: { $nin: realKeywords }
      });
      console.log(`🗑️ Removed ${testBlogs.length} test blog entries`);
    }

    // Remove test keywords that aren't from Google Sheets
    const testKeywords = await Keyword.find({
      keyword: { $nin: realKeywords }
    });

    if (testKeywords.length > 0) {
      await Keyword.deleteMany({
        keyword: { $nin: realKeywords }
      });
      console.log(`🗑️ Removed ${testKeywords.length} test keywords`);
    }

    // Remove orphaned drafts (drafts without valid blog data or company)
    const orphanedDrafts = await Draft.find().populate('blogId');
    const draftsToRemove = orphanedDrafts.filter(draft =>
      !draft.blogId || draft.blogId.focusKeyword === 'placeholder'
    );

    if (draftsToRemove.length > 0) {
      const draftIds = draftsToRemove.map(draft => draft._id);
      await Draft.deleteMany({ _id: { $in: draftIds } });
      console.log(`🗑️ Removed ${draftsToRemove.length} orphaned drafts`);
    }

    console.log('🎉 Test data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupTestData();
