// scripts/cleanupDatabase.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TrendData = require('../models/TrendData');
const ContentBlock = require('../models/ContentBlock');

dotenv.config();

async function cleanupDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Remove old trend data (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deletedTrends = await TrendData.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    console.log(`🧹 Deleted ${deletedTrends.deletedCount} old trend records`);

    // Remove orphaned content blocks (blocks without valid blog references)
    const BlogData = require('../models/BlogData');
    const allBlogs = await BlogData.find({}, '_id');
    const validBlogIds = allBlogs.map(blog => blog._id);
    
    const deletedBlocks = await ContentBlock.deleteMany({
      blogId: { $nin: validBlogIds }
    });
    console.log(`🧹 Deleted ${deletedBlocks.deletedCount} orphaned content blocks`);

    // Update keyword usage statistics
    const Keyword = require('../models/Keyword');
    const keywords = await Keyword.find({});
    
    for (const keyword of keywords) {
      const usageCount = await BlogData.countDocuments({
        focusKeyword: { $regex: keyword.keyword, $options: 'i' }
      });
      
      await Keyword.findByIdAndUpdate(keyword._id, {
        usageCount,
        lastUsed: usageCount > 0 ? new Date() : keyword.lastUsed
      });
    }
    console.log(`📊 Updated usage statistics for ${keywords.length} keywords`);

    console.log('🎉 Database cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
}
cleanupDatabase();