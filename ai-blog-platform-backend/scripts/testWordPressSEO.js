#!/usr/bin/env node

/**
 * WordPress SEO Meta Fields Test Script
 * Tests if title, meta title, and meta description are properly set in WordPress
 */

const WordPressService = require('../services/wordpressService');
const Company = require('../models/Company');
const mongoose = require('mongoose');
require('dotenv').config();

async function testWordPressSEO() {
  try {
    console.log('🧪 Testing WordPress SEO Meta Fields...\n');
    console.log('='.repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const wordpressService = new WordPressService();
    
    // Test with WattMonk (assuming it exists)
    const company = await Company.findOne({ name: 'WattMonk' });
    if (!company) {
      console.log('❌ WattMonk company not found in database');
      return;
    }
    
    console.log(`✅ Found company: ${company.name}`);
    console.log(`🔗 WordPress URL: ${company.wordpressConfig?.baseUrl || 'Not configured'}`);
    
    // Test connection first
    const connectionTest = await wordpressService.testConnection(company._id);
    if (!connectionTest.success) {
      console.log('❌ WordPress connection failed:', connectionTest.error);
      return;
    }
    
    console.log('✅ WordPress connection successful!');
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Testing WordPress Draft Creation with SEO Meta Fields');
    console.log('='.repeat(60));
    
    // Test creating a sample draft with comprehensive SEO meta fields
    const testDraftData = {
      title: 'Complete Guide to Solar Panel Installation Costs in 2025',
      content: `
        <div class="wp-block-group" style="color: #333; font-family: 'Open Sans', sans-serif;">
          <h2 style="color: #f4b942; font-weight: 600;">Introduction to Solar Panel Installation</h2>
          <p>Solar panel installation has become increasingly popular as homeowners seek sustainable energy solutions. This comprehensive guide covers everything you need to know about solar panel installation costs, benefits, and the installation process.</p>
          
          <h2 style="color: #f4b942; font-weight: 600;">Understanding Solar Panel Installation Costs</h2>
          <p>The cost of solar panel installation varies based on several factors including system size, panel type, and installation complexity. On average, homeowners can expect to invest between $15,000 to $25,000 for a complete solar system.</p>
          
          <h2 style="color: #f4b942; font-weight: 600;">Factors Affecting Installation Costs</h2>
          <p>Several key factors influence the total cost of your solar panel installation:</p>
          <ul>
            <li>System size and energy requirements</li>
            <li>Panel quality and efficiency ratings</li>
            <li>Roof complexity and accessibility</li>
            <li>Local permits and inspection fees</li>
            <li>Available incentives and rebates</li>
          </ul>
          
          <h2 style="color: #f4b942; font-weight: 600;">Benefits of Professional Installation</h2>
          <p>Professional solar panel installation ensures optimal system performance, safety compliance, and warranty protection. WattMonk's certified installers provide expert installation services with comprehensive support.</p>
          
          <h2 style="color: #f4b942; font-weight: 600;">Conclusion</h2>
          <p>Investing in solar panel installation offers long-term energy savings and environmental benefits. Contact WattMonk today for a personalized solar installation quote and professional consultation.</p>
        </div>
      `,
      metaTitle: 'Solar Panel Installation Costs 2025 | WattMonk Solar Guide',
      metaDescription: 'Complete guide to solar panel installation costs in 2025. Learn about pricing factors, benefits, and professional installation services from WattMonk solar experts.',
      focusKeyword: 'solar panel installation costs',
      featuredImage: null
    };
    
    console.log('📝 Test Data:');
    console.log(`   Title: ${testDraftData.title}`);
    console.log(`   Meta Title: ${testDraftData.metaTitle}`);
    console.log(`   Meta Description: ${testDraftData.metaDescription}`);
    console.log(`   Focus Keyword: ${testDraftData.focusKeyword}`);
    console.log(`   Content Length: ${testDraftData.content.length} characters`);
    
    console.log('\n🚀 Creating WordPress draft...');
    const draftResult = await wordpressService.createDraft(testDraftData, company._id);
    
    if (draftResult.success) {
      console.log('\n✅ SUCCESS! WordPress draft created with SEO optimization!');
      console.log('='.repeat(60));
      console.log(`📝 WordPress Post ID: ${draftResult.wordpressId}`);
      console.log(`🔗 Edit URL: ${draftResult.editUrl}`);
      console.log(`👁️ Preview URL: ${draftResult.previewUrl}`);
      
      console.log('\n💡 VERIFICATION CHECKLIST:');
      console.log('   Go to the WordPress admin and check:');
      console.log('   ✓ Post title appears correctly');
      console.log('   ✓ SEO section shows meta title');
      console.log('   ✓ SEO section shows meta description');
      console.log('   ✓ Focus keyword is configured');
      console.log('   ✓ Content has WattMonk styling (golden headings)');
      
      console.log('\n🎯 EXPECTED RESULTS:');
      console.log(`   - Title: "${testDraftData.title}"`);
      console.log(`   - Meta Title: "${testDraftData.metaTitle}"`);
      console.log(`   - Meta Description: "${testDraftData.metaDescription}"`);
      console.log(`   - Focus Keyword: "${testDraftData.focusKeyword}"`);
      
    } else {
      console.log('\n❌ FAILED! WordPress draft creation failed');
      console.log('='.repeat(60));
      console.log('Error:', draftResult.error);
      console.log('Details:', draftResult.details || 'No additional details');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📊 Disconnected from MongoDB');
    console.log('✅ Test completed');
  }
}

// Run the test
testWordPressSEO()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
