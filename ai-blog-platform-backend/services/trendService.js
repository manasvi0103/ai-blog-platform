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
        case 'all':
          return await this.fetchFromAllSources(keyword, limit);
        default:
          throw new Error(`Unsupported trend source: ${source}`);
      }
    } catch (error) {
      console.error(`Error fetching ${source} data:`, error.message);
      return [];
    }
  }

  // New method to fetch from all sources and combine results
  async fetchFromAllSources(keyword, limit = 10) {
    console.log(`🔍 Fetching trends for "${keyword}" from ALL sources...`);

    const results = [];
    const sources = ['gnews', 'newsdata', 'rapidapi'];
    const limitPerSource = Math.ceil(limit / sources.length);

    // Fetch from all sources in parallel
    const promises = sources.map(async (source) => {
      try {
        console.log(`📰 Fetching from ${source}...`);
        const data = await this.fetchTrendData(keyword, source, limitPerSource);
        console.log(`✅ ${source}: ${data.length} articles`);
        return data;
      } catch (error) {
        console.warn(`⚠️ ${source} failed:`, error.message);
        return [];
      }
    });

    const allResults = await Promise.all(promises);

    // Combine and deduplicate results
    const combined = allResults.flat();
    const unique = this.deduplicateArticles(combined);

    // Sort by relevance and recency
    const sorted = unique.sort((a, b) => {
      const scoreA = (a.relevanceScore || 50) + (this.getRecencyScore(a.publishedAt) || 0);
      const scoreB = (b.relevanceScore || 50) + (this.getRecencyScore(b.publishedAt) || 0);
      return scoreB - scoreA;
    });

    console.log(`🎯 Combined results: ${sorted.length} unique articles from ${sources.length} sources`);
    return sorted.slice(0, limit);
  }

  // Helper method to remove duplicate articles
  deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Helper method to calculate recency score
  getRecencyScore(publishedAt) {
    if (!publishedAt) return 0;

    const now = new Date();
    const published = new Date(publishedAt);
    const daysDiff = (now - published) / (1000 * 60 * 60 * 24);

    // More recent articles get higher scores
    if (daysDiff <= 1) return 20;
    if (daysDiff <= 7) return 15;
    if (daysDiff <= 30) return 10;
    return 5;
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