// controllers/dashboardController.js
const BlogData = require('../models/BlogData');
const Company = require('../models/Company');
const Keyword = require('../models/Keyword');
const TrendData = require('../models/TrendData');
const ContentBlock = require('../models/ContentBlock');

class DashboardController {
  // Get dashboard overview statistics
  async getDashboardStats(req, res) {
    try {
      const { companyId, timeRange = '30d' } = req.query;
      
      // Date range calculation
      let dateFilter = {};
      if (timeRange !== 'all') {
        const days = parseInt(timeRange.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = { createdAt: { $gte: startDate } };
      }

      // Build company filter
      let companyFilter = {};
      if (companyId) {
        companyFilter = { companyId };
      }

      // Parallel queries for better performance
      const [
        totalBlogs,
        completedBlogs,
        inProgressBlogs,
        publishedBlogs,
        totalKeywords,
        totalCompanies,
        recentTrends,
        topPerformingBlogs
      ] = await Promise.all([
        BlogData.countDocuments({ ...companyFilter, ...dateFilter }),
        BlogData.countDocuments({ ...companyFilter, ...dateFilter, status: 'completed' }),
        BlogData.countDocuments({ ...companyFilter, ...dateFilter, status: 'in-progress' }),
        BlogData.countDocuments({ ...companyFilter, ...dateFilter, status: 'published' }),
        Keyword.countDocuments(dateFilter),
        Company.countDocuments({ isActive: true }),
        TrendData.find(dateFilter).sort({ createdAt: -1 }).limit(5),
        BlogData.find({ ...companyFilter, ...dateFilter })
          .populate('companyId', 'name')
          .sort({ seoScore: -1 })
          .limit(5)
      ]);

      // Content generation statistics
      const contentStats = await ContentBlock.aggregate([
        { 
          $match: { 
            ...dateFilter,
            'metadata.aiGenerated': true 
          } 
        },
        {
          $group: {
            _id: '$metadata.source',
            count: { $sum: 1 },
            totalWords: { $sum: '$metadata.wordCount' }
          }
        }
      ]);

      // Blog status distribution
      const statusDistribution = await BlogData.aggregate([
        { $match: { ...companyFilter, ...dateFilter } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        overview: {
          totalBlogs,
          completedBlogs,
          inProgressBlogs,
          publishedBlogs,
          totalKeywords,
          totalCompanies,
          completionRate: totalBlogs > 0 ? ((completedBlogs / totalBlogs) * 100).toFixed(1) : 0
        },
        contentGeneration: {
          aiGeneratedBlocks: contentStats.reduce((sum, stat) => sum + stat.count, 0),
          totalWordsGenerated: contentStats.reduce((sum, stat) => sum + (stat.totalWords || 0), 0),
          bySource: contentStats
        },
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentTrends: recentTrends.map(trend => ({
          keyword: trend.keyword,
          title: trend.title,
          source: trend.source,
          relevanceScore: trend.relevanceScore,
          publishedAt: trend.publishedAt
        })),
        topPerformingBlogs: topPerformingBlogs.map(blog => ({
          id: blog._id,
          focusKeyword: blog.focusKeyword,
          company: blog.companyId?.name,
          status: blog.status,
          seoScore: blog.seoScore || 0,
          createdAt: blog.createdAt
        }))
      };

      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  }

  // Get recent activity feed
  async getActivityFeed(req, res) {
    try {
      const { limit = 20 } = req.query;

      // Get recent blogs
      const recentBlogs = await BlogData.find()
        .populate('companyId', 'name')
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit) / 2);

      // Get recent content blocks
      const recentContent = await ContentBlock.find()
        .populate('blogId', 'focusKeyword')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 2);

      // Combine and format activities
      const activities = [];

      recentBlogs.forEach(blog => {
        activities.push({
          type: 'blog_update',
          title: `Blog "${blog.focusKeyword}" status changed to ${blog.status}`,
          company: blog.companyId?.name,
          timestamp: blog.updatedAt,
          metadata: {
            blogId: blog._id,
            status: blog.status,
            focusKeyword: blog.focusKeyword
          }
        });
      });

      recentContent.forEach(content => {
        activities.push({
          type: 'content_generated',
          title: `${content.blockType.toUpperCase()} content generated for "${content.blogId?.focusKeyword}"`,
          timestamp: content.createdAt,
          metadata: {
            blockType: content.blockType,
            source: content.metadata?.source,
            aiGenerated: content.metadata?.aiGenerated
          }
        });
      });

      // Sort by timestamp and limit
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));

      res.json(sortedActivities);
    } catch (error) {
      console.error('Activity feed error:', error);
      res.status(500).json({ message: 'Failed to fetch activity feed' });
    }
  }

  // Get keyword performance analytics
  async getKeywordAnalytics(req, res) {
    try {
      const { limit = 10 } = req.query;

      const keywordStats = await Keyword.aggregate([
        {
          $lookup: {
            from: 'blogdatas',
            localField: 'keyword',
            foreignField: 'focusKeyword',
            as: 'blogs'
          }
        },
        {
          $addFields: {
            blogCount: { $size: '$blogs' },
            avgSearchVolume: '$searchVolume',
            competitionScore: {
              $switch: {
                branches: [
                  { case: { $eq: ['$competition', 'low'] }, then: 1 },
                  { case: { $eq: ['$competition', 'medium'] }, then: 2 },
                  { case: { $eq: ['$competition', 'high'] }, then: 3 }
                ],
                default: 0
              }
            }
          }
        },
        {
          $project: {
            keyword: 1,
            searchVolume: 1,
            difficulty: 1,
            competition: 1,
            usageCount: 1,
            lastUsed: 1,
            blogCount: 1,
            opportunity: {
              $multiply: [
                { $divide: ['$searchVolume', { $add: ['$difficulty', 1] }] },
                { $subtract: [4, '$competitionScore'] }
              ]
            }
          }
        },
        { $sort: { opportunity: -1 } },
        { $limit: parseInt(limit) }
      ]);

      res.json(keywordStats);
    } catch (error) {
      console.error('Keyword analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch keyword analytics' });
    }
  }
}

module.exports = new DashboardController();