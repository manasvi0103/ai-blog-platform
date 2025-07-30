// scripts/setupN8N.js - N8N WordPress Integration Setup
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class N8NSetup {
  constructor() {
    this.n8nUrl = process.env.N8N_URL || 'http://localhost:5678';
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/wordpress-draft';
  }

  async checkN8NStatus() {
    console.log('🔍 Checking N8N status...');
    
    try {
      const response = await axios.get(`${this.n8nUrl}/healthz`, {
        timeout: 5000
      });
      
      console.log('✅ N8N is running and accessible');
      return true;
    } catch (error) {
      console.error('❌ N8N is not accessible:', error.message);
      console.log('\n📋 To start N8N:');
      console.log('   Option 1 (Docker): docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n');
      console.log('   Option 2 (NPM): npm install n8n -g && n8n start');
      return false;
    }
  }

  async testWebhook() {
    console.log('🔗 Testing N8N webhook...');
    
    try {
      const testPayload = {
        test: true,
        title: 'N8N Setup Test',
        content: 'This is a test from the setup script.',
        companyId: 'setup-test'
      };

      const response = await axios.post(this.webhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.success) {
        console.log('✅ N8N webhook is working correctly');
        return true;
      } else {
        console.log('⚠️ N8N webhook responded but with error:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ N8N webhook test failed:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n📋 Webhook not accessible. Make sure:');
        console.log('   1. N8N is running on port 5678');
        console.log('   2. WordPress Draft Creator workflow is active');
        console.log('   3. Webhook path is: /webhook/wordpress-draft');
      }
      
      return false;
    }
  }

  displayWorkflowInstructions() {
    console.log('\n🔄 N8N Workflow Setup Instructions:');
    console.log('=====================================');
    console.log('1. Open N8N at: http://localhost:5678');
    console.log('2. Click "Import from file"');
    console.log('3. Select: n8n-workflows/wordpress-draft-creator.json');
    console.log('4. Configure WordPress credentials:');
    console.log('   - Go to Credentials → Add Credential → WordPress API');
    console.log('   - URL: Your WordPress site URL');
    console.log('   - Username: Your WordPress username');
    console.log('   - Password: WordPress Application Password');
    console.log('5. Activate the workflow');
    console.log('6. Test with this script: npm run test-n8n');
  }

  displayWordPressAppPasswordInstructions() {
    console.log('\n🔑 WordPress Application Password Setup:');
    console.log('=========================================');
    console.log('1. Login to your WordPress admin');
    console.log('2. Go to Users → Your Profile');
    console.log('3. Scroll to "Application Passwords"');
    console.log('4. Enter name: "N8N Integration"');
    console.log('5. Click "Add New Application Password"');
    console.log('6. Copy the generated password');
    console.log('7. Use this password in N8N credentials');
  }

  displayDockerSetup() {
    console.log('\n🐳 Quick Docker Setup:');
    console.log('======================');
    console.log('Create docker-compose.yml:');
    console.log(`
version: '3.7'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - GENERIC_TIMEZONE=UTC
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-secure-password
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
`);
    console.log('Then run: docker-compose up -d');
  }

  async runSetup() {
    console.log('🚀 AI Blog Platform - N8N WordPress Integration Setup');
    console.log('=====================================================\n');

    // Step 1: Check N8N status
    const n8nRunning = await this.checkN8NStatus();
    
    if (!n8nRunning) {
      this.displayDockerSetup();
      return;
    }

    // Step 2: Test webhook
    const webhookWorking = await this.testWebhook();
    
    if (!webhookWorking) {
      this.displayWorkflowInstructions();
      this.displayWordPressAppPasswordInstructions();
      return;
    }

    // Step 3: Success
    console.log('\n🎉 N8N WordPress Integration Setup Complete!');
    console.log('============================================');
    console.log('✅ N8N is running');
    console.log('✅ Webhook is accessible');
    console.log('✅ WordPress integration is ready');
    console.log('\n📋 Next Steps:');
    console.log('1. Configure WordPress credentials in N8N');
    console.log('2. Test with a real blog draft');
    console.log('3. Monitor N8N workflow executions');
    console.log('\n🔗 Useful URLs:');
    console.log(`   N8N Dashboard: ${this.n8nUrl}`);
    console.log(`   Webhook URL: ${this.webhookUrl}`);
    console.log('   Test Endpoint: /api/wordpress/test-n8n');
  }

  async testWordPressIntegration() {
    console.log('🧪 Testing WordPress Integration...');
    
    try {
      const testDraft = {
        title: 'Test Blog Post from N8N',
        content: '<p>This is a test blog post created via N8N workflow to verify the WordPress integration is working correctly.</p><p>Generated at: ' + new Date().toISOString() + '</p>',
        excerpt: 'Test blog post to verify N8N WordPress integration',
        metaTitle: 'Test Blog Post - N8N Integration',
        metaDescription: 'Testing the N8N WordPress integration with AI Blog Platform',
        focusKeyword: 'n8n wordpress integration',
        companyId: 'test-company',
        categories: ['Test'],
        tags: ['n8n', 'wordpress', 'integration', 'test']
      };

      const response = await axios.post(this.webhookUrl, testDraft, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data.success) {
        console.log('✅ WordPress draft created successfully!');
        console.log('📄 WordPress ID:', response.data.data.wordpressId);
        console.log('🔗 Edit URL:', response.data.data.editUrl);
        console.log('👁️ Preview URL:', response.data.data.previewUrl);
        return true;
      } else {
        console.log('❌ WordPress draft creation failed:', response.data.error);
        return false;
      }
    } catch (error) {
      console.error('🚨 WordPress integration test failed:', error.message);
      return false;
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new N8NSetup();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'test-webhook':
      setup.testWebhook();
      break;
    case 'test-wordpress':
      setup.testWordPressIntegration();
      break;
    case 'status':
      setup.checkN8NStatus();
      break;
    default:
      setup.runSetup();
  }
}

module.exports = N8NSetup;
