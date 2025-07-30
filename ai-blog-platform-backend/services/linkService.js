// services/linkService.js
const axios = require('axios');
const trendService = require('./trendService');
const serpService = require('./serpService');

class LinkService {
  constructor() {
    this.authorityDomains = [
      'energy.gov',
      'nrel.gov',
      'seia.org',
      'solarpowerworldonline.com',
      'pv-magazine.com',
      'greentechmedia.com',
      'renewableenergyworld.com',
      'cleantechnica.com',
      'energysage.com',
      'solar.com'
    ];
  }

  async generateInboundOutboundLinks(keyword, companyName, trendData = []) {
    try {
      console.log(`🔗 Generating REAL links for keyword: ${keyword}, company: ${companyName}`);

      const inboundLinks = await this.generateInboundLinks(keyword, companyName);
      const outboundLinks = await this.generateOutboundLinks(keyword, trendData);

      console.log(`✅ Generated ${inboundLinks.length} inbound and ${outboundLinks.length} outbound links`);
      console.log(`🔗 Sample inbound: ${inboundLinks[0]?.url || 'none'}`);
      console.log(`🔗 Sample outbound: ${outboundLinks[0]?.url || 'none'}`);

      return {
        inboundLinks,
        outboundLinks
      };
    } catch (error) {
      console.error('Link generation error:', error);
      return {
        inboundLinks: [],
        outboundLinks: []
      };
    }
  }

  async generateInboundLinks(keyword, companyName) {
    try {
      console.log(`🔍 Searching for REAL company links using SERP API...`);

      // Use SERP API to find real company pages
      const realCompanyLinks = await serpService.searchCompanyLinks(companyName, keyword, 3);

      if (realCompanyLinks.length > 0) {
        console.log(`🔗 Found ${realCompanyLinks.length} REAL company links via SERP API`);
        return realCompanyLinks;
      }

      console.log('⚠️ No real company links found via SERP, trying fallback search...');

      // Fallback: try the old search method
      const fallbackLinks = await this.searchCompanyBlogLinks(keyword, companyName);
      if (fallbackLinks.length > 0) {
        console.log(`🔗 Found ${fallbackLinks.length} company links via fallback search`);
        return fallbackLinks.slice(0, 3);
      }
    } catch (error) {
      console.log('⚠️ All company link searches failed, using predefined links');
    }

    // Get company-specific links based on company name
    const companySpecificLinks = await this.getCompanySpecificLinks(companyName, keyword);
    if (companySpecificLinks.length > 0) {
      return companySpecificLinks.slice(0, 3);
    }

    // Final fallback: Generate internal links that would make sense for a solar company
    const inboundLinks = [
      {
        text: "solar installation services",
        url: `/services/solar-installation`,
        context: "Learn more about our professional solar installation services"
      },
      {
        text: "solar panel maintenance",
        url: `/services/maintenance`,
        context: "Discover our comprehensive solar panel maintenance programs"
      },
      {
        text: "solar financing options",
        url: `/financing`,
        context: "Explore flexible financing solutions for your solar project"
      },
      {
        text: "solar energy calculator",
        url: `/calculator`,
        context: "Calculate your potential solar savings with our free tool"
      },
      {
        text: "customer testimonials",
        url: `/testimonials`,
        context: "Read what our satisfied customers say about their solar experience"
      }
    ];

    // Filter and customize based on keyword
    return inboundLinks.filter(link =>
      this.isRelevantLink(link.text, keyword)
    ).slice(0, 3); // Limit to 3 most relevant
  }

  async getCompanySpecificLinks(companyName, keyword) {
    try {
      // Company-specific link patterns based on known solar companies
      const companyLinks = {
        'Wattmonk': [
          {
            text: "solar design services",
            url: "https://wattmonk.com/solar-design-services",
            context: "Professional solar system design and engineering services"
          },
          {
            text: "solar permit services",
            url: "https://wattmonk.com/solar-permit-services",
            context: "Streamlined solar permitting and approval process"
          },
          {
            text: "solar engineering solutions",
            url: "https://wattmonk.com/solar-engineering",
            context: "Expert solar engineering and technical consulting"
          }
        ],
        'Ensite': [
          {
            text: "solar site assessment",
            url: "https://ensite.com/site-assessment",
            context: "Comprehensive solar site evaluation and analysis"
          },
          {
            text: "solar project management",
            url: "https://ensite.com/project-management",
            context: "End-to-end solar project management services"
          },
          {
            text: "solar installation planning",
            url: "https://ensite.com/installation-planning",
            context: "Strategic planning for solar installation projects"
          }
        ],
        'Watt-Pay': [
          {
            text: "solar financing solutions",
            url: "https://watt-pay.com/financing",
            context: "Flexible financing options for solar installations"
          },
          {
            text: "solar payment plans",
            url: "https://watt-pay.com/payment-plans",
            context: "Customized payment solutions for solar projects"
          },
          {
            text: "solar loan programs",
            url: "https://watt-pay.com/loans",
            context: "Competitive solar loan programs and rates"
          }
        ]
      };

      // Get links for the specific company
      const links = companyLinks[companyName] || [];

      // Filter based on keyword relevance
      return links.filter(link => this.isRelevantLink(link.text, keyword));

    } catch (error) {
      console.error('Company-specific link generation error:', error);
      return [];
    }
  }

