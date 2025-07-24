// services/geminiService.js
const axios = require('axios');
require('dotenv').config();

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  async generateContent(prompt, companyContext = {}) {
    try {
      console.log('🔑 Gemini API Key in service:', this.apiKey ? 'SET' : 'NOT SET');
      console.log('🔑 API Key length:', this.apiKey?.length);

      const contextualPrompt = this.buildContextualPrompt(prompt, companyContext);

      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: contextualPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      return {
        content: generatedText,
        keywords: this.extractKeywords(generatedText),
        wordCount: generatedText.split(' ').length
      };
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      throw new Error('Failed to generate content with Gemini');
    }
  }

  buildContextualPrompt(prompt, companyContext) {
    let contextualPrompt = '';
    
    if (companyContext.name) {
      contextualPrompt += `Company: ${companyContext.name}\n`;
    }
    if (companyContext.tone) {
      contextualPrompt += `Tone: ${companyContext.tone}\n`;
    }
    if (companyContext.brandVoice) {
      contextualPrompt += `Brand Voice: ${companyContext.brandVoice}\n`;
    }
    if (companyContext.serviceOverview) {
      contextualPrompt += `Services: ${companyContext.serviceOverview}\n`;
    }
    if (companyContext.targetAudience) {
      contextualPrompt += `Target Audience: ${companyContext.targetAudience}\n`;
    }

    contextualPrompt += `\n${prompt}`;
    return contextualPrompt;
  }

  extractKeywords(text) {
    // Simple keyword extraction - can be enhanced with NLP libraries
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const frequency = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  async generateKeywordSuggestions(focusKeyword, companyContext) {
    const prompt = `Generate 15 related keywords and long-tail keywords for the focus keyword "${focusKeyword}". 
    Consider SEO best practices and search intent. Format as a comma-separated list.`;
    
    try {
      const result = await this.generateContent(prompt, companyContext);
      const keywords = result.content
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      return keywords;
    } catch (error) {
      console.error('Keyword generation error:', error);
      return [];
    }
  }

  async generateMetaContent(title, companyContext) {
    const prompt = `Generate SEO-optimized meta title (max 60 characters) and meta description (max 160 characters) for the article title: "${title}". 
    Format as JSON: {"metaTitle": "...", "metaDescription": "..."}`;
    
    try {
      const result = await this.generateContent(prompt, companyContext);
      return JSON.parse(result.content.replace(/```json|```/g, ''));
    } catch (error) {
      console.error('Meta content generation error:', error);
      return {
        metaTitle: title.substring(0, 60),
        metaDescription: `Learn more about ${title.toLowerCase()}`
      };
    }
  }

  async generateH1Alternatives(focusKeyword, articleFormat, companyContext) {
    const prompt = `Generate 5 different H1 title alternatives for a ${articleFormat} article about "${focusKeyword}". 
    Make them engaging, SEO-friendly, and include the focus keyword. Format as JSON array.`;
    
    try {
      const result = await this.generateContent(prompt, companyContext);
      const titles = JSON.parse(result.content.replace(/```json|```/g, ''));
      return Array.isArray(titles) ? titles : [titles];
    } catch (error) {
      console.error('H1 generation error:', error);
      return [`Complete Guide to ${focusKeyword}`];
    }
  }
}

module.exports = new GeminiService();
