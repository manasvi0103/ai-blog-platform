// services/trendService.js
const axios = require('axios');
const TrendData = require('../models/TrendData');

class TrendService {
  constructor() {
    this.gnewsApiKey = process.env.GNEWS_API_KEY;
    this.newsdataApiKey = process.env.NEWSDATA_API_KEY;
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
  }

  async fetchTrendData(keyword, source = 'gnews', limit = 10) {
    try {
      switch (source) {
        case 'gnews':
          return await this.fetchGNewsData(keyword, limit);
        case 'newsdata':
          return await this.fetchNewsDataIO(keyword, limit);
        case 'rapidapi':
          return await this.fetchRapidAPIData(keyword, limit);
        default:
          throw new Error(`Unsupported trend source: ${source}`);
      }
    } catch (error) {
      console.error(`Error fetching ${source} data:`, error.message);
      return [];
    }
  }

  async fetchGNewsData(keyword, limit) {
    if (!this.gnewsApiKey) {
      throw new Error('GNews API key not configured');
    }

    const response = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        q: keyword,
        token: this.gnewsApiKey,
        lang: 'en',
        max: limit,
        sortby: 'publishedAt'
      }
    });

    return response.data.articles.map(article => ({
      source: 'gnews',
      keyword,
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: new Date(article.publishedAt),
      relevanceScore: this.calculateRelevanceScore(article.title + ' ' + article.description, keyword),
      extractedContent: {
        summary: article.description,
        keyPoints: [],
        quotes: []
      }
    }));
  }

  async fetchNewsDataIO(keyword, limit) {
    if (!this.newsdataApiKey) {
      throw new Error('NewsData API key not configured');
    }

    const response = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: this.newsdataApiKey,
        q: keyword,
        language: 'en',
        size: limit
      }
    });

    return response.data.results.map(article => ({
      source: 'newsdata',
      keyword,
      title: article.title,
      description: article.description,
      url: article.link,
      publishedAt: new Date(article.pubDate),
      relevanceScore: this.calculateRelevanceScore(article.title + ' ' + article.description, keyword),
      extractedContent: {
        summary: article.description,
        keyPoints: [],
        quotes: []
      }
    }));
  }

  async fetchRapidAPIData(keyword, limit) {
    if (!this.rapidApiKey) {
      throw new Error('RapidAPI key not configured');
    }

    // Example using a news API from RapidAPI marketplace
    const response = await axios.get('https://bing-news-search1.p.rapidapi.com/news/search', {
      headers: {
        'X-RapidAPI-Key': this.rapidApiKey,
        'X-RapidAPI-Host': 'bing-news-search1.p.rapidapi.com'
      },
      params: {
        q: keyword,
        count: limit,
        freshness: 'Day',
        textFormat: 'Raw',
        safeSearch: 'Off'
      }
    });

    return response.data.value.map(article => ({
      source: 'rapidapi',
      keyword,
      title: article.name,
      description: article.description,
      url: article.url,
      publishedAt: new Date(article.datePublished),
      relevanceScore: this.calculateRelevanceScore(article.name + ' ' + article.description, keyword),
      extractedContent: {
        summary: article.description,
        keyPoints: [],
        quotes: []
      }
    }));
  }

  calculateRelevanceScore(text, keyword) {
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const keywordWords = lowerKeyword.split(' ');
    
    let score = 0;
    keywordWords.forEach(word => {
      const occurrences = (lowerText.match(new RegExp(word, 'g')) || []).length;
      score += occurrences * 10;
    });
    
    // Bonus for exact phrase match
    if (lowerText.includes(lowerKeyword)) {
      score += 25;
    }
    
    return Math.min(score, 100);
  }

  async getCompetitorAnalysis(keyword, limit = 5) {
    try {
      // Combine results from multiple sources
      const allTrends = await Promise.allSettled([
        this.fetchTrendData(keyword, 'gnews', limit),
        this.fetchTrendData(keyword, 'newsdata', limit)
      ]);

      const combinedResults = allTrends
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat()
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      return combinedResults;
    } catch (error) {
      console.error('Competitor analysis error:', error);
      return [];
    }
  }
}

module.exports = new TrendService();