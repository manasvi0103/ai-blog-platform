const axios = require('axios');
const Company = require('../models/Company');
const n8nWordpressService = require('./n8nWordpressService');

class WordPressService {
  constructor() {
    this.defaultTimeout = 30000;
    this.maxRetries = 3;
  }

  async deployToWordPress(draftData, companyId) {
    try {
      // Get WordPress configuration
      const config = await this.getCompanyWordPressConfig(companyId);
      
      console.log('📝 Processing content and uploading media...');
      // Process content and upload any embedded images
      const processedContent = await this.processContentAndUploadMedia(draftData.content, config);

      // Upload featured image if present
      let featuredMediaId = null;
      if (draftData.featuredImage) {
        try {
          const uploadedImage = await this.uploadMediaToWordPress(draftData.featuredImage, config);
          featuredMediaId = uploadedImage.id;
        } catch (error) {
          console.warn('Failed to upload featured image:', error);
        }
      }
      
      console.log('📝 Preparing WordPress post data...');
      const postData = {
        title: draftData.title,
        content: processedContent,
        status: 'draft',
        featured_media: featuredMediaId,
        meta: {
          _yoast_wpseo_metadesc: draftData.metaDescription,
          _yoast_wpseo_focuskw: draftData.focusKeyword,
          _yoast_wpseo_title: draftData.metaTitle
        }
      };

      // Create the WordPress post
      const response = await axios({
        method: 'POST',
        url: `${config.baseUrl}/wp-json/wp/v2/posts`,
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        data: postData,
        timeout: this.defaultTimeout
      });

      if (response.status === 201) {
        const draftUrl = `${config.baseUrl}/wp-admin/post.php?post=${response.data.id}&action=edit`;
        console.log('✅ WordPress draft created successfully:', draftUrl);

        return {
          success: true,
          wordpressId: response.data.id,
          draftUrl: draftUrl,
          previewUrl: response.data.link,
          editUrl: draftUrl,
          message: 'Draft created successfully'
        };
      } else {
        throw new Error(`WordPress API returned unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ WordPress deployment failed:', error.message);
      throw error;
    }
  }

  // Enhanced: Upload image to WordPress with better error handling and file type detection
  async uploadMediaToWordPress(imageUrl, config) {
    try {
      console.log(`📤 Downloading image from: ${imageUrl.substring(0, 50)}...`);

      // Download image from URL with timeout and proper headers
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'AI-Blog-Platform/1.0'
        }
      });

      const buffer = Buffer.from(imageResponse.data);
      const contentType = imageResponse.headers['content-type'] || 'image/jpeg';

      // Determine file extension from content type
      let extension = 'jpg';
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('gif')) extension = 'gif';
      else if (contentType.includes('webp')) extension = 'webp';

      const filename = `ai-blog-image-${Date.now()}.${extension}`;

      console.log(`📁 Uploading as: ${filename} (${contentType})`);

      // Create form data for WordPress upload
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', buffer, {
        filename: filename,
        contentType: contentType
      });

      const uploadResponse = await axios({
        method: 'POST',
        url: `${config.baseUrl}/wp-json/wp/v2/media`,
        headers: {
          'Authorization': `Basic ${config.auth}`,
          ...formData.getHeaders()
        },
        data: formData,
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (uploadResponse.status !== 201) {
        throw new Error(`WordPress media upload failed: ${uploadResponse.status}`);
      }

      console.log(`✅ Image uploaded to WordPress: ${uploadResponse.data.source_url}`);

      return {
        id: uploadResponse.data.id,
        url: uploadResponse.data.source_url,
        title: uploadResponse.data.title?.rendered || filename,
        alt: uploadResponse.data.alt_text || ''
      };
    } catch (error) {
      console.error('❌ Failed to upload image to WordPress:', error.message);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  // Enhanced: Process content and upload images with better error handling
  async processContentAndUploadMedia(content, config) {
    try {
      let processedContent = content;
      console.log('🖼️ Processing content for image uploads...');

      // Find all image URLs in content (including figure tags)
      const imageUrlRegex = /<img[^>]+src="([^">]+)"[^>]*>/g;
      const matches = [];
      let match;

      // Collect all matches first
      while ((match = imageUrlRegex.exec(content)) !== null) {
        matches.push({
          fullMatch: match[0],
          imageUrl: match[1]
        });
      }

      console.log(`📸 Found ${matches.length} images to process`);

      // Process each image
      for (const imageMatch of matches) {
        const { fullMatch, imageUrl } = imageMatch;

        // Skip if already a WordPress URL or invalid URL
        if (!imageUrl || imageUrl.includes('wp-content') || imageUrl.includes('wordpress')) {
          console.log(`⏭️ Skipping WordPress URL: ${imageUrl}`);
          continue;
        }

        if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
          try {
            console.log(`📤 Uploading image: ${imageUrl.substring(0, 50)}...`);
            const uploadedImage = await this.uploadMediaToWordPress(imageUrl, config);

            // Replace the entire img tag with updated URL
            const updatedImgTag = fullMatch.replace(imageUrl, uploadedImage.url);
            processedContent = processedContent.replace(fullMatch, updatedImgTag);

            console.log(`✅ Image uploaded successfully: ${uploadedImage.url}`);
          } catch (imageError) {
            console.warn(`⚠️ Failed to upload image ${imageUrl}:`, imageError.message);
            // Continue with original URL if upload fails
          }
        }
      }

      console.log(`✅ Content processing complete. Final length: ${processedContent.length} chars`);
      return processedContent;
    } catch (error) {
      console.error('❌ Failed to process content and upload media:', error);
      // Return original content if processing fails
      return content;
    }
  }

  validateEnvironment() {
    const requiredEnvVars = {
      'WORDPRESS_BASE_URL': process.env.WORDPRESS_BASE_URL,
      'WORDPRESS_USERNAME': process.env.WORDPRESS_USERNAME,
      'WORDPRESS_APP_PASSWORD': process.env.WORDPRESS_APP_PASSWORD
    };

    const missing = [];
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      console.error('❌ Missing required WordPress environment variables:', missing.join(', '));
      console.log('ℹ️ Please check your .env file and ensure all WordPress credentials are properly configured');
    } else {
      console.log('✅ WordPress environment variables validated successfully');
    }
  }

  // FIXED: Robust environment config with detailed error reporting
  async getCompanyWordPressConfig(companyId) {
    try {
      // If no companyId is provided, use environment variables
      if (!companyId) {
        console.log('ℹ️ No company ID provided, using environment variables');
        return {
          baseUrl: process.env.WORDPRESS_BASE_URL.replace(/\/$/, ''),
          auth: Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`).toString('base64')
        };
      }

      console.log(`🔍 Getting WordPress config for company: ${companyId}`);
      
      const company = await Company.findById(companyId);
      if (!company) {
        console.warn(`⚠️ Company not found: ${companyId}, falling back to environment variables`);
        return {
          baseUrl: process.env.WORDPRESS_BASE_URL.replace(/\/$/, ''),
          auth: Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`).toString('base64')
        };
      }

      // Check if company has WordPress credentials
      if (!company.wordpressUrl || !company.wordpressUsername || !company.wordpressPassword) {
        console.warn(`⚠️ Company ${companyId} missing WordPress credentials, using environment fallback`);
        return {
          baseUrl: process.env.WORDPRESS_BASE_URL.replace(/\/$/, ''),
          auth: Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`).toString('base64')
        };
      }

