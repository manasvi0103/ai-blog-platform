const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  searchVolume: Number,
  difficulty: {
    type: Number,
    min: 0,
    max: 100
  },
  cpc: Number,
  competition: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  relatedKeywords: [String],
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: Date,
  trends: [{
    date: Date,
    volume: Number,
    position: Number
  }],
  companyIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }]
}, {
  timestamps: true
});

// Index for search optimization
keywordSchema.index({ keyword: 'text' });
keywordSchema.index({ searchVolume: -1 });
keywordSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Keyword', keywordSchema);