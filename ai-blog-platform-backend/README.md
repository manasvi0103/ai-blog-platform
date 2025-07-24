# AI Blog Platform Backend

A comprehensive AI-driven blog content generation platform backend built with Node.js, Express, MongoDB, and integrated with Gemini AI, Google Sheets, and various news APIs.

## 🚀 Features

- **AI Content Generation**: Powered by Google Gemini for creating blog posts, titles, and meta descriptions
- **Multi-Company Support**: Manage multiple companies with different brand voices and tones
- **Google Sheets Integration**: Sync blog data and company information from Google Sheets
- **Trend Analysis**: Fetch and analyze trends from GNews, NewsData.io, and RapidAPI
- **Block-Based Content**: Modular content creation with versioning and alternatives
- **WordPress Integration**: Direct publishing to WordPress as drafts
- **SEO Optimization**: Built-in SEO analysis and keyword management
- **Caching & Performance**: Redis-like caching for improved performance

## 📋 Prerequisites

- Node.js 16+ and npm 8+
- MongoDB (local or Atlas)
- Google Cloud Project (for Gemini API and Sheets)
- WordPress site (for publishing)
- API keys for news services

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ai-blog-platform-backend
npm install
```

### 2. Environment Configuration

Copy the `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Fill in all required environment variables:

#### Required API Keys:
- **GEMINI_API_KEY**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **GNEWS_API_KEY**: Get from [GNews.io](https://gnews.io/)
- **NEWSDATA_API_KEY**: Get from [NewsData.io](https://newsdata.io/)
- **RAPIDAPI_KEY**: Get from [RapidAPI](https://rapidapi.com/)

#### Google Sheets Setup:
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Download the service account JSON file
5. Extract `client_email` and `private_key` for the environment variables
6. Share your Google Sheets with the service account email

#### MongoDB Setup:
- **Local**: `mongodb://localhost:27017/ai-blog-platform`
- **Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/ai-blog-platform`

### 3. Database Setup

```bash
# Seed the database with sample data
npm run seed

# Or sync from Google Sheets (if configured)
npm run sync-sheets
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
ai-blog-platform-backend/
├── models/              # MongoDB schemas
│   ├── Company.js       # Company data model
│   ├── BlogData.js      # Blog requirements model
│   ├── ContentBlock.js  # Content blocks model
│   ├── Keyword.js       # Keywords model
│   ├── TrendData.js     # Trend analysis data
│   └── Draft.js         # Final drafts model
├── routes/              # API routes
│   ├── blogRoutes.js    # Blog management
│   ├── companyRoutes.js # Company management
│   ├── keywordRoutes.js # Keyword operations
│   ├── contentRoutes.js # Content generation
│   └── trendRoutes.js   # Trend analysis
├── services/            # External service integrations
│   ├── geminiService.js # AI content generation
│   ├── trendService.js  # News/trend fetching
│   ├── googleSheetsService.js # Sheets sync
│   └── wordpressService.js # WordPress publishing
├── middleware/          # Express middleware
│   ├── auth.js          # Authentication
│   ├── validation.js    # Request validation
│   ├── errorHandler.js  # Error handling
│   └── cache.js         # Caching middleware
├── scripts/             # Utility scripts
│   ├── seedDatabase.js  # Database seeding
│   ├── syncGoogleSheets.js # Sheets synchronization
│   └── cleanupDatabase.js # Maintenance tasks
└── server.js            # Main application entry
```

## 🔗 API Endpoints

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company

### Blog Management
- `GET /api/blogs` - List blogs with pagination
- `GET /api/blogs/:id` - Get blog with content blocks
- `POST /api/blogs` - Create new blog entry
- `PUT /api/blogs/:id/status` - Update blog status

### Content Generation
- `GET /api/content/blog/:blogId` - Get content blocks
- `POST /api/content/generate` - Generate AI content
- `PUT /api/content/:id` - Update content block
- `POST /api/content/:id/select` - Select alternative content

### Keywords
- `GET /api/keywords` - Search keywords
- `POST /api/keywords` - Create/update keyword
- `GET /api/keywords/suggestions/:focusKeyword` - Get suggestions

### Trends
- `GET /api/trends/:keyword` - Get trend data
- `POST /api/trends/fetch` - Fetch fresh trends

## 🔧 Configuration Options

### Google Sheets Format

#### Company Data Sheet:
| Company Name | Services Offered | Service Overview | About The Company | Tone | Brand Voice |
|--------------|-----------------|------------------|-------------------|------|-------------|
| WattMonk | Solar Design, Engineering | Comprehensive solar services | Leading solar provider | professional | Expert and reliable |

#### Blog Data Sheet:
| Focus Keyword | Article Format | Word Count | Target Audience | Objective |
|---------------|---------------|------------|-----------------|-----------|
| solar installation cost | guide | 2000 | Homeowners | Generate leads |

### Content Block Types
- `h1`: Main headings
- `h2`, `h3`: Subheadings
- `paragraph`: Body text
- `list`: Bullet/numbered lists
- `image`: Image blocks with alt text
- `quote`: Blockquotes
- `code`: Code snippets

## 🚀 Usage Examples

### Generate Content Block
```javascript
POST /api/content/generate
{
  "blogId": "64abc123def456789",
  "blockType": "h2",
  "prompt": "Create a subheading about solar panel costs",
  "companyContext": {
    "name": "WattMonk",
    "tone": "professional",
    "brandVoice": "Expert and reliable"
  }
}
```

### Fetch Trends
```javascript
POST /api/trends/fetch
{
  "keyword": "solar energy trends",
  "sources": ["gnews", "newsdata"]
}
```

### Create Blog Entry
```javascript
POST /api/blogs
{
  "focusKeyword": "residential solar installation",
  "articleFormat": "guide",
  "wordCount": 1500,
  "targetAudience": "Homeowners",
  "objective": "Educational content for lead generation",
  "companyId": "64abc123def456789"
}
```

## 🔄 n8n Integration

The platform is designed to work with n8n workflows for automation:

1. **Scheduled Data Sync**: Automatically sync Google Sheets data
2. **Trend Monitoring**: Regular trend analysis and data collection
3. **Content Pipeline**: Automated content generation workflows
4. **WordPress Publishing**: Automated draft creation and publishing

### Sample n8n Workflow Triggers:
- Webhook: `http://localhost:5000/api/webhooks/n8n`
- Cron: Daily sync at 9 AM
- Manual: Trigger via n8n interface

## 📊 Monitoring & Maintenance

### Health Check
```bash
curl http://localhost:5000/health
```

### Database Cleanup
```bash
npm run cleanup
```

### Log Files
- Error logs: `./logs/error.log`
- Combined logs: `./logs/combined.log`

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- Input validation with Joi
- JWT authentication ready
- CORS configuration
- Error handling without data exposure

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Development Scripts

```bash
npm run dev          # Start development server
npm run seed         # Seed database with sample data
npm run sync-sheets  # Sync Google Sheets data
npm run cleanup      # Clean up old data
npm test             # Run tests
```

## 🚨 Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string in `.env`

2. **Google Sheets Access Denied**
   - Verify service account email has access to sheets
   - Check private key format (include \n characters)

3. **API Rate Limits**
   - Monitor API usage in logs
   - Implement exponential backoff for external APIs

4. **Gemini API Errors**
   - Verify API key is active
   - Check quota limits in Google Cloud Console

### Debug Mode:
```bash
NODE_ENV=development DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Next Steps**: Once the backend is running, you can proceed with frontend development using React, Next.js, or your preferred framework. The backend provides a comprehensive REST API for all blog management operations.