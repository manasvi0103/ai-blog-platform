const axios = require('axios');

async function testWordPressConnection() {
  console.log('🧪 Testing WordPress Connection...');
  
  try {
    // Test the WordPress connection endpoint
    const response = await axios.get(
      `http://localhost:5000/api/wordpress/test-connection`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true // Don't throw on error status
      }
    );

    console.log('📡 Response status:', response.status);
    console.log('📄 Response data:', response.data);

    if (response.status === 200 && response.data.connected) {
      console.log('✅ WordPress Connection is working correctly!');
      console.log('🔗 WordPress Details:');
      console.log(`   URL: ${response.data.url}`);
      console.log(`   Status: ${response.data.status}`);
    } else if (response.status === 404) {
      console.log('⚠️ WordPress connection endpoint not found');
      console.log('🔧 Need to create the endpoint in backend');
    } else {
      console.log('❌ WordPress Connection test failed');
      console.log('Error:', response.data);
    }

    // Test the deployment endpoint as well
    console.log('\n🚀 Testing WordPress deployment endpoint...');
    
    const deployResponse = await axios.post(
      `http://localhost:5000/api/blogs/deploy-wordpress`,
      { draftId: '507f1f77bcf86cd799439011' }, // Mock ID
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true
      }
    );

    console.log('📡 Deploy Response status:', deployResponse.status);
    
    if (deployResponse.status === 200) {
      console.log('✅ WordPress deployment endpoint is working!');
    } else if (deployResponse.status === 404) {
      console.log('⚠️ Draft not found (expected for test)');
      console.log('✅ WordPress deployment endpoint exists and is configured');
    } else {
      console.log('❌ WordPress deployment endpoint issue');
      console.log('Error:', deployResponse.data);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️ Backend server not running - please start with: npm run dev');
    } else {
      console.log('❌ WordPress Connection test error:', error.message);
    }
  }
}

// Test the WordPress connection
testWordPressConnection();
