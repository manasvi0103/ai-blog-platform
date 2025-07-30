export interface Company {
  id: string
  companyName: string
  servicesOffered: string
  serviceOverview: string
  aboutTheCompany: string
}

// Backend Company model structure (for reference)
export interface BackendCompany {
  _id: string
  name: string
  servicesOffered: Array<{name: string, description?: string}> | string
  serviceOverview: string
  aboutCompany: string
  tone: 'professional' | 'casual' | 'technical' | 'friendly' | 'authoritative'
  brandVoice: string
  targetAudience: string[]
  isActive: boolean
}

export interface Draft {
  id: string
  companyName: string
  selectedKeyword?: string
  currentStep: number
  status: "draft" | "published"
  lastEdited: string
}

// Backend Draft model structure (for reference)
export interface BackendDraft {
  _id: string
  blogId: string
  title?: string
  metaTitle?: string
  metaDescription?: string
  content?: string
  featuredImage?: {
    url: string
    altText: string
    caption: string
  }
  contentBlocks: string[]
  wordpressStatus: 'not-sent' | 'draft' | 'published' | 'failed'
  wordpressId?: number
  seoAnalysis?: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  version: number
}

export interface Keyword {
  focusKeyword: string
  articleFormat: string
  wordCount: string
  targetAudience: string
  objective: string
  source: "manual" | "ai"
}

export interface CompetitorAnalysis {
  domain: string
  title: string
  domainAuthority: number
  wordCount: number
  seoScore: number
}

export interface KeywordCluster {
  keyword: string
  searchVolume: number
  difficulty: number
  relevanceScore: number
}

export interface TrendAnalysis {
  topic: string
  description: string
  direction: "up" | "down"
  confidence: number
}

export interface MetaOption {
  h1Title: string
  metaTitle: string
  metaDescription: string
  scores: {
    keywordScore: number
    lengthScore: number
    readabilityScore: number
    trendScore: number
    totalScore: number
  }
  keywordsIncluded: string[]
}

export interface BlogBlock {
  id: string
  type: "introduction" | "section" | "image" | "conclusion" | "references"
  content?: string
  h2?: string
  imageType?: "feature" | "in-blog"
  alt?: string
  editable: boolean
  wordCount?: number
  citations?: Array<{
    url: string
    title: string
    description?: string
  }>
}

export interface InternalLink {
  anchorText: string
  targetUrl: string
  context: string
  relevance: number
}

export interface ExternalLink {
  anchorText: string
  targetDomain: string
  context: string
  relevance: number
}

// Backend BlogData model structure (for reference)
export interface BackendBlogData {
  _id: string
  focusKeyword: string
  articleFormat: 'how-to' | 'listicle' | 'guide' | 'comparison' | 'review' | 'news' | 'case-study'
  wordCount: number
  targetAudience: string
  objective: string
  companyId: string
  priority: number
  status: 'pending' | 'in-progress' | 'completed' | 'published'
  seoScore?: number
}

// Backend ContentBlock model structure (for reference)
export interface BackendContentBlock {
  _id: string
  blogId: string
  blockType: 'h1' | 'h2' | 'h3' | 'paragraph' | 'list' | 'image' | 'quote' | 'code'
  content: string
  order: number
  metadata: {
    wordCount?: number
    aiGenerated?: boolean
    source?: string
    keywords?: string[]
    citations?: Array<{
      url: string
      title: string
      description: string
    }>
  }
  version: number
  isSelected: boolean
  alternatives: Array<{
    content: string
    source: string
    createdAt: Date
  }>
}
