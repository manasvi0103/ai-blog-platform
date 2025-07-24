const axios = require('axios');
const Company = require('../models/Company');

class WordPressService {
  constructor() {
    // Remove global WordPress config since each company has its own
  }

  // Get WordPress config for a specific company
  async getCompanyWordPressConfig(companyId) {
    try {
      const company = await Company.findById(companyId);
      if (!company || !company.wordpressConfig) {
        throw new Error('Company WordPress configuration not found');
      }
      
      if (!company.wordpressConfig.isActive) {
        throw new Error('WordPress configuration is disabled for this company');
      }

      return {
        baseUrl: company.wordpressConfig.baseUrl,
        username: company.wordpressConfig.username,
        appPassword: company.wordpressConfig.appPassword,
        auth: Buffer.from(`${company.wordpressConfig.username}:${company.wordpressConfig.appPassword}`).toString('base64')
      };
    } catch (error) {
      console.error('WordPress config error:', error);
      throw error;
    }
  }

  // Test WordPress connection for a company
  async testConnection(companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);
      
      const response = await axios.get(`${config.baseUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Update connection status
      await Company.findByIdAndUpdate(companyId, {
        'wordpressConfig.connectionStatus': 'connected',
        'wordpressConfig.lastConnectionTest': new Date()
      });

      return {
        success: true,
        userInfo: {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          roles: response.data.roles
        }
      };
    } catch (error) {
      // Update connection status to failed
      await Company.findByIdAndUpdate(companyId, {
        'wordpressConfig.connectionStatus': 'failed',
        'wordpressConfig.lastConnectionTest': new Date()
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Create draft for specific company
  async createDraft(draftData, companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      const postData = {
        title: draftData.title,
        content: draftData.content,
        status: 'draft',
        meta: {
          _yoast_wpseo_title: draftData.metaTitle,
          _yoast_wpseo_metadesc: draftData.metaDescription
        }
      };

      if (draftData.featuredImage?.url) {
        const mediaId = await this.uploadImage(draftData.featuredImage.url, draftData.featuredImage.altText, companyId);
        if (mediaId) {
          postData.featured_media = mediaId;
        }
      }

      const response = await axios.post(
        `${config.baseUrl}/wp-json/wp/v2/posts`,
        postData,
        {
          headers: {
            'Authorization': `Basic ${config.auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        wordpressId: response.data.id,
        editUrl: `${config.baseUrl}/wp-admin/post.php?post=${response.data.id}&action=edit`,
        previewUrl: response.data.link,
        companyId
      };
    } catch (error) {
      console.error('WordPress draft creation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        companyId
      };
    }
  }

  // Upload image for specific company
  async uploadImage(imageUrl, altText = '', companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      // Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000
      });

      const fileName = imageUrl.split('/').pop() || 'image.jpg';
      
      // Upload to WordPress
      const uploadResponse = await axios.post(
        `${config.baseUrl}/wp-json/wp/v2/media`,
        imageResponse.data,
        {
          headers: {
            'Authorization': `Basic ${config.auth}`,
            'Content-Type': imageResponse.headers['content-type'],
            'Content-Disposition': `attachment; filename="${fileName}"`
          },
          timeout: 30000
        }
      );

      // Update alt text if provided
      if (altText && uploadResponse.data.id) {
        await axios.post(
          `${config.baseUrl}/wp-json/wp/v2/media/${uploadResponse.data.id}`,
          { alt_text: altText },
          {
            headers: {
              'Authorization': `Basic ${config.auth}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
      }

      return uploadResponse.data.id;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  }

  // Update draft for specific company
  async updateDraft(wordpressId, draftData, companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      const response = await axios.post(
        `${config.baseUrl}/wp-json/wp/v2/posts/${wordpressId}`,
        {
          title: draftData.title,
          content: draftData.content,
          meta: {
            _yoast_wpseo_title: draftData.metaTitle,
            _yoast_wpseo_metadesc: draftData.metaDescription
          }
        },
        {
          headers: {
            'Authorization': `Basic ${config.auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        wordpressId: response.data.id,
        companyId
      };
    } catch (error) {
      console.error('WordPress update error:', error);
      return {
        success: false,
        error: error.message,
        companyId
      };
    }
  }

  // Get all WordPress sites status
  async getAllWordPressSitesStatus() {
    try {
      const companies = await Company.find({ 
        isActive: true,
        'wordpressConfig.isActive': true 
      }).select('name wordpressConfig');

      const statusChecks = await Promise.allSettled(
        companies.map(company => this.testConnection(company._id))
      );

      return companies.map((company, index) => ({
        companyId: company._id,
        companyName: company.name,
        wordpressUrl: company.wordpressConfig.baseUrl,
        status: statusChecks[index].status === 'fulfilled' ? 
          statusChecks[index].value : 
          { success: false, error: statusChecks[index].reason?.message },
        lastTested: company.wordpressConfig.lastConnectionTest,
        connectionStatus: company.wordpressConfig.connectionStatus
      }));
    } catch (error) {
      console.error('WordPress status check error:', error);
      throw error;
    }
  }
}

module.exports = new WordPressService();