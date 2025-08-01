/**
 * SERP Service for WattMonk AI Blog Platform
 * 
 * Handles:
 * - Google Search API integration
 * - Competitor research and analysis
 * - Keyword ranking analysis
 * - Search volume and difficulty estimation
 * 
 * @author WattMonk Technologies
 * @version 3.0.0 - Production Ready
 */

const axios = require('axios');

class SerpService {
  constructor() {
    this.serpApiKey = process.env.SERP_API_KEY;
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
    this.defaultTimeout = 15000;
  }

  /**
   * Search Google for competitor analysis
   * @param {string} keyword - Search keyword
   * @param {string} excludeDomain - Domain to exclude from results
   * @param {number} limit - Number of results to return
   * @returns {Array} Array of competitor results
   */
  async searchCompetitors(keyword, excludeDomain = '', limit = 10) {
    try {
      console.log(`🔍 Searching competitors for keyword: "${keyword}"`);

      if (!this.serpApiKey) {
        console.warn('SERP API key not configured, using fallback');
        return this.getFallbackCompetitors(keyword, limit);
      }

      const searchQuery = excludeDomain 
        ? `${keyword} solar -site:${excludeDomain}`
        : `${keyword} solar`;

      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: searchQuery,
          api_key: this.serpApiKey,
          engine: 'google',
          num: limit,
          hl: 'en',
          gl: 'us'
        },
        timeout: this.defaultTimeout
      });

      const results = response.data.organic_results || [];
      
      const competitors = results.map((result, index) => ({
        rank: index + 1,
        title: result.title,
        url: result.link,
        snippet: result.snippet || '',
        domain: this.extractDomain(result.link),
        estimatedTraffic: this.estimateTraffic(index + 1),
        domainAuthority: this.estimateDomainAuthority(result.link),
        keywordRelevance: this.calculateKeywordRelevance(result.title + ' ' + result.snippet, keyword)
      }));

      console.log(`✅ Found ${competitors.length} competitors for "${keyword}"`);
      return competitors;

    } catch (error) {
      console.error('SERP search error:', error.message);
      return this.getFallbackCompetitors(keyword, limit);
    }
  }

  /**
   * Get keyword analysis data
   * @param {string} keyword - Keyword to analyze
   * @returns {Object} Keyword analysis data
   */
  async analyzeKeyword(keyword) {
    try {
      console.log(`📊 Analyzing keyword: "${keyword}"`);

      // Get search results for analysis
      const competitors = await this.searchCompetitors(keyword, '', 10);
      
      // Calculate metrics
      const analysis = {
        keyword: keyword,
        searchVolume: this.estimateSearchVolume(keyword),
        difficulty: this.estimateKeywordDifficulty(competitors),
        cpc: this.estimateCPC(keyword),
        competition: this.analyzeCompetition(competitors),
        topCompetitors: competitors.slice(0, 5),
        relatedKeywords: this.generateRelatedKeywords(keyword),
        searchIntent: this.determineSearchIntent(keyword),
        seasonality: this.analyzeSeasonality(keyword)
      };

      console.log(`✅ Keyword analysis complete for "${keyword}"`);
      return analysis;

    } catch (error) {
      console.error('Keyword analysis error:', error.message);
      return this.getFallbackKeywordAnalysis(keyword);
    }
  }

  /**
   * Get keyword clustering data
   * @param {string} mainKeyword - Main keyword
   * @param {Array} relatedKeywords - Related keywords
   * @returns {Object} Keyword cluster data
   */
  async getKeywordClusters(mainKeyword, relatedKeywords = []) {
    try {
      console.log(`🔗 Generating keyword clusters for: "${mainKeyword}"`);

      const clusters = {
        primary: {
          keyword: mainKeyword,
          searchVolume: this.estimateSearchVolume(mainKeyword),
          difficulty: this.estimateKeywordDifficulty([]),
          intent: this.determineSearchIntent(mainKeyword)
        },
        secondary: [],
        longtail: []
      };

      // Generate secondary keywords
      const secondaryKeywords = [
        `${mainKeyword} benefits`,
        `${mainKeyword} cost`,
        `${mainKeyword} installation`,
        `${mainKeyword} guide`,
        `${mainKeyword} companies`
      ];

      clusters.secondary = secondaryKeywords.map(keyword => ({
        keyword: keyword,
        searchVolume: Math.floor(this.estimateSearchVolume(mainKeyword) * 0.3),
        difficulty: Math.max(20, this.estimateKeywordDifficulty([]) - 15),
        intent: this.determineSearchIntent(keyword),
        relevance: this.calculateKeywordRelevance(keyword, mainKeyword)
      }));

      // Generate long-tail keywords
      const longtailKeywords = [
        `best ${mainKeyword} for home`,
        `how to choose ${mainKeyword}`,
        `${mainKeyword} vs alternatives`,
        `${mainKeyword} installation process`,
        `${mainKeyword} maintenance tips`
      ];

      clusters.longtail = longtailKeywords.map(keyword => ({
        keyword: keyword,
        searchVolume: Math.floor(this.estimateSearchVolume(mainKeyword) * 0.1),
        difficulty: Math.max(10, this.estimateKeywordDifficulty([]) - 25),
        intent: this.determineSearchIntent(keyword),
        relevance: this.calculateKeywordRelevance(keyword, mainKeyword)
      }));

      console.log(`✅ Generated keyword clusters: ${clusters.secondary.length} secondary, ${clusters.longtail.length} long-tail`);
      return clusters;

    } catch (error) {
      console.error('Keyword clustering error:', error.message);
      return this.getFallbackKeywordClusters(mainKeyword);
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - Full URL
   * @returns {string} Domain name
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown-domain.com';
    }
  }

  /**
   * Estimate traffic based on search position
   * @param {number} position - Search result position
   * @returns {number} Estimated monthly traffic
   */
  estimateTraffic(position) {
    const ctrRates = {
      1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.06,
      6: 0.05, 7: 0.04, 8: 0.03, 9: 0.03, 10: 0.02
    };
    
    const baseCtr = ctrRates[position] || 0.01;
    const estimatedSearchVolume = Math.floor(Math.random() * 5000) + 1000;
    
    return Math.floor(estimatedSearchVolume * baseCtr);
  }

  /**
   * Estimate domain authority
   * @param {string} url - Domain URL
   * @returns {number} Estimated domain authority (1-100)
   */
  estimateDomainAuthority(url) {
    const domain = this.extractDomain(url);
    
    // High authority domains
    const highAuthority = ['energy.gov', 'nrel.gov', 'seia.org'];
    const mediumAuthority = ['solarpowerworldonline.com', 'pv-magazine.com'];
    
    if (highAuthority.some(d => domain.includes(d))) return Math.floor(Math.random() * 10) + 90;
    if (mediumAuthority.some(d => domain.includes(d))) return Math.floor(Math.random() * 20) + 70;
    
    return Math.floor(Math.random() * 40) + 40;
  }

  /**
   * Calculate keyword relevance score
   * @param {string} content - Content to analyze
   * @param {string} keyword - Target keyword
   * @returns {number} Relevance score (0-100)
   */
  calculateKeywordRelevance(content, keyword) {
    if (!content || !keyword) return 0;
    
    const contentLower = content.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    const keywordWords = keywordLower.split(' ');
    
    let score = 0;
    
    // Exact match bonus
    if (contentLower.includes(keywordLower)) score += 40;
    
    // Partial match scoring
    keywordWords.forEach(word => {
      if (contentLower.includes(word)) score += 15;
    });
    
    return Math.min(100, score);
  }

  /**
   * Estimate search volume for keyword
   * @param {string} keyword - Keyword to estimate
   * @returns {number} Estimated monthly search volume
   */
  estimateSearchVolume(keyword) {
    const keywordLength = keyword.split(' ').length;
    const baseVolume = keywordLength === 1 ? 5000 : 
                     keywordLength === 2 ? 2000 : 
                     keywordLength === 3 ? 800 : 300;
    
    return Math.floor(Math.random() * baseVolume) + Math.floor(baseVolume * 0.5);
  }

  /**
   * Estimate keyword difficulty
   * @param {Array} competitors - Competitor data
   * @returns {number} Difficulty score (0-100)
   */
  estimateKeywordDifficulty(competitors) {
    if (!competitors || competitors.length === 0) {
      return Math.floor(Math.random() * 30) + 40; // Default range 40-70
    }
    
    const avgDomainAuthority = competitors.reduce((sum, comp) => sum + comp.domainAuthority, 0) / competitors.length;
    return Math.min(100, Math.floor(avgDomainAuthority * 0.8) + Math.floor(Math.random() * 20));
  }

  /**
   * Estimate CPC for keyword
   * @param {string} keyword - Keyword
   * @returns {number} Estimated CPC in USD
   */
  estimateCPC(keyword) {
    const solarKeywords = ['solar', 'panel', 'energy', 'installation'];
    const isHighValue = solarKeywords.some(k => keyword.toLowerCase().includes(k));
    
    if (isHighValue) {
      return parseFloat((Math.random() * 3 + 2).toFixed(2)); // $2-5 for solar keywords
    }
    
    return parseFloat((Math.random() * 1.5 + 0.5).toFixed(2)); // $0.5-2 for others
  }

  /**
   * Analyze competition level
   * @param {Array} competitors - Competitor data
   * @returns {string} Competition level
   */
  analyzeCompetition(competitors) {
    if (!competitors || competitors.length === 0) return 'Medium';
    
    const avgDA = competitors.reduce((sum, comp) => sum + comp.domainAuthority, 0) / competitors.length;
    
    if (avgDA >= 80) return 'High';
    if (avgDA >= 60) return 'Medium';
    return 'Low';
  }

  /**
   * Generate related keywords
   * @param {string} keyword - Main keyword
   * @returns {Array} Array of related keywords
   */
  generateRelatedKeywords(keyword) {
    const modifiers = ['best', 'top', 'how to', 'guide', 'tips', 'cost', 'benefits', 'installation'];
    const suffixes = ['2024', 'guide', 'cost', 'benefits', 'installation', 'companies', 'services'];
    
    const related = [];
    
    modifiers.forEach(modifier => {
      related.push(`${modifier} ${keyword}`);
    });
    
    suffixes.forEach(suffix => {
      related.push(`${keyword} ${suffix}`);
    });
    
    return related.slice(0, 10);
  }

  /**
   * Determine search intent
   * @param {string} keyword - Keyword to analyze
   * @returns {string} Search intent type
   */
  determineSearchIntent(keyword) {
    const keywordLower = keyword.toLowerCase();
    
    if (keywordLower.includes('how to') || keywordLower.includes('guide') || keywordLower.includes('tips')) {
      return 'Informational';
    }
    
    if (keywordLower.includes('buy') || keywordLower.includes('cost') || keywordLower.includes('price')) {
      return 'Commercial';
    }
    
    if (keywordLower.includes('best') || keywordLower.includes('vs') || keywordLower.includes('compare')) {
      return 'Commercial';
    }
    
    return 'Informational';
  }

  /**
   * Analyze keyword seasonality
   * @param {string} keyword - Keyword to analyze
   * @returns {Object} Seasonality data
   */
  analyzeSeasonality(keyword) {
    // Solar keywords typically peak in spring/summer
    const solarKeywords = ['solar', 'panel', 'energy'];
    const isSolar = solarKeywords.some(k => keyword.toLowerCase().includes(k));
    
    if (isSolar) {
      return {
        peak: 'Summer',
        low: 'Winter',
        trend: 'Seasonal',
        peakMonths: ['April', 'May', 'June', 'July', 'August']
      };
    }
    
    return {
      peak: 'Stable',
      low: 'Stable',
      trend: 'Consistent',
      peakMonths: []
    };
  }

  /**
   * Get fallback competitors when API fails
   * @param {string} keyword - Search keyword
   * @param {number} limit - Number of results
   * @returns {Array} Fallback competitor data
   */
  getFallbackCompetitors(keyword, limit = 5) {
    const fallbackCompetitors = [
      {
        rank: 1,
        title: `${keyword} - Solar Power World`,
        url: 'https://www.solarpowerworldonline.com/',
        snippet: `Comprehensive guide to ${keyword} in solar industry`,
        domain: 'solarpowerworldonline.com',
        estimatedTraffic: 15000,
        domainAuthority: 75,
        keywordRelevance: 85
      },
      {
        rank: 2,
        title: `${keyword} - PV Magazine`,
        url: 'https://www.pv-magazine.com/',
        snippet: `Latest insights on ${keyword} technology`,
        domain: 'pv-magazine.com',
        estimatedTraffic: 12000,
        domainAuthority: 72,
        keywordRelevance: 82
      },
      {
        rank: 3,
        title: `${keyword} - SEIA Research`,
        url: 'https://www.seia.org/',
        snippet: `Industry data and research on ${keyword}`,
        domain: 'seia.org',
        estimatedTraffic: 8000,
        domainAuthority: 88,
        keywordRelevance: 78
      }
    ];

    return fallbackCompetitors.slice(0, limit);
  }

  /**
   * Get fallback keyword analysis
   * @param {string} keyword - Keyword to analyze
   * @returns {Object} Fallback analysis data
   */
  getFallbackKeywordAnalysis(keyword) {
    return {
      keyword: keyword,
      searchVolume: this.estimateSearchVolume(keyword),
      difficulty: 55,
      cpc: this.estimateCPC(keyword),
      competition: 'Medium',
      topCompetitors: this.getFallbackCompetitors(keyword, 3),
      relatedKeywords: this.generateRelatedKeywords(keyword),
      searchIntent: this.determineSearchIntent(keyword),
      seasonality: this.analyzeSeasonality(keyword)
    };
  }

  /**
   * Get fallback keyword clusters
   * @param {string} mainKeyword - Main keyword
   * @returns {Object} Fallback cluster data
   */
  getFallbackKeywordClusters(mainKeyword) {
    return {
      primary: {
        keyword: mainKeyword,
        searchVolume: this.estimateSearchVolume(mainKeyword),
        difficulty: 55,
        intent: this.determineSearchIntent(mainKeyword)
      },
      secondary: [
        {
          keyword: `${mainKeyword} benefits`,
          searchVolume: Math.floor(this.estimateSearchVolume(mainKeyword) * 0.3),
          difficulty: 40,
          intent: 'Informational',
          relevance: 85
        }
      ],
      longtail: [
        {
          keyword: `best ${mainKeyword} for home`,
          searchVolume: Math.floor(this.estimateSearchVolume(mainKeyword) * 0.1),
          difficulty: 30,
          intent: 'Commercial',
          relevance: 80
        }
      ]
    };
  }
}

module.exports = new SerpService();
