// scripts/syncGoogleSheets.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('../models/Company');
const BlogData = require('../models/BlogData');
const googleSheetsService = require('../services/googleSheetsService');

dotenv.config();

async function syncGoogleSheets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Sync company data
    if (process.env.COMPANY_DATA_SPREADSHEET_ID) {
      console.log('📊 Syncing company data from Google Sheets...');
      const companyData = await googleSheetsService.syncCompanyDataSheet(
        process.env.COMPANY_DATA_SPREADSHEET_ID
      );

      for (const company of companyData) {
        await Company.findOneAndUpdate(
          { name: company.name },
          company,
          { upsert: true, new: true }
        );
      }
      console.log(`✅ Synced ${companyData.length} companies`);
    }

    // Sync blog data
    if (process.env.BLOG_DATA_SPREADSHEET_ID) {
      console.log('📊 Syncing blog data from Google Sheets...');
      const blogData = await googleSheetsService.syncBlogDataSheet(
        process.env.BLOG_DATA_SPREADSHEET_ID
      );

      // Get default company (first one) for blogs without company reference
      const defaultCompany = await Company.findOne().sort({ createdAt: 1 });

      for (const blog of blogData) {
        // Check if blog already exists
        const existingBlog = await BlogData.findOne({ 
          focusKeyword: blog.focusKeyword 
        });

        if (!existingBlog) {
          await BlogData.create({
            ...blog,
            companyId: defaultCompany._id
          });
        }
      }
      console.log(`✅ Synced ${blogData.length} blog entries`);
    }

    console.log('🎉 Google Sheets sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Google Sheets sync failed:', error);
    process.exit(1);
  }
}

syncGoogleSheets();