// __tests__/api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Company = require('../models/Company');
const BlogData = require('../models/BlogData');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ai-blog-platform-test';

describe('API Endpoints', () => {
  let server;
  let testCompany;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Clear test data
    await Company.deleteMany({});
    await BlogData.deleteMany({});
    
    // Create test company
    testCompany = await Company.create({
      name: 'Test Company',
      servicesOffered: [{ name: 'Test Service', description: 'Test Description' }],
      serviceOverview: 'Test service overview',
      aboutCompany: 'Test company description',
      tone: 'professional',
      brandVoice: 'Professional and reliable',
      targetAudience: ['Test Audience']
    });

    server = app.listen(5001);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Companies API', () => {
    test('should get all companies', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should get company by ID', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompany._id}`)
        .expect(200);

      expect(response.body.name).toBe('Test Company');
      expect(response.body.tone).toBe('professional');
    });

    test('should create new company', async () => {
      const newCompany = {
        name: 'New Test Company',
        servicesOffered: [{ name: 'New Service', description: 'New Description' }],
        serviceOverview: 'New service overview',
        aboutCompany: 'New company description',
        tone: 'casual',
        brandVoice: 'Friendly and approachable',
        targetAudience: ['New Audience']
      };

      const response = await request(app)
        .post('/api/companies')
        .send(newCompany)
        .expect(201);

      expect(response.body.name).toBe('New Test Company');
      expect(response.body.tone).toBe('casual');
    });
  });

  describe('Blogs API', () => {
    test('should create new blog', async () => {
      const newBlog = {
        focusKeyword: 'test keyword',
        articleFormat: 'guide',
        wordCount: 1500,
        targetAudience: 'Test audience',
        objective: 'Test objective',
        companyId: testCompany._id
      };

      const response = await request(app)
        .post('/api/blogs')
        .send(newBlog)
        .expect(201);

      expect(response.body.focusKeyword).toBe('test keyword');
      expect(response.body.status).toBe('pending');
    });

    test('should get all blogs', async () => {
      const response = await request(app)
        .get('/api/blogs')
        .expect(200);

      expect(response.body).toHaveProperty('blogs');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.blogs)).toBe(true);
    });
  });

  describe('Keywords API', () => {
    test('should create keyword', async () => {
      const keyword = {
        keyword: 'test seo keyword',
        searchVolume: 1000,
        difficulty: 50,
        competition: 'medium'
      };

      const response = await request(app)
        .post('/api/keywords')
        .send(keyword)
        .expect(201);

      expect(response.body.keyword).toBe('test seo keyword');
      expect(response.body.searchVolume).toBe(1000);
    });

    test('should search keywords', async () => {
      const response = await request(app)
        .get('/api/keywords?search=test')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