      return {
        baseUrl: company.wordpressUrl.replace(/\/$/, ''),
        auth: Buffer.from(`${company.wordpressUsername}:${company.wordpressPassword}`).toString('base64')
      };
    } catch (error) {
      console.error('❌ WordPress config error:', error.message);
      throw error;
    }
  }

  // Enhanced connection test method with detailed diagnostics
  async testConnection(companyId) {
    try {
      console.log('🔄 Testing WordPress connection...');
      
      // Step 1: Get and validate configuration
      const config = await this.getCompanyWordPressConfig(companyId);
      
      console.log('📝 WordPress config:', {
        baseUrl: config.baseUrl,
        hasAuth: !!config.auth
      });

      try {
        // Step 2: Test basic WordPress connection
        const wpResponse = await axios({
          method: 'GET',
          url: `${config.baseUrl}/wp-json`,
          headers: {
            'Authorization': `Basic ${config.auth}`,
            'Content-Type': 'application/json'
          },
          timeout: this.defaultTimeout,
          validateStatus: () => true // Don't throw on any status code
        });

        if (wpResponse.status !== 200) {
          throw new Error(`WordPress connection failed: ${wpResponse.status}`);
        }

        console.log('✅ Basic WordPress connection successful');

        // Step 3: Test REST API access
        const apiResponse = await axios({
          method: 'GET',
          url: `${config.baseUrl}/wp-json/wp/v2/posts?per_page=1`,
          headers: {
            'Authorization': `Basic ${config.auth}`,
            'Content-Type': 'application/json'
          },
          timeout: this.defaultTimeout,
          validateStatus: () => true
        });

        if (apiResponse.status !== 200) {
          throw new Error(`WordPress REST API access failed: ${apiResponse.status}`);
        }

        console.log('✅ WordPress REST API access successful');

        return {
          success: true,
          direct: {
            success: true,
            userInfo: wpResponse.data
          },
          overall: {
            success: true,
            method: 'direct'
          }
        };
      } catch (error) {
        console.error('❌ WordPress connection error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });

        return {
          success: false,
          direct: {
            success: false,
            error: error.message,
            details: error.response?.data
          },
          overall: {
            success: false,
            method: 'failed',
            error: error.message
          }
        };
      }
    } catch (error) {
      console.error('❌ WordPress configuration error:', error.message);
      return { 
        success: false, 
        error: error.message,
        details: { configError: true }
      };
    }
  }

  // ENHANCED: Direct WordPress API integration with proper URL handling
  async createDraft(draftData, companyId) {
    console.log(`📝 Creating WordPress draft for company: ${companyId}`);

    try {
      // Validate input
      if (!draftData || !draftData.title || !draftData.content) {
        throw new Error('Title and content are required');
      }

      // Get WordPress configuration
      const config = await this.getCompanyWordPressConfig(companyId);
      
      console.log('� Preparing WordPress post data...');
      const postData = {
        title: draftData.title,
        content: draftData.content,
        status: 'draft',
        meta: {
          _yoast_wpseo_metadesc: draftData.metaDescription,
          _yoast_wpseo_focuskw: draftData.focusKeyword,
          _yoast_wpseo_title: draftData.metaTitle
        }
      };

      // Create draft in WordPress
      const response = await axios({
        method: 'POST',
        url: `${config.baseUrl}/wp-json/wp/v2/posts`,
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        data: postData,
        timeout: this.defaultTimeout
      });

      if (response.status === 201) {
        const draftUrl = `${config.baseUrl}/wp-admin/post.php?post=${response.data.id}&action=edit`;
        console.log('✅ WordPress draft created successfully:', draftUrl);
        
        return {
          success: true,
          wordpressId: response.data.id,
          draftUrl: draftUrl,
          previewUrl: response.data.link,
          editUrl: draftUrl,
          message: 'Draft created successfully'
        };
      } else {
        throw new Error(`WordPress API returned unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.error('🚨 Both N8N and direct WordPress failed:', error.message);
      return {
        success: false,
        error: error.message,
        details: { source: 'wordpress-service-error' }
      };
    }
  }

  // Direct WordPress API method (fallback)
  async createDraftDirect(draftData, companyId) {
    console.log(`📝 Creating WordPress draft directly for company: ${companyId}`);

    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      console.log(`📄 Title: ${draftData.title}`);

      // Generate SEO-friendly slug from focus keyword
      const seoSlug = this.generateSEOSlug(draftData.focusKeyword || draftData.title);

      const postData = {
        title: draftData.title,
        content: draftData.content,
        status: 'draft',
        slug: seoSlug,
        excerpt: draftData.excerpt || this.generateExcerpt(draftData.content),
        meta: {
          _yoast_wpseo_title: draftData.metaTitle || draftData.title,
          _yoast_wpseo_metadesc: draftData.metaDescription || this.generateExcerpt(draftData.content, 160),
          _yoast_wpseo_focuskw: draftData.focusKeyword || '',
          ai_generated: true,
          ai_platform: 'AI-Blog-Platform',
          generation_date: new Date().toISOString()
        }
      };

      // Handle categories
      if (draftData.categories?.length > 0) {
        postData.categories = draftData.categories;
      }

      // Handle tags
      if (draftData.tags?.length > 0) {
        postData.tags = draftData.tags;
      }

      // Handle featured image (don't fail draft if image fails)
      if (draftData.featuredImage?.url) {
        try {
          console.log(`🖼️ Uploading featured image...`);
          const mediaId = await this.uploadImage(draftData.featuredImage.url, draftData.featuredImage.altText, companyId);
          if (mediaId) {
            postData.featured_media = mediaId;
            console.log(`✅ Featured image uploaded: ${mediaId}`);
          }
        } catch (imageError) {
          console.warn(`⚠️ Featured image upload failed:`, imageError.message);
          // Continue without image
        }
      }

      console.log(`🚀 Creating WordPress post...`);
      const response = await axios.post(
        `${config.baseUrl}/wp-json/wp/v2/posts`,
        postData,
        {
          headers: {
            'Authorization': `Basic ${config.auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Blog-Platform/1.0'
          },
          timeout: this.defaultTimeout,
          validateStatus: () => true // Accept all status codes
        }
      );

      console.log(`📝 Post Response: ${response.status} ${response.statusText}`);

      if (response.status === 401) {
        throw new Error('Authentication failed during post creation');
      }

      if (response.status === 403) {
        throw new Error('Permission denied. User cannot create posts');
      }

      if (response.status !== 201) {
        const errorMsg = response.data?.message || `Post creation failed: ${response.status}`;
        throw new Error(errorMsg);
      }

      console.log(`✅ WordPress draft created successfully: ${response.data.id}`);

      return {
        success: true,
        wordpressId: response.data.id,
        editUrl: `${config.baseUrl}/wp-admin/post.php?post=${response.data.id}&action=edit`,
        previewUrl: response.data.link,
        viewUrl: response.data.guid?.rendered || response.data.link,
        status: response.data.status,
        publishedDate: response.data.date,
        modifiedDate: response.data.modified,
        companyId,
        postData: {
          title: response.data.title?.rendered,
          slug: response.data.slug,
          excerpt: response.data.excerpt?.rendered
        }
      };

    } catch (error) {
      console.error('❌ WordPress draft creation failed:', error.message);

      return {
        success: false,
        error: error.message,
        details: {
          status: error.response?.status,
          code: error.code,
          data: error.response?.data,
          originalMessage: error.message
        },
        companyId
      };
    }
  }

  // Helper: Format error messages
  formatErrorMessage(error) {
    if (error.code === 'ENOTFOUND') {
      return 'WordPress site not found. Please check the URL.';
    }
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused. WordPress site may be offline.';
    }
    if (error.code === 'ETIMEDOUT') {
      return 'Connection timed out. WordPress site is not responding.';
    }
    if (error.response?.status === 401) {
      return 'Authentication failed. Check username and application password.';
    }
    if (error.response?.status === 403) {
      return 'Access forbidden. User needs proper permissions.';
    }
    if (error.response?.status === 404) {
      return 'WordPress REST API not found. Enable pretty permalinks.';
    }
    
    return error.response?.data?.message || error.message || 'Unknown error occurred';
  }

  // Helper: Generate excerpt
  generateExcerpt(content, maxLength = 160) {
    if (!content) return '';

    const textContent = content.replace(/<[^>]*>/g, '').trim();

    if (textContent.length <= maxLength) return textContent;

    const truncated = textContent.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return (lastSpace > maxLength * 0.8 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }

  generateSEOSlug(text) {
    if (!text) return 'blog-post';

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length for SEO
  }

  // FIXED: Image upload with proper error handling
  async uploadImage(imageUrl, altText = '', companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      // Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'AI-Blog-Platform/1.0'
        }
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
          timeout: 30000,
          validateStatus: () => true
        }
      );

      if (uploadResponse.status !== 201) {
        throw new Error(`Image upload failed: ${uploadResponse.status}`);
      }

      // Update alt text
      if (altText && uploadResponse.data.id) {
        try {
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
        } catch (altError) {
          console.warn('⚠️ Alt text update failed:', altError.message);
        }
      }

      return uploadResponse.data.id;
      
    } catch (error) {
      console.error('❌ Image upload error:', error.message);
      throw error; // Let calling code handle this
    }
  }

  // Get draft posts
  async getDraftPosts(companyId, params = {}) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      const response = await axios.get(`${config.baseUrl}/wp-json/wp/v2/posts`, {
        params: {
          status: 'draft',
          per_page: params.perPage || 10,
          page: params.page || 1,
          orderby: params.orderBy || 'date',
          order: params.order || 'desc',
          _embed: true
        },
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        timeout: this.defaultTimeout,
        validateStatus: () => true
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      return {
        success: true,
        data: response.data,
        totalPages: parseInt(response.headers['x-wp-totalpages']) || 1,
        total: parseInt(response.headers['x-wp-total']) || 0
      };
      
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error)
      };
    }
  }

  // Get single draft
  async getDraftPost(postId, companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      const response = await axios.get(`${config.baseUrl}/wp-json/wp/v2/posts/${postId}`, {
        params: { _embed: true },
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        timeout: this.defaultTimeout,
        validateStatus: () => true
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch draft: ${response.status}`);
      }

      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error)
      };
    }
  }

  // Publish draft
  async publishDraft(postId, companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      const response = await axios.put(`${config.baseUrl}/wp-json/wp/v2/posts/${postId}`, {
        status: 'publish'
      }, {
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        timeout: this.defaultTimeout,
        validateStatus: () => true
      });

      if (response.status !== 200) {
        throw new Error(`Failed to publish draft: ${response.status}`);
      }

      console.log(`🚀 Draft ${postId} published successfully`);

      return {
        success: true,
        data: response.data,
        publishedUrl: response.data.link
      };
      
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error)
      };
    }
  }

  // Delete draft
  async deleteDraft(postId, companyId, permanent = false) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);

      const response = await axios.delete(`${config.baseUrl}/wp-json/wp/v2/posts/${postId}`, {
        params: { force: permanent },
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        timeout: this.defaultTimeout,
        validateStatus: () => true
      });

      if (response.status !== 200) {
        throw new Error(`Failed to delete draft: ${response.status}`);
      }

      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error)
      };
    }
  }

  // Update draft
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
          timeout: this.defaultTimeout,
          validateStatus: () => true
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update draft: ${response.status}`);
      }

      return {
        success: true,
        wordpressId: response.data.id,
        companyId
      };
      
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
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
