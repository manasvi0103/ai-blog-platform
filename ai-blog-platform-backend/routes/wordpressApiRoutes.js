// routes/wordpressApiRoutes.js
// Enhanced WordPress API routes with CORS support

const express = require('express');
const WordPressService = require('../services/wordpressService');
const Draft = require('../models/Draft');
const router = express.Router();

// Initialize WordPress service
const wordpressService = new WordPressService();

// Basic health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CORS middleware for WordPress routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Test WordPress connection endpoint (GET for frontend compatibility)
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🔄 Testing WordPress connection via GET...');
    const { companyId } = req.query;

    const result = await wordpressService.testConnection(companyId);
    console.log('📊 WordPress connection test result:', result);

    const response = {
      connected: result.overall?.success || false,
      method: result.overall?.method || 'unknown',
      n8n: result.n8n || { success: false },
      direct: result.direct || { success: false },
      userInfo: result.direct?.userInfo,
      error: result.direct?.error || result.n8n?.error || 'Connection failed'
    };

    console.log('✅ Sending response to frontend:', response);

    res.json(response);
  } catch (error) {
    console.error('❌ WordPress connection test error:', error);
    res.status(500).json({
      connected: false,
      method: 'error',
      message: error.message,
      error: error.message
    });
  }
});

// Test WordPress connection endpoint (POST for backward compatibility)
router.post('/test-connection', async (req, res) => {
  try {
    console.log('🔄 Testing WordPress connection...');

    // First check if environment variables are set
    const envConfig = {
      baseUrl: process.env.WORDPRESS_BASE_URL?.trim(),
      username: process.env.WORDPRESS_USERNAME?.trim(),
      password: process.env.WORDPRESS_APP_PASSWORD?.trim()
    };

    // Log configuration (without sensitive data)
    console.log('📝 WordPress config:', {
      baseUrl: envConfig.baseUrl,
      hasUsername: !!envConfig.username,
      hasPassword: !!envConfig.password
    });

    const missingVars = Object.entries(envConfig)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('❌ Missing WordPress configuration:', missingVars);
      return res.status(400).json({
        connected: false,
        error: `Missing WordPress configuration: ${missingVars.join(', ')}`
      });
    }

    console.log('✅ WordPress environment variables found, testing connection...');

    // Test WordPress connection (will use environment variables if no company config)
    const result = await wordpressService.testConnection(companyId || null);

    console.log('📊 WordPress test result:', {
      overall: result.overall?.success || false,
      method: result.overall?.method || 'unknown',
      n8nSuccess: result.n8n?.success || false,
      directSuccess: result.direct?.success || false
    });

    const response = {
      connected: result.overall?.success || false,
      method: result.overall?.method || 'unknown',
      n8n: result.n8n || { success: false },
      direct: result.direct || { success: false },
      userInfo: result.direct?.userInfo,
      error: result.direct?.error || result.n8n?.error || 'Connection failed'
    };

    console.log('✅ Sending response to frontend:', response);

    res.json(response);
  } catch (error) {
    console.error('❌ WordPress connection test error:', error);
    res.status(500).json({
      connected: false,
      method: 'error',
      message: error.message,
      error: error.message
    });
  }
});

// NEW: Test N8N connection
router.get('/test-n8n', async (req, res) => {
  try {
    console.log('🔄 Testing N8N connection...');

    const result = await n8nWordpressService.testConnection();

    res.json({
      success: result.success,
      service: 'N8N WordPress Integration',
      status: result.success ? 'connected' : 'disconnected',
      ...result
    });
  } catch (error) {
    console.error('🚨 N8N test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'N8N WordPress Integration'
    });
  }
});

