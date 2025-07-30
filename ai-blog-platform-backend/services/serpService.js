// services/serpService.js - Real company link search using SERP API
const axios = require('axios');

class SerpService {
  constructor() {
    this.apiKey = process.env.SERP_API_KEY;
    this.baseUrl = 'https://serpapi.com/search';
  }

  async searchCompanyLinks(companyName, keyword, limit = 5) {
    try {
      console.log(`🔍 Searching real company links for "${companyName}" + "${keyword}"`);

      if (!this.apiKey) {
        console.warn('⚠️ SERP API key not configured, using fallback method');
        return this.getFallbackCompanyLinks(companyName, keyword, limit);
      }

      // Search for company-specific pages related to the keyword
      const searchQuery = `site:${this.getCompanyDomain(companyName)} ${keyword}`;
      
      const response = await axios.get(this.baseUrl, {
        params: {
          q: searchQuery,
          api_key: this.apiKey,
          engine: 'google',
          num: limit * 2, // Get more results to filter
          gl: 'us',
          hl: 'en'
        },
        timeout: 10000
      });

      const results = response.data.organic_results || [];
      
      console.log(`📊 Found ${results.length} search results for ${companyName}`);

      // Process and validate the results
      const companyLinks = results
        .filter(result => this.isValidCompanyLink(result, companyName))
        .slice(0, limit)
        .map(result => ({
          text: this.generateAnchorText(result.title, keyword),
          url: result.link,
          context: this.generateContext(result.snippet, keyword),
          title: result.title,
          isReal: true,
          source: 'serp-api',
          relevance: this.calculateRelevance(result, keyword)
        }));

      console.log(`✅ Generated ${companyLinks.length} real company links`);
      return companyLinks;

    } catch (error) {
      console.error('SERP API search failed:', error.message);
      return this.getFallbackCompanyLinks(companyName, keyword, limit);
    }
  }

  async searchIndustryLinks(keyword, limit = 5) {
    try {
      console.log(`🔍 Searching industry authority links for "${keyword}"`);

      if (!this.apiKey) {
        console.warn('⚠️ SERP API key not configured, using fallback method');
        return this.getFallbackIndustryLinks(keyword, limit);
      }

      // Search for authoritative industry sources
      const authorityDomains = [
        'nrel.gov',
        'seia.org', 
        'energy.gov',
        'eia.gov',
        'irena.org',
        'solarpowerworld.com',
        'pv-magazine.com'
      ];

      const searchQuery = `${keyword} site:(${authorityDomains.join(' OR site:')})`;
      
      const response = await axios.get(this.baseUrl, {
        params: {
          q: searchQuery,
          api_key: this.apiKey,
          engine: 'google',
          num: limit * 2,
          gl: 'us',
          hl: 'en'
        },
        timeout: 10000
      });

      const results = response.data.organic_results || [];
      
      console.log(`📊 Found ${results.length} industry authority results`);

      const industryLinks = results
        .filter(result => this.isValidAuthorityLink(result))
        .slice(0, limit)
        .map(result => ({
          text: this.generateAnchorText(result.title, keyword),
          url: result.link,
          context: this.generateContext(result.snippet, keyword),
          title: result.title,
          isReal: true,
          source: 'serp-api-authority',
          relevance: this.calculateRelevance(result, keyword),
          targetDomain: this.extractDomain(result.link)
        }));

      console.log(`✅ Generated ${industryLinks.length} real industry authority links`);
      return industryLinks;

    } catch (error) {
      console.error('Industry SERP search failed:', error.message);
      return this.getFallbackIndustryLinks(keyword, limit);
    }
  }

  // Helper methods
  getCompanyDomain(companyName) {
    const domainMap = {
      'Wattmonk': 'wattmonk.com',
      'Ensite': 'ensite.com', 
      'Watt-Pay': 'watt-pay.com',
      'SolarPower': 'solarpower.com',
      'SunRun': 'sunrun.com',
      'Tesla': 'tesla.com',
      'Sungevity': 'sungevity.com'
    };
    
    return domainMap[companyName] || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
  }