  async searchCompanyBlogLinks(keyword, companyName) {
    try {
      const axios = require('axios');

      // Search for company blog posts related to the keyword
      const searchQueries = [
        `site:${companyName.toLowerCase().replace(/\s+/g, '')}.com ${keyword} blog`,
        `"${companyName}" ${keyword} solar blog`,
        `${companyName} ${keyword} guide solar energy`
      ];

      const foundLinks = [];

      for (const query of searchQueries) {
        try {
          // Use Google Custom Search API if available
          if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
            const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
              params: {
                key: process.env.GOOGLE_SEARCH_API_KEY,
                cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
                q: query,
                num: 3
              }
            });

            if (response.data.items) {
              response.data.items.forEach(item => {
                foundLinks.push({
                  text: item.title.substring(0, 60) + (item.title.length > 60 ? '...' : ''),
                  url: item.link,
                  context: item.snippet.substring(0, 100) + '...'
                });
              });
            }
          }
        } catch (error) {
          console.log(`Search failed for query: ${query}`);
        }

        if (foundLinks.length >= 3) break;
      }

      return foundLinks;
    } catch (error) {
      console.error('Company blog search error:', error);
      return [];
    }
  }

  async generateOutboundLinks(keyword, trendData = []) {
    const outboundLinks = [];

    console.log(`🔗 Generating REAL outbound links for keyword: ${keyword}`);

    // Priority 1: Use SERP API to find REAL industry authority links
    try {
      console.log(`🔍 Searching for REAL industry authority links using SERP API...`);
      const serpIndustryLinks = await serpService.searchIndustryLinks(keyword, 3);

      if (serpIndustryLinks.length > 0) {
        console.log(`✅ Found ${serpIndustryLinks.length} REAL industry authority links via SERP API`);
        outboundLinks.push(...serpIndustryLinks);
      }
    } catch (error) {
      console.log('⚠️ SERP industry search failed:', error.message);
    }

    // Priority 2: Add REAL links from trend data (news articles, studies)
    if (trendData && trendData.length > 0) {
      console.log(`📰 Processing ${trendData.length} REAL trend articles for clickable links`);
      trendData.forEach(trend => {
        if (trend.url && this.isValidUrl(trend.url) && outboundLinks.length < 5) {
          outboundLinks.push({
            text: trend.title.substring(0, 80) + (trend.title.length > 80 ? '...' : ''),
            url: trend.url,
            context: `Recent industry insights about ${keyword}`,
            source: trend.source || 'news',
            publishedAt: trend.publishedAt || trend.date,
            isReal: true,
            relevance: 85
          });
        }
      });
    }

    // Priority 3: Fetch additional real links from news APIs if we need more
    if (outboundLinks.length < 5) {
      console.log(`🔍 Fetching additional REAL links for "${keyword}" from news sources...`);
      try {
        const additionalLinks = await this.fetchRealNewsLinks(keyword);
        outboundLinks.push(...additionalLinks.slice(0, 5 - outboundLinks.length));
      } catch (error) {
        console.log('⚠️ Could not fetch additional real links:', error.message);
      }
    }

    // Priority 3: Add diverse authoritative industry sources (keyword-specific context)
    const industryLinks = [
      {
        text: `SEIA Research on ${keyword}`,
        url: "https://www.seia.org/solar-industry-research-data",
        context: `Latest solar industry statistics and market data related to ${keyword}`
      },
      {
        text: `NREL ${keyword} Research`,
        url: "https://www.nrel.gov/solar/",
        context: `Comprehensive solar energy research and resources about ${keyword}`
      },
      {
        text: `DOE Solar Program - ${keyword}`,
        url: "https://www.energy.gov/eere/solar/solar-energy-technologies-office",
        context: `Federal solar energy initiatives and programs covering ${keyword}`
      },
      {
        text: `IRENA Global ${keyword} Analysis`,
        url: "https://www.irena.org/solar",
        context: `Global solar energy statistics and renewable energy insights on ${keyword}`
      },
      {
        text: `Solar Power World - ${keyword} News`,
        url: "https://www.solarpowerworldonline.com/",
        context: `Industry news and technical insights for solar professionals about ${keyword}`
      },
      {
        text: `PV Magazine ${keyword} Coverage`,
        url: "https://www.pv-magazine.com/",
        context: `International photovoltaic markets and technology news on ${keyword}`
      },
      {
        text: `Clean Technica ${keyword} Updates`,
        url: "https://cleantechnica.com/tag/solar/",
        context: `Clean energy news and solar technology developments in ${keyword}`
      },
      {
        text: `EnergySage ${keyword} Guide`,
        url: "https://www.energysage.com/solar/",
        context: `Consumer-focused solar information and market insights about ${keyword}`
      },
      {
        text: `Renewable Energy World ${keyword} Analysis`,
        url: "https://www.renewableenergyworld.com/solar/",
        context: `Global renewable energy industry news and analysis of ${keyword}`
      }
    ];

    console.log(`🏛️ Generated ${industryLinks.length} keyword-specific authority links`);

    // Add relevant industry links
    industryLinks.forEach(link => {
      if (this.isRelevantLink(link.text, keyword)) {
        outboundLinks.push(link);
      }
    });

    // Limit to 4-5 most relevant outbound links
    return outboundLinks.slice(0, 5);
  }

  isRelevantLink(linkText, keyword) {
    const keywordLower = keyword.toLowerCase();
    const linkTextLower = linkText.toLowerCase();
    
    // Check for keyword relevance
    const keywordWords = keywordLower.split(' ');
    const linkWords = linkTextLower.split(' ');
    
    // Count matching words
    const matchingWords = keywordWords.filter(word => 
      linkWords.some(linkWord => linkWord.includes(word) || word.includes(linkWord))
    );
    
    // Consider relevant if at least 1 word matches or contains solar-related terms
    return matchingWords.length > 0 || 
           linkTextLower.includes('solar') || 
           linkTextLower.includes('energy') ||
           linkTextLower.includes('renewable');
  }

  isAuthoritySource(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return this.authorityDomains.some(authDomain => 
        domain.includes(authDomain) || authDomain.includes(domain)
      );
    } catch (error) {
      return false;
    }
  }

  async fetchCompetitorAnalysis(keyword) {
    try {
      // This would integrate with SEO tools like Ahrefs, SEMrush, etc.
      // For now, return mock competitor data
      return [
        {
          domain: "energysage.com",
          title: `${keyword} Guide - EnergySage`,
          url: `https://www.energysage.com/solar/${keyword.replace(/\s+/g, '-')}/`,
          metrics: {
            domainAuthority: 85,
            backlinks: 15000,
            organicTraffic: 50000
          }
        },
        {
          domain: "solar.com",
          title: `Everything About ${keyword} - Solar.com`,
          url: `https://www.solar.com/learn/${keyword.replace(/\s+/g, '-')}/`,
          metrics: {
            domainAuthority: 78,
            backlinks: 8000,
            organicTraffic: 25000
          }
        }
      ];
    } catch (error) {
      console.error('Competitor analysis error:', error);
      return [];
    }
  }

  async fetchRealNewsLinks(keyword) {
    const realLinks = [];

    try {
      // Use the trend service to fetch real news articles
      const trendService = require('./trendService');
      const newsArticles = await trendService.fetchTrendData(keyword, 'all', 10);

      console.log(`📰 Found ${newsArticles.length} real news articles for "${keyword}"`);

      newsArticles.forEach(article => {
        if (article.url && this.isValidUrl(article.url) && this.isAuthoritySource(article.url)) {
          realLinks.push({
            text: article.title.substring(0, 80) + (article.title.length > 80 ? '...' : ''),
            url: article.url,
            context: `Industry news about ${keyword}`,
            source: article.source || 'news',
            publishedAt: article.publishedAt || article.date,
            isReal: true,
            authority: true
          });
        }
      });

      console.log(`✅ Generated ${realLinks.length} real authority links from news sources`);
      return realLinks.slice(0, 5); // Limit to 5 best links

    } catch (error) {
      console.error('Error fetching real news links:', error);
      return [];
    }
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  isAuthoritySource(url) {
    if (!url) return false;

    // Enhanced authority domains list
    const authorityDomains = [
      ...this.authorityDomains,
      'reuters.com',
      'bloomberg.com',
      'forbes.com',
      'cnbc.com',
      'marketwatch.com',
      'businesswire.com',
      'prnewswire.com',
      'yahoo.com',
      'msn.com',
      'google.com',
      'news.google.com'
    ];

    return authorityDomains.some(domain => url.includes(domain));
  }
}

module.exports = new LinkService();