// NEW: Get N8N service status
router.get('/n8n/status', async (req, res) => {
  try {
    const status = n8nWordpressService.getServiceStatus();
    const connectionTest = await n8nWordpressService.testConnection();

    res.json({
      success: true,
      ...status,
      connectionStatus: connectionTest.success ? 'connected' : 'disconnected',
      lastTest: new Date().toISOString(),
      connectionDetails: connectionTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware to validate company access
const validateCompanyAccess = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    req.companyId = companyId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate company access' });
  }
};

// GET /api/wordpress/:companyId/drafts - Get all WordPress drafts for a company
router.get('/:companyId/drafts', validateCompanyAccess, async (req, res) => {
  try {
    const { page = 1, perPage = 10, orderBy = 'date', order = 'desc' } = req.query;
    
    const result = await wordpressService.getDraftPosts(req.companyId, {
      page: parseInt(page),
      perPage: parseInt(perPage),
      orderBy,
      order
    });

    if (result.success) {
      res.json({
        drafts: result.data,
        pagination: {
          page: parseInt(page),
          perPage: parseInt(perPage),
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch WordPress drafts' });
  }
});

// GET /api/wordpress/:companyId/drafts/:postId - Get single WordPress draft
router.get('/:companyId/drafts/:postId', validateCompanyAccess, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const result = await wordpressService.getDraftPost(postId, req.companyId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch WordPress draft' });
  }
});

// POST /api/wordpress/:companyId/drafts - Create new WordPress draft
router.post('/:companyId/drafts', validateCompanyAccess, async (req, res) => {
  try {
    const { title, content, metaTitle, metaDescription, focusKeyword, categories, tags, featuredImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const draftData = {
      title,
      content,
      metaTitle,
      metaDescription,
      focusKeyword,
      categories,
      tags,
      featuredImage
    };

    const result = await wordpressService.createDraft(draftData, req.companyId);

    if (result.success) {
      res.status(201).json({
        message: 'WordPress draft created successfully',
        ...result
      });
    } else {
      res.status(400).json({ error: result.error, details: result.details });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create WordPress draft' });
  }
});

// PUT /api/wordpress/:companyId/drafts/:postId - Update WordPress draft
router.put('/:companyId/drafts/:postId', validateCompanyAccess, async (req, res) => {
  try {
    const { postId } = req.params;
    const updateData = req.body;

    const result = await wordpressService.updateDraft(postId, updateData, req.companyId);

    if (result.success) {
      res.json({
        message: 'WordPress draft updated successfully',
        ...result
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update WordPress draft' });
  }
});

// POST /api/wordpress/:companyId/drafts/:postId/publish - Publish WordPress draft
router.post('/:companyId/drafts/:postId/publish', validateCompanyAccess, async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await wordpressService.publishDraft(postId, req.companyId);

    if (result.success) {
      res.json({
        message: 'WordPress draft published successfully',
        publishedUrl: result.publishedUrl,
        ...result
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish WordPress draft' });
  }
});

// DELETE /api/wordpress/:companyId/drafts/:postId - Delete WordPress draft
router.delete('/:companyId/drafts/:postId', validateCompanyAccess, async (req, res) => {
  try {
    const { postId } = req.params;
    const { permanent = false } = req.query;

    const result = await wordpressService.deleteDraft(postId, req.companyId, permanent === 'true');

    if (result.success) {
      res.json({
        message: `WordPress draft ${permanent === 'true' ? 'permanently deleted' : 'moved to trash'}`,
        ...result
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete WordPress draft' });
  }
});

// POST /api/wordpress/:companyId/deploy-draft/:draftId - Deploy platform draft to WordPress
router.post('/:companyId/deploy-draft/:draftId', validateCompanyAccess, async (req, res) => {
  try {
    const { draftId } = req.params;

    // Get the platform draft
    const draft = await Draft.findById(draftId).populate({
      path: 'blogId',
      populate: {
        path: 'companyId'
      }
    });

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Verify the draft belongs to the specified company
    if (draft.blogId.companyId._id.toString() !== req.companyId) {
      return res.status(403).json({ error: 'Draft does not belong to this company' });
    }

    // Prepare WordPress draft data
    const wordpressDraftData = {
      title: draft.selectedH1 || draft.title || `${draft.selectedKeyword} Guide`,
      content: draft.content || '<p>Content coming soon...</p>',
      metaTitle: draft.selectedMetaTitle || draft.metaTitle,
      metaDescription: draft.selectedMetaDescription || draft.metaDescription,
      focusKeyword: draft.selectedKeyword,
      featuredImage: draft.featuredImage
    };

    // First test WordPress connection
    console.log('🔄 Testing WordPress connection before deployment...');
    const connectionTest = await wordpressService.testConnection();
    
    if (!connectionTest.success) {
      console.error('❌ WordPress connection test failed:', connectionTest.error);
      return res.status(400).json({
        error: 'WordPress connection failed',
        details: connectionTest.error
      });
    }

    console.log('✅ WordPress connection successful, deploying draft...');

    // Deploy to WordPress
    const result = await wordpressService.createDraft(wordpressDraftData);

    if (result.success) {
      console.log('✅ Draft deployed to WordPress:', result.wordpressId);
      
      // Update platform draft with WordPress info
      await Draft.findByIdAndUpdate(draftId, {
        wordpressStatus: 'draft',
        wordpressId: result.wordpressId,
        wordpressEditUrl: result.editUrl,
        wordpressPreviewUrl: result.previewUrl,
        status: 'ready_to_publish'
      });

      res.json({
        message: 'Draft successfully deployed to WordPress',
        draftUrl: result.draftUrl,
        previewUrl: result.previewUrl,
        editUrl: result.editUrl,
        wordpressId: result.wordpressId,
        ...result
      });
    } else {
      res.status(400).json({ 
        error: 'WordPress deployment failed', 
        details: result.error 
      });
    }
  } catch (error) {
    console.error('WordPress deployment error:', error);
    res.status(500).json({ error: 'Failed to deploy draft to WordPress' });
  }
});

module.exports = router;