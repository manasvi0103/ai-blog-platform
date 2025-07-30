# AI Blog Platform - Complete Documentation

## 🚀 Project Overview

**AI Blog Platform** is a comprehensive, AI-powered content generation system designed specifically for solar companies. It automates the entire blog creation workflow from keyword selection to WordPress deployment, with multiple fallback mechanisms to ensure reliability.

## 🎯 Core Features

### 1. **Multi-Source Keyword Generation**
- **Manual Keywords**: Real keywords from Google Sheets
- **AI Keywords**: Generated using Gemini 2.0 Flash with trend analysis
- **Fallback Keywords**: Pre-defined solar industry keywords

### 2. **Intelligent Content Generation**
- **AI Content**: High-quality blog posts using Gemini 2.0 Flash
- **Real Company Links**: SERP API integration for authentic company references
- **Authority References**: Automatic citations from industry sources
- **Word Count Matching**: Dynamic content distribution based on keyword requirements

### 3. **Advanced Image Generation**
- **Multiple Services**: Pollinations-Flux, Pollinations-Default with Unsplash fallback
- **S3 Storage**: AWS S3 integration for image hosting
- **Error Recovery**: Automatic retry and fallback mechanisms

### 4. **WordPress Integration**
- **Dual Deployment**: N8N workflow + Direct WordPress API
- **Draft Creation**: Automatic WordPress draft generation
- **Edit URL Redirection**: Direct links to WordPress editor

## 🏗️ System Architecture

### **Frontend (Next.js)**
- **Framework**: Next.js 14 with TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks and context
- **API Integration**: Custom API client with error handling

### **Backend (Express.js)**
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Rate Limiting**: Express rate limiter

### **AI Services**
- **Primary AI**: Google Gemini 2.0 Flash
- **Content Generation**: Blog posts, meta descriptions, keywords
- **Image Generation**: AI-powered image creation with fallbacks

### **External Integrations**
- **Google Sheets**: Manual keyword and company data
- **SERP API**: Real company link discovery
- **News APIs**: Trend analysis (GNews, NewsData, RapidAPI)
- **WordPress**: Content deployment
- **AWS S3**: Image storage

## 📊 Complete Workflow Diagram

The following flowchart shows the complete workflow with all fallback mechanisms:

```mermaid
graph TD
    A[Start: User Selects Company] --> B[Load Keywords]
    
    %% Keyword Loading Flow
    B --> C{Google Sheets Available?}
    C -->|Yes| D[Fetch Manual Keywords from Sheets]
    C -->|No| E[Skip Manual Keywords]
    
    D --> F[Generate AI Keywords with Gemini]
    E --> F
    
    F --> G{AI Generation Success?}
    G -->|Yes| H[Combine Manual + AI Keywords]
    G -->|No| I[Use Basic AI Keywords]
    
    I --> J{Basic AI Success?}
    J -->|Yes| H
    J -->|No| K[Use Fallback Keywords]
    
    H --> L[Filter Used Keywords]
    K --> L
    L --> M[Ensure 4 Keywords Total]
    M --> N[Display Keyword Selection]
    
    %% Keyword Selection
    N --> O[User Selects Keyword]
    O --> P[Generate Meta Options]
    
    %% Meta Generation Flow
    P --> Q{Gemini Available?}
    Q -->|Yes| R[Generate 3 Meta Options]
    Q -->|No| S[Use Template Meta]
    
    R --> T[User Selects Meta]
    S --> T
    T --> U[Start Content Generation]
    
    %% Content Generation Flow
    U --> V[Generate Content Blocks]
    V --> W{Gemini Available?}
    W -->|Yes| X[Generate AI Content]
    W -->|No| Y[Use Template Content]
    
    X --> Z[Fetch Real Company Links]
    Y --> Z
    
    Z --> AA{SERP API Available?}
    AA -->|Yes| BB[Get Real Company Links]
    AA -->|No| CC[Use Sample Links]
    
    BB --> DD[Generate Authority References]
    CC --> DD
    
    DD --> EE[Generate Images for Blocks]
    
    %% Image Generation Flow
    EE --> FF{Pollinations-Flux Available?}
    FF -->|Yes| GG[Generate with Flux]
    FF -->|No| HH{Pollinations-Default Available?}
    
    GG --> II{Generation Success?}
    II -->|Yes| JJ[Upload to S3]
    II -->|No| HH
    
    HH -->|Yes| KK[Generate with Default]
    HH -->|No| LL[Use Unsplash Fallback]
    
    KK --> MM{Generation Success?}
    MM -->|Yes| JJ
    MM -->|No| LL
    
    LL --> NN[Fetch Unsplash Image]
    NN --> JJ
    
    JJ --> OO{S3 Upload Success?}
    OO -->|Yes| PP[Image Ready]
    OO -->|No| QQ[Use Direct URL]
    
    PP --> RR[Content Review Page]
    QQ --> RR
    
    %% WordPress Deployment Flow
    RR --> SS[User Clicks Deploy]
    SS --> TT[Test WordPress Connection]
    
    TT --> UU{N8N Available?}
    UU -->|Yes| VV[Deploy via N8N]
    UU -->|No| WW{Direct WordPress API Available?}
    
    VV --> XX{N8N Success?}
    XX -->|Yes| YY[Deployment Complete]
    XX -->|No| WW
    
    WW -->|Yes| ZZ[Deploy via Direct API]
    WW -->|No| AAA[Show Error Message]
    
    ZZ --> BBB{Direct API Success?}
    BBB -->|Yes| YY
    BBB -->|No| AAA
    
    YY --> CCC[Redirect to WordPress Editor]
    AAA --> DDD[Allow Manual Retry]
    
    %% Styling
    classDef success fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    classDef error fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    classDef process fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef decision fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    classDef fallback fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    
    class YY,CCC,GG,BB,R success
    class AAA,DDD error
    class A,B,U,V,EE,SS,TT process
    class C,G,J,Q,W,AA,FF,II,MM,OO,UU,XX,BBB decision
    class K,S,Y,CC,LL,HH,WW fallback
```

## 🔄 Fallback Mechanisms

### **1. Keyword Generation Fallbacks**
```
Google Sheets → AI Keywords → Basic AI → Fallback Keywords
```

### **2. Content Generation Fallbacks**
```
Gemini AI → Template Content → Manual Content
```

### **3. Image Generation Fallbacks**
```
Pollinations-Flux → Pollinations-Default → Unsplash → Direct URL
```

### **4. WordPress Deployment Fallbacks**
```
N8N Workflow → Direct WordPress API → Manual Retry
```

### **5. Company Links Fallbacks**
```
SERP API → Sample Links → Manual Links
```

## 🛠️ API Dependencies & Fallbacks

| Service | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|---------|---------|------------|------------|------------|
| **Keywords** | Google Sheets | Gemini AI | Basic AI | Fallback List |
| **Content** | Gemini 2.0 Flash | Template | Manual | - |
| **Images** | Pollinations-Flux | Pollinations-Default | Unsplash | Direct URL |
| **Company Links** | SERP API | Sample Links | Manual Links | - |
| **Trends** | GNews + NewsData + RapidAPI | Cached Data | Fallback Topics | - |
| **WordPress** | N8N Workflow | Direct API | Manual | - |
| **Storage** | AWS S3 | Direct URLs | Local Cache | - |

## 📁 Project Structure

```
ai-blog-platform/
├── ai-blog-platform-frontend/          # Next.js Frontend
│   ├── app/                            # App Router Pages
│   │   ├── blog/[draftId]/            # Blog Workflow Pages
│   │   │   ├── keywords/              # Keyword Selection
│   │   │   ├── meta/                  # Meta Generation
│   │   │   ├── editor/                # Content Editor
│   │   │   └── review/                # Review & Deploy
│   │   ├── companies/                 # Company Management
│   │   └── wordpress-setup/           # WordPress Configuration
│   ├── components/                     # Reusable Components
│   ├── lib/                           # Utilities & API Client
│   └── types/                         # TypeScript Definitions
│
├── ai-blog-platform-backend/           # Express.js Backend
│   ├── controllers/                    # Route Controllers
│   ├── models/                        # MongoDB Models
│   ├── routes/                        # API Routes
│   ├── services/                      # Business Logic
│   │   ├── geminiService.js           # AI Content Generation
│   │   ├── imageService.js            # Image Generation
│   │   ├── keywordService.js          # Keyword Management
│   │   ├── linkService.js             # Company Link Discovery
│   │   ├── wordpressService.js        # WordPress Integration
│   │   ├── googleSheetsService.js     # Google Sheets Integration
│   │   └── trendService.js            # Trend Analysis
│   ├── middleware/                    # Express Middleware
│   └── utils/                         # Helper Functions
│
└── documentation/                      # Project Documentation
    ├── API_DOCUMENTATION.md           # API Reference
    ├── DEPLOYMENT_GUIDE.md            # Deployment Instructions
    └── TROUBLESHOOTING.md             # Common Issues & Solutions
```

## 🔧 Environment Configuration

### **Backend Environment Variables (.env)**

```bash
# Core Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# News & Trends APIs
GNEWS_API_KEY=your_gnews_api_key
NEWSDATA_API_KEY=your_newsdata_api_key
RAPIDAPI_KEY=your_rapidapi_key

# Search & Links
SERP_API_KEY=your_serp_api_key

# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BLOG_DATA_SPREADSHEET_ID=your_blog_spreadsheet_id
COMPANY_DATA_SPREADSHEET_ID=your_company_spreadsheet_id

# WordPress Integration
WORDPRESS_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your_wp_username
WORDPRESS_PASSWORD=your_wp_app_password

# N8N Integration (Optional)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/wordpress-draft
N8N_WEBHOOK_SECRET=your_webhook_secret

# AWS S3 Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_s3_bucket

# Security
JWT_SECRET=your_jwt_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Frontend Environment Variables (.env.local)**

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Development Settings
NODE_ENV=development
```

## 🚀 Quick Start Guide

### **1. Prerequisites**
- Node.js 18+ and npm/yarn
- MongoDB database (local or cloud)
- Google Cloud Project with Sheets API enabled
- WordPress site with Application Passwords enabled
- AWS S3 bucket for image storage

### **2. Installation**

```bash
# Clone the repository
git clone <repository-url>
cd ai-blog-platform

# Install backend dependencies
cd ai-blog-platform-backend
npm install

# Install frontend dependencies
cd ../ai-blog-platform-frontend
npm install
```

### **3. Configuration**

```bash
# Backend configuration
cd ai-blog-platform-backend
cp .env.example .env
# Edit .env with your API keys and configuration

# Frontend configuration
cd ../ai-blog-platform-frontend
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### **4. Database Setup**

```bash
# Start MongoDB (if running locally)
mongod

# The application will automatically create collections on first run
```

### **5. Start Development Servers**

```bash
# Terminal 1: Start Backend
cd ai-blog-platform-backend
npm run dev

