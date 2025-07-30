// server.js - Main Express server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const blogRoutes = require('./routes/blogRoutes');
const companyRoutes = require('./routes/companyRoutes');
const keywordRoutes = require('./routes/keywordRoutes');
const contentRoutes = require('./routes/contentRoutes');
const trendRoutes = require('./routes/trendRoutes');
const imageRoutes = require('./routes/imageRoutes');
const wordpressApiRoutes = require('./routes/wordpressApiRoutes');

dotenv.config();

const app = express();

// Configure Express to parse JSON bodies
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5001;

// Security middleware (with relaxed settings for development)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ENHANCED CORS Configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001', // Allow both ports for development
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Rate limiting (more relaxed for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More requests in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// REQUEST LOGGING MIDDLEWARE (Add this for debugging)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`, {
    query: Object.keys(req.query).length > 0 ? req.query : 'No query params',
    body: req.method !== 'GET' && Object.keys(req.body || {}).length > 0 ? 'Has body data' : 'No body',
    origin: req.get('Origin') || 'No origin header',
    userAgent: req.get('User-Agent')?.substring(0, 50) + '...' || 'No user agent'
  });
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-blog-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Static file serving for uploads with CORS headers
const path = require('path');
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes with logging
console.log('🔧 Setting up API routes...');

app.use('/api/blogs', (req, res, next) => {
  console.log(`📝 Blog route: ${req.method} /api/blogs${req.path}`);
  next();
}, blogRoutes);

app.use('/api/companies', (req, res, next) => {
  console.log(`🏢 Company route: ${req.method} /api/companies${req.path}`);
  next();
}, companyRoutes);

app.use('/api/company', (req, res, next) => {
  console.log(`🏢 Company alias route: ${req.method} /api/company${req.path}`);
  next();
}, companyRoutes);

app.use('/api/keywords', keywordRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/wordpress', wordpressApiRoutes);

// Error handling middleware

// WordPress routes with extra logging
app.use('/api/wordpress', (req, res, next) => {
  console.log(`🔌 WordPress route: ${req.method} /api/wordpress${req.path}`, {
    query: req.query,
    hasBody: !!req.body && Object.keys(req.body).length > 0
  });
  next();
}, wordpressApiRoutes);

console.log('✅ All API routes configured');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// API info endpoint for debugging
app.get('/api', (req, res) => {
  res.json({
    message: 'AI Blog Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /api',
      'GET,POST /api/blogs/*',
      'GET /api/companies',
      'GET /api/company',
      'GET,POST /api/wordpress/*'
    ]
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.status || 500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'GET /api',
      'GET,POST /api/blogs/*',
      'GET /api/companies',
      'GET /api/company',
      'GET,POST /api/wordpress/*'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔗 WordPress API: http://localhost:${PORT}/api/wordpress`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 Server listening on: 0.0.0.0:${PORT} (all interfaces)`);
  console.log('='.repeat(50));
  
  // Test WordPress connection on startup
  setTimeout(() => {
    console.log('🔍 Testing WordPress configuration on startup...');
    const wordpressService = require('./services/wordpressService');
    wordpressService.testConnection(null)
      .then(result => {
        if (result.overall?.success) {
          console.log('✅ WordPress connection test: SUCCESS');
        } else {
          console.log('⚠️  WordPress connection test: FAILED');
          console.log('   Configure WordPress credentials to enable deployment');
        }
      })
      .catch(err => {
        console.log('⚠️  WordPress connection test: ERROR');
        console.log('   Error:', err.message);
      });
  }, 2000);
});

module.exports = app;