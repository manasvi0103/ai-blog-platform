// routes/contentRoutes.js
const express = require('express');
const ContentBlock = require('../models/ContentBlock');
const geminiService = require('../services/geminiService');
const router = express.Router();

// Test endpoint for Gemini service
router.post('/test-gemini', async (req, res) => {
  try {
    const { prompt, companyContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    console.log('🧪 Testing Gemini service with prompt:', prompt);

    // Test Gemini service directly
    const result = await geminiService.generateContent(prompt, companyContext || {});

    res.json({
      success: true,
      content: result.content,
      wordCount: result.wordCount,
      keywords: result.keywords,
      service: 'Gemini AI'
    });
  } catch (error) {
    console.error('Gemini test error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      service: 'Gemini AI'
    });
  }
});

// GET content blocks for a blog
router.get('/blog/:blogId', async (req, res) => {
  try {
    const contentBlocks = await ContentBlock.find({ blogId: req.params.blogId })
      .sort({ order: 1 });
    res.json(contentBlocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST generate content block using AI
router.post('/generate', async (req, res) => {
  try {
    const { blogId, blockType, prompt, companyContext } = req.body;
    
    // Generate content using Gemini
    const generatedContent = await geminiService.generateContent(prompt, companyContext);
    
    // Get the next order number
    const lastBlock = await ContentBlock.findOne({ blogId })
      .sort({ order: -1 });
    const nextOrder = lastBlock ? lastBlock.order + 1 : 1;
    
    const contentBlock = new ContentBlock({
      blogId,
      blockType,
      content: generatedContent.content,
      order: nextOrder,
      metadata: {
        aiGenerated: true,
        source: 'gemini',
        keywords: generatedContent.keywords || [],
        wordCount: generatedContent.content.split(' ').length
      }
    });
    
    const savedBlock = await contentBlock.save();
    res.status(201).json(savedBlock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update content block
router.put('/:id', async (req, res) => {
  try {
    const contentBlock = await ContentBlock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!contentBlock) {
      return res.status(404).json({ message: 'Content block not found' });
    }
    res.json(contentBlock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST select content block alternative
router.post('/:id/select', async (req, res) => {
  try {
    const { alternativeIndex } = req.body;
    const contentBlock = await ContentBlock.findById(req.params.id);
    
    if (!contentBlock) {
      return res.status(404).json({ message: 'Content block not found' });
    }
    
    if (alternativeIndex >= 0 && alternativeIndex < contentBlock.alternatives.length) {
      // Save current content as alternative
      contentBlock.alternatives.push({
        content: contentBlock.content,
        source: contentBlock.metadata.source,
        createdAt: new Date()
      });
      
      // Set selected alternative as main content
      const selectedAlt = contentBlock.alternatives[alternativeIndex];
      contentBlock.content = selectedAlt.content;
      contentBlock.metadata.source = selectedAlt.source;
      contentBlock.version += 1;
      
      // Remove selected alternative from alternatives array
      contentBlock.alternatives.splice(alternativeIndex, 1);
      
      await contentBlock.save();
    }
    
    res.json(contentBlock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;