-- ============= CLEANUP (DROP IF EXISTS) =============

DROP TABLE IF EXISTS "StockRecommendation" CASCADE;
DROP TABLE IF EXISTS "FraudAlert" CASCADE;
DROP TABLE IF EXISTS "SocialMediaSentiment" CASCADE;
DROP TABLE IF EXISTS "PricePrediction" CASCADE;
DROP TABLE IF EXISTS "PatternRecognition" CASCADE;
DROP TABLE IF EXISTS "ChatbotQuery" CASCADE;
DROP TABLE IF EXISTS "TradingStrategy" CASCADE;
DROP TABLE IF EXISTS "UserPreferences" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "AiInsight" CASCADE;
DROP TABLE IF EXISTS "Portfolio" CASCADE;
DROP TABLE IF EXISTS "Watchlist" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "ChatbotMessage" CASCADE;
DROP TABLE IF EXISTS "ChatbotConversation" CASCADE;
DROP TABLE IF EXISTS "ChatbotKnowledge" CASCADE;
DROP TABLE IF EXISTS "ChatbotTool" CASCADE;

-- ============= TABLES =============

CREATE TABLE "VerificationToken" (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMP NOT NULL,
  CONSTRAINT "VerificationToken_identifier_token" UNIQUE (identifier, token)
);

CREATE TABLE "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMP,
  image TEXT,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Account" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId")
);

CREATE TABLE "Session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "Watchlist" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  type TEXT DEFAULT 'stock',
  "addedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "Watchlist_userId_symbol_key" UNIQUE ("userId", symbol)
);

CREATE TABLE "Portfolio" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  name TEXT DEFAULT 'My Portfolio',
  symbol TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  "buyPrice" DOUBLE PRECISION NOT NULL,
  "currentPrice" DOUBLE PRECISION,
  "totalValue" DOUBLE PRECISION,
  profit DOUBLE PRECISION,
  "profitPercent" DOUBLE PRECISION,
  type TEXT DEFAULT 'stock',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "AiInsight" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  symbol TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  sentiment TEXT,
  confidence DOUBLE PRECISION DEFAULT 0.5,
  "sourceUrl" TEXT,
  "imageUrl" TEXT,
  category TEXT DEFAULT 'general',
  "isRead" BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'comprehensive',
  timeframe TEXT DEFAULT '1m',
  "keyPoints" JSONB,
  prediction TEXT,
  "riskFactors" JSONB,
  opportunities JSONB,
  "technicalIndicators" JSONB,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "AiInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  "isRead" BOOLEAN DEFAULT false,
  "actionUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "UserPreferences" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT UNIQUE NOT NULL,
  "emailNotifications" BOOLEAN DEFAULT true,
  "pushNotifications" BOOLEAN DEFAULT false,
  "darkMode" BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  "portfolioUpdateFreq" TEXT DEFAULT 'daily',
  "newsUpdateFreq" TEXT DEFAULT 'daily',
  "riskTolerance" TEXT DEFAULT 'moderate',
  "investmentGoals" TEXT DEFAULT 'growth',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "TradingStrategy" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  parameters JSONB NOT NULL,
  performance JSONB,
  "isActive" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "TradingStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "ChatbotQuery" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "ChatbotQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "PatternRecognition" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  "patternType" TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  "detectedAt" TIMESTAMP DEFAULT now(),
  "isValid" BOOLEAN DEFAULT true,
  timeframe TEXT DEFAULT 'daily'
);

CREATE TABLE "PricePrediction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  "modelType" TEXT NOT NULL,
  prediction DOUBLE PRECISION NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  "targetDate" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now(),
  "actualPrice" DOUBLE PRECISION,
  accuracy DOUBLE PRECISION
);

CREATE TABLE "SocialMediaSentiment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  platform TEXT NOT NULL,
  sentiment DOUBLE PRECISION NOT NULL,
  mentions INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "FraudAlert" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  "alertType" TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "StockRecommendation" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  reason TEXT NOT NULL,
  "priceTarget" DOUBLE PRECISION,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  "isRead" BOOLEAN DEFAULT false,
  CONSTRAINT "StockRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "ChatbotConversation" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  "isArchived" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "ChatbotConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "ChatbotMessage" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB,
  sources JSONB,
  confidence DOUBLE PRECISION,
  tokens INTEGER,
  "responseTime" INTEGER,
  "createdAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "ChatbotMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatbotConversation"(id) ON DELETE CASCADE
);

CREATE TABLE "ChatbotKnowledge" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[],
  priority INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "ChatbotTool" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  parameters JSONB NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

-- ============= INDEXES =============

CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");
CREATE INDEX "AiInsight_userId_idx" ON "AiInsight"("userId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "TradingStrategy_userId_idx" ON "TradingStrategy"("userId");
CREATE INDEX "ChatbotQuery_userId_idx" ON "ChatbotQuery"("userId");
CREATE INDEX "StockRecommendation_userId_idx" ON "StockRecommendation"("userId");
CREATE INDEX "AiInsight_symbol_idx" ON "AiInsight"(symbol);
CREATE INDEX "Portfolio_symbol_idx" ON "Portfolio"(symbol);
CREATE INDEX "Watchlist_symbol_idx" ON "Watchlist"(symbol);
CREATE INDEX "ChatbotConversation_userId_idx" ON "ChatbotConversation"("userId");
CREATE INDEX "ChatbotMessage_conversationId_idx" ON "ChatbotMessage"("conversationId");
CREATE INDEX "ChatbotKnowledge_category_idx" ON "ChatbotKnowledge"(category);
CREATE INDEX "ChatbotTool_name_idx" ON "ChatbotTool"(name);