# 🎬 Fragile News Source (FNS)

**Matrix-themed news platform with Keisha AI bias analysis**

FNS is a revolutionary news platform that imports stories from your existing soWSnewsletter system, analyzes them through Keisha AI's bias detection engine, and presents them in a sleek Matrix-themed interface. Every article gets the "fragility decoding" treatment, revealing the white supremacist patterns hidden in mainstream media.

## 🌟 Features

- **📰 Automated News Import**: Pulls stories from your soWSnewsletter system twice daily
- **🤖 Keisha AI Analysis**: Every article gets analyzed for bias, euphemisms, and systemic patterns
- **🎭 Matrix Theme**: Sleek, futuristic interface with Matrix background video
- **📊 Severity Scoring**: Visual indicators showing the level of white supremacist content
- **🔍 Smart Search**: Find articles by content, category, or bias level
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **⚡ Real-time Updates**: Fresh content twice daily with automated analysis

## 🏗️ Architecture

```
soWSnewsletter (Render) → FNS Import Service → Database → Keisha AI → Frontend
```

### Components

1. **News Import Service** - Fetches articles from your newsletter system
2. **Keisha Analysis Integration** - Connects to your existing microfrag API
3. **Database Layer** - Stores articles and analysis results
4. **REST API** - Serves data to frontend
5. **Matrix-themed Frontend** - Modern news interface

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- MySQL/MariaDB database
- Your existing Keisha AI backend running
- Access to your soWSnewsletter data

### Installation

1. **Clone and setup**:
```bash
cd fragiled2
npm install
cp .env.example .env
```

2. **Configure environment**:
Edit `.env` with your database and API settings:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fns_database
KEISHA_API_URL=http://localhost:3001
LOCAL_NEWS_PATH=../news_project
```

3. **Initialize database**:
```bash
npm run setup
```

4. **Import your news**:
```bash
npm run import:news
```

5. **Start Keisha analysis**:
```bash
npm run analyze:pending
```

6. **Launch the server**:
```bash
npm start
```

Visit `http://localhost:3002` to see your Matrix-themed news platform!

## 📊 API Endpoints

### News Feed
```http
GET /api/fns/news/feed?limit=20&category=systemic%20racism&minSeverity=75
```

### Single Article
```http
GET /api/fns/news/article/:id
```

### Search Articles
```http
GET /api/fns/news/search?q=white%20supremacy&limit=10
```

### Import News
```http
POST /api/fns/news/import
```

### Keisha Analysis Status
```http
GET /api/fns/keisha/status
```

## 🎨 Frontend Integration

The backend is designed to work with your existing Keisha AI frontend. Key integration points:

### Story Card Component
```javascript
// Example story data structure
{
  id: "fns_20250121_abc123",
  title: "Article Title",
  url: "https://original-source.com/article",
  summary: "Article summary...",
  severity_score: 85.5,
  featured_image: "https://image-url.com/image.jpg",
  keisha_translation: "Keisha's analysis...",
  bias_score: 78.2,
  analyzed_at: "2025-01-21T10:30:00Z"
}
```

### Matrix Theme Assets
- Place `matrix.mp4` in `/public/static/`
- FNS logo and branding assets
- Dark theme with green Matrix-style accents

## 🔄 Automated Operations

FNS runs several automated tasks:

- **📰 News Import**: Every 12 hours (6 AM & 6 PM)
- **🤖 Analysis Queue**: Every 30 minutes
- **🔍 Pending Analysis**: Every hour

Monitor with:
```bash
curl http://localhost:3002/api/fns/keisha/status
```

## 🗄️ Database Schema

### Core Tables
- `fns_articles` - News articles with metadata
- `fns_keisha_analysis` - Keisha AI analysis results
- `fns_article_images` - Article images
- `fns_categories` - News categories
- `fns_user_interactions` - User engagement tracking

### Key Views
- `fns_latest_analyzed` - Recent articles with analysis
- `fns_pending_analysis` - Articles awaiting analysis
- `fns_daily_stats` - Daily statistics

## 🔧 Configuration

### News Categories
Based on your newsletter keywords:
- `systemic racism` (Severity: 1.2x)
- `white supremacy` (Severity: 1.5x)
- `MAGA` (Severity: 1.1x)
- `christian nationalism` (Severity: 1.3x)
- `great replacement theory` (Severity: 1.4x)

### Analysis Settings
- **Batch Size**: 10 concurrent analyses
- **Rate Limiting**: 2-second delay between batches
- **Timeout**: 60 seconds per article
- **Retry Logic**: 3 attempts for failed analyses

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
```

## 🔍 Monitoring

### Health Check
```http
GET /health
```

### Statistics Dashboard
```http
GET /api/fns/news/stats
```

### Queue Status
```http
GET /api/fns/keisha/status
```

## 🛠️ Development

### Project Structure
```
fragiled2/
├── services/           # Core business logic
├── routes/            # API endpoints
├── database/          # Schema and migrations
├── scripts/           # Utility scripts
├── public/            # Static assets
└── frontend/          # React app (to be built)
```

### Adding New Features
1. Create service in `/services/`
2. Add routes in `/routes/`
3. Update database schema if needed
4. Add tests
5. Update documentation

## 🤝 Integration with Existing Systems

### soWSnewsletter
- Reads from your existing JSON files in `news_project/`
- Can also hit API endpoints if you add them
- Preserves all original metadata

### Keisha AI Backend
- Uses existing microfrag analysis API
- Maintains compatibility with current prompt system
- Stores results in separate FNS tables

### Frontend Integration
- Designed to work with your existing React components
- Provides clean API for story cards and detail views
- Matrix theme assets ready for integration

## 📈 Next Steps

1. **Frontend Development**: Build React components for news interface
2. **Image Processing**: Enhance image extraction and optimization
3. **User Features**: Add bookmarking, sharing, comments
4. **Analytics**: Track user engagement and popular stories
5. **Mobile App**: React Native version for mobile users

## 🎯 The Vision

FNS transforms your critical race analysis newsletter into a modern, engaging news platform. Users get:

- **Original journalism** with direct links to sources
- **Keisha's insights** revealing hidden bias patterns  
- **Matrix aesthetic** that matches the "red pill" awakening theme
- **Twice-daily updates** keeping content fresh
- **Smart categorization** helping users find relevant stories

This is more than a news site - it's a consciousness-raising platform that helps people see through the matrix of white supremacist media manipulation.

---

**Built with ❤️ for the resistance**

*"The Matrix is a system, Neo. That system is our enemy."*
