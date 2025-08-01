// routes/imageRoutes.js
const express = require('express');
const imageService = require('../services/imageService');
const router = express.Router();

// POST generate AI image
router.post('/generate', async (req, res) => {
  try {
    const { prompt, style = 'realistic', imageType = 'featured', draftId, blockId, blogTitle, customTitle } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    console.log(`🎨 Image generation request: "${prompt}" (style: ${style}, type: ${imageType})`);
    if (customTitle) {
      console.log(`🏷️ Using custom title: "${customTitle}"`);
    }

    // Use provided blog title or empty string
    const titleForImage = blogTitle || '';
    const result = await imageService.generateImageWithAI(prompt, style, imageType, titleForImage, customTitle);

    // If this is for a specific content block, we could save the association
    if (draftId && blockId) {
      console.log(`📎 Generated image for draft ${draftId}, block ${blockId}`);
      result.draftId = draftId;
      result.blockId = blockId;
    }

    res.json(result);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST upload image
router.post('/upload', imageService.getUploadMiddleware(), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const result = await imageService.uploadImage(req.file);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
