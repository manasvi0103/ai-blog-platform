// models/Draft.js
const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogData',
    required: true
  },
  title: String,
  metaTitle: String,
  metaDescription: String,
  content: String, // Assembled HTML content
  featuredImage: {
    url: String,
    altText: String,
    caption: String
  },
  contentBlocks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentBlock'
  }],
  wordpressStatus: {
    type: String,
    enum: ['not-sent', 'draft', 'published', 'failed'],
    default: 'not-sent'
  },
  wordpressId: Number,
  seoAnalysis: {
    score: Number,
    issues: [String],
    suggestions: [String]
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Draft', draftSchema);