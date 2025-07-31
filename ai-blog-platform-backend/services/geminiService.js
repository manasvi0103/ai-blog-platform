// services/geminiService.js
const axios = require('axios');
require('dotenv').config();

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    // Use multiple models for fallback when one is overloaded
    this.textModels = [
      'gemini-2.0-flash-exp', // Latest Gemini 2.0 Flash (PRIMARY - most efficient)
      'gemini-1.5-pro-002',   // High quality fallback
      'gemini-1.5-flash-002', // Faster fallback
      'gemini-pro'            // Final fallback model
    ];
    this.currentModelIndex = 0;
    this.imageModel = 'imagen-3.0-generate-001'; // Imagen 3.0 for image generation
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async generateContent(prompt, companyContext = {}) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.warn('⚠️ Gemini API key not configured, using high-quality fallback content');
      return this.generateHighQualityFallback(prompt, companyContext);
    }

    // Try multiple models in case one is overloaded
    for (let i = 0; i < this.textModels.length; i++) {
      const model = this.textModels[i];
      try {
        console.log(`🤖 Trying Gemini model: ${model}`);
        console.log('🔑 Gemini API Key in service:', this.apiKey ? 'SET' : 'NOT SET');

        const contextualPrompt = this.buildContextualPrompt(prompt, companyContext);

        const response = await axios.post(
          `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`,
          {
            contents: [{
              parts: [{
                text: contextualPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
              candidateCount: 1,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000 // 30 second timeout
          }
        );

        const generatedText = response.data.candidates[0].content.parts[0].text;
        console.log(`✅ Successfully generated content with ${model}`);

        return {
          content: generatedText,
          keywords: this.extractKeywords(generatedText),
          wordCount: generatedText.split(' ').length
        };

      } catch (error) {
        console.error(`❌ Model ${model} failed:`, error.response?.data?.error?.message || error.message);

        // If this is the last model, use high-quality fallback
        if (i === this.textModels.length - 1) {
          console.warn('🔄 All Gemini models failed, using high-quality fallback content');
          return this.generateHighQualityFallback(prompt, companyContext);
        }

        // Try next model
        continue;
      }
    }
  }

  generateHighQualityFallback(prompt, companyContext = {}) {
    console.log('🎯 Generating high-quality fallback content for prompt:', prompt.substring(0, 100) + '...');

    const keyword = companyContext.keyword || this.extractKeywordFromPrompt(prompt);
    const companyName = companyContext.name || 'Solar Company';

    // Detect what type of content is being requested
    if (prompt.toLowerCase().includes('meta title') || prompt.toLowerCase().includes('metatitle')) {
      return {
        content: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Solutions | ${companyName} Expert Guide`,
        keywords: [keyword, 'solutions', 'guide'],
        wordCount: 8
      };
    }

    if (prompt.toLowerCase().includes('meta description') || prompt.toLowerCase().includes('metadescription')) {
      return {
        content: `Discover comprehensive ${keyword} solutions with ${companyName}. Expert insights, practical tips, and proven strategies for solar professionals and homeowners.`,
        keywords: [keyword, 'solutions', 'expert', 'solar'],
        wordCount: 22
      };
    }

    if (prompt.toLowerCase().includes('h1') || prompt.toLowerCase().includes('title') || prompt.toLowerCase().includes('heading')) {
      const h1Options = [
        `Complete ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Guide for Solar Professionals`,
        `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Expert Solutions and Best Practices`,
        `Professional ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Implementation Guide`,
        `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Mastery: From Basics to Advanced Strategies`
      ];
      const selectedH1 = h1Options[Math.floor(Math.random() * h1Options.length)];

      return {
        content: selectedH1,
        keywords: [keyword, 'guide', 'professional', 'solar'],
        wordCount: selectedH1.split(' ').length
      };
    }

    // For longer content (paragraphs, sections, etc.)
    const contentTemplates = this.getContentTemplates(keyword, companyName);
    const selectedTemplate = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

    return {
      content: selectedTemplate,
      keywords: this.extractKeywords(selectedTemplate),
      wordCount: selectedTemplate.split(' ').length
    };
  }

  extractKeywordFromPrompt(prompt) {
    // Try to extract keyword from common prompt patterns
    const patterns = [
      /for (?:the )?(?:keyword |focus keyword )?["']([^"']+)["']/i,
      /about ["']([^"']+)["']/i,
      /regarding ["']([^"']+)["']/i,
      /on ["']([^"']+)["']/i,
      /titled? ["']([^"']+)["']/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    // Default fallback
    return 'solar energy solutions';
  }

  getContentTemplates(keyword, companyName) {
    return [
      `Understanding ${keyword} is essential for modern solar professionals and homeowners looking to maximize their energy efficiency. This comprehensive approach combines industry best practices with cutting-edge technology to deliver exceptional results. ${companyName} has been at the forefront of ${keyword} implementation, helping thousands of clients achieve their energy goals through proven methodologies and expert guidance.`,

      `The solar industry continues to evolve rapidly, and ${keyword} represents a significant opportunity for both residential and commercial applications. Professional installers and energy consultants need to stay current with the latest developments in ${keyword} to provide the best service to their clients. ${companyName} specializes in ${keyword} solutions that are both cost-effective and environmentally sustainable.`,

      `When it comes to ${keyword}, proper planning and execution are crucial for success. ${companyName} has developed a systematic approach that ensures optimal performance and long-term reliability. Our expertise in ${keyword} spans multiple applications, from small residential projects to large-scale commercial installations, making us the trusted choice for solar professionals nationwide.`,

      `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} technology has revolutionized the way we approach solar energy systems. ${companyName} leverages advanced ${keyword} techniques to optimize system performance and reduce installation costs. Our team of certified professionals brings years of experience in ${keyword} implementation, ensuring that every project meets the highest standards of quality and efficiency.`
    ];
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

  async generateStructuredBlogContent(draftData, trendData = []) {
    const { selectedKeyword, selectedH1, selectedMetaTitle, selectedMetaDescription, companyName, targetWordCount = 2500, strictKeywordFocus, generateAllBlocks } = draftData;

    console.log(`🎯 GENERATING SEO-OPTIMIZED CONTENT FOR KEYWORD: "${selectedKeyword}"`);
    console.log(`📝 SELECTED H1: ${selectedH1}`);
    console.log(`📝 SELECTED Meta Title: ${selectedMetaTitle}`);
    console.log(`📝 SELECTED Meta Description: ${selectedMetaDescription}`);
    console.log(`🏢 Company: ${companyName}`);
    console.log(`📊 Target Word Count: ${targetWordCount}`);
    console.log(`🔒 Strict Keyword Focus: ${strictKeywordFocus}`);
    console.log(`📦 Generate All Blocks: ${generateAllBlocks}`);

    // Generate keyword-specific links using the link service
    const linkService = require('./linkService');
    const linkData = await linkService.generateInboundOutboundLinks(selectedKeyword, companyName, trendData);

    console.log(`🔗 Generated ${linkData.inboundLinks.length} inbound and ${linkData.outboundLinks.length} outbound links for "${selectedKeyword}"`);

    // Calculate dynamic word counts based on target
    const introWords = Math.round(targetWordCount * 0.08); // 8% for intro (150-200 words for 2500 target)
    const sectionWords = Math.round(targetWordCount * 0.18); // 18% per section (450 words for 2500 target)
    const conclusionWords = Math.round(targetWordCount * 0.10); // 10% for conclusion (250 words for 2500 target)

    console.log(`📊 Dynamic word distribution for ${targetWordCount} total words:`);
    console.log(`   Introduction: ${introWords} words`);
    console.log(`   Each section: ${sectionWords} words`);
    console.log(`   Conclusion: ${conclusionWords} words`);

    const expertPrompt = `You are an expert solar industry content writer and SEO strategist with 10+ years of experience. You write authoritative, data-driven blogs for leading clean energy companies like ${companyName}, targeting U.S. solar professionals, installers, and decision-makers. Your writing is professional, technically accurate, and based on real industry data and trends.

CRITICAL REQUIREMENTS:
1. EVERYTHING MUST BE ABOUT "${selectedKeyword}" - NO GENERIC CONTENT, NO AI-GENERATED FLUFF
2. USE REAL INDUSTRY DATA, STATISTICS, AND CURRENT TRENDS
3. WRITE LIKE A HUMAN EXPERT, NOT AN AI
4. INCLUDE REAL COMPANY CONTEXT FOR ${companyName}

CONTENT QUALITY STANDARDS:
Your task is to write a professional, authoritative blog article EXCLUSIVELY about "${selectedKeyword}" that:
- Provides genuine value to solar professionals working with "${selectedKeyword}"
- Uses real industry statistics, market data, and technical specifications
- References current trends and developments in "${selectedKeyword}"
- Includes practical, actionable insights about "${selectedKeyword}"
- Demonstrates deep expertise in "${selectedKeyword}" applications
- Connects to ${companyName}'s actual services and expertise in "${selectedKeyword}"
- Avoids generic AI content patterns and robotic language
- Reads like content from a leading solar industry publication

WRITING GUIDELINES - STRICT "${selectedKeyword}" FOCUS
- EXACT Title: ${selectedH1}
- EXACT Meta Title: ${selectedMetaTitle}
- EXACT Meta Description: ${selectedMetaDescription}
- PRIMARY KEYWORD (use 20-25 times throughout content): ${selectedKeyword}
- Structure: H1 + 5x H2 sections about "${selectedKeyword}" (including a conclusion)
- TARGET TOTAL WORD COUNT: ${targetWordCount} words
- Each section must be 2–4 paragraphs specifically about "${selectedKeyword}"
- Every H2 heading must include or relate to "${selectedKeyword}"
- Use bullet points sparingly, only for "${selectedKeyword}" specific points
- Tone: Professional expert specifically in "${selectedKeyword}" — no generic solar language

DO NOT USE:
- "Not just X, it's Y" constructions
- Metaphors or figurative intros
- Em dashes for emphasis
- Redundant phrases like "not only that…" or "in conclusion…"
- Any markdown formatting (**, ##, ###, -, *, etc.)
- Bold, italic, or heading markers in content

REAL LINKS AND REFERENCES REQUIREMENTS:
- Include REAL, CLICKABLE links from actual industry sources
- Use the provided trend data and news articles as references
- Integrate links naturally: "According to recent SEIA data on ${selectedKeyword} (REAL_URL), installations have increased..."
- Reference actual studies, reports, and news articles about "${selectedKeyword}"
- Include ${companyName}'s real services and expertise areas
- NO fake links, NO placeholder URLs, NO generic references

FORMATTING REQUIREMENTS:
- Write in clean, plain text only - NO markdown symbols anywhere
- Remove all ** bold markers, ## heading markers, and other formatting
- Include 2-3 REAL clickable URLs naturally within each section about "${selectedKeyword}"
- Use authoritative sources specifically about "${selectedKeyword}":
  * https://www.energy.gov/eere/solar/solar-energy-technologies-office (for ${selectedKeyword} research)
  * https://www.seia.org/solar-industry-research-data (for ${selectedKeyword} market data)
  * https://www.nrel.gov/solar/ (for ${selectedKeyword} technical information)
  * https://www.irena.org/solar (for global ${selectedKeyword} statistics)
  * https://www.solarpowerworldonline.com/ (for ${selectedKeyword} industry news)
- Total of 8-12 URLs about "${selectedKeyword}" embedded throughout the content
- NO generic solar links - ALL links must relate to "${selectedKeyword}"

${trendData.length > 0 ? `REAL INDUSTRY TRENDS TO REFERENCE (use these as sources):
${trendData.map(trend => `- "${trend.title}" from ${trend.source || 'industry source'} (${trend.url || 'URL available'}) - ${trend.summary || trend.description || 'Recent development in ' + selectedKeyword}`).join('\n')}` : ''}

REAL LINKS TO INCORPORATE IN CONTENT:
Internal Links (${companyName}): ${linkData.inboundLinks.map(link => `"${link.text}" → ${link.url} (${link.context})`).join(', ')}
External Authority Links: ${linkData.outboundLinks.map(link => `"${link.text}" → ${link.url} (${link.context})`).join(', ')}

COMPANY CONTEXT FOR ${companyName}:
- Integrate ${companyName}'s expertise in ${selectedKeyword}
- Reference ${companyName}'s services related to ${selectedKeyword}
- Position ${companyName} as a trusted authority in ${selectedKeyword}
- Include relevant internal links to ${companyName}'s ${selectedKeyword} services

Generate a complete blog article about "${selectedKeyword}" with the following structure as JSON:
{
  "title": "${selectedH1}",
  "introduction": "First paragraph MUST START with '${selectedKeyword}' as the very first words. Include compelling insight/stat about ${selectedKeyword} (${introWords} words) - MUST mention ${selectedKeyword} 3-4 times total",
  "sections": [
    {
      "h2": "What is ${selectedKeyword}? [or similar ${selectedKeyword} heading]",
      "content": "2-4 paragraphs explaining ${selectedKeyword} (${sectionWords} words) - MUST mention ${selectedKeyword} 4-5 times",
      "includesKeyword": true
    },
    {
      "h2": "Benefits of ${selectedKeyword} [or similar ${selectedKeyword} heading]",
      "content": "2-4 paragraphs about ${selectedKeyword} benefits (${sectionWords} words) - MUST mention ${selectedKeyword} 4-5 times",
      "includesKeyword": true
    },
    {
      "h2": "How ${selectedKeyword} Works [or similar ${selectedKeyword} heading]",
      "content": "2-4 paragraphs about ${selectedKeyword} process (${sectionWords} words) - MUST mention ${selectedKeyword} 4-5 times",
      "includesKeyword": true
    },
    {
      "h2": "${selectedKeyword} Best Practices [or similar ${selectedKeyword} heading]",
      "content": "2-4 paragraphs about ${selectedKeyword} best practices (${sectionWords} words) - MUST mention ${selectedKeyword} 4-5 times",
      "includesKeyword": true
    },
    {
      "h2": "Conclusion: Getting Started with ${selectedKeyword}",
      "content": "Concluding paragraphs about ${selectedKeyword} with call to action (${conclusionWords} words) - MUST mention ${selectedKeyword} 3-4 times",
      "includesKeyword": true
    }
  ],
  "inboundLinks": [
    {
      "text": "anchor text",
      "url": "relevant industry resource URL",
      "context": "where it fits in content"
    }
  ],
  "outboundLinks": [
    {
      "text": "anchor text",
      "url": "authoritative source URL",
      "context": "where it fits in content"
    }
  ],
  "imagePrompts": [
    {
      "section": "introduction",
      "prompt": "Professional ${selectedKeyword} installation showing workers installing solar panels with ${selectedKeyword} equipment and safety gear",
      "altText": "${selectedKeyword} - Professional installation process"
    },
    {
      "section": "section2",
      "prompt": "Technical diagram showing ${selectedKeyword} components, specifications, and installation details with labels and measurements",
      "altText": "${selectedKeyword} technical diagram and components"
    }
  ]
}`;

    try {
      const result = await this.generateContent(expertPrompt, {
        name: companyName,
        targetAudience: 'Solar industry professionals',
        tone: 'Professional, empathetic, conversational'
      });

      // Clean and parse JSON response
      let cleanContent = result.content.replace(/```json|```/g, '').trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.substring(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.substring(0, cleanContent.length - 3);
      }

      const parsedContent = JSON.parse(cleanContent);

      // Clean all markdown formatting from the content
      if (parsedContent.introduction) {
        parsedContent.introduction = this.cleanMarkdown(parsedContent.introduction);
      }
      if (parsedContent.sections) {
        parsedContent.sections.forEach(section => {
          if (section.h2) section.h2 = this.cleanMarkdown(section.h2);
          if (section.content) section.content = this.cleanMarkdown(section.content);
        });
      }
      if (parsedContent.conclusion) {
        parsedContent.conclusion = this.cleanMarkdown(parsedContent.conclusion);
      }

      // Merge with generated links
      parsedContent.inboundLinks = linkData.inboundLinks;
      parsedContent.outboundLinks = linkData.outboundLinks;

      return parsedContent;
    } catch (error) {
      console.error('Structured content generation error:', error);
      // Return fallback structure
      return this.generateFallbackContent(selectedKeyword, selectedH1, linkData);
    }
  }

  generateFallbackContent(keyword, h1Title, linkData = { inboundLinks: [], outboundLinks: [] }) {
    console.log(`🎯 Generating comprehensive fallback content for keyword: "${keyword}"`);

    // Generate much more detailed and realistic content
    const sections = this.generateDetailedSections(keyword);
    const introduction = this.generateDetailedIntroduction(keyword);
    const conclusion = this.generateDetailedConclusion(keyword);

    return {
      title: h1Title,
      introduction: introduction,
      sections: sections,
      conclusion: conclusion,
      inboundLinks: linkData.inboundLinks || [],
      outboundLinks: linkData.outboundLinks || [],
      totalWordCount: this.calculateTotalWordCount(introduction, sections, conclusion)
    };
  }

  generateDetailedIntroduction(keyword) {
    const intros = [
      `The solar industry is experiencing unprecedented growth, and ${keyword} has emerged as a critical component for both residential and commercial applications. As energy costs continue to rise and environmental concerns become more pressing, understanding ${keyword} is essential for homeowners, business owners, and solar professionals alike. This comprehensive guide explores the fundamental principles, practical applications, and long-term benefits of ${keyword}, providing you with the knowledge needed to make informed decisions about your solar energy investments.`,

      `In today's rapidly evolving energy landscape, ${keyword} represents a game-changing opportunity for those looking to reduce their carbon footprint while achieving significant cost savings. Whether you're a homeowner considering solar installation, a business owner exploring renewable energy options, or a solar professional seeking to expand your expertise, understanding ${keyword} is crucial for success. This detailed analysis covers everything from basic concepts to advanced implementation strategies, ensuring you have the tools and knowledge necessary to maximize your solar energy potential.`,

      `As the solar industry continues to mature and technology advances at an unprecedented pace, ${keyword} has become increasingly important for achieving optimal system performance and return on investment. This comprehensive resource is designed to provide solar professionals, homeowners, and business decision-makers with the essential knowledge needed to navigate the complexities of ${keyword}. From initial planning and system design to installation best practices and long-term maintenance, we'll explore every aspect of ${keyword} to help you achieve your energy goals.`
    ];

    return intros[Math.floor(Math.random() * intros.length)];
  }

  generateDetailedSections(keyword) {
    return [
      {
        h2: `Understanding ${keyword}: Fundamentals and Core Concepts`,
        content: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} encompasses a range of technologies, methodologies, and best practices that are essential for modern solar energy systems. At its core, ${keyword} involves the strategic integration of advanced solar technologies with proven installation techniques to maximize energy production and system efficiency. Professional solar installers and energy consultants rely on ${keyword} principles to design systems that not only meet current energy needs but also provide long-term value and reliability. The key components of ${keyword} include proper system sizing, optimal panel placement, efficient inverter selection, and comprehensive monitoring solutions that ensure peak performance throughout the system's lifespan.`,
        includesKeyword: true
      },
      {
        h2: `Benefits and Advantages of ${keyword} Implementation`,
        content: `Implementing ${keyword} solutions offers numerous advantages for both residential and commercial applications. Cost savings represent one of the most significant benefits, with properly designed ${keyword} systems typically reducing energy bills by 70-90% or more. Environmental impact is another crucial consideration, as ${keyword} systems significantly reduce carbon emissions and contribute to a more sustainable energy future. Additionally, ${keyword} implementations often increase property values, provide energy independence, and offer protection against rising utility costs. For businesses, ${keyword} solutions can also provide tax incentives, improve corporate sustainability profiles, and demonstrate environmental responsibility to customers and stakeholders.`,
        includesKeyword: true
      },
      {
        h2: `${keyword} Installation Process and Best Practices`,
        content: `The successful implementation of ${keyword} requires careful planning, professional expertise, and adherence to industry best practices. The process typically begins with a comprehensive site assessment to evaluate factors such as roof condition, shading, orientation, and local building codes. Professional installers then design a customized ${keyword} system that maximizes energy production while ensuring compliance with all safety and regulatory requirements. Installation involves precise mounting of solar panels, proper electrical connections, inverter setup, and integration with existing electrical systems. Quality ${keyword} installations also include comprehensive testing, system commissioning, and detailed documentation to ensure optimal performance and warranty compliance.`,
        includesKeyword: true
      },
      {
        h2: `Maintenance and Long-term Performance of ${keyword} Systems`,
        content: `Proper maintenance is essential for ensuring the long-term performance and reliability of ${keyword} systems. Regular maintenance activities include visual inspections, performance monitoring, cleaning when necessary, and periodic electrical testing to identify potential issues before they impact system performance. Most ${keyword} systems are designed to operate efficiently for 25-30 years with minimal maintenance requirements. However, proactive maintenance can extend system life, optimize energy production, and protect warranty coverage. Professional maintenance services typically include annual inspections, performance analysis, and preventive maintenance to ensure that ${keyword} systems continue to deliver maximum value throughout their operational lifespan.`,
        includesKeyword: true
      }
    ];
  }

  generateDetailedConclusion(keyword) {
    const conclusions = [
      `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} represents a transformative opportunity for anyone looking to harness the power of solar energy effectively. As technology continues to advance and costs continue to decline, ${keyword} solutions are becoming increasingly accessible and attractive for both residential and commercial applications. By understanding the fundamental principles, benefits, and implementation strategies outlined in this guide, you'll be well-equipped to make informed decisions about ${keyword} and achieve your energy goals. Whether you're just beginning to explore solar options or looking to optimize an existing system, ${keyword} provides the foundation for long-term energy independence and environmental sustainability.`,

      `The future of solar energy is bright, and ${keyword} will continue to play a crucial role in driving innovation and adoption across all market segments. As we've explored throughout this comprehensive guide, ${keyword} offers significant benefits in terms of cost savings, environmental impact, and energy independence. For solar professionals, mastering ${keyword} principles and best practices is essential for delivering exceptional value to clients and staying competitive in a rapidly evolving market. For homeowners and business owners, understanding ${keyword} enables informed decision-making and helps ensure that solar investments deliver maximum returns for years to come.`
    ];

    return conclusions[Math.floor(Math.random() * conclusions.length)];
  }

  calculateTotalWordCount(introduction, sections, conclusion) {
    let totalWords = introduction.split(' ').length + conclusion.split(' ').length;
    sections.forEach(section => {
      totalWords += section.content.split(' ').length;
    });
    return totalWords;
  }

  cleanMarkdown(text) {
    if (!text) return text;

    return text
      // Remove bold markdown
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      // Remove italic markdown
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove heading markers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Clean up extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  async generateBlockContent(prompt, blockType, companyContext) {
    try {
      console.log(`🤖 Generating ${blockType} content with Gemini`);

      const result = await this.generateContent(prompt, companyContext);

      return {
        content: result.content,
        wordCount: result.content.split(' ').length,
        blockType: blockType
      };
    } catch (error) {
      console.error(`Block content generation error for ${blockType}:`, error);

      // Fallback content based on block type
      const fallbackContent = this.getFallbackContent(blockType, companyContext);

      return {
        content: fallbackContent,
        wordCount: fallbackContent.split(' ').length,
        blockType: blockType
      };
    }
  }

  getFallbackContent(blockType, companyContext) {
    const keyword = companyContext.keyword || 'solar energy';

    const fallbacks = {
      'title': `Complete Guide to ${keyword}`,
      'introduction': `Understanding ${keyword} is essential for solar professionals looking to stay competitive in today's market. This comprehensive guide covers everything you need to know about ${keyword}, from basic concepts to advanced implementation strategies that can help grow your solar business.`,
      'conclusion': `${keyword} represents a significant opportunity for solar professionals. By implementing the strategies and insights covered in this guide, you can enhance your services, improve customer satisfaction, and grow your solar business. Start applying these concepts today to see immediate results.`,
      'key-factors': `Several key factors are crucial when considering ${keyword} in solar installations. These include system efficiency, cost-effectiveness, regulatory compliance, and long-term performance. Understanding these factors helps solar professionals make informed decisions and provide better service to their customers.`,
      'examples': `Real-world applications of ${keyword} in the solar industry demonstrate its practical value. For instance, many successful solar installations have benefited from proper implementation of ${keyword} principles, resulting in improved performance and customer satisfaction.`,
      'benefits': `The benefits of ${keyword} for solar businesses include increased efficiency, reduced costs, improved customer satisfaction, and competitive advantages. These advantages help solar companies differentiate themselves in the market and build stronger customer relationships.`,
      'tips': `Best practices for ${keyword} include thorough planning, proper equipment selection, regular maintenance, and staying updated with industry standards. Following these tips ensures optimal results and helps solar professionals deliver exceptional service to their customers.`,
      'section': `${keyword} plays an important role in the solar industry. Understanding its applications, benefits, and implementation strategies helps solar professionals provide better services and achieve superior results for their customers.`
    };

    return fallbacks[blockType] || fallbacks['section'];
  }
}

module.exports = new GeminiService();
