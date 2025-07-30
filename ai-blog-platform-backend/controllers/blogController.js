// controllers/blogController.js
const BlogData = require('../models/BlogData');
const ContentBlock = require('../models/ContentBlock');
const Draft = require('../models/Draft');
const Company = require('../models/Company');
const geminiService = require('../services/geminiService');
const trendService = require('../services/trendService');
const wordpressService = require('../services/wordpressService');
const { clearCache } = require('../middleware/cache');

class BlogController {
  // Create a complete blog workflow
  async createBlogWorkflow(req, res) {
    try {
      const { companyId, focusKeyword, articleFormat, wordCount, targetAudience, objective } = req.body;
      
      // Get company context
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Create blog entry
      const blog = new BlogData({
        companyId,
        focusKeyword,
        articleFormat,
        wordCount,
        targetAudience,
        objective,
        status: 'in-progress'
      });
      await blog.save();

      // Fetch trend data for context
      const trends = await trendService.getCompetitorAnalysis(focusKeyword, 3);
      
      // Generate H1 alternatives
      const h1Alternatives = await geminiService.generateH1Alternatives(
        focusKeyword, 
        articleFormat, 
        company
      );

      // Generate keyword suggestions
      const keywordSuggestions = await geminiService.generateKeywordSuggestions(
        focusKeyword,
        company
      );

      // Create initial content structure
      const contentStructure = await this.generateContentStructure(
        blog._id,
        h1Alternatives[0],
        company,
        trends
      );

      // Clear related caches
      clearCache('blogs');
      clearCache('content');

      res.status(201).json({
        blog,
        h1Alternatives,
        keywordSuggestions,
        contentStructure,
        trends: trends.slice(0, 3),
        message: 'Blog workflow created successfully'
      });
    } catch (error) {
      console.error('Blog workflow creation error:', error);
      res.status(500).json({ message: 'Failed to create blog workflow' });
    }
  }

  // Generate content structure based on article format
  async generateContentStructure(blogId, h1Title, company, trends = []) {
    const contentBlocks = [];
    
    try {
      // H1 Block
      const h1Block = new ContentBlock({
        blogId,
        blockType: 'h1',
        content: h1Title,
        order: 1,
        metadata: {
          aiGenerated: true,
          source: 'gemini',
          wordCount: h1Title.split(' ').length
        }
      });
      contentBlocks.push(await h1Block.save());

      // Introduction paragraph
      const introPrompt = `Write an engaging introduction paragraph for an article titled "${h1Title}". Make it compelling and include the main value proposition.`;
      const introContent = await geminiService.generateContent(introPrompt, company);
      
      const introBlock = new ContentBlock({
        blogId,
        blockType: 'paragraph',
        content: introContent.content,
        order: 2,
        metadata: {
          aiGenerated: true,
          source: 'gemini',
          keywords: introContent.keywords,
          wordCount: introContent.wordCount
        }
      });
      contentBlocks.push(await introBlock.save());

      // Generate structure based on article format
      const blog = await BlogData.findById(blogId);
      const structureBlocks = await this.generateFormatSpecificStructure(
        blog,
        company,
        trends,
        3 // Starting order after intro
      );

      contentBlocks.push(...structureBlocks);
      return contentBlocks;
    } catch (error) {
      console.error('Content structure generation error:', error);
      return contentBlocks;
    }
  }

  // Generate structure based on article format
  async generateFormatSpecificStructure(blog, company, trends, startOrder) {
    const blocks = [];
    let order = startOrder;

    switch (blog.articleFormat) {
      case 'how-to':
        blocks.push(...await this.generateHowToStructure(blog, company, order));
        break;
      case 'listicle':
        blocks.push(...await this.generateListicleStructure(blog, company, order));
        break;
      case 'guide':
        blocks.push(...await this.generateGuideStructure(blog, company, trends, order));
        break;
      case 'comparison':
        blocks.push(...await this.generateComparisonStructure(blog, company, order));
        break;
      default:
        blocks.push(...await this.generateDefaultStructure(blog, company, order));
    }

    return blocks;
  }

