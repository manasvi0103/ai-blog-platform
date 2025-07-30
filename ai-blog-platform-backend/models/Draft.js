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

  // Selected data from previous steps
  selectedKeyword: String,
  selectedH1: String,
  selectedMetaTitle: String,
  selectedMetaDescription: String,
  keywords: [{
    focusKeyword: String,
    source: String,
    articleFormat: String,
    wordCount: String,
    targetAudience: String,
    objective: String
  }],

  // Generated content and links
  generatedContent: {
    blogContent: mongoose.Schema.Types.Mixed,
    contentBlocks: [mongoose.Schema.Types.Mixed], // FIXED: Add contentBlocks field
    uploadedImages: mongoose.Schema.Types.Mixed,
    editedContent: mongoose.Schema.Types.Mixed,
    wordCount: Number,
    lastSaved: Date,
    inboundLinks: [{
      text: String,
      url: String,
      context: String
    }],
    outboundLinks: [{
      text: String,
      url: String,
      context: String
    }],
    imagePrompts: [{
      section: String,
      prompt: String,
      altText: String
    }],
    generatedAt: Date
  },
  featuredImage: {
    url: String,
    altText: String,
    caption: String
  },
  contentBlocks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentBlock'
  }],

  // FIXED: Add links fields at root level
  internalLinks: [mongoose.Schema.Types.Mixed],
  externalLinks: [mongoose.Schema.Types.Mixed],

  // Workflow status tracking
  status: {
    type: String,
    enum: ['keyword_selection', 'meta_generation', 'meta_selection', 'content_review', 'ready_to_publish'],
    default: 'keyword_selection'
  },
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