const axios = require('axios');
require('dotenv').config();

async function testWordPressConnection() {
  try {
    console.log('🔍 Testing WordPress connection...');
    console.log('URL:', process.env.WORDPRESS_URL);
    console.log('Username:', process.env.WORDPRESS_USERNAME);
    console.log('Password set:', !!process.env.WORDPRESS_PASSWORD);

    if (!process.env.WORDPRESS_URL || !process.env.WORDPRESS_USERNAME || !process.env.WORDPRESS_PASSWORD) {
      console.error('❌ Missing WordPress credentials in .env file');
      return;
    }

    const auth = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_PASSWORD}`).toString('base64');
    const baseUrl = process.env.WORDPRESS_URL.replace(/\/$/, '');

    const response = await axios.get(`${baseUrl}/wp-json/wp/v2/posts?per_page=1`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ WordPress connection successful!');
    console.log('Status:', response.status);
    console.log('Posts found:', response.data.length);

  } catch (error) {
    console.error('❌ WordPress connection failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testWordPressConnection();