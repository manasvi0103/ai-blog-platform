const geminiService = require('./geminiService');
const trendService = require('./trendService');

class MetaService {
  async generateMetaData(keyword, companyInfo) {
    try {
      console.log(`🎯 META SERVICE: Generating meta for keyword: "${keyword.focusKeyword}"`);
      console.log(`   Company: ${companyInfo.companyName}`);
      console.log(`   Article Format: ${keyword.articleFormat}`);

      // Get trending topics for better meta generation
      let trendingContext = '';
      try {
        console.log('🔍 Fetching trending topics from ALL sources for meta generation...');
        const trendData = await trendService.fetchTrendData(keyword.focusKeyword, 'all', 5);
        if (trendData && trendData.length > 0) {
          const topics = trendData.map(item => item.title).slice(0, 3).join(', ');
          trendingContext = `\n\nCurrent trending topics related to "${keyword.focusKeyword}": ${topics}`;
          console.log('✅ Found trending context for meta generation');
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch trending context for meta:', error.message);
      }

      const prompt = `Generate RankMath SEO-optimized meta data for a blog post about "${keyword.focusKeyword}" for a solar company called "${companyInfo.companyName}".

Company Context:
- Company: ${companyInfo.companyName}
- Services: ${companyInfo.servicesOffered || 'Solar services'}
- Target Audience: ${keyword.targetAudience}
- Article Format: ${keyword.articleFormat}
- Word Count: ${keyword.wordCount}
- Objective: ${keyword.objective}
${trendingContext}

Generate the following in JSON format with RankMath SEO requirements:
{
  "h1": "Main H1 heading (50-60 characters, MUST start with focus keyword '${keyword.focusKeyword}')",
  "metaTitle": "SEO title for search engines (50-60 characters, focus keyword at beginning, include company name)",
  "metaDescription": "Meta description (140-155 characters, focus keyword in first 120 chars, include CTA)",
  "focusKeyword": "${keyword.focusKeyword}",
  "seoScore": "Estimated RankMath SEO score out of 100",
  "keywordPlacement": "Focus keyword placement strategy"
}

RankMath SEO Requirements:
- H1: Focus keyword at the beginning, power words, under 60 characters
- Meta Title: Focus keyword first, company name, compelling, 50-60 chars
- Meta Description: Focus keyword early, benefit-focused, CTA, 140-155 chars
- Optimize for click-through rate and search ranking
- Include emotional triggers and power words
- Make it relevant to ${keyword.targetAudience}
- Consider trending topics for better engagement

Example format:
{
  "h1": "Complete Solar Panel Installation Guide for Homeowners",
  "metaTitle": "Solar Panel Installation Guide | WattMonk Solar Solutions",
  "metaDescription": "Learn how to install solar panels with our comprehensive guide. Expert tips, costs, and benefits from WattMonk's solar professionals."
}`;

      const response = await geminiService.generateContent(prompt, { 
        keyword: keyword.focusKeyword,
        company: companyInfo.companyName 
      });

      // Try to parse JSON from the response
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const metaData = JSON.parse(jsonMatch[0]);
          
          // Validate required fields
          if (metaData.h1 && metaData.metaTitle && metaData.metaDescription) {
            return {
              h1: metaData.h1.trim(),
              metaTitle: metaData.metaTitle.trim(),
              metaDescription: metaData.metaDescription.trim()
            };
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse meta data JSON, using fallback');
      }

      // Fallback meta data if parsing fails
      return this.getFallbackMetaData(keyword, companyInfo);
      
    } catch (error) {
      console.error('Meta data generation error:', error);
      return this.getFallbackMetaData(keyword, companyInfo);
    }
  }

  getFallbackMetaData(keyword, companyInfo) {
    const companyName = companyInfo.companyName || 'Solar Company';
    const focusKeyword = keyword.focusKeyword;
    
    return {
      h1: `${focusKeyword.charAt(0).toUpperCase() + focusKeyword.slice(1)} - Complete Guide`,
      metaTitle: `${focusKeyword} | ${companyName} Solar Solutions`,
      metaDescription: `Discover everything about ${focusKeyword} with ${companyName}. Expert insights, tips, and solutions for your solar needs.`
    };
  }
}

module.exports = new MetaService();
