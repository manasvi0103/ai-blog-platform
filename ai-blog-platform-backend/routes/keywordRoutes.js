// routes/keywordRoutes.js
const express = require('express');
const Keyword = require('../models/Keyword');
const router = express.Router();

// GET keywords with search
router.get('/', async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { keyword: { $regex: search, $options: 'i' } },
          { relatedKeywords: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const keywords = await Keyword.find(query)
      .sort({ searchVolume: -1, usageCount: 1 })
      .limit(parseInt(limit));
    
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create or update keyword
router.post('/', async (req, res) => {
  try {
    const existingKeyword = await Keyword.findOne({ keyword: req.body.keyword });
    
    if (existingKeyword) {
      // Update existing keyword
      const updatedKeyword = await Keyword.findByIdAndUpdate(
        existingKeyword._id,
        { $inc: { usageCount: 1 }, lastUsed: new Date() },
        { new: true }
      );
      res.json(updatedKeyword);
    } else {
      // Create new keyword
      const keyword = new Keyword(req.body);
      const savedKeyword = await keyword.save();
      res.status(201).json(savedKeyword);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET keyword suggestions based on focus keyword
router.get('/suggestions/:focusKeyword', async (req, res) => {
  try {
    const { focusKeyword } = req.params;
    
    const suggestions = await Keyword.find({
      $or: [
        { keyword: { $regex: focusKeyword, $options: 'i' } },
        { relatedKeywords: { $regex: focusKeyword, $options: 'i' } }
      ]
    })
    .sort({ searchVolume: -1, difficulty: 1 })
    .limit(10);
    
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;