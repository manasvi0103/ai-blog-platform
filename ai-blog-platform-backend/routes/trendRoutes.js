// routes/trendRoutes.js
const express = require('express');
const TrendData = require('../models/TrendData');
const router = express.Router();

// GET trends for keyword
router.get('/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { limit = 10, source } = req.query;
    
    let query = { keyword: { $regex: keyword, $options: 'i' } };
    if (source) query.source = source;
    
    const trends = await TrendData.find(query)
      .sort({ publishedAt: -1, relevanceScore: -1 })
      .limit(parseInt(limit));
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST fetch fresh trend data (simplified for now)
router.post('/fetch', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    // For now, just return a success message
    // You can add actual API fetching later when you have API keys
    res.json({
      message: `Trend fetch requested for keyword: ${keyword}`,
      keyword,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;