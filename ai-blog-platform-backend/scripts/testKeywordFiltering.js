#!/usr/bin/env node

/**
 * Test script to verify keyword filtering and used keyword detection
 */

const mongoose = require('mongoose');
const KeywordService = require('../services/keywordService');
require('dotenv').config();

async function testKeywordFiltering() {
  try {
    console.log('🔄 Testing Keyword Filtering and Used Keyword Detection...');
    console.log('='.repeat(60));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const keywordService = new KeywordService();

    // Test 1: Check used keywords
    console.log('\n📋 Test 1: Checking used keywords...');
    const usedKeywords = await keywordService.getUsedKeywords();
    console.log(`Found ${usedKeywords.length} used keywords:`);
    usedKeywords.forEach((keyword, index) => {
      console.log(`  ${index + 1}. "${keyword}"`);
    });

    // Test 2: Generate keywords for a test company
    console.log('\n🎯 Test 2: Generating keywords for test company...');
    const testCompany = 'Ensite Solar';
    
    console.log('\n--- Without filtering (showing all keywords) ---');
    const allKeywords = await keywordService.getKeywordsForCompany(testCompany, false);
    console.log(`Generated ${allKeywords.length} total keywords:`);
    allKeywords.forEach((keyword, index) => {
      console.log(`  ${index + 1}. "${keyword.focusKeyword}" (${keyword.source})`);
    });

    console.log('\n--- With filtering (excluding used keywords) ---');
    const filteredKeywords = await keywordService.getKeywordsForCompany(testCompany, true);
    console.log(`Generated ${filteredKeywords.length} filtered keywords:`);
    filteredKeywords.forEach((keyword, index) => {
      console.log(`  ${index + 1}. "${keyword.focusKeyword}" (${keyword.source})`);
    });

    // Test 3: Check for location-based keywords
    console.log('\n🌍 Test 3: Checking for location-based keywords...');
    const locationTerms = ['india', 'usa', 'california', 'texas', 'florida', 'new york', 'delhi', 'mumbai', 'bangalore', 'near me', 'in my area', 'local', 'best company', 'top company'];
    
    let locationKeywordsFound = 0;
    filteredKeywords.forEach(keyword => {
      const keywordLower = keyword.focusKeyword.toLowerCase();
      const hasLocation = locationTerms.some(term => keywordLower.includes(term));
      if (hasLocation) {
        console.log(`⚠️ Location-based keyword found: "${keyword.focusKeyword}"`);
        locationKeywordsFound++;
      }
    });

    if (locationKeywordsFound === 0) {
      console.log('✅ No location-based keywords found - filtering working correctly!');
    } else {
      console.log(`❌ Found ${locationKeywordsFound} location-based keywords - filtering needs improvement`);
    }

    // Test 4: Check keyword uniqueness
    console.log('\n🔄 Test 4: Checking keyword uniqueness...');
    const keywordTexts = filteredKeywords.map(k => k.focusKeyword.toLowerCase());
    const uniqueKeywords = [...new Set(keywordTexts)];
    
    if (keywordTexts.length === uniqueKeywords.length) {
      console.log('✅ All keywords are unique');
    } else {
      console.log(`⚠️ Found ${keywordTexts.length - uniqueKeywords.length} duplicate keywords`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Keyword filtering test completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Used keywords: ${usedKeywords.length}`);
    console.log(`   - Total generated: ${allKeywords.length}`);
    console.log(`   - After filtering: ${filteredKeywords.length}`);
    console.log(`   - Location keywords: ${locationKeywordsFound}`);
    console.log(`   - Unique keywords: ${uniqueKeywords.length}/${keywordTexts.length}`);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testKeywordFiltering();
}

module.exports = testKeywordFiltering;
