// models/TrendData.js
const mongoose = require('mongoose');

const trendDataSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['gnews', 'newsdata', 'rapidapi', 'google-trends', 'competitor'],
    required: true
  },
  keyword: {
    type: String,
    required: true
  },
  title: String,
  description: String,
  url: String,
  publishedAt: Date,
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral']
  },
  relevanceScore: {
    type: Number,
    min: 0,
    max: 100
  },
  extractedContent: {
    summary: String,
    keyPoints: [String],
    quotes: [String]
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  usedInBlogs: [{
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogData'
    },
    usedAt: Date
  }]
}, {
  timestamps: true
});

// Index for trend analysis
trendDataSchema.index({ keyword: 1, publishedAt: -1 });
trendDataSchema.index({ source: 1 });
trendDataSchema.index({ relevanceScore: -1 });

module.exports = mongoose.model('TrendData', trendDataSchema);