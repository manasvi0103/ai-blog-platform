// services/imageService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

class ImageService {
  constructor() {
    // Configure multer for file uploads
    this.upload = multer({
      dest: 'uploads/',
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });
  }

  async generateImageWithAI(prompt, style = 'realistic') {
    try {
      // Using a free AI image generation API (you can replace with your preferred service)
      // For now, we'll use a placeholder service or return a placeholder
      
      // Option 1: Use Hugging Face Inference API (free tier available)
      if (process.env.HUGGINGFACE_API_KEY) {
        return await this.generateWithHuggingFace(prompt, style);
      }
      
      // Option 2: Use OpenAI DALL-E (requires API key)
      if (process.env.OPENAI_API_KEY) {
        return await this.generateWithOpenAI(prompt, style);
      }
      
      // Fallback: Return placeholder image URL
      return {
        success: true,
        imageUrl: `https://picsum.photos/800/600?random=${Date.now()}`,
        prompt: prompt,
        style: style,
        source: 'placeholder'
      };
      
    } catch (error) {
      console.error('AI image generation error:', error);
      throw error;
    }
  }

  async generateWithHuggingFace(prompt, style) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
        { inputs: `${prompt}, ${style} style` },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // Save the generated image
      const filename = `ai-generated-${Date.now()}.png`;
      const filepath = path.join('uploads', filename);
      
      fs.writeFileSync(filepath, response.data);
      
      return {
        success: true,
        imageUrl: `/uploads/${filename}`,
        prompt: prompt,
        style: style,
        source: 'huggingface'
      };
    } catch (error) {
      console.error('Hugging Face API error:', error);
      throw error;
    }
  }

  async generateWithOpenAI(prompt, style) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          prompt: `${prompt}, ${style} style`,
          n: 1,
          size: '1024x1024'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        imageUrl: response.data.data[0].url,
        prompt: prompt,
        style: style,
        source: 'openai'
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async uploadImage(file) {
    try {
      // Move uploaded file to permanent location
      const filename = `uploaded-${Date.now()}-${file.originalname}`;
      const filepath = path.join('uploads', filename);
      
      fs.renameSync(file.path, filepath);
      
      return {
        success: true,
        imageUrl: `/uploads/${filename}`,
        originalName: file.originalname,
        size: file.size,
        source: 'upload'
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  getUploadMiddleware() {
    return this.upload.single('image');
  }
}

module.exports = new ImageService();