  isValidCompanyLink(result, companyName) {
    const domain = this.getCompanyDomain(companyName);
    return result.link && 
           result.link.includes(domain) && 
           result.title && 
           result.snippet &&
           !result.link.includes('404') &&
           !result.link.includes('error');
  }

  isValidAuthorityLink(result) {
    const authorityDomains = ['nrel.gov', 'seia.org', 'energy.gov', 'eia.gov', 'irena.org'];
    return result.link && 
           authorityDomains.some(domain => result.link.includes(domain)) &&
           result.title && 
           result.snippet;
  }

  generateAnchorText(title, keyword) {
    // Create natural anchor text that includes the keyword
    const cleanTitle = title.replace(/[^\w\s-]/g, '').trim();
    
    if (cleanTitle.toLowerCase().includes(keyword.toLowerCase())) {
      return cleanTitle.substring(0, 60) + (cleanTitle.length > 60 ? '...' : '');
    }
    
    return `${keyword} - ${cleanTitle.substring(0, 40)}${cleanTitle.length > 40 ? '...' : ''}`;
  }

  generateContext(snippet, keyword) {
    if (!snippet) return `Learn more about ${keyword} and related services.`;
    
    // Clean and truncate snippet
    const cleanSnippet = snippet.replace(/[^\w\s.,!?-]/g, '').trim();
    return cleanSnippet.substring(0, 120) + (cleanSnippet.length > 120 ? '...' : '');
  }

  calculateRelevance(result, keyword) {
    let score = 50; // Base score
    
    const title = (result.title || '').toLowerCase();
    const snippet = (result.snippet || '').toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // Boost score based on keyword presence
    if (title.includes(keywordLower)) score += 30;
    if (snippet.includes(keywordLower)) score += 20;
    
    // Boost for authority domains
    const authorityDomains = ['nrel.gov', 'seia.org', 'energy.gov'];
    if (authorityDomains.some(domain => result.link.includes(domain))) {
      score += 25;
    }
    
    return Math.min(score, 95); // Cap at 95%
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  // Fallback methods when SERP API is not available
  getFallbackCompanyLinks(companyName, keyword, limit) {
    console.log(`🔄 Using fallback company links for ${companyName}`);
    
    const domain = this.getCompanyDomain(companyName);
    const fallbackLinks = [
      {
        text: `${keyword} services`,
        url: `https://${domain}/services`,
        context: `Professional ${keyword} services and solutions`,
        isReal: false,
        source: 'fallback',
        relevance: 75
      },
      {
        text: `${keyword} solutions`,
        url: `https://${domain}/solutions`,
        context: `Comprehensive ${keyword} solutions for your needs`,
        isReal: false,
        source: 'fallback', 
        relevance: 70
      },
      {
        text: `About ${companyName}`,
        url: `https://${domain}/about`,
        context: `Learn more about ${companyName} and our expertise`,
        isReal: false,
        source: 'fallback',
        relevance: 65
      }
    ];
    
    return fallbackLinks.slice(0, limit);
  }

  getFallbackIndustryLinks(keyword, limit) {
    console.log(`🔄 Using fallback industry links for ${keyword}`);
    
    const fallbackLinks = [
      {
        text: `NREL ${keyword} Research`,
        url: `https://www.nrel.gov/solar/`,
        context: `National Renewable Energy Laboratory research on ${keyword}`,
        targetDomain: 'nrel.gov',
        isReal: true,
        source: 'fallback-authority',
        relevance: 90
      },
      {
        text: `SEIA ${keyword} Data`,
        url: `https://www.seia.org/solar-industry-research-data`,
        context: `Solar Energy Industries Association data on ${keyword}`,
        targetDomain: 'seia.org',
        isReal: true,
        source: 'fallback-authority',
        relevance: 85
      },
      {
        text: `Energy.gov ${keyword} Information`,
        url: `https://www.energy.gov/eere/solar/solar-energy-technologies-office`,
        context: `U.S. Department of Energy information on ${keyword}`,
        targetDomain: 'energy.gov',
        isReal: true,
        source: 'fallback-authority',
        relevance: 88
      }
    ];
    
    return fallbackLinks.slice(0, limit);
  }
}

module.exports = new SerpService();