  async generateHowToStructure(blog, company, startOrder) {
    const blocks = [];
    let order = startOrder;

    // Prerequisites section
    const prereqPrompt = `Create an H2 heading for prerequisites needed for ${blog.focusKeyword}`;
    const prereqHeading = await geminiService.generateContent(prereqPrompt, company);
    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: prereqHeading.content,
      order: order++,
      metadata: { aiGenerated: true, source: 'gemini' }
    }));

    // Step-by-step sections (generate 5 steps)
    for (let i = 1; i <= 5; i++) {
      const stepPrompt = `Create an H2 heading for step ${i} of ${blog.focusKeyword} process`;
      const stepHeading = await geminiService.generateContent(stepPrompt, company);
      blocks.push(new ContentBlock({
        blogId: blog._id,
        blockType: 'h2',
        content: stepHeading.content,
        order: order++,
        metadata: { aiGenerated: true, source: 'gemini' }
      }));
    }

    // Save all blocks
    return await Promise.all(blocks.map(block => block.save()));
  }

  async generateListicleStructure(blog, company, startOrder) {
    const blocks = [];
    let order = startOrder;

    // Generate list items (7-10 items typically)
    const itemCount = Math.floor(Math.random() * 4) + 7; // 7-10 items
    
    for (let i = 1; i <= itemCount; i++) {
      const itemPrompt = `Create an H2 heading for item ${i} in a listicle about ${blog.focusKeyword}`;
      const itemHeading = await geminiService.generateContent(itemPrompt, company);
      blocks.push(new ContentBlock({
        blogId: blog._id,
        blockType: 'h2',
        content: `${i}. ${itemHeading.content}`,
        order: order++,
        metadata: { aiGenerated: true, source: 'gemini' }
      }));
    }

    return await Promise.all(blocks.map(block => block.save()));
  }

  async generateGuideStructure(blog, company, trends, startOrder) {
    const blocks = [];
    let order = startOrder;

    // Overview section
    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: `Understanding ${blog.focusKeyword}: Overview`,
      order: order++,
      metadata: { aiGenerated: false, source: 'template' }
    }));

    // Key considerations
    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: `Key Considerations for ${blog.focusKeyword}`,
      order: order++,
      metadata: { aiGenerated: false, source: 'template' }
    }));

    // Best practices
    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: `Best Practices and Tips`,
      order: order++,
      metadata: { aiGenerated: false, source: 'template' }
    }));

    // Common mistakes
    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: `Common Mistakes to Avoid`,
      order: order++,
      metadata: { aiGenerated: false, source: 'template' }
    }));

    return await Promise.all(blocks.map(block => block.save()));
  }

  async generateComparisonStructure(blog, company, startOrder) {
    const blocks = [];
    let order = startOrder;

    // Comparison criteria
    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: 'Comparison Criteria',
      order: order++,
      metadata: { aiGenerated: false, source: 'template' }
    }));

    // Option A vs Option B sections
    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: 'Option A: Detailed Analysis',
      order: order++,
      metadata: { aiGenerated: false, source: 'template' }
    }));

    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: 'Option B: Detailed Analysis',
      order: order++,
      metadata: { aiGenerated: false, source: 'template' }
    }));

    // Final recommendation
    blocks.push(new ContentBlock({
      blogId: blog._id,
      blockType: 'h2',
      content: 'Our Recommendation',
      order: order++,
      metadata: { aiGenerated: false, source: 'template' }
    }));

    return await Promise.all(blocks.map(block => block.save()));
  }

  async generateDefaultStructure(blog, company, startOrder) {
    const blocks = [];
    let order = startOrder;

    // Generic structure
    const sections = [
      'What You Need to Know',
      'Key Benefits',
      'Implementation Steps',
      'Final Thoughts'
    ];

    for (const section of sections) {
      blocks.push(new ContentBlock({
        blogId: blog._id,
        blockType: 'h2',
        content: section,
        order: order++,
        metadata: { aiGenerated: false, source: 'template' }
      }));
    }

    return await Promise.all(blocks.map(block => block.save()));
  }

  // Generate complete draft from content blocks
  async generateDraft(req, res) {
    try {
      const { blogId } = req.params;
      
      const blog = await BlogData.findById(blogId).populate('companyId');
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const contentBlocks = await ContentBlock.find({ 
        blogId, 
        isSelected: true 
      }).sort({ order: 1 });    
      if (contentBlocks.length === 0) {
        return res.status(400).json({ message: 'No content blocks selected for draft generation' });
      }

      // Assemble HTML content
      let htmlContent = '';
      let title = '';
      
      contentBlocks.forEach(block => {
        switch (block.blockType) {
          case 'h1':
            title = block.content;
            htmlContent += `<h1>${block.content}</h1>\n`;
            break;
          case 'h2':
            htmlContent += `<h2>${block.content}</h2>\n`;
            break;
          case 'h3':
            htmlContent += `<h3>${block.content}</h3>\n`;
            break;
          case 'paragraph':
            htmlContent += `<p>${block.content}</p>\n`;
            break;
          case 'list':
            htmlContent += `<ul>${block.content}</ul>\n`;
            break;
          case 'image':
            const altText = block.metadata?.altText || 'Image';
            htmlContent += `<img src="${block.content}" alt="${altText}" />\n`;
            break;
          case 'quote':
            htmlContent += `<blockquote>${block.content}</blockquote>\n`;
            break;
          case 'code':
            htmlContent += `<pre><code>${block.content}</code></pre>\n`;
            break;
        }
      });

      // Generate meta content
      const metaContent = await geminiService.generateMetaContent(title, blog.companyId);

      // Create or update draft
      let draft = await Draft.findOne({ blogId });
      if (draft) {
        draft.title = title;
        draft.content = htmlContent;
        draft.metaTitle = metaContent.metaTitle;
        draft.metaDescription = metaContent.metaDescription;
        draft.contentBlocks = contentBlocks.map(block => block._id);
        draft.version += 1;
      } else {
        draft = new Draft({
          blogId,
          title,
          content: htmlContent,
          metaTitle: metaContent.metaTitle,
          metaDescription: metaContent.metaDescription,
          contentBlocks: contentBlocks.map(block => block._id)
        });
      }

      await draft.save();

      // Update blog status
      await BlogData.findByIdAndUpdate(blogId, { status: 'completed' });

      // Clear caches
      clearCache('blogs');
      clearCache('drafts');

      res.json({
        draft,
        wordCount: htmlContent.replace(/<[^>]*>/g, '').split(' ').length,
        message: 'Draft generated successfully'
      });
    } catch (error) {
      console.error('Draft generation error:', error);
      res.status(500).json({ message: 'Failed to generate draft' });
    }
  }

  // Publish draft to WordPress
  async publishToWordPress(req, res) {
  try {
    const { draftId } = req.params;
    
    console.log(`🚀 Publishing draft ${draftId} to WordPress`);
    
    // Get draft with populated company info
    const draft = await Draft.findById(draftId).populate({
      path: 'blogId',
      populate: { path: 'companyId' }
    });

    if (!draft) {
      console.error(`❌ Draft ${draftId} not found`);
      return res.status(404).json({ 
        success: false,
        message: 'Draft not found' 
      });
    }

    // FIXED: Validate required fields
    if (!draft.title || !draft.content) {
      console.error(`❌ Draft ${draftId} missing required fields`);
      return res.status(400).json({
        success: false,
        message: 'Draft must have title and content to publish to WordPress'
      });
    }

    // FIXED: Validate company info
    if (!draft.blogId?.companyId?._id) {
      console.error(`❌ Draft ${draftId} missing company information`);
      return res.status(400).json({
        success: false,
        message: 'Draft must be associated with a company to publish to WordPress'
      });
    }

    const companyId = draft.blogId.companyId._id;
    console.log(`📋 Publishing for company: ${draft.blogId.companyId.name} (${companyId})`);

    // Prepare WordPress data with fallbacks
    const wordpressData = {
      title: draft.title,
      content: draft.content,
      metaTitle: draft.metaTitle || draft.title,
      metaDescription: draft.metaDescription || draft.excerpt || '',
      focusKeyword: draft.selectedKeyword || '',
      featuredImage: draft.featuredImage || null,
      // Add any other fields from your draft
      excerpt: draft.excerpt || '',
      categories: draft.categories || [],
      tags: draft.tags || []
    };

    console.log(`📝 WordPress data prepared: ${wordpressData.title}`);

    // FIXED: Pass companyId to WordPress service
    const result = await wordpressService.createDraft(wordpressData, companyId);

    // FIXED: Properly check success before updating database
    if (result.success) {
      console.log(`✅ WordPress draft created: ${result.wordpressId}`);
      
      try {
        // Update draft with WordPress info
        await Draft.findByIdAndUpdate(draftId, {
          wordpressStatus: 'draft',
          wordpressId: result.wordpressId,
          wordpressEditUrl: result.editUrl,
          wordpressPreviewUrl: result.previewUrl,
          publishedToWordPressAt: new Date()
        });

        console.log(`✅ Draft ${draftId} updated with WordPress info`);

        // FIXED: Only update blog status if everything succeeded
        if (draft.blogId?._id) {
          await BlogData.findByIdAndUpdate(draft.blogId._id, { 
            status: 'published',
            lastPublishedAt: new Date()
          });
          console.log(`✅ Blog ${draft.blogId._id} status updated to published`);
        }

        res.json({
          success: true,
          message: 'Successfully published to WordPress',
          wordpressId: result.wordpressId,
          editUrl: result.editUrl,
          previewUrl: result.previewUrl,
          draftId: draftId
        });

      } catch (dbError) {
        console.error(`❌ Database update failed after WordPress success:`, dbError.message);
        
        // WordPress succeeded but database update failed
        // Don't delete from WordPress, just inform user
        res.status(500).json({
          success: false,
          message: 'Published to WordPress but failed to update local database',
          error: dbError.message,
          wordpressId: result.wordpressId,
          editUrl: result.editUrl
        });
      }

    } else {
      // FIXED: WordPress creation failed - don't update database
      console.error(`❌ WordPress publishing failed:`, result.error);
      
      res.status(400).json({
        success: false,
        message: 'Failed to publish to WordPress',
        error: result.error,
        details: result.details || {}
      });
    }

  } catch (error) {
    console.error('🚨 WordPress publishing crashed:', error.message);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to publish to WordPress',
      error: error.message
    });
  }

  // BONUS: Add a validation helper function
  validateDraftForWordPress(draft) {
    const errors = [];

    if (!draft.title || draft.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!draft.content || draft.content.trim().length === 0) {
      errors.push('Content is required');
    }

    if (draft.title && draft.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (!draft.blogId?.companyId?._id) {
      errors.push('Draft must be associated with a company');
    }

    return errors;
  }

  // BONUS: Enhanced version with validation
  async publishToWordPressEnhanced(req, res) {
  try {
    const { draftId } = req.params;
    
    console.log(`🚀 Publishing draft ${draftId} to WordPress (Enhanced)`);
    
    const draft = await Draft.findById(draftId).populate({
      path: 'blogId',
      populate: { path: 'companyId' }
    });

    if (!draft) {
      return res.status(404).json({ 
        success: false,
        message: 'Draft not found' 
      });
    }

    // Validate draft before attempting WordPress publish
    const validationErrors = validateDraftForWordPress(draft);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Draft validation failed',
        errors: validationErrors
      });
    }

    // Check if already published to WordPress
    if (draft.wordpressId) {
      console.warn(`⚠️ Draft ${draftId} already has WordPress ID: ${draft.wordpressId}`);
      return res.status(400).json({
        success: false,
        message: 'Draft already published to WordPress',
        wordpressId: draft.wordpressId,
        editUrl: draft.wordpressEditUrl
      });
    }

    const companyId = draft.blogId.companyId._id;
    
    // Test WordPress connection first
    console.log(`🔗 Testing WordPress connection for company ${companyId}`);
    const connectionTest = await wordpressService.testConnection(companyId);
    
    if (!connectionTest.success) {
      return res.status(400).json({
        success: false,
        message: 'WordPress connection failed',
        error: connectionTest.error,
        details: connectionTest.details
      });
    }

    // Prepare and publish to WordPress
    const wordpressData = {
      title: draft.title,
      content: draft.content,
      metaTitle: draft.metaTitle || draft.title,
      metaDescription: draft.metaDescription || draft.excerpt || '',
      focusKeyword: draft.selectedKeyword || '',
      featuredImage: draft.featuredImage || null,
      excerpt: draft.excerpt || '',
      categories: draft.categories || [],
      tags: draft.tags || []
    };

    const result = await wordpressService.createDraft(wordpressData, companyId);

    if (result.success) {
      // Update draft atomically
      const updatedDraft = await Draft.findByIdAndUpdate(
        draftId,
        {
          wordpressStatus: 'draft',
          wordpressId: result.wordpressId,
          wordpressEditUrl: result.editUrl,
          wordpressPreviewUrl: result.previewUrl,
          publishedToWordPressAt: new Date()
        },
        { new: true }
      );

      // Update blog status
      if (draft.blogId?._id) {
        await BlogData.findByIdAndUpdate(draft.blogId._id, { 
          status: 'published',
          lastPublishedAt: new Date()
        });
      }

      res.json({
        success: true,
        message: 'Successfully published to WordPress',
        data: {
          draftId: updatedDraft._id,
          wordpressId: result.wordpressId,
          editUrl: result.editUrl,
          previewUrl: result.previewUrl,
          title: updatedDraft.title,
          publishedAt: updatedDraft.publishedToWordPressAt
        }
      });

    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to publish to WordPress',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('🚨 WordPress publishing crashed:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error during WordPress publishing',
      error: error.message
    });
  }

  // Get blog analytics and insights
  async getBlogAnalytics(req, res) {
    try {
      const { blogId } = req.params;
      
      const blog = await BlogData.findById(blogId).populate('companyId');
      const contentBlocks = await ContentBlock.find({ blogId });
      const draft = await Draft.findOne({ blogId });

      // Calculate analytics
      const totalWords = contentBlocks.reduce((sum, block) => {
        return sum + (block.metadata?.wordCount || 0);
      }, 0);

      const aiGeneratedBlocks = contentBlocks.filter(block => 
        block.metadata?.aiGenerated
      ).length;

      const keywordDensity = this.calculateKeywordDensity(
        contentBlocks,
        blog.focusKeyword
      );

      const readingTime = Math.ceil(totalWords / 200); // Average reading speed

      const analytics = {
        blog,
        stats: {
          totalWords,
          totalBlocks: contentBlocks.length,
          aiGeneratedBlocks,
          manualBlocks: contentBlocks.length - aiGeneratedBlocks,
          keywordDensity,
          readingTime,
          completionPercentage: this.calculateCompletionPercentage(blog, contentBlocks)
        },
        seoAnalysis: {
          hasMetaTitle: !!draft?.metaTitle,
          hasMetaDescription: !!draft?.metaDescription,
          hasFocusKeyword: this.checkFocusKeywordUsage(contentBlocks, blog.focusKeyword),
          hasImages: contentBlocks.some(block => block.blockType === 'image'),
          hasHeadings: contentBlocks.some(block => ['h1', 'h2', 'h3'].includes(block.blockType))
        },
        contentBreakdown: {
          headings: contentBlocks.filter(block => ['h1', 'h2', 'h3'].includes(block.blockType)).length,
          paragraphs: contentBlocks.filter(block => block.blockType === 'paragraph').length,
          images: contentBlocks.filter(block => block.blockType === 'image').length,
          lists: contentBlocks.filter(block => block.blockType === 'list').length
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Analytics generation error:', error);
      res.status(500).json({ message: 'Failed to generate analytics' });
    }
  }

  // Helper methods
  calculateKeywordDensity(contentBlocks, focusKeyword) {
    const totalText = contentBlocks
      .map(block => block.content)
      .join(' ')
      .toLowerCase();
    
    const totalWords = totalText.split(/\s+/).length;
    const keywordOccurrences = (totalText.match(new RegExp(focusKeyword.toLowerCase(), 'g')) || []).length;
    
    return totalWords > 0 ? ((keywordOccurrences / totalWords) * 100).toFixed(2) : 0;
  }

  calculateCompletionPercentage(blog, contentBlocks) {
    const targetWords = blog.wordCount;
    const currentWords = contentBlocks.reduce((sum, block) => {
      return sum + (block.metadata?.wordCount || 0);
    }, 0);
    
    return Math.min(((currentWords / targetWords) * 100).toFixed(0), 100);
  }

  checkFocusKeywordUsage(contentBlocks, focusKeyword) {
    const allText = contentBlocks.map(block => block.content).join(' ').toLowerCase();
    return allText.includes(focusKeyword.toLowerCase());
  }
}

module.exports = new BlogController();