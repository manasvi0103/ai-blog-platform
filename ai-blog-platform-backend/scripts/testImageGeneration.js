// Test script for Gemini-enhanced image generation
const imageService = require('../services/imageService');
require('dotenv').config();

async function testImageGeneration() {
  console.log('🧪 Testing Gemini-enhanced image generation...');
  console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
  
  try {
    // Test with a solar industry prompt
    const testPrompt = 'Professional solar panel installation on modern residential roof with workers in safety gear';
    const style = 'realistic';
    
    console.log(`\n🎨 Generating image with prompt: "${testPrompt}"`);
    console.log(`🎭 Style: ${style}`);
    
    const startTime = Date.now();
    const result = await imageService.generateImageWithAI(testPrompt, style);
    const endTime = Date.now();
    
    console.log('\n✅ Image generation completed!');
    console.log('📊 Results:');
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Image URL: ${result.imageUrl}`);
    console.log(`   - Source: ${result.source}`);
    console.log(`   - Quality: ${result.quality || 'standard'}`);
    console.log(`   - Model: ${result.model || 'default'}`);
    console.log(`   - Generation time: ${endTime - startTime}ms`);
    
    if (result.success) {
      console.log('\n🎉 Gemini-enhanced image generation is working perfectly!');
      console.log(`🖼️  You can view the image at: http://localhost:5000${result.imageUrl}`);
    } else {
      console.log('\n❌ Image generation failed');
    }
    
  } catch (error) {
    console.error('\n❌ Error during image generation test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testImageGeneration();
