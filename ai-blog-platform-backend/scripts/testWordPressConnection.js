#!/usr/bin/env node

/**
 * WordPress Connection Test Script
 * Run this to debug WordPress connection issues
 */

const axios = require('axios');
const Company = require('../models/Company');
const mongoose = require('mongoose');
require('dotenv').config();

async function testWordPressConnection() {
  try {
    console.log('🔄 Starting WordPress Connection Test...');
    console.log('='.repeat(50));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all companies with WordPress config
    const companies = await Company.find({
      'wordpressConfig.baseUrl': { $exists: true, $ne: '' }
    });

    console.log(`📋 Found ${companies.length} companies with WordPress config`);

    for (const company of companies) {
      console.log('\n' + '='.repeat(30));
      console.log(`🏢 Testing: ${company.name}`);
      console.log('='.repeat(30));

      const config = company.wordpressConfig;
      
      // Clean baseUrl
      let baseUrl = config.baseUrl.trim();
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
      }

      console.log(`🔗 Base URL: ${baseUrl}`);
      console.log(`👤 Username: ${config.username}`);
      console.log(`🔑 Has App Password: ${!!config.appPassword}`);

      // Test 1: Basic site accessibility
      console.log('\n📡 Test 1: Basic site accessibility...');
      try {
        const siteResponse = await axios.get(baseUrl, { timeout: 10000 });
        console.log(`✅ Site accessible (Status: ${siteResponse.status})`);
      } catch (error) {
        console.log(`❌ Site not accessible: ${error.message}`);
        continue;
      }

      // Test 2: WordPress REST API discovery
      console.log('\n🔍 Test 2: WordPress REST API discovery...');
      try {
        const apiResponse = await axios.get(`${baseUrl}/wp-json/`, { timeout: 10000 });
        console.log(`✅ WordPress REST API found (Status: ${apiResponse.status})`);
        console.log(`📋 API Info: ${apiResponse.data.name || 'Unknown'}`);
      } catch (error) {
        console.log(`❌ WordPress REST API not found: ${error.message}`);
        continue;
      }

      // Test 3: Authentication test
      console.log('\n🔐 Test 3: Authentication test...');
      try {
        const auth = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');
        const authResponse = await axios.get(`${baseUrl}/wp-json/wp/v2/users/me`, {
          headers: {
            'Authorization': `Basic ${auth}`
          },
          timeout: 10000
        });
        console.log(`✅ Authentication successful (Status: ${authResponse.status})`);
        console.log(`👤 User: ${authResponse.data.name || 'Unknown'}`);
      } catch (error) {
        console.log(`❌ Authentication failed: ${error.message}`);
        if (error.response) {
          console.log(`📊 Response Status: ${error.response.status}`);
          console.log(`📄 Response Data:`, error.response.data);
        }
        continue;
      }

      // Test 4: Post creation capability
      console.log('\n📝 Test 4: Post creation capability...');
      try {
        const auth = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');
        const testPostData = {
          title: 'Test Post - Please Delete',
          content: 'This is a test post created by the blog platform. Please delete this.',
          status: 'draft'
        };

        const postResponse = await axios.post(`${baseUrl}/wp-json/wp/v2/posts`, testPostData, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        console.log(`✅ Test post created successfully (Status: ${postResponse.status})`);
        console.log(`📝 Post ID: ${postResponse.data.id}`);
        console.log(`🔗 Edit URL: ${baseUrl}/wp-admin/post.php?post=${postResponse.data.id}&action=edit`);

        // Clean up - delete the test post
        try {
          await axios.delete(`${baseUrl}/wp-json/wp/v2/posts/${postResponse.data.id}?force=true`, {
            headers: {
              'Authorization': `Basic ${auth}`
            },
            timeout: 10000
          });
          console.log(`🗑️ Test post deleted successfully`);
        } catch (deleteError) {
          console.log(`⚠️ Could not delete test post: ${deleteError.message}`);
        }

      } catch (error) {
        console.log(`❌ Post creation failed: ${error.message}`);
        if (error.response) {
          console.log(`📊 Response Status: ${error.response.status}`);
          console.log(`📄 Response Data:`, JSON.stringify(error.response.data, null, 2));
        }
      }

      console.log(`\n✅ WordPress connection test completed for ${company.name}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All WordPress connection tests completed!');

  } catch (error) {
    console.error('❌ Test script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testWordPressConnection();
}

module.exports = testWordPressConnection;
