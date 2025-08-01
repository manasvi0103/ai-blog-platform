/**
 * WordPress Integration Service for WattMonk Blog Platform
 * 
 * Production-ready WordPress service with:
 * - Clean WordPress REST API integration
 * - Elementor-compatible block generation
 * - WattMonk brand styling and SEO optimization
 * - Feature image upload and management
 * - Error handling and logging
 * 
 * @author WattMonk Technologies
 * @version 3.0.0 - Production Ready
 */

const axios = require('axios');
const Company = require('../models/Company');

class WordPressService {
  constructor() {
    this.defaultTimeout = 30000;
    this.maxRetries = 3;
  }

  /**
   * Deploy blog to WordPress with full SEO optimization
   * @param {Object} draftData - Blog draft data
   * @param {string} companyId - Company ID
   * @returns {Object} Deployment result with URLs
   */
  async deployToWordPress(draftData, companyId) {
    try {
      console.log(`🚀 Starting WordPress deployment for company: ${companyId}`);
      console.log(`📝 Title: ${draftData.title}`);
      console.log(`🎯 Focus Keyword: ${draftData.focusKeyword}`);

      // Get WordPress configuration
      const config = await this.getCompanyWordPressConfig(companyId);
      
      // Generate SEO-optimized slug
      const seoSlug = this.generateSEOSlug(draftData.focusKeyword || draftData.title);

      // Convert content to Elementor-compatible blocks
      const elementorContent = this.convertToElementorBlocks(draftData.content, draftData.focusKeyword);

      // Prepare WordPress post data with comprehensive SEO optimization
      // Note: Meta fields will be set after post creation due to WordPress REST API limitations
      const postData = {
        title: draftData.title,
        content: elementorContent,
        status: 'draft',
        slug: seoSlug,
        excerpt: draftData.metaDescription || this.generateExcerpt(draftData.content, 160)
      };

      // Store meta fields separately for post-creation update
      const metaFields = {
        // Yoast SEO meta fields (most common SEO plugin)
        _yoast_wpseo_title: draftData.metaTitle || draftData.title,
        _yoast_wpseo_metadesc: draftData.metaDescription || this.generateExcerpt(draftData.content, 160),
        _yoast_wpseo_focuskw: draftData.focusKeyword || '',
        _yoast_wpseo_meta_robots_noindex: '0',
        _yoast_wpseo_meta_robots_nofollow: '0',

        // RankMath SEO meta fields (alternative SEO plugin)
        rank_math_title: draftData.metaTitle || draftData.title,
        rank_math_description: draftData.metaDescription || this.generateExcerpt(draftData.content, 160),
        rank_math_focus_keyword: draftData.focusKeyword || '',

        // All in One SEO Pack meta fields (another popular SEO plugin)
        _aioseop_title: draftData.metaTitle || draftData.title,
        _aioseop_description: draftData.metaDescription || this.generateExcerpt(draftData.content, 160),
        _aioseop_keywords: draftData.focusKeyword || '',

        // SEOPress meta fields
        _seopress_titles_title: draftData.metaTitle || draftData.title,
        _seopress_titles_desc: draftData.metaDescription || this.generateExcerpt(draftData.content, 160),
        _seopress_analysis_target_kw: draftData.focusKeyword || ''
      };

      // Add meta fields to post data for initial attempt
      postData.meta = metaFields;

      // Handle categories and tags
      if (draftData.categories?.length > 0) {
        postData.categories = draftData.categories;
      }
      if (draftData.tags?.length > 0) {
        postData.tags = draftData.tags;
      }

      // Handle featured image upload
      await this.handleFeatureImageUpload(draftData, postData, companyId);

      // Create WordPress post
      const result = await this.createWordPressPost(postData, config);
      
      console.log(`✅ WordPress deployment successful: Post ID ${result.postId}`);
      return result;

    } catch (error) {
      console.error('❌ WordPress deployment failed:', error.message);

      // Return structured error response instead of throwing
      return {
        success: false,
        error: error.message,
        details: {
          originalError: error.message,
          timestamp: new Date().toISOString(),
          companyId: companyId
        }
      };
    }
  }

