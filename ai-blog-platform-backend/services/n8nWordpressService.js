// services/n8nWordpressService.js
const axios = require('axios');
require('dotenv').config();

class N8NWordPressService {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/wordpress-draft';
    this.webhookSecret = process.env.N8N_WEBHOOK_SECRET || '';
  }

  /**
   * Create WordPress draft via N8N workflow
   * @param {Object} draftData - The blog draft data
   * @param {string} companyId - Company identifier for routing
   * @returns {Promise<Object>} Result with success status and WordPress info
   */
  async createWordPressDraft(draftData, companyId) {
    try {
      console.log('📝 Sending draft to WordPress via N8N...');
      console.log(`🏢 Company ID: ${companyId}`);
      console.log(`📄 Title: ${draftData.title}`);

      // Prepare payload for N8N webhook
      const payload = {
        // Core content
        title: draftData.title,
        content: draftData.content,
        excerpt: draftData.excerpt || this.generateExcerpt(draftData.content),
        
        // SEO metadata
        metaTitle: draftData.metaTitle || draftData.title,
        metaDescription: draftData.metaDescription || '',
        focusKeyword: draftData.focusKeyword || '',
        
        // Company routing
        companyId: companyId,
        
        // Additional WordPress fields
        categories: draftData.categories || [],
        tags: draftData.tags || [],
        featuredImage: draftData.featuredImage || null,
        
        // AI platform metadata
        aiGenerated: true,
        sourcePlatform: 'AI-Blog-Platform',
        generatedAt: new Date().toISOString(),
        
        // Webhook security
        secret: this.webhookSecret
      };

      console.log('🔗 Sending to N8N webhook:', this.webhookUrl);

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Blog-Platform/1.0'
        },
        timeout: 30000 // 30 second timeout
      });

      const result = response.data;

      if (result.success) {
        console.log('✅ WordPress draft created via N8N:', result.data?.wordpressId);
        
        return {
          success: true,
          wordpressId: result.data?.wordpressId,
          editUrl: result.data?.editUrl,
          previewUrl: result.data?.previewUrl,
          status: result.data?.status || 'draft',
          createdAt: result.data?.createdAt,
          source: 'n8n-workflow'
        };
      } else {
        console.error('❌ N8N WordPress creation failed:', result.error);
        return {
          success: false,
          error: result.error || 'Unknown N8N error',
          details: result
        };
      }

    } catch (error) {
      console.error('🚨 N8N request failed:', error.message);
      
      // Enhanced error handling
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'N8N service is not running. Please start N8N on port 5678.',
          details: { code: 'N8N_OFFLINE' }
        };
      }
      
      if (error.response) {
        return {
          success: false,
          error: `N8N webhook error: ${error.response.status} ${error.response.statusText}`,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message,
        details: { code: error.code }
      };
    }
  }

  /**
   * Test N8N connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      console.log('🔍 Testing N8N connection...');
      
      const testPayload = {
        test: true,
        title: 'N8N Connection Test',
        content: 'This is a test to verify N8N connectivity.',
        companyId: 'test',
        secret: this.webhookSecret
      };

      const response = await axios.post(this.webhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ N8N connection successful');
      return {
        success: true,
        message: 'N8N webhook is accessible',
        responseTime: response.headers['x-response-time'] || 'unknown'
      };

    } catch (error) {
      console.error('❌ N8N connection failed:', error.message);
      return {
        success: false,
        error: error.message,
        suggestion: error.code === 'ECONNREFUSED' 
          ? 'Start N8N with: docker-compose up -d or n8n start'
          : 'Check N8N webhook URL and configuration'
      };
    }
  }

  /**
   * Generate excerpt from content
   * @param {string} content - HTML content
   * @returns {string} Generated excerpt
   */
  generateExcerpt(content) {
    if (!content) return '';
    
    // Strip HTML tags and get first 150 characters
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    return plainText.length > 150 
      ? plainText.substring(0, 150) + '...'
      : plainText;
  }

  /**
   * Update WordPress post via N8N (for future use)
   * @param {string} wordpressId - WordPress post ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateWordPressPost(wordpressId, updateData) {
    try {
      console.log(`📝 Updating WordPress post ${wordpressId} via N8N...`);
      
      const payload = {
        action: 'update',
        wordpressId: wordpressId,
        ...updateData,
        secret: this.webhookSecret
      };

      const updateWebhookUrl = this.webhookUrl.replace('/wordpress-draft', '/wordpress-update');
      
      const response = await axios.post(updateWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;

    } catch (error) {
      console.error('🚨 WordPress update via N8N failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get N8N workflow status
   * @returns {Object} Service status
   */
  getServiceStatus() {
    return {
      service: 'N8N WordPress Integration',
      webhookUrl: this.webhookUrl,
      hasSecret: !!this.webhookSecret,
      version: '1.0.0'
    };
  }
}

module.exports = new N8NWordPressService();
