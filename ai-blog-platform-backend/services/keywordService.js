// services/keywordService.js
const googleSheetsService = require('./googleSheetsService');
const geminiService = require('./geminiService');
const trendService = require('./trendService');
const Draft = require('../models/Draft');
const BlogData = require('../models/BlogData');

class KeywordService {
  async getKeywordsForCompany(companyName, excludeDraftKeywords = true) {
    try {
      let finalKeywords = [];

      // 1. Try to get manual keywords from Google Sheets (if available)
      let manualKeywords = [];
      if (process.env.BLOG_DATA_SPREADSHEET_ID) {
        try {
          const allManualKeywords = await googleSheetsService.getKeywordsFromSheet(
            process.env.BLOG_DATA_SPREADSHEET_ID
          );
          manualKeywords = allManualKeywords.slice(0, 2); // Take only first 2
          console.log(`✅ Fetched ${manualKeywords.length} manual keywords from Google Sheets`);
        } catch (error) {
          console.warn('⚠️ Failed to fetch manual keywords from sheets:', error.message);
        }
      }

      // 2. Generate AI keywords using Gemini (always generate 4 if no manual keywords)
      let aiKeywords = [];
      const keywordsToGenerate = manualKeywords.length > 0 ? 2 : 4; // Generate more if no manual keywords

      try {
        console.log(`🤖 Generating ${keywordsToGenerate} AI keywords with trends and competitor analysis for ${companyName}`);
        const generatedKeywords = await this.generateAIKeywordsWithTrends(companyName, keywordsToGenerate);
        aiKeywords = generatedKeywords.slice(0, keywordsToGenerate);
        console.log(`✅ Generated ${aiKeywords.length} AI keywords using Gemini with trend analysis`);
      } catch (error) {
        console.warn('⚠️ Failed to generate AI keywords with trends:', error.message);
        // Fallback to basic AI keywords
        try {
          const basicKeywords = await this.generateAIKeywords(companyName);
          aiKeywords = basicKeywords.slice(0, keywordsToGenerate);
          console.log(`✅ Generated ${aiKeywords.length} basic AI keywords`);
        } catch (basicError) {
          console.warn('⚠️ Failed to generate basic AI keywords:', basicError.message);
          // Final fallback to solar industry keywords
          const fallbackKeywords = this.getFallbackKeywords(companyName);
          aiKeywords = fallbackKeywords.slice(0, keywordsToGenerate);
          console.log(`✅ Using ${aiKeywords.length} fallback keywords`);
        }
      }

      // 3. Combine manual + AI keywords
      finalKeywords = [...manualKeywords, ...aiKeywords];

      // 4. Filter out keywords already used in existing drafts (TEMPORARILY DISABLED)
      if (excludeDraftKeywords && false) { // Disabled to show AI keywords
        try {
          const usedKeywords = await this.getUsedKeywords();
          finalKeywords = finalKeywords.filter(keyword =>
            !usedKeywords.includes(keyword.focusKeyword.toLowerCase())
          );
          console.log(`✅ Filtered out used keywords`);
        } catch (error) {
          console.warn('⚠️ Failed to check used keywords:', error.message);
        }
      }

      // 5. Ensure we have at least 4 keywords
      if (finalKeywords.length < 4) {
        console.log(`⚠️ Only ${finalKeywords.length} keywords available, generating additional ones`);
        const additionalNeeded = 4 - finalKeywords.length;
        const additionalKeywords = this.getFallbackKeywords(companyName).slice(0, additionalNeeded);
        finalKeywords = [...finalKeywords, ...additionalKeywords];
      }

      return finalKeywords.slice(0, 4);

    } catch (error) {
      console.error('Error getting keywords:', error);
      // Return 4 fallback keywords if everything fails
      return this.getFallbackKeywords(companyName).slice(0, 4);
    }
  }
  
  async generateAIKeywords(companyName) {
    try {
      // First, get trending solar topics from news APIs
      let trendingTopics = '';
      try {
        console.log('🔍 Fetching trending solar topics...');
        const trendData = await trendService.fetchTrendData('solar energy', 'newsdata', 5);
        if (trendData && trendData.length > 0) {
          const topics = trendData.map(item => item.title).join(', ');
          trendingTopics = `\n\nCurrent trending solar topics from news: ${topics}`;
          console.log('✅ Found trending topics for keyword generation');
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch trending topics:', error.message);
      }

      const prompt = `Generate exactly 4 relevant blog post keywords for a solar company called "${companyName}".
      Focus on solar industry keywords that would be good for SEO and content marketing.
      Make sure these are different from common keywords like "solar PTO", "solar system design guide", "photovoltaic software".
      ${trendingTopics}

      Return only a JSON array with exactly 4 objects containing:
      - focusKeyword: the main keyword phrase (solar industry related, consider trending topics if relevant)
      - articleFormat: one of "how-to", "guide", "listicle", "comparison", "review"
      - wordCount: suggested word count like "1200-1800" (MAX 2000 words)
      - targetAudience: who this content is for
      - objective: what the goal of this content is
      - source: "ai"

      Example format:
      [
        {"focusKeyword": "solar financing options", "articleFormat": "guide", "wordCount": "1500-2000", "targetAudience": "Homeowners", "objective": "Lead generation", "source": "ai"},
        {"focusKeyword": "solar battery storage systems", "articleFormat": "comparison", "wordCount": "1600-2000", "targetAudience": "Property owners", "objective": "Education", "source": "ai"}
      ]`;

      const response = await geminiService.generateContent(prompt, { name: companyName });

      // Try to parse JSON from the response
      let aiKeywords = [];
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiKeywords = JSON.parse(jsonMatch[0]);
        } else {
          aiKeywords = JSON.parse(response.content);
        }

        // Ensure we have keywords
        if (Array.isArray(aiKeywords) && aiKeywords.length > 0) {
          return aiKeywords.slice(0, 4);
        }
      } catch (parseError) {
        console.warn('Failed to parse AI keywords JSON, using fallback');
      }

      // Fallback keywords if parsing fails
      return this.getFallbackKeywords(companyName).slice(0, 4);
    } catch (error) {
      console.error('AI keyword generation error:', error);
      return this.getFallbackKeywords(companyName).slice(0, 4);
    }
  }

  async generateAIKeywordsWithTrends(companyName, count = 4) {
    try {
      // First, get trend data for solar industry from multiple sources
      const trendService = require('./trendService');
      let trendData = [];

      try {
        console.log(`📊 Fetching comprehensive trend data for ${count} keyword generation...`);
        trendData = await trendService.fetchTrendData('solar energy', 'all', 10);
        console.log(`✅ Fetched ${trendData.length} trend articles for enhanced keyword context`);
      } catch (error) {
        console.warn('⚠️ Could not fetch trend data for keyword generation:', error.message);
      }

      // Create comprehensive trend context
      const trendContext = trendData.length > 0
        ? `Current industry trends and hot topics: ${trendData.map(t => t.title).slice(0, 5).join(', ')}`
        : 'Focus on evergreen solar industry topics with high search volume';

      const prompt = `Generate exactly ${count} high-value SEO keywords for ${companyName} in the solar energy industry.
      Consider current market trends, competitor analysis, and search volume opportunities.

      ${trendContext}

      Focus on:
      1. Keywords that drive qualified leads and conversions
      2. Topics showing search volume growth and trending interest
      3. Competitive opportunities and content gaps
      4. Local and commercial solar markets
      5. Emerging solar technologies and industry developments
      6. Seasonal and timely solar topics

      Return only a JSON array with exactly ${count} objects containing:
      - focusKeyword: the main keyword phrase (consider trending topics and search intent)
      - articleFormat: one of "how-to", "guide", "listicle", "comparison", "review", "case-study"
      - wordCount: suggested word count like "1500-2000" (MAX 2500 words)
      - targetAudience: specific target audience
      - objective: content goal (Lead generation, Brand awareness, Education, etc.)
      - source: "ai-trends"

      Example format:
      [
        {"focusKeyword": "solar panel installation cost 2024", "articleFormat": "guide", "wordCount": "1800-2200", "targetAudience": "Homeowners researching solar", "objective": "Lead generation", "source": "ai-trends"},
        {"focusKeyword": "commercial solar ROI calculator", "articleFormat": "tool", "wordCount": "1200-1500", "targetAudience": "Business owners", "objective": "Lead generation", "source": "ai-trends"}
      ]`;

      const response = await geminiService.generateContent(prompt, {
        name: companyName,
        tone: 'professional',
        targetAudience: 'Solar industry professionals and potential customers'
      });

      // Try to parse JSON from the response
      let aiKeywords = [];
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiKeywords = JSON.parse(jsonMatch[0]);
        } else {
          aiKeywords = JSON.parse(response.content);
        }

        // Ensure we have the requested number of keywords
        if (Array.isArray(aiKeywords) && aiKeywords.length > 0) {
          console.log(`✅ Generated ${aiKeywords.length} trend-based keywords`);
          return aiKeywords.slice(0, count);
        }
      } catch (parseError) {
        console.warn('Failed to parse AI keywords with trends JSON, falling back to basic generation');
      }

      // Fallback to basic AI keyword generation
      return await this.generateAIKeywords(companyName);
    } catch (error) {
      console.error('AI keyword generation with trends error:', error);
      return await this.generateAIKeywords(companyName);
    }
  }

  getFallbackKeywords(companyName) {
    // Solar industry related fallback keywords
    return [
      {
        focusKeyword: "solar panel installation guide",
        articleFormat: "guide",
        wordCount: "1500-2000",
        targetAudience: "Homeowners",
        objective: "Lead generation",
        source: "fallback"
      },
      {
        focusKeyword: "solar energy cost savings",
        articleFormat: "how-to",
        wordCount: "1200-1800",
        targetAudience: "Property owners",
        objective: "Education",
        source: "fallback"
      },
      {
        focusKeyword: "commercial solar system benefits",
        articleFormat: "comparison",
        wordCount: "1800-2200",
        targetAudience: "Business owners",
        objective: "Lead generation",
        source: "fallback"
      },
      {
        focusKeyword: "solar financing options",
        articleFormat: "guide",
        wordCount: "1400-1800",
        targetAudience: "Homeowners and businesses",
        objective: "Lead generation",
        source: "fallback"
      },
      {
        focusKeyword: "commercial solar design",
        articleFormat: "guide",
        wordCount: "1800-2000",
        targetAudience: "Business owners",
        objective: "Lead generation",
        source: "fallback"
      },
      {
        focusKeyword: "solar permit process",
        articleFormat: "how-to",
        wordCount: "1000-1500",
        targetAudience: "Solar installers",
        objective: "Education",
        source: "fallback"
      },
      {
        focusKeyword: "solar system maintenance",
        articleFormat: "guide",
        wordCount: "1200-1600",
        targetAudience: "Solar owners",
        objective: "Customer retention",
        source: "fallback"
      }
    ];
  }
  
  async getUsedKeywords() {
    try {
      // Get all existing drafts and their keywords
      const drafts = await Draft.find().populate('blogId');
      const usedKeywords = drafts
        .map(draft => draft.blogId?.focusKeyword)
        .filter(keyword => keyword && keyword !== 'placeholder')
        .map(keyword => keyword.toLowerCase());
      
      return [...new Set(usedKeywords)]; // Remove duplicates
    } catch (error) {
      console.error('Error getting used keywords:', error);
      return [];
    }
  }
}

module.exports = new KeywordService();
