#!/usr/bin/env node

/**
 * WordPress SEO Verification Script
 * Verifies that SEO meta fields are properly set in WordPress posts
 */

const axios = require('axios');
const Company = require('../models/Company');
const mongoose = require('mongoose');
require('dotenv').config();

async function verifyWordPressSEO(postId = 14374) {
  try {
    console.log('🔍 Verifying WordPress SEO Meta Fields...\n');
    console.log('='.repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get WattMonk company
    const company = await Company.findOne({ name: 'WattMonk' });
    if (!company) {
      console.log('❌ WattMonk company not found in database');
      return;
    }
    
    const config = company.wordpressConfig;
    const baseUrl = config.baseUrl.trim().replace(/\/$/, '');
    const auth = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');
    
    console.log(`🏢 Company: ${company.name}`);
    console.log(`🔗 WordPress URL: ${baseUrl}`);
    console.log(`📝 Checking Post ID: ${postId}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FETCHING POST DATA FROM WORDPRESS');
    console.log('='.repeat(60));
    
    // Fetch post data from WordPress
    const response = await axios({
      method: 'GET',
      url: `${baseUrl}/wp-json/wp/v2/posts/${postId}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      const post = response.data;
      
      console.log('✅ Post found in WordPress!');
      console.log('\n📋 POST DETAILS:');
      console.log(`   ID: ${post.id}`);
      console.log(`   Title: ${post.title.rendered}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Date: ${post.date}`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   Excerpt: ${post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 100)}...`);
      
      console.log('\n🔍 SEO META FIELDS:');
      if (post.meta) {
        // Check Yoast SEO fields
        console.log('\n🎯 YOAST SEO FIELDS:');
        console.log(`   Meta Title: ${post.meta._yoast_wpseo_title || 'Not set'}`);
        console.log(`   Meta Description: ${post.meta._yoast_wpseo_metadesc || 'Not set'}`);
        console.log(`   Focus Keyword: ${post.meta._yoast_wpseo_focuskw || 'Not set'}`);
        console.log(`   No Index: ${post.meta._yoast_wpseo_meta_robots_noindex || 'Not set'}`);
        console.log(`   No Follow: ${post.meta._yoast_wpseo_meta_robots_nofollow || 'Not set'}`);
        
        // Check RankMath fields
        console.log('\n📈 RANKMATH SEO FIELDS:');
        console.log(`   Meta Title: ${post.meta.rank_math_title || 'Not set'}`);
        console.log(`   Meta Description: ${post.meta.rank_math_description || 'Not set'}`);
        console.log(`   Focus Keyword: ${post.meta.rank_math_focus_keyword || 'Not set'}`);
        
        // Check All in One SEO fields
        console.log('\n🔧 ALL IN ONE SEO FIELDS:');
        console.log(`   Meta Title: ${post.meta._aioseop_title || 'Not set'}`);
        console.log(`   Meta Description: ${post.meta._aioseop_description || 'Not set'}`);
        console.log(`   Keywords: ${post.meta._aioseop_keywords || 'Not set'}`);
        
        // Check SEOPress fields
        console.log('\n⚡ SEOPRESS FIELDS:');
        console.log(`   Meta Title: ${post.meta._seopress_titles_title || 'Not set'}`);
        console.log(`   Meta Description: ${post.meta._seopress_titles_desc || 'Not set'}`);
        console.log(`   Target Keyword: ${post.meta._seopress_analysis_target_kw || 'Not set'}`);
        
      } else {
        console.log('❌ No meta fields found in post data');
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('🎯 VERIFICATION RESULTS');
      console.log('='.repeat(60));
      
      // Verification checklist
      const hasYoastTitle = post.meta?._yoast_wpseo_title;
      const hasYoastDesc = post.meta?._yoast_wpseo_metadesc;
      const hasYoastKeyword = post.meta?._yoast_wpseo_focuskw;
      const hasRankMathTitle = post.meta?.rank_math_title;
      const hasRankMathDesc = post.meta?.rank_math_description;
      
      console.log(`✅ Post Title: ${post.title.rendered ? '✓' : '❌'}`);
      console.log(`${hasYoastTitle ? '✅' : '❌'} Yoast Meta Title: ${hasYoastTitle ? '✓' : '❌'}`);
      console.log(`${hasYoastDesc ? '✅' : '❌'} Yoast Meta Description: ${hasYoastDesc ? '✓' : '❌'}`);
      console.log(`${hasYoastKeyword ? '✅' : '❌'} Yoast Focus Keyword: ${hasYoastKeyword ? '✓' : '❌'}`);
      console.log(`${hasRankMathTitle ? '✅' : '❌'} RankMath Meta Title: ${hasRankMathTitle ? '✓' : '❌'}`);
      console.log(`${hasRankMathDesc ? '✅' : '❌'} RankMath Meta Description: ${hasRankMathDesc ? '✓' : '❌'}`);
      
      console.log('\n🔗 WORDPRESS ADMIN LINKS:');
      console.log(`   Edit Post: ${baseUrl}/wp-admin/post.php?post=${postId}&action=edit`);
      console.log(`   Preview Post: ${baseUrl}/?p=${postId}&preview=true`);
      console.log(`   View Post: ${post.link}`);
      
      if (hasYoastTitle || hasRankMathTitle) {
        console.log('\n🎉 SUCCESS! SEO meta fields are properly configured!');
      } else {
        console.log('\n⚠️ WARNING: SEO meta fields may not be properly set');
      }
      
    } else {
      console.log(`❌ Failed to fetch post: Status ${response.status}`);
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`❌ Post ${postId} not found in WordPress`);
    } else {
      console.error('❌ Verification failed:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n📊 Disconnected from MongoDB');
    console.log('✅ Verification completed');
  }
}

// Get post ID from command line argument or use default
const postId = process.argv[2] || 14374;

// Run the verification
verifyWordPressSEO(postId)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Verification error:', error);
    process.exit(1);
  });
