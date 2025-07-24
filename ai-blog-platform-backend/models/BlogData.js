// models/BlogData.js
const mongoose = require('mongoose');

const blogDataSchema = new mongoose.Schema({
  focusKeyword: {
    type: String,
    required: true,
    trim: true
  },
  articleFormat: {
    type: String,
    required: true,
    trim: true
  },
  wordCount: {
    type: Number,
    required: true,
    min: 300,
    max: 5000
  },
  targetAudience: {
    type: String,
    required: true
  },
  objective: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'published'],
    default: 'pending'
  },
  seoScore: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Index for efficient querying
blogDataSchema.index({ focusKeyword: 1, companyId: 1 });
blogDataSchema.index({ status: 1 });

module.exports = mongoose.model('BlogData', blogDataSchema);
