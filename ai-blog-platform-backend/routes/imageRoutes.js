// routes/imageRoutes.js
const express = require('express');
const imageService = require('../services/imageService');
const router = express.Router();

// POST generate AI image
router.post('/generate', async (req, res) => {
  try {
    const { prompt, style = 'realistic' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    const result = await imageService.generateImageWithAI(prompt, style);
    res.json(result);
  } catch (error) {
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