  /**
   * Handle feature image upload to WordPress
   * @param {Object} draftData - Draft data containing image info
   * @param {Object} postData - WordPress post data to modify
   * @param {string} companyId - Company ID
   */
  async handleFeatureImageUpload(draftData, postData, companyId) {
    if (draftData.featuredImage?.url) {
      try {
        console.log(`🖼️ Uploading featured image to WordPress feature image section...`);
        const mediaId = await this.uploadFeatureImageToWordPress(
          draftData.featuredImage.url, 
          draftData.featuredImage.altText || 'Featured image', 
          companyId
        );
        if (mediaId) {
          postData.featured_media = mediaId;
          console.log(`✅ Featured image uploaded to WordPress feature image section: ${mediaId}`);
        }
      } catch (imageError) {
        console.warn(`⚠️ Featured image upload failed:`, imageError.message);
        // Continue without image - don't fail the entire deployment
      }
    }
  }

  /**
   * Create WordPress post via REST API
   * @param {Object} postData - WordPress post data
   * @param {Object} config - WordPress configuration
   * @returns {Object} Creation result
   */
  async createWordPressPost(postData, config) {
    console.log(`🚀 Creating WordPress post with SEO optimization...`);
    console.log(`🔗 WordPress URL: ${config.baseUrl}/wp-json/wp/v2/posts`);
    console.log(`👤 Username: ${config.username}`);
    console.log(`📝 Post Title: ${postData.title}`);
    console.log(`📄 Meta Title: ${postData.meta?._yoast_wpseo_title || 'Not set'}`);
    console.log(`📄 Meta Description: ${postData.meta?._yoast_wpseo_metadesc || 'Not set'}`);

    try {
      // First create the post
      const response = await axios({
        method: 'POST',
        url: `${config.baseUrl}/wp-json/wp/v2/posts`,
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        data: postData,
        timeout: this.defaultTimeout,
        validateStatus: function (status) {
          // Accept any status code less than 500
          return status < 500;
        }
      });

      console.log(`📊 WordPress API Response Status: ${response.status}`);

      if (response.status === 404) {
        console.error(`❌ WordPress API endpoint not found (404)`);
        console.error(`🔗 Tried URL: ${config.baseUrl}/wp-json/wp/v2/posts`);
        console.error(`💡 Check if WordPress REST API is enabled and accessible`);
        throw new Error(`WordPress REST API not found. Please check if the WordPress site URL is correct and REST API is enabled.`);
      }

      if (response.status === 401) {
        console.error(`❌ WordPress authentication failed (401)`);
        console.error(`👤 Username: ${config.username}`);
        console.error(`💡 Check WordPress credentials and application password`);
        throw new Error(`WordPress authentication failed. Please check your username and application password.`);
      }

      if (response.status === 403) {
        console.error(`❌ WordPress access forbidden (403)`);
        console.error(`💡 User may not have permission to create posts`);
        throw new Error(`WordPress access forbidden. User may not have permission to create posts.`);
      }

      if (response.status !== 201) {
        console.error(`❌ WordPress API returned unexpected status: ${response.status}`);
        console.error(`📄 Response data:`, response.data);
        throw new Error(`WordPress API returned status: ${response.status}. ${response.data?.message || 'Unknown error'}`);
      }

      const postId = response.data.id;
      const editUrl = `${config.baseUrl}/wp-admin/post.php?post=${postId}&action=edit`;
      const previewUrl = response.data.link;

      console.log(`✅ WordPress post created successfully`);
      console.log(`📝 Post ID: ${postId}`);
      console.log(`📝 Edit URL: ${editUrl}`);
      console.log(`👁️ Preview URL: ${previewUrl}`);

      // Update meta fields using direct database approach
      if (postData.meta && Object.keys(postData.meta).length > 0) {
        try {
          console.log(`🔧 Updating SEO meta fields for post ${postId}...`);
          await this.updatePostMetaDirectly(postId, postData.meta, config);
          console.log(`✅ SEO meta fields updated successfully`);
        } catch (metaError) {
          console.warn(`⚠️ Failed to update meta fields:`, metaError.message);
          // Don't fail the entire operation for meta field issues
        }
      }

      return {
        success: true,
        postId: postId,
        editUrl: editUrl,
        previewUrl: previewUrl,
        wordpressId: postId,
        message: 'Successfully deployed to WordPress',
        seoInstructions: {
          metaTitle: postData.meta?._yoast_wpseo_title || postData.title,
          metaDescription: postData.meta?._yoast_wpseo_metadesc || postData.excerpt,
          focusKeyword: postData.meta?._yoast_wpseo_focuskw || 'Not specified',
          instructions: [
            'Go to WordPress admin and edit the post',
            'Scroll down to the SEO section (Yoast/RankMath/etc.)',
            `Set Meta Title: ${postData.meta?._yoast_wpseo_title || postData.title}`,
            `Set Meta Description: ${postData.meta?._yoast_wpseo_metadesc || postData.excerpt}`,
            `Set Focus Keyword: ${postData.meta?._yoast_wpseo_focuskw || 'No keyword specified'}`
          ]
        }
      };

    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        console.error(`❌ WordPress site not found: ${config.baseUrl}`);
        throw new Error(`WordPress site not found. Please check the site URL: ${config.baseUrl}`);
      }

      if (error.code === 'ECONNREFUSED') {
        console.error(`❌ Connection refused to WordPress site: ${config.baseUrl}`);
        throw new Error(`Cannot connect to WordPress site. Please check if the site is accessible: ${config.baseUrl}`);
      }

      if (error.code === 'ETIMEDOUT') {
        console.error(`❌ WordPress request timed out`);
        throw new Error(`WordPress request timed out. The site may be slow or unreachable.`);
      }

      // Re-throw the error if it's already a custom error message
      if (error.message.includes('WordPress')) {
        throw error;
      }

      console.error(`❌ Unexpected WordPress API error:`, error.message);
      throw new Error(`WordPress deployment failed: ${error.message}`);
    }
  }

  /**
   * Update post meta fields directly using WordPress database approach
   * @param {number} postId - WordPress post ID
   * @param {Object} metaFields - Meta fields to update
   * @param {Object} config - WordPress configuration
   */
  async updatePostMetaDirectly(postId, metaFields, config) {
    console.log(`🔧 Updating meta fields directly for post ${postId}...`);

    try {
      // Method 1: Try updating via post endpoint with meta fields
      console.log(`📝 Attempting to update post with meta fields...`);

      const updateResponse = await axios({
        method: 'POST',
        url: `${config.baseUrl}/wp-json/wp/v2/posts/${postId}`,
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Content-Type': 'application/json'
        },
        data: {
          meta: metaFields
        },
        timeout: this.defaultTimeout
      });

      if (updateResponse.status === 200) {
        console.log(`✅ Meta fields updated via post endpoint`);

        // Verify the update by fetching the post
        const verifyResponse = await axios({
          method: 'GET',
          url: `${config.baseUrl}/wp-json/wp/v2/posts/${postId}`,
          headers: {
            'Authorization': `Basic ${config.auth}`
          },
          timeout: this.defaultTimeout
        });

        if (verifyResponse.data.meta) {
          const updatedMeta = verifyResponse.data.meta;
          let successCount = 0;

          for (const [key, value] of Object.entries(metaFields)) {
            if (updatedMeta[key] === value) {
              successCount++;
              console.log(`   ✅ ${key}: Successfully set`);
            } else {
              console.log(`   ⚠️ ${key}: Not set (expected: ${value}, got: ${updatedMeta[key] || 'undefined'})`);
            }
          }

          console.log(`✅ Verified ${successCount}/${Object.keys(metaFields).length} meta fields`);
        }

        return true;
      } else {
        console.warn(`⚠️ Meta update returned status: ${updateResponse.status}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to update meta fields directly:`, error.response?.data?.message || error.message);

      // Method 2: Try using WordPress custom endpoint (if available)
      try {
        console.log(`🔄 Trying alternative meta update method...`);

        // Some WordPress installations have custom meta endpoints
        const customResponse = await axios({
          method: 'POST',
          url: `${config.baseUrl}/wp-json/custom/v1/post-meta/${postId}`,
          headers: {
            'Authorization': `Basic ${config.auth}`,
            'Content-Type': 'application/json'
          },
          data: metaFields,
          timeout: this.defaultTimeout
        });

        if (customResponse.status === 200) {
          console.log(`✅ Meta fields updated via custom endpoint`);
          return true;
        }
      } catch (customError) {
        console.warn(`⚠️ Custom meta endpoint not available`);
      }

      throw error;
    }
  }

  /**
   * Upload feature image specifically to WordPress feature image section
   * @param {string} imageUrl - Image URL to upload
   * @param {string} altText - Alt text for image
   * @param {string} companyId - Company ID
   * @returns {number} WordPress media ID
   */
  async uploadFeatureImageToWordPress(imageUrl, altText = 'Featured image', companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);
      console.log(`📤 Uploading feature image from: ${imageUrl.substring(0, 50)}...`);

      // Download the image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'AI-Blog-Platform/1.0'
        }
      });

      const buffer = Buffer.from(imageResponse.data);
      const contentType = imageResponse.headers['content-type'] || 'image/jpeg';

      // Determine file extension
      let extension = 'jpg';
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('gif')) extension = 'gif';
      else if (contentType.includes('webp')) extension = 'webp';

      const filename = `featured-image-${Date.now()}.${extension}`;

      // Create form data for WordPress upload
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', buffer, {
        filename: filename,
        contentType: contentType
      });

      // Upload to WordPress media library
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
        throw new Error(`Feature image upload failed: ${uploadResponse.status}`);
      }

      // Update alt text for the uploaded image
      if (altText && uploadResponse.data.id) {
        try {
          await axios.post(
            `${config.baseUrl}/wp-json/wp/v2/media/${uploadResponse.data.id}`,
            { 
              alt_text: altText,
              title: altText,
              description: altText
            },
            {
              headers: {
                'Authorization': `Basic ${config.auth}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          console.log(`✅ Feature image alt text updated: "${altText}"`);
        } catch (altError) {
          console.warn('⚠️ Alt text update failed:', altError.message);
        }
      }

      console.log(`✅ Feature image uploaded successfully: ${uploadResponse.data.source_url}`);
      return uploadResponse.data.id;

    } catch (error) {
      console.error('❌ Feature image upload error:', error.message);
      throw error;
    }
  }

  /**
   * Get WordPress configuration for company
   * @param {string} companyId - Company ID
   * @returns {Object} WordPress configuration
   */
  async getCompanyWordPressConfig(companyId) {
    console.log(`🔍 Getting WordPress config for company ID: ${companyId}`);

    const company = await Company.findById(companyId);
    if (!company) {
      console.error(`❌ Company not found with ID: ${companyId}`);
      throw new Error('Company not found');
    }

    console.log(`✅ Found company: ${company.name}`);
    console.log(`📋 WordPress config present: ${!!company.wordpressConfig}`);

    if (!company.wordpressConfig) {
      console.error(`❌ No WordPress configuration found for company: ${company.name}`);
      throw new Error('WordPress configuration not found for company');
    }

    const config = company.wordpressConfig;
    console.log(`🔧 Config details:`, {
      hasBaseUrl: !!config.baseUrl,
      hasUsername: !!config.username,
      hasAppPassword: !!config.appPassword,
      isActive: config.isActive,
      baseUrl: config.baseUrl,
      username: config.username
    });

    if (!config.baseUrl || !config.username || !config.appPassword) {
      console.error(`❌ Incomplete WordPress configuration for ${company.name}:`, {
        baseUrl: config.baseUrl,
        username: config.username,
        hasAppPassword: !!config.appPassword
      });
      throw new Error('Incomplete WordPress configuration');
    }

    // Clean and validate baseUrl
    let baseUrl = config.baseUrl.trim();

    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Ensure it starts with http:// or https://
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
    }

    console.log(`🔗 Cleaned baseUrl: ${baseUrl}`);

    // Create basic auth string
    const auth = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');

    return {
      baseUrl: baseUrl,
      auth: auth,
      username: config.username
    };
  }

  /**
   * Generate SEO-optimized slug from text
   * @param {string} text - Text to convert to slug
   * @returns {string} SEO-friendly slug
   */
  generateSEOSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length for SEO
  }

  /**
   * Generate excerpt from content
   * @param {string} content - Full content
   * @param {number} maxLength - Maximum length
   * @returns {string} Generated excerpt
   */
  generateExcerpt(content, maxLength = 160) {
    // Remove HTML tags
    const textOnly = content.replace(/<[^>]*>/g, '');

    // Truncate to maxLength
    if (textOnly.length <= maxLength) {
      return textOnly;
    }

    // Find last complete word within limit
    const truncated = textOnly.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  /**
   * Convert content to Elementor-compatible WordPress blocks
   * @param {string} content - HTML content to convert
   * @param {string} focusKeyword - SEO focus keyword
   * @returns {string} WordPress blocks with Elementor compatibility
   */
  convertToElementorBlocks(content, focusKeyword) {
    console.log('🔄 Converting content to Elementor-compatible blocks...');

    // WattMonk brand colors and typography
    const wattmonkStyles = {
      primaryFont: "'Inter', 'Segoe UI', 'Roboto', 'Arial', sans-serif",
      headingColor: "#1A202C",
      subHeadingColor: "#2D3748",
      textColor: "#4A5568",
      accentColor: "#FFD700",
      secondaryAccent: "#FF8C00",
      linkColor: "#3182CE",
      backgroundColor: "#FFF8E1"
    };

    let elementorContent = '';
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('<h1')) {
        const h1Content = trimmedLine.replace(/<\/?h1[^>]*>/g, '');
        elementorContent += this.wrapInWordPressBlock(h1Content, 'h1', wattmonkStyles);
      } else if (trimmedLine.startsWith('<h2')) {
        const h2Content = trimmedLine.replace(/<\/?h2[^>]*>/g, '');
        elementorContent += this.wrapInWordPressBlock(h2Content, 'h2', wattmonkStyles);
      } else if (trimmedLine.startsWith('<p')) {
        const pContent = trimmedLine.replace(/<\/?p[^>]*>/g, '');
        if (pContent.trim()) {
          elementorContent += this.wrapInWordPressBlock(pContent, 'paragraph', wattmonkStyles);
        }
      } else if (trimmedLine.includes('<img')) {
        // Handle images
        elementorContent += this.wrapInWordPressBlock(trimmedLine, 'image', wattmonkStyles);
      } else if (trimmedLine.trim().length > 0) {
        // Default to paragraph for any other content
        elementorContent += this.wrapInWordPressBlock(trimmedLine, 'paragraph', wattmonkStyles);
      }
    }

    // Add "You May Also Like" section at the end
    elementorContent += this.addRelatedArticlesSection(wattmonkStyles);

    console.log(`✅ Converted to ${elementorContent.split('<!-- wp:').length - 1} WordPress blocks`);
    return elementorContent;
  }

  /**
   * Wrap content in WordPress blocks with WattMonk styling
   * @param {string} content - Content to wrap
   * @param {string} type - Block type
   * @param {Object} styles - WattMonk styles object
   * @returns {string} WordPress block HTML
   */
  wrapInWordPressBlock(content, type, styles) {
    if (!content.trim()) return '';

    switch (type) {
      case 'paragraph':
        return `<!-- wp:group {"className":"elementor-section wattmonk-content"} -->\n<div class="wp-block-group elementor-section wattmonk-content">\n<!-- wp:paragraph {"className":"elementor-widget elementor-widget-text-editor","style":{"typography":{"fontSize":"16px","lineHeight":"1.7","fontFamily":"${styles.primaryFont}","fontWeight":"400"},"color":{"text":"${styles.textColor}"},"spacing":{"margin":{"bottom":"20px"}}}} -->\n<p class="elementor-widget elementor-widget-text-editor wattmonk-text" style="font-size:16px;line-height:1.7;font-family:${styles.primaryFont};font-weight:400;color:${styles.textColor};margin-bottom:20px;">${content.trim()}</p>\n<!-- /wp:paragraph -->\n</div>\n<!-- /wp:group -->\n\n`;

      case 'h2':
        return `<!-- wp:group {"className":"elementor-section wattmonk-heading"} -->\n<div class="wp-block-group elementor-section wattmonk-heading">\n<!-- wp:heading {"level":2,"className":"elementor-widget elementor-widget-heading","style":{"typography":{"fontSize":"28px","fontWeight":"700","lineHeight":"1.3","fontFamily":"${styles.primaryFont}"},"color":{"text":"${styles.subHeadingColor}"},"spacing":{"margin":{"top":"40px","bottom":"24px"}}}} -->\n<h2 class="elementor-widget elementor-widget-heading wattmonk-h2" style="font-size:28px;font-weight:700;line-height:1.3;font-family:${styles.primaryFont};color:${styles.subHeadingColor};margin-top:40px;margin-bottom:24px;">${content.trim()}</h2>\n<!-- /wp:heading -->\n</div>\n<!-- /wp:group -->\n\n`;

      case 'h1':
        return `<!-- wp:group {"className":"elementor-section wattmonk-main-heading"} -->\n<div class="wp-block-group elementor-section wattmonk-main-heading">\n<!-- wp:heading {"level":1,"className":"elementor-widget elementor-widget-heading","style":{"typography":{"fontSize":"42px","fontWeight":"800","lineHeight":"1.2","fontFamily":"${styles.primaryFont}"},"color":{"text":"${styles.headingColor}"},"spacing":{"margin":{"top":"0px","bottom":"30px"}}}} -->\n<h1 class="elementor-widget elementor-widget-heading wattmonk-h1" style="font-size:42px;font-weight:800;line-height:1.2;font-family:${styles.primaryFont};color:${styles.headingColor};margin-top:0px;margin-bottom:30px;">${content.trim()}</h1>\n<!-- /wp:heading -->\n</div>\n<!-- /wp:group -->\n\n`;

      default:
        return `<!-- wp:group {"className":"elementor-section wattmonk-content"} -->\n<div class="wp-block-group elementor-section wattmonk-content">\n<!-- wp:paragraph {"className":"elementor-widget elementor-widget-text-editor","style":{"typography":{"fontSize":"16px","lineHeight":"1.7","fontFamily":"${styles.primaryFont}","fontWeight":"400"},"color":{"text":"${styles.textColor}"},"spacing":{"margin":{"bottom":"20px"}}}} -->\n<p class="elementor-widget elementor-widget-text-editor wattmonk-text" style="font-size:16px;line-height:1.7;font-family:${styles.primaryFont};font-weight:400;color:${styles.textColor};margin-bottom:20px;">${content.trim()}</p>\n<!-- /wp:paragraph -->\n</div>\n<!-- /wp:group -->\n\n`;
    }
  }

  /**
   * Add "You May Also Like" related articles section
   * @param {Object} styles - WattMonk styles object
   * @returns {string} Related articles section HTML
   */
  addRelatedArticlesSection(styles) {
    return `<!-- wp:group {"className":"elementor-section related-articles wattmonk-related","style":{"spacing":{"padding":{"top":"50px","bottom":"40px"}},"border":{"top":{"color":"${styles.accentColor}","width":"3px"}},"background":{"color":"#FAFAFA"}}} -->\n<div class="wp-block-group elementor-section related-articles wattmonk-related" style="padding-top:50px;padding-bottom:40px;border-top:3px solid ${styles.accentColor};background-color:#FAFAFA;">\n<!-- wp:heading {"level":3,"className":"elementor-widget elementor-widget-heading","style":{"typography":{"fontSize":"28px","fontWeight":"700","fontFamily":"${styles.primaryFont}"},"color":{"text":"${styles.headingColor}"},"spacing":{"margin":{"bottom":"30px"}}}} -->\n<h3 class="elementor-widget elementor-widget-heading wattmonk-related-title" style="font-size:28px;font-weight:700;font-family:${styles.primaryFont};color:${styles.headingColor};margin-bottom:30px;text-align:center;">⚡ You May Also Like</h3>\n<!-- /wp:heading -->\n<!-- wp:list {"className":"elementor-widget elementor-widget-text-editor related-links wattmonk-links","style":{"typography":{"fontSize":"17px","lineHeight":"1.6","fontFamily":"${styles.primaryFont}"},"spacing":{"padding":{"left":"0px"}}}} -->\n<ul class="elementor-widget elementor-widget-text-editor related-links wattmonk-links" style="font-size:17px;line-height:1.6;font-family:${styles.primaryFont};padding-left:0px;list-style:none;max-width:800px;margin:0 auto;">\n<li style="margin-bottom:16px;padding:20px;background:${styles.backgroundColor};border-radius:12px;border-left:5px solid ${styles.accentColor};box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s ease;"><a href="https://www.wattmonk.com/solar-pto-process-to-accelerate-approval/" target="_blank" style="color:${styles.headingColor};text-decoration:none;font-weight:600;display:block;">📋 Solar PTO Guide: Avoid Delays & Speed Up Approvals</a><span style="color:#666;font-size:14px;margin-top:5px;display:block;">Complete guide to streamline your solar PTO process</span></li>\n<li style="margin-bottom:16px;padding:20px;background:${styles.backgroundColor};border-radius:12px;border-left:5px solid ${styles.accentColor};box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s ease;"><a href="https://www.wattmonk.com/service/pto-interconnection/" target="_blank" style="color:${styles.headingColor};text-decoration:none;font-weight:600;display:block;">⚡ Solar PTO Interconnection Made Easy</a><span style="color:#666;font-size:14px;margin-top:5px;display:block;">Professional interconnection services for solar projects</span></li>\n<li style="margin-bottom:16px;padding:20px;background:${styles.backgroundColor};border-radius:12px;border-left:5px solid ${styles.accentColor};box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s ease;"><a href="https://www.wattmonk.com/utility-interconnection/" target="_blank" style="color:${styles.headingColor};text-decoration:none;font-weight:600;display:block;">🔌 Utility Interconnection Services</a><span style="color:#666;font-size:14px;margin-top:5px;display:block;">Expert utility interconnection solutions</span></li>\n<li style="margin-bottom:16px;padding:20px;background:${styles.backgroundColor};border-radius:12px;border-left:5px solid ${styles.accentColor};box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s ease;"><a href="https://www.wattmonk.com/solar-pv-agrivoltaic-guide/" target="_blank" style="color:${styles.headingColor};text-decoration:none;font-weight:600;display:block;">🌱 Solar PV Agrivoltaic Complete Guide</a><span style="color:#666;font-size:14px;margin-top:5px;display:block;">Comprehensive guide to agrivoltaic solar systems</span></li>\n</ul>\n<!-- /wp:list -->\n</div>\n<!-- /wp:group -->\n\n`;
  }

  /**
   * Legacy method for backward compatibility
   * @param {Object} draftData - Draft data
   * @param {string} companyId - Company ID
   * @returns {Object} Creation result
   */
  async createDraft(draftData, companyId) {
    return await this.deployToWordPress(draftData, companyId);
  }

  /**
   * Test WordPress connection (legacy method)
   * @param {string} companyId - Company ID
   * @returns {Object} Connection test result
   */
  async testConnection(companyId) {
    try {
      const config = await this.getCompanyWordPressConfig(companyId);
      console.log(`🔍 Testing WordPress connection to: ${config.baseUrl}`);

      // Simple test - try to get site info
      const response = await axios.get(`${config.baseUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${config.auth}`
        },
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      if (response.status === 404) {
        console.error(`❌ WordPress REST API not found (404) at: ${config.baseUrl}/wp-json/wp/v2/users/me`);
        return {
          success: false,
          message: 'WordPress REST API not found',
          error: 'The WordPress REST API endpoint is not accessible. Please check if REST API is enabled.'
        };
      }

      if (response.status === 401) {
        console.error(`❌ WordPress authentication failed (401)`);
        return {
          success: false,
          message: 'WordPress authentication failed',
          error: 'Invalid username or application password. Please check your WordPress credentials.'
        };
      }

      if (response.status !== 200) {
        console.error(`❌ WordPress API returned status: ${response.status}`);
        return {
          success: false,
          message: 'WordPress connection failed',
          error: `WordPress API returned status: ${response.status}`
        };
      }

      console.log(`✅ WordPress connection successful`);
      return {
        success: true,
        message: 'WordPress connection successful',
        user: response.data.name || 'Unknown'
      };
    } catch (error) {
      console.error(`❌ WordPress connection test failed:`, error.message);

      let errorMessage = 'WordPress connection failed';
      if (error.code === 'ENOTFOUND') {
        errorMessage = 'WordPress site not found. Please check the site URL.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to WordPress site. Please check if the site is accessible.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'WordPress connection timed out. The site may be slow or unreachable.';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }
}

module.exports = WordPressService;
