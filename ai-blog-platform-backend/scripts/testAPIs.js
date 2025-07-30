// scripts/testAPIs.js
const axios = require('axios');
require('dotenv').config();

async function testAPIs() {
  console.log('🔍 Testing API Connections...\n');

  // Test Gemini API
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      console.log('Testing Gemini API...');
      console.log('🔑 API Key:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
      console.log('🔑 API Key length:', process.env.GEMINI_API_KEY?.length);
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: 'Say hello in one word'
            }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      console.log('✅ Gemini API: Connected successfully');
      console.log('Response:', response.data.candidates[0].content.parts[0].text.trim());
    } catch (error) {
      console.log('❌ Gemini API: Failed');
      console.log('Error:', error.response?.data?.error?.message || error.message);
      console.log('Full error response:', error.response?.data);
    }
  } else {
    console.log('⚠️  Gemini API: Not configured (update GEMINI_API_KEY in .env)');
  }

  // Test GNews API
  if (process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== 'your_gnews_api_key_here') {
    try {
      console.log('\nTesting GNews API...');
      const response = await axios.get('https://gnews.io/api/v4/search', {
        params: {
          q: 'technology',
          token: process.env.GNEWS_API_KEY,
          lang: 'en',
          max: 1
        },
        timeout: 10000
      });
      console.log('✅ GNews API: Connected successfully');
      console.log('Articles found:', response.data.totalArticles);
    } catch (error) {
      console.log('❌ GNews API: Failed');
      console.log('Error:', error.response?.data?.errors?.[0] || error.message);
    }
  } else {
    console.log('⚠️  GNews API: Not configured (update GNEWS_API_KEY in .env)');
  }

  // Test MongoDB connection
  try {
    console.log('\nTesting MongoDB connection...');
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB: Connected successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB: Failed');
    console.log('Error:', error.message);
  }
}

testAPIs().catch(console.error);
