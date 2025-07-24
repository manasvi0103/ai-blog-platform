// models/ContentBlock.js
const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogData',
    required: true
  },
  blockType: {
    type: String,
    enum: ['h1', 'h2', 'h3', 'paragraph', 'list', 'image', 'quote', 'code'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  metadata: {
    wordCount: Number,
    aiGenerated: Boolean,
    source: String, // 'gemini', 'manual', 'competitor'
    keywords: [String],
    citations: [{
      url: String,
      title: String,
      description: String
    }]
  },
  version: {
    type: Number,
    default: 1
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  alternatives: [{
    content: String,
    source: String,
    createdAt: Date
  }]
}, {
  timestamps: true
});

// Index for efficient content assembly
contentBlockSchema.index({ blogId: 1, order: 1 });
contentBlockSchema.index({ blockType: 1 });

module.exports = mongoose.model('ContentBlock', contentBlockSchema);
