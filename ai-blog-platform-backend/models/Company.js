// models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  servicesOffered: [{
    name: String,
    description: String
  }],
  serviceOverview: {
    type: String,
    required: true
  },
  aboutCompany: {
    type: String,
    required: true
  },
  tone: {
    type: String,
    enum: ['professional', 'casual', 'technical', 'friendly', 'authoritative'],
    required: true
  },
  brandVoice: {
    type: String,
    required: true
  },
  targetAudience: [String],
  
  // WordPress Configuration for each company
  wordpressConfig: {
    baseUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'WordPress URL must be a valid URL'
      }
    },
    username: String,
    appPassword: String,
    isActive: {
      type: Boolean,
      default: false
    },
    lastConnectionTest: Date,
    connectionStatus: {
      type: String,
      enum: ['connected', 'failed', 'not-tested'],
      default: 'not-tested'
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);