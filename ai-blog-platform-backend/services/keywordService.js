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

      // 1. Get 2 manual keywords from Google Sheets
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

      // 2. Generate 2 AI keywords using Gemini
      let aiKeywords = [];
      try {
        const generatedKeywords = await this.generateAIKeywords(companyName);
        aiKeywords = generatedKeywords.slice(0, 2); // Take only first 2
        console.log(`✅ Generated ${aiKeywords.length} AI keywords using Gemini`);
      } catch (error) {
        console.warn('⚠️ Failed to generate AI keywords:', error.message);
        // Fallback to 2 solar industry keywords if AI fails
        const fallbackKeywords = this.getFallbackKeywords(companyName);
        aiKeywords = fallbackKeywords.slice(0, 2);
        console.log(`✅ Using ${aiKeywords.length} fallback keywords`);
      }

      // 3. Combine manual + AI keywords
      finalKeywords = [...manualKeywords, ...aiKeywords];

      // 4. Filter out keywords already used in existing drafts
      if (excludeDraftKeywords) {
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

      // 5. Ensure we have exactly 4 keywords (2 manual + 2 AI)
      return finalKeywords.slice(0, 4);

    } catch (error) {
      console.error('Error getting keywords:', error);
      // Return 2 fallback keywords if everything fails
      return this.getFallbackKeywords(companyName).slice(0, 2);
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

      const prompt = `Generate exactly 2 relevant blog post keywords for a solar company called "${companyName}".
      Focus on solar industry keywords that would be good for SEO and content marketing.
      Make sure these are different from common keywords like "solar PTO", "solar system design guide", "photovoltaic software".
      ${trendingTopics}

      Return only a JSON array with exactly 2 objects containing:
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

        // Ensure we have exactly 2 keywords
        if (Array.isArray(aiKeywords) && aiKeywords.length > 0) {
          return aiKeywords.slice(0, 2);
        }
      } catch (parseError) {
        console.warn('Failed to parse AI keywords JSON, using fallback');
      }

      // Fallback keywords if parsing fails
      return this.getFallbackKeywords(companyName).slice(0, 2);
    } catch (error) {
      console.error('AI keyword generation error:', error);
      return this.getFallbackKeywords(companyName).slice(0, 2);
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