# Terminal 2: Start Frontend
cd ai-blog-platform-frontend
npm run dev
```

### **6. Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## 📋 User Workflow

### **Step 1: Company Selection**
1. Navigate to the application
2. Select or create a company profile
3. Verify company data and WordPress configuration

### **Step 2: Keyword Selection**
1. View available keywords (Manual + AI Generated)
2. Review keyword metadata (word count, audience, objective)
3. Select focus keyword for the blog post

### **Step 3: Meta Generation**
1. AI generates 3 meta description options
2. User selects preferred meta description
3. System saves meta information

### **Step 4: Content Generation**
1. AI generates structured content blocks
2. Real company links are automatically embedded
3. Authority references are added
4. Images are generated for each content block

### **Step 5: Content Review & Editing**
1. Review generated content in editor
2. Edit content blocks as needed
3. Regenerate images if required
4. Add custom images via upload

### **Step 6: Final Review & Deployment**
1. Review complete blog post
2. Check internal and external links
3. Verify WordPress connection
4. Deploy to WordPress as draft
5. Redirect to WordPress editor for final edits

## 🔍 API Endpoints Overview

### **Blog Management**
- `GET /api/blogs/keywords/:companyName` - Get keywords for company
- `POST /api/blogs/draft` - Create new blog draft
- `GET /api/blogs/draft/:draftId` - Get draft details
- `PUT /api/blogs/draft/:draftId` - Update draft
- `POST /api/blogs/generate-content` - Generate blog content
- `POST /api/blogs/deploy-wordpress` - Deploy to WordPress

### **Company Management**
- `GET /api/companies` - List all companies
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `POST /api/blogs/setup-wordpress` - Configure WordPress

### **Content Generation**
- `POST /api/content/generate` - Generate content with AI
- `POST /api/content/meta` - Generate meta descriptions
- `POST /api/content/regenerate` - Regenerate specific content

### **Image Management**
- `POST /api/images/generate` - Generate AI images
- `POST /api/images/upload` - Upload custom images
- `GET /api/images/:imageId` - Get image details

### **WordPress Integration**
- `GET /api/wordpress/test-connection` - Test WordPress connection
- `POST /api/wordpress/deploy` - Deploy content to WordPress
- `GET /api/wordpress/status` - Get WordPress status

## 🛡️ Error Handling & Recovery

### **Graceful Degradation**
The system is designed to continue functioning even when external services fail:

1. **API Failures**: Automatic fallback to alternative services
2. **Network Issues**: Retry mechanisms with exponential backoff
3. **Service Timeouts**: Shorter timeouts with fallback options
4. **Data Corruption**: Validation and sanitization at multiple levels

### **User Experience**
- **Loading States**: Clear progress indicators during operations
- **Error Messages**: User-friendly error descriptions with suggested actions
- **Retry Options**: Automatic and manual retry mechanisms
- **Fallback Content**: Always provide usable content even when services fail

## 📊 Performance Optimization

### **Caching Strategy**
- **API Responses**: Redis caching for frequently accessed data
- **Generated Content**: Database caching for AI-generated content
- **Images**: S3 CDN for fast image delivery
- **Static Assets**: Next.js automatic optimization

### **Rate Limiting**
- **API Calls**: Intelligent rate limiting to prevent service overload
- **User Actions**: Prevent spam and abuse
- **External APIs**: Respect third-party rate limits

## 🔒 Security Measures

### **Authentication & Authorization**
- **JWT Tokens**: Secure user authentication
- **Role-Based Access**: Different permissions for different user types
- **API Key Management**: Secure storage and rotation of API keys

### **Data Protection**
- **Input Validation**: Comprehensive validation of all user inputs
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: Content sanitization and CSP headers
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 🧪 Testing Strategy

### **Unit Tests**
- Service layer testing for business logic
- Utility function testing
- Component testing for React components

### **Integration Tests**
- API endpoint testing
- Database integration testing
- External service integration testing

### **End-to-End Tests**
- Complete user workflow testing
- Cross-browser compatibility testing
- Performance testing under load

## 📈 Monitoring & Analytics

### **Application Monitoring**
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Metrics**: Response times and throughput monitoring
- **User Analytics**: Usage patterns and feature adoption

### **External Service Monitoring**
- **API Health Checks**: Regular monitoring of external service availability
- **Rate Limit Tracking**: Monitor API usage against limits
- **Cost Tracking**: Monitor usage costs for paid services

## 🚀 Deployment Guide

### **Production Environment**
- **Docker Containerization**: Containerized deployment for consistency
- **Environment Variables**: Secure configuration management
- **Database Migration**: Automated database schema updates
- **SSL/TLS**: HTTPS encryption for all communications

### **Scaling Considerations**
- **Horizontal Scaling**: Load balancing across multiple instances
- **Database Optimization**: Indexing and query optimization
- **CDN Integration**: Global content delivery for images and assets
- **Caching Layer**: Redis for improved performance

## 🔧 Troubleshooting Common Issues

### **WordPress Connection Issues**
1. **Check Credentials**: Verify WordPress username and application password
2. **Test API Access**: Ensure WordPress REST API is accessible
3. **Network Connectivity**: Check firewall and network settings
4. **Plugin Conflicts**: Disable conflicting WordPress plugins

### **AI Generation Failures**
1. **API Key Validation**: Verify Gemini API key is valid and has quota
2. **Rate Limiting**: Check if API rate limits are exceeded
3. **Content Filtering**: Ensure content doesn't violate AI service policies
4. **Fallback Activation**: Verify fallback mechanisms are working

### **Image Generation Issues**
1. **Service Availability**: Check if image generation services are online
2. **S3 Configuration**: Verify AWS S3 credentials and bucket permissions
3. **Network Timeouts**: Increase timeout values for slow connections
4. **Fallback Images**: Ensure Unsplash fallback is configured

### **Database Connection Problems**
1. **MongoDB Status**: Check if MongoDB service is running
2. **Connection String**: Verify MongoDB URI is correct
3. **Network Access**: Ensure database is accessible from application
4. **Authentication**: Check database credentials and permissions
