

# FinSight AI - Advanced Financial Analytics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-38B2AC.svg)](https://tailwindcss.com/)
[![Finnhub](https://img.shields.io/badge/Finnhub-API-00B464.svg)](https://finnhub.io/)

**Live Demo**: [https://finsight-ai-phi.vercel.app/](https://finsight-ai-phi.vercel.app/)

FinSight AI is an advanced financial analytics platform that combines real-time market data, AI-powered insights, and portfolio simulations to help investors make smarter decisions. Built with Next.js 15 and powered by cutting-edge AI technologies.

## 🌟 Features

### 📊 Real-Time Market Data
- Live stock and cryptocurrency prices updated every minute
- Interactive charts with historical data visualization
- Advanced search functionality for stocks, crypto, and other assets
- Market status indicators and summary cards

### 🤖 AI-Powered Insights
- OpenAI-driven news summarization and sentiment analysis
- AI-generated market predictions and trend analysis
- Personalized investment insights based on your portfolio
- Confidence scoring for AI predictions

### 📈 Portfolio Simulator
- Virtual trading with "what-if" scenario testing
- Real-time profit/loss calculations
- Portfolio allocation visualization
- Performance tracking and analytics

### 🔐 Secure Authentication
- Google and GitHub OAuth integration
- Secure session management with NextAuth.js
- User profile with saved preferences
- Role-based access control

### 📱 Responsive Design
- Mobile-first approach with responsive layouts
- Professional UI with shadcn/ui components
- Dark mode support
- Optimized for all device sizes

## 🛠️ Tech Stack

### Frontend & Full-Stack
- **Next.js 15** - React framework with App Router and Server Actions
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **Framer Motion** - Production-ready motion library
- **Recharts** - Composable charting library

### Backend & APIs
- **NextAuth.js** - Authentication for Next.js
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Relational database (via Neon)
- **OpenAI API** - AI-powered insights and predictions
- **Finnhub API** - Real-time market data
- **Yahoo Finance** - Historical chart data

### Deployment & Infrastructure
- **Vercel** - Serverless deployment platform
- **Neon** - Serverless PostgreSQL database
- **Upstash Redis** - Serverless caching (optional)
- **GitHub Actions** - CI/CD pipeline

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- API keys for:
  - OpenAI (for AI features)
  - Finnhub (for market data)
  - Google OAuth (optional)
  - GitHub OAuth (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/finsight-ai.git
   cd finsight-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then update `.env.local` with your API keys and configuration.

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database (Neon via Vercel)
DATABASE_URL="your_neon_database_url"

# NextAuth.js
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# APIs
FINNHUB_API_KEY="your-finnhub-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Optional: Email notifications
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SERVER="smtp://username:password@smtp.provider.com:587"

# Optional: CRON secret
CRON_SECRET="your-cron-secret-key"
```

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to production**
   ```bash
   vercel --prod
   ```

4. **Set environment variables**
   Add all environment variables from `.env.local` to your Vercel project settings.

### Database Setup

1. **Create a Neon database**
   - Go to your Vercel dashboard
   - Navigate to the Storage tab
   - Create a new Neon database
   - Copy the connection string to `DATABASE_URL`

2. **Run database migrations**
   ```bash
   npx prisma db push
   ```

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Set the redirect URI: `https://yourdomain.vercel.app/api/auth/callback/google`

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set the authorization callback URL: `https://yourdomain.vercel.app/api/auth/callback/github`

## 📊 API Usage & Costs

### Free Tier Usage
- **Vercel**: Free tier (sufficient for development)
- **Neon Database**: Free tier (3GB storage)
- **Finnhub API**: Free tier (60 calls/minute)
- **Yahoo Finance**: Free (no API key needed)
- **OpenAI API**: Pay-per-use (~$5-10/month for moderate usage)
- **GitHub/Google OAuth**: Free

### Estimated Monthly Cost
- **Development**: $0 (all free tiers)
- **Production**: ~$5-15 (mostly OpenAI usage)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [OpenAI](https://openai.com/) for providing powerful AI capabilities
- [Finnhub](https://finnhub.io/) for real-time financial data
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Vercel](https://vercel.com/) for the seamless deployment experience

---

**Built with ❤️ by Mohit Bansal
