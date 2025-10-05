// F:\finsight-ai\src\lib\ai-service.ts
import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface AiInsight {
  symbol: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  prediction: string;
  keyPoints: string[];
}

export interface TradingStrategy {
  name: string;
  description: string;
  parameters: Record<string, any>;
  performance?: Record<string, any>;
}

export interface PatternRecognitionResult {
  patternType: string;
  confidence: number;
  description: string;
  implications: string;
}

export interface PricePredictionResult {
  prediction: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

export interface SocialMediaSentimentResult {
  overallSentiment: number;
  platformSentiments: Record<string, number>;
  keyTopics: string[];
  mentions: number;
}

export interface FraudAlertResult {
  alertType: string;
  confidence: number;
  description: string;
  indicators: string[];
}

export interface StockRecommendationResult {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  priceTarget?: number;
  timeHorizon: string;
}

type CompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function toNumber(value: unknown): number | undefined {
  if (isNumber(value)) return value as number;
  if (isString(value)) {
    const parsed = Number(value as string);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isSentiment(value: unknown): value is 'positive' | 'negative' | 'neutral' {
  return value === 'positive' || value === 'negative' || value === 'neutral';
}

export class AiService {
  /**
   * Summarize an array of news-like objects into an AiInsight.
   */
  static async summarizeNews(
    newsArticles: Array<Record<string, unknown>>,
    symbol: string
  ): Promise<AiInsight> {
    try {
      const newsText = newsArticles
        .slice(0, 5)
        .map((article) => {
          const headline = isString((article as Record<string, unknown>).headline)
            ? (article as Record<string, unknown>).headline as string
            : isString((article as Record<string, unknown>).title)
            ? (article as Record<string, unknown>).title as string
            : 'Untitled';

          const summary = isString((article as Record<string, unknown>).summary)
            ? (article as Record<string, unknown>).summary as string
            : isString((article as Record<string, unknown>).description)
            ? (article as Record<string, unknown>).description as string
            : '';

          return `${headline}: ${summary}`;
        })
        .join('\n\n');

      const prompt = `Analyze the following financial news about ${symbol} and provide insights:\n\n${newsText}\n\nPlease provide a JSON response with:\n1. A concise summary (max 200 words)\n2. Overall sentiment (positive, negative, or neutral)\n3. Confidence score (0-1)\n4. A brief prediction about the stock's direction\n5. 3-5 key points that investors should know\n\nFormat your response as valid JSON:\n{\n  "summary": "...",\n  "sentiment": "positive|negative|neutral",\n  "confidence": 0.8,\n  "prediction": "...",\n  "keyPoints": ["point1", "point2", "point3"]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial analyst AI that provides concise, accurate market insights. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const summary = isString(parsed.summary) ? parsed.summary : `Analysis incomplete for ${symbol}`;
      const sentiment = isSentiment(parsed.sentiment) ? parsed.sentiment : 'neutral';
      const confidence = isNumber(parsed.confidence) ? parsed.confidence : (typeof parsed.confidence === 'string' ? Number(parsed.confidence) || 0.5 : 0.5);
      const prediction = isString(parsed.prediction) ? parsed.prediction : 'No prediction provided.';
      const keyPoints = isStringArray(parsed.keyPoints) ? parsed.keyPoints : (isString(parsed.keyPoints) ? [parsed.keyPoints] : ['No key points provided.']);

      return {
        symbol,
        summary,
        sentiment,
        confidence,
        prediction,
        keyPoints,
      };
    } catch (error) {
      console.error('AI summarization error:', error);
      return {
        symbol,
        summary: `Analysis unavailable for ${symbol}. Please try again later.`,
        sentiment: 'neutral',
        confidence: 0.5,
        prediction: 'Market direction uncertain due to analysis limitations.',
        keyPoints: ['Analysis temporarily unavailable'],
      };
    }
  }

  /**
   * Generate a short market prediction.
   */
  static async generateMarketPrediction(
    stockData: Record<string, unknown>,
    symbol: string
  ): Promise<string> {
    try {
      const price = toNumber(stockData.price) ?? toNumber(stockData.currentPrice) ?? 0;
      const changePercent = toNumber(stockData.changePercent) ?? toNumber(stockData.change) ?? 0;
      const volume = toNumber(stockData.volume) ?? undefined;
      const high = toNumber(stockData.high) ?? undefined;
      const low = toNumber(stockData.low) ?? undefined;

      const prompt = `Based on the following stock data for ${symbol}, provide a brief market prediction:\n\nCurrent Price: $${price}\nChange: ${changePercent}%\nVolume: ${typeof volume === 'number' ? volume : 'N/A'}\n52-Week High: $${typeof high === 'number' ? high : 'N/A'}\n52-Week Low: $${typeof low === 'number' ? low : 'N/A'}\n\nProvide a 1-2 sentence prediction about the stock's short-term direction (next 1-2 weeks). Keep it professional and mention that this is not financial advice.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              "You are a financial analyst providing brief, professional market predictions. Always include a disclaimer about not being financial advice.",
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.4,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        return `Technical analysis suggests ${symbol} may continue current trend. This is not financial advice.`;
      }

      return raw;
    } catch (error) {
      console.error('Prediction generation error:', error);
      return `Market prediction unavailable for ${symbol}. This is not financial advice.`;
    }
  }

  /**
   * Analyze technical indicators
   */
  static async analyzeTechnicalIndicators(
    chartData: Array<Record<string, unknown>>,
    symbol: string
  ): Promise<{
    summary: string;
    sentiment: string;
    confidence: number;
    keyPoints: string[];
    prediction: string;
    indicators: Record<string, any>;
  }> {
    try {
      // Convert chart data to a format that can be analyzed
      const dataPoints = chartData.map(point => {
        const date = isString(point.date) ? point.date : '';
        const open = toNumber(point.open) ?? 0;
        const high = toNumber(point.high) ?? 0;
        const low = toNumber(point.low) ?? 0;
        const close = toNumber(point.close) ?? 0;
        const volume = toNumber(point.volume) ?? 0;
        
        return { date, open, high, low, close, volume };
      });

      // Calculate basic technical indicators
      const closes = dataPoints.map(d => d.close);
      const latestPrice = closes[closes.length - 1];
      const previousPrice = closes[closes.length - 2];
      const priceChange = latestPrice - previousPrice;
      const priceChangePercent = (priceChange / previousPrice) * 100;
      
      // Simple moving averages
      const sma20 = closes.slice(-20).reduce((sum, price) => sum + price, 0) / Math.min(20, closes.length);
      const sma50 = closes.slice(-50).reduce((sum, price) => sum + price, 0) / Math.min(50, closes.length);
      
      // Determine trend based on moving averages
      let trend = 'neutral';
      if (latestPrice > sma20 && sma20 > sma50) {
        trend = 'bullish';
      } else if (latestPrice < sma20 && sma20 < sma50) {
        trend = 'bearish';
      }
      
      // Calculate RSI (simplified)
      let rsi = 50;
      if (closes.length > 14) {
        let gains = 0;
        let losses = 0;
        
        for (let i = closes.length - 14; i < closes.length; i++) {
          const change = closes[i] - closes[i - 1];
          if (change > 0) {
            gains += change;
          } else {
            losses -= change;
          }
        }
        
        const avgGain = gains / 14;
        const avgLoss = losses / 14;
        const rs = avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));
      }
      
      const indicators = {
        latestPrice,
        priceChange,
        priceChangePercent,
        sma20,
        sma50,
        rsi,
        trend
      };

      const prompt = `Analyze the following technical indicators for ${symbol}:\n\nCurrent Price: $${latestPrice}\nPrice Change: ${priceChangePercent.toFixed(2)}%\n20-day SMA: $${sma20.toFixed(2)}\n50-day SMA: $${sma50.toFixed(2)}\nRSI: ${rsi.toFixed(2)}\nTrend: ${trend}\n\nProvide a JSON response with:\n1. A concise summary of the technical analysis\n2. Overall sentiment (positive, negative, or neutral)\n3. Confidence score (0-1)\n4. 3-5 key technical observations\n5. A brief prediction based on technical indicators\n\nFormat your response as valid JSON:\n{\n  "summary": "...",\n  "sentiment": "positive|negative|neutral",\n  "confidence": 0.8,\n  "keyPoints": ["point1", "point2", "point3"],\n  "prediction": "..."\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a technical analyst AI that provides concise analysis of stock indicators. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const summary = isString(parsed.summary) ? parsed.summary : `Technical analysis incomplete for ${symbol}`;
      const sentiment = isSentiment(parsed.sentiment) ? parsed.sentiment : 'neutral';
      const confidence = isNumber(parsed.confidence) ? parsed.confidence : 0.5;
      const keyPoints = isStringArray(parsed.keyPoints) ? parsed.keyPoints : ['Unable to analyze technical indicators at this time'];
      const prediction = isString(parsed.prediction) ? parsed.prediction : 'Technical indicators are inconclusive at this time.';

      return {
        summary,
        sentiment,
        confidence,
        keyPoints,
        prediction,
        indicators
      };
    } catch (error) {
      console.error('Technical analysis error:', error);
      return {
        summary: `Technical analysis for ${symbol} is currently unavailable. Please try again later.`,
        sentiment: 'neutral',
        confidence: 0.3,
        keyPoints: ['Unable to analyze technical indicators at this time'],
        prediction: 'Technical indicators are inconclusive at this time.',
        indicators: {}
      };
    }
  }

  /**
   * Analyze fundamentals
   */
  static async analyzeFundamentals(
    stockData: Record<string, unknown>,
    symbol: string
  ): Promise<{
    summary: string;
    sentiment: string;
    confidence: number;
    keyPoints: string[];
    prediction: string;
    riskFactors: string[];
    opportunities: string[];
  }> {
    try {
      const price = toNumber(stockData.price) ?? toNumber(stockData.currentPrice) ?? 0;
      const change = toNumber(stockData.change) ?? 0;
      const changePercent = toNumber(stockData.changePercent) ?? 0;
      const volume = toNumber(stockData.volume) ?? 0;
      const companyName = isString(stockData.companyName) ? stockData.companyName : symbol;

      const prompt = `Analyze the fundamental aspects of ${companyName} (${symbol}) based on the following data:\n\nCurrent Price: $${price}\nChange: ${change > 0 ? '+' : ''}${change.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)\nVolume: ${volume.toLocaleString()}\n\nProvide a JSON response with:\n1. A concise summary of the fundamental analysis\n2. Overall sentiment (positive, negative, or neutral)\n3. Confidence score (0-1)\n4. 3-5 key fundamental observations\n5. A brief prediction based on fundamentals\n6. 2-3 potential risk factors\n7. 2-3 potential opportunities\n\nFormat your response as valid JSON:\n{\n  "summary": "...",\n  "sentiment": "positive|negative|neutral",\n  "confidence": 0.8,\n  "keyPoints": ["point1", "point2", "point3"],\n  "prediction": "...",\n  "riskFactors": ["risk1", "risk2"],\n  "opportunities": ["opp1", "opp2"]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a fundamental analyst AI that provides concise analysis of stock fundamentals. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const summary = isString(parsed.summary) ? parsed.summary : `Fundamental analysis incomplete for ${symbol}`;
      const sentiment = isSentiment(parsed.sentiment) ? parsed.sentiment : 'neutral';
      const confidence = isNumber(parsed.confidence) ? parsed.confidence : 0.5;
      const keyPoints = isStringArray(parsed.keyPoints) ? parsed.keyPoints : ['Unable to analyze fundamentals at this time'];
      const prediction = isString(parsed.prediction) ? parsed.prediction : 'Fundamental analysis is inconclusive at this time.';
      const riskFactors = isStringArray(parsed.riskFactors) ? parsed.riskFactors : ['Market volatility', 'Economic uncertainty'];
      const opportunities = isStringArray(parsed.opportunities) ? parsed.opportunities : ['Potential growth', 'Market expansion'];

      return {
        summary,
        sentiment,
        confidence,
        keyPoints,
        prediction,
        riskFactors,
        opportunities
      };
    } catch (error) {
      console.error('Fundamental analysis error:', error);
      return {
        summary: `Fundamental analysis for ${symbol} is currently unavailable. Please try again later.`,
        sentiment: 'neutral',
        confidence: 0.3,
        keyPoints: ['Unable to analyze fundamentals at this time'],
        prediction: 'Fundamental analysis is inconclusive at this time.',
        riskFactors: ['Market volatility', 'Economic uncertainty'],
        opportunities: ['Potential growth', 'Market expansion']
      };
    }
  }

  /**
   * Analyze sentiment
   */
  static async analyzeSentiment(
    newsArticles: Array<Record<string, unknown>>,
    socialMediaData: Record<string, unknown> | null,
    symbol: string
  ): Promise<{
    summary: string;
    sentiment: string;
    confidence: number;
    keyPoints: string[];
    prediction: string;
  }> {
    try {
      const newsText = newsArticles
        .slice(0, 5)
        .map((article) => {
          const headline = isString((article as Record<string, unknown>).headline)
            ? (article as Record<string, unknown>).headline as string
            : isString((article as Record<string, unknown>).title)
            ? (article as Record<string, unknown>).title as string
            : 'Untitled';

          const summary = isString((article as Record<string, unknown>).summary)
            ? (article as Record<string, unknown>).summary as string
            : isString((article as Record<string, unknown>).description)
            ? (article as Record<string, unknown>).description as string
            : '';

          return `${headline}: ${summary}`;
        })
        .join('\n\n');

      let socialMediaText = '';
      if (socialMediaData) {
        const overallSentiment = isNumber(socialMediaData.overallSentiment) ? socialMediaData.overallSentiment : 0;
        const mentions = isNumber(socialMediaData.mentions) ? socialMediaData.mentions : 0;
        const keyTopics = Array.isArray(socialMediaData.keyTopics) ? socialMediaData.keyTopics.join(', ') : '';
        
        socialMediaText = `Social Media Sentiment: ${overallSentiment > 0.1 ? 'Positive' : overallSentiment < -0.1 ? 'Negative' : 'Neutral'} (${overallSentiment.toFixed(2)})\nMentions: ${mentions}\nKey Topics: ${keyTopics}`;
      }

      const prompt = `Analyze the sentiment for ${symbol} based on the following news and social media data:\n\nNews:\n${newsText}\n\n${socialMediaText ? `Social Media:\n${socialMediaText}` : ''}\n\nProvide a JSON response with:\n1. A concise summary of the sentiment analysis\n2. Overall sentiment (positive, negative, or neutral)\n3. Confidence score (0-1)\n4. 3-5 key sentiment observations\n5. A brief prediction based on sentiment\n\nFormat your response as valid JSON:\n{\n  "summary": "...",\n  "sentiment": "positive|negative|neutral",\n  "confidence": 0.8,\n  "keyPoints": ["point1", "point2", "point3"],\n  "prediction": "..."\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a sentiment analyst AI that provides concise analysis of market sentiment. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const summary = isString(parsed.summary) ? parsed.summary : `Sentiment analysis incomplete for ${symbol}`;
      const sentiment = isSentiment(parsed.sentiment) ? parsed.sentiment : 'neutral';
      const confidence = isNumber(parsed.confidence) ? parsed.confidence : 0.5;
      const keyPoints = isStringArray(parsed.keyPoints) ? parsed.keyPoints : ['Unable to analyze sentiment at this time'];
      const prediction = isString(parsed.prediction) ? parsed.prediction : 'Sentiment analysis is inconclusive at this time.';

      return {
        summary,
        sentiment,
        confidence,
        keyPoints,
        prediction
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        summary: `Sentiment analysis for ${symbol} is currently unavailable. Please try again later.`,
        sentiment: 'neutral',
        confidence: 0.3,
        keyPoints: ['Unable to analyze sentiment at this time'],
        prediction: 'Sentiment analysis is inconclusive at this time.'
      };
    }
  }

  /**
   * Generate comprehensive analysis
   */
  static async generateComprehensiveAnalysis(
    stockData: Record<string, unknown> | null,
    chartData: Array<Record<string, unknown>>,
    newsArticles: Array<Record<string, unknown>>,
    socialMediaData: Record<string, unknown> | null,
    symbol: string,
    timeframe: string
  ): Promise<{
    summary: string;
    sentiment: string;
    confidence: number;
    keyPoints: string[];
    prediction: string;
    riskFactors: string[];
    opportunities: string[];
    technicalIndicators: Record<string, any>;
  }> {
    try {
      // Get individual analyses
      const technicalAnalysis = stockData ? await this.analyzeTechnicalIndicators(chartData, symbol) : null;
      const fundamentalAnalysis = stockData ? await this.analyzeFundamentals(stockData, symbol) : null;
      const sentimentAnalysis = await this.analyzeSentiment(newsArticles, socialMediaData, symbol);

      // Combine analyses
      const technicalSentiment = technicalAnalysis?.sentiment || 'neutral';
      const fundamentalSentiment = fundamentalAnalysis?.sentiment || 'neutral';
      const sentimentSentiment = sentimentAnalysis.sentiment;

      // Determine overall sentiment
      let overallSentiment = 'neutral';
      const sentimentCounts = {
        positive: 0,
        negative: 0,
        neutral: 0
      };

      sentimentCounts[technicalSentiment as keyof typeof sentimentCounts]++;
      sentimentCounts[fundamentalSentiment as keyof typeof sentimentCounts]++;
      sentimentCounts[sentimentSentiment as keyof typeof sentimentCounts]++;

      if (sentimentCounts.positive > sentimentCounts.negative && sentimentCounts.positive > sentimentCounts.neutral) {
        overallSentiment = 'positive';
      } else if (sentimentCounts.negative > sentimentCounts.positive && sentimentCounts.negative > sentimentCounts.neutral) {
        overallSentiment = 'negative';
      }

      // Combine key points
      const allKeyPoints = [
        ...(technicalAnalysis?.keyPoints || []),
        ...(fundamentalAnalysis?.keyPoints || []),
        ...(sentimentAnalysis.keyPoints || [])
      ];

      // Combine risk factors and opportunities
      const riskFactors = fundamentalAnalysis?.riskFactors || [];
      const opportunities = fundamentalAnalysis?.opportunities || [];

      const prompt = `Based on the following analyses for ${symbol}, provide a comprehensive summary:\n\nTechnical Analysis Sentiment: ${technicalSentiment}\nFundamental Analysis Sentiment: ${fundamentalSentiment}\nSentiment Analysis: ${sentimentSentiment}\nOverall Sentiment: ${overallSentiment}\n\nKey Points:\n${allKeyPoints.slice(0, 5).join('\n')}\n\nProvide a JSON response with:\n1. A comprehensive summary of all analyses\n2. Overall sentiment (positive, negative, or neutral)\n3. Confidence score (0-1)\n4. 3-5 key observations from all analyses\n5. A brief prediction based on all factors\n\nFormat your response as valid JSON:\n{\n  "summary": "...",\n  "sentiment": "positive|negative|neutral",\n  "confidence": 0.8,\n  "keyPoints": ["point1", "point2", "point3"],\n  "prediction": "..."\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial analyst AI that provides comprehensive analysis of stocks. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const summary = isString(parsed.summary) ? parsed.summary : `Comprehensive analysis incomplete for ${symbol}`;
      const sentiment = isSentiment(parsed.sentiment) ? parsed.sentiment : overallSentiment;
      const confidence = isNumber(parsed.confidence) ? parsed.confidence : 0.5;
      const keyPoints = isStringArray(parsed.keyPoints) ? parsed.keyPoints : allKeyPoints.slice(0, 5);
      const prediction = isString(parsed.prediction) ? parsed.prediction : 'Comprehensive analysis is inconclusive at this time.';

      return {
        summary,
        sentiment,
        confidence,
        keyPoints,
        prediction,
        riskFactors,
        opportunities,
        technicalIndicators: technicalAnalysis?.indicators || {}
      };
    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      return {
        summary: `Comprehensive analysis for ${symbol} is currently unavailable. Please try again later.`,
        sentiment: 'neutral',
        confidence: 0.3,
        keyPoints: ['Unable to perform comprehensive analysis at this time'],
        prediction: 'Comprehensive analysis is inconclusive at this time.',
        riskFactors: ['Market volatility', 'Economic uncertainty'],
        opportunities: ['Potential growth', 'Market expansion'],
        technicalIndicators: {}
      };
    }
  }

  /**
   * Generate personalized stock recommendations based on user preferences and portfolio
   */
  static async generateStockRecommendations(
    userId: string,
    portfolio: Array<Record<string, unknown>>,
    userPreferences: Record<string, unknown>
  ): Promise<StockRecommendationResult[]> {
    try {
      // Get user's portfolio and preferences
      const portfolioText = portfolio.map((item: Record<string, unknown>) => {
        const symbol = isString(item.symbol) ? item.symbol : 'Unknown';
        const quantity = toNumber(item.quantity) ?? 0;
        const buyPrice = toNumber(item.buyPrice) ?? 0;
        const currentPrice = toNumber(item.currentPrice) ?? 0;
        const profit = toNumber(item.profit) ?? 0;
        const profitPercent = toNumber(item.profitPercent) ?? 0;
        
        return `${symbol}: Qty: ${quantity}, Buy: $${buyPrice}, Current: $${currentPrice}, Profit: $${profit} (${profitPercent}%)`;
      }).join('\n');

      const riskTolerance = isString(userPreferences.riskTolerance) ? userPreferences.riskTolerance : 'moderate';
      const investmentGoals = isString(userPreferences.investmentGoals) ? userPreferences.investmentGoals : 'growth';

      const prompt = `Based on the following user portfolio and preferences, generate 3-5 personalized stock recommendations:\n\nPortfolio:\n${portfolioText}\n\nRisk Tolerance: ${riskTolerance}\nInvestment Goals: ${investmentGoals}\n\nPlease provide a JSON response with an array of recommendations, each containing:\n1. Symbol (stock ticker)\n2. Action (buy, sell, hold)\n3. Confidence score (0-1)\n4. Reason for recommendation\n5. Price target (if applicable)\n6. Time horizon (short-term, medium-term, long-term)\n\nFormat your response as valid JSON:\n{\n  "recommendations": [\n    {\n      "symbol": "AAPL",\n      "action": "buy",\n      "confidence": 0.8,\n      "reason": "Strong fundamentals aligned with your growth goals",\n      "priceTarget": 180.0,\n      "timeHorizon": "medium-term"\n    }\n  ]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial advisor AI that provides personalized stock recommendations. Always respond with valid JSON and include a disclaimer that this is not financial advice.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

      // Save recommendations to database
      const savedRecommendations: StockRecommendationResult[] = [];
      
      for (const rec of recommendations) {
        if (typeof rec === 'object' && rec !== null) {
          const recObj = rec as Record<string, unknown>;
          const symbol = isString(recObj.symbol) ? recObj.symbol : 'UNKNOWN';
          const action = isString(recObj.action) && (recObj.action === 'buy' || recObj.action === 'sell' || recObj.action === 'hold') 
            ? recObj.action as 'buy' | 'sell' | 'hold' 
            : 'hold';
          const confidence = isNumber(recObj.confidence) ? recObj.confidence : 0.5;
          const reason = isString(recObj.reason) ? recObj.reason : 'No specific reason provided';
          const priceTarget = toNumber(recObj.priceTarget);
          const timeHorizon = isString(recObj.timeHorizon) ? recObj.timeHorizon : 'medium-term';

          // Save to database
          await prisma.stockRecommendation.create({
            data: {
              userId,
              symbol,
              action,
              confidence,
              reason,
              priceTarget,
            }
          });

          savedRecommendations.push({
            symbol,
            action,
            confidence,
            reason,
            priceTarget: priceTarget || undefined,
            timeHorizon
          });
        }
      }

      return savedRecommendations;
    } catch (error) {
      console.error('Stock recommendation generation error:', error);
      return [{
        symbol: 'N/A',
        action: 'hold',
        confidence: 0.5,
        reason: 'Unable to generate recommendations at this time. Please try again later.',
        timeHorizon: 'medium-term'
      }];
    }
  }

  /**
   * Analyze social media sentiment for a stock
   */
  static async analyzeSocialMediaSentiment(
    symbol: string
  ): Promise<SocialMediaSentimentResult> {
    try {
      // In a real implementation, this would fetch data from Twitter API, Reddit API, etc.
      // For now, we'll simulate this with AI
      
      const prompt = `Analyze the current social media sentiment for ${symbol} across platforms like Twitter, Reddit, and StockTwits. Provide:\n1. Overall sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)\n2. Platform-specific sentiment scores\n3. Key topics being discussed\n4. Approximate number of mentions\n\nFormat your response as valid JSON:\n{\n  "overallSentiment": 0.3,\n  "platformSentiments": {\n    "twitter": 0.2,\n    "reddit": 0.5,\n    "stocktwits": 0.1\n  },\n  "keyTopics": ["earnings", "new product", "competition"],\n  "mentions": 1250\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a social media analyst AI that provides sentiment analysis for stocks. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      
      const overallSentiment = isNumber(parsed.overallSentiment) ? parsed.overallSentiment : 0;
      const platformSentiments = typeof parsed.platformSentiments === 'object' && parsed.platformSentiments !== null 
        ? parsed.platformSentiments as Record<string, number>
        : {};
      const keyTopics = isStringArray(parsed.keyTopics) ? parsed.keyTopics : [];
      const mentions = isNumber(parsed.mentions) ? parsed.mentions : 0;

      // Save to database
      for (const [platform, sentiment] of Object.entries(platformSentiments)) {
        await prisma.socialMediaSentiment.create({
          data: {
            symbol,
            platform,
            sentiment,
            mentions,
          }
        });
      }

      return {
        overallSentiment,
        platformSentiments,
        keyTopics,
        mentions
      };
    } catch (error) {
      console.error('Social media sentiment analysis error:', error);
      return {
        overallSentiment: 0,
        platformSentiments: {},
        keyTopics: [],
        mentions: 0
      };
    }
  }

  /**
   * Recognize patterns in stock price charts
   */
  static async recognizePatterns(
    chartData: Array<Record<string, unknown>>,
    symbol: string
  ): Promise<PatternRecognitionResult[]> {
    try {
      // Convert chart data to a format that can be analyzed
      const dataPoints = chartData.map(point => {
        const date = isString(point.date) ? point.date : '';
        const open = toNumber(point.open) ?? 0;
        const high = toNumber(point.high) ?? 0;
        const low = toNumber(point.low) ?? 0;
        const close = toNumber(point.close) ?? 0;
        const volume = toNumber(point.volume) ?? 0;
        
        return { date, open, high, low, close, volume };
      });

      // In a real implementation, this would use technical analysis libraries
      // For now, we'll simulate with AI
      
      const prompt = `Analyze the following stock price data for ${symbol} to identify technical patterns:\n\n${JSON.stringify(dataPoints.slice(-30))}\n\nIdentify any of the following patterns if present: head_and_shoulders, double_top, double_bottom, triangle, wedge, flag, cup_and_handle\n\nFor each pattern found, provide:\n1. Pattern type\n2. Confidence level (0-1)\n3. Brief description\n4. Implications for future price movement\n\nFormat your response as valid JSON:\n{\n  "patterns": [\n    {\n      "patternType": "head_and_shoulders",\n      "confidence": 0.7,\n      "description": "A classic head and shoulders pattern is forming...",\n      "implications": "This pattern typically signals a reversal from bullish to bearish..."\n    }\n  ]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a technical analysis AI that identifies chart patterns. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.2,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const patterns = Array.isArray(parsed.patterns) ? parsed.patterns : [];

      const results: PatternRecognitionResult[] = [];
      
      for (const pattern of patterns) {
        if (typeof pattern === 'object' && pattern !== null) {
          const patternObj = pattern as Record<string, unknown>;
          const patternType = isString(patternObj.patternType) ? patternObj.patternType : 'unknown';
          const confidence = isNumber(patternObj.confidence) ? patternObj.confidence : 0.5;
          const description = isString(patternObj.description) ? patternObj.description : 'No description available';
          const implications = isString(patternObj.implications) ? patternObj.implications : 'No implications available';

          // Save to database
          await prisma.patternRecognition.create({
            data: {
              symbol,
              patternType,
              confidence,
              timeframe: 'daily'
            }
          });

          results.push({
            patternType,
            confidence,
            description,
            implications
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Pattern recognition error:', error);
      return [{
        patternType: 'unknown',
        confidence: 0,
        description: 'Unable to identify patterns at this time',
        implications: 'No specific implications'
      }];
    }
  }

  /**
   * Predict stock prices using ML models
   */
  static async predictStockPrice(
    historicalData: Array<Record<string, unknown>>,
    symbol: string,
    timeframe: string = '1w'
  ): Promise<PricePredictionResult> {
    try {
      // Convert historical data to a format that can be analyzed
      const dataPoints = historicalData.map(point => {
        const date = isString(point.date) ? point.date : '';
        const open = toNumber(point.open) ?? 0;
        const high = toNumber(point.high) ?? 0;
        const low = toNumber(point.low) ?? 0;
        const close = toNumber(point.close) ?? 0;
        const volume = toNumber(point.volume) ?? 0;
        
        return { date, open, high, low, close, volume };
      });

      // Get the latest price for context
      const latestPrice = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].close : 0;
      
      if (latestPrice === 0) {
        throw new Error('No valid price data available');
      }

      // Calculate basic statistics for context
      const prices = dataPoints.map(d => d.close);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const volatility = this.calculateVolatility(prices);

      const prompt = `Based on the following historical stock data for ${symbol}, predict the price movement for the next ${timeframe}:\n\nCurrent Price: $${latestPrice.toFixed(2)}\nAverage Price: $${avgPrice.toFixed(2)}\nPrice Range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}\nVolatility: ${volatility.toFixed(2)}\nRecent Price Data: ${JSON.stringify(dataPoints.slice(-10))}\n\nProvide a JSON response with:\n1. Predicted price (a realistic number close to the current price)\n2. Confidence level (0-1)\n3. Key factors influencing the prediction\n\nFormat your response as valid JSON:\n{\n  "prediction": 150.25,\n  "confidence": 0.75,\n  "factors": ["strong earnings", "positive sentiment", "technical indicators"]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a quantitative analyst AI that predicts stock prices. Always respond with valid JSON and include a disclaimer that this is not financial advice. Ensure your prediction is realistic and close to the current price.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.2,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      // Try to extract JSON from the response
      let parsed: Record<string, unknown> = {};
      
      try {
        // First try to parse the entire response as JSON
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch (error) {
        // If that fails, try to extract JSON from the response
        console.error('Failed to parse JSON directly, attempting to extract JSON from response');
        
        // Look for JSON in the response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          } catch (extractError) {
            console.error('Failed to extract JSON from response:', extractError);
            throw new Error('Invalid JSON response from AI');
          }
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      const prediction = isNumber(parsed.prediction) ? parsed.prediction : latestPrice;
      const confidence = isNumber(parsed.confidence) ? parsed.confidence : 0.5;
      const factors = isStringArray(parsed.factors) ? parsed.factors : 
                     isString(parsed.factors) ? [parsed.factors] : 
                     ['Based on historical price trends and market conditions'];

      // Calculate target date based on timeframe
      let targetDate = new Date();
      if (timeframe === '1d') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (timeframe === '1w') {
        targetDate.setDate(targetDate.getDate() + 7);
      } else if (timeframe === '1m') {
        targetDate.setMonth(targetDate.getMonth() + 1);
      } else if (timeframe === '3m') {
        targetDate.setMonth(targetDate.getMonth() + 3);
      }

      // Save to database
      try {
        await prisma.pricePrediction.create({
          data: {
            symbol,
            modelType: 'gpt-3.5-turbo',
            prediction,
            confidence,
            targetDate
          }
        });
      } catch (dbError) {
        console.error('Failed to save prediction to database:', dbError);
        // Continue even if database save fails
      }

      return {
        prediction,
        confidence,
        timeframe,
        factors
      };
    } catch (error) {
      console.error('Stock price prediction error:', error);
      
      // Return a fallback prediction based on recent price data
      try {
        const prices = historicalData.map(point => toNumber(point.close) ?? 0).filter(p => p > 0);
        
        if (prices.length > 0) {
          const latestPrice = prices[prices.length - 1];
          const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          
          // Simple prediction based on recent trend
          let prediction = latestPrice;
          let confidence = 0.3;
          let factors = ['Limited data available'];
          
          if (prices.length >= 5) {
            const recentPrices = prices.slice(-5);
            const avgRecentPrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
            
            if (avgRecentPrice > latestPrice) {
              prediction = latestPrice * 1.02; // 2% increase
              factors.push('Recent upward trend');
            } else if (avgRecentPrice < latestPrice) {
              prediction = latestPrice * 0.98; // 2% decrease
              factors.push('Recent downward trend');
            } else {
              factors.push('Recent price stability');
            }
            
            confidence = 0.4;
          }
          
          return {
            prediction,
            confidence,
            timeframe,
            factors
          };
        }
      } catch (fallbackError) {
        console.error('Fallback prediction also failed:', fallbackError);
      }
      
      // Ultimate fallback
      return {
        prediction: 0,
        confidence: 0,
        timeframe,
        factors: ['Unable to generate prediction at this time']
      };
    }
  }

  /**
   * Add this helper method to calculate volatility
   */
  static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const squaredDifferences = prices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / prices.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Detect potential fraud in trading patterns
   */
  static async detectFraud(
    tradingData: Array<Record<string, unknown>>,
    symbol: string
  ): Promise<FraudAlertResult[]> {
    try {
      // Convert trading data to a format that can be analyzed
      const dataPoints = tradingData.map(point => {
        const date = isString(point.date) ? point.date : '';
        const volume = toNumber(point.volume) ?? 0;
        const price = toNumber(point.price) ?? 0;
        const trades = toNumber(point.trades) ?? 0;
        
        return { date, volume, price, trades };
      });

      // In a real implementation, this would use anomaly detection algorithms
      // For now, we'll simulate with AI
      
      const prompt = `Analyze the following trading data for ${symbol} to detect potential fraudulent activities:\n\n${JSON.stringify(dataPoints.slice(-30))}\n\nLook for patterns indicating:\n1. Pump and dump schemes\n2. Wash trading\n3. Insider trading\n4. Market manipulation\n\nFor each potential fraud detected, provide:\n1. Alert type\n2. Confidence level (0-1)\n3. Description of the suspicious activity\n4. Specific indicators that raised the alert\n\nFormat your response as valid JSON:\n{\n  "alerts": [\n    {\n      "alertType": "pump_and_dump",\n      "confidence": 0.7,\n      "description": "Unusual volume spike followed by rapid price increase...",\n      "indicators": ["volume 5x average", "price increase 20% in one day", "high social media mentions"]\n    }\n  ]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a market surveillance AI that detects potential fraudulent trading activities. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.2,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const alerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];

      const results: FraudAlertResult[] = [];
      
      for (const alert of alerts) {
        if (typeof alert === 'object' && alert !== null) {
          const alertObj = alert as Record<string, unknown>;
          const alertType = isString(alertObj.alertType) ? alertObj.alertType : 'unknown';
          const confidence = isNumber(alertObj.confidence) ? alertObj.confidence : 0.5;
          const description = isString(alertObj.description) ? alertObj.description : 'No description available';
          const indicators = isStringArray(alertObj.indicators) ? alertObj.indicators : [];

          // Save to database
          await prisma.fraudAlert.create({
            data: {
              symbol,
              alertType,
              confidence,
              description
            }
          });

          results.push({
            alertType,
            confidence,
            description,
            indicators
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Fraud detection error:', error);
      return [{
        alertType: 'none',
        confidence: 0,
        description: 'No fraudulent activity detected',
        indicators: []
      }];
    }
  }

  /**
   * Generate automated trading strategies
   */
  static async generateTradingStrategies(
    userId: string,
    riskTolerance: string,
    investmentGoals: string,
    initialCapital: number
  ): Promise<TradingStrategy[]> {
    try {
      const prompt = `Generate 3-5 automated trading strategies for a user with the following profile:\n\nRisk Tolerance: ${riskTolerance}\nInvestment Goals: ${investmentGoals}\nInitial Capital: $${initialCapital}\n\nFor each strategy, provide:\n1. Strategy name\n2. Brief description\n3. Key parameters (entry/exit rules, position sizing, etc.)\n4. Expected performance metrics (win rate, profit factor, max drawdown)\n\nFormat your response as valid JSON:\n{\n  "strategies": [\n    {\n      "name": "Momentum Breakout",\n      "description": "Captures strong price movements...",\n      "parameters": {\n        "entryRule": "Buy when price breaks above 20-day high",\n        "exitRule": "Sell when price drops below 10-day low",\n        "positionSizing": "2% risk per trade"\n      },\n      "performance": {\n        "winRate": 0.65,\n        "profitFactor": 1.8,\n        "maxDrawdown": 0.15\n      }\n    }\n  ]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a quantitative trading strategist AI that generates automated trading strategies. Always respond with valid JSON and include a disclaimer that past performance is not indicative of future results.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const strategies = Array.isArray(parsed.strategies) ? parsed.strategies : [];

      const results: TradingStrategy[] = [];
      
      for (const strategy of strategies) {
        if (typeof strategy === 'object' && strategy !== null) {
          const strategyObj = strategy as Record<string, unknown>;
          const name = isString(strategyObj.name) ? strategyObj.name : 'Unnamed Strategy';
          const description = isString(strategyObj.description) ? strategyObj.description : 'No description available';
          const parameters = typeof strategyObj.parameters === 'object' && strategyObj.parameters !== null 
            ? strategyObj.parameters as Record<string, any>
            : {};
          const performance = typeof strategyObj.performance === 'object' && strategyObj.performance !== null 
            ? strategyObj.performance as Record<string, any>
            : {};

          // Save to database
          await prisma.tradingStrategy.create({
            data: {
              userId,
              name,
              description,
              parameters,
              performance
            }
          });

          results.push({
            name,
            description,
            parameters,
            performance
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Trading strategy generation error:', error);
      return [{
        name: 'Default Strategy',
        description: 'Unable to generate custom strategies at this time',
        parameters: {}
      }];
    }
  }

  /**
   * Optimize portfolio based on AI analysis
   */
  static async optimizePortfolio(
    userId: string,
    currentPortfolio: Array<Record<string, unknown>>,
    riskTolerance: string,
    investmentGoals: string
  ): Promise<Record<string, any>> {
    try {
      // Convert portfolio to a format that can be analyzed
      const portfolioText = currentPortfolio.map((item: Record<string, unknown>) => {
        const symbol = isString(item.symbol) ? item.symbol : 'Unknown';
        const quantity = toNumber(item.quantity) ?? 0;
        const buyPrice = toNumber(item.buyPrice) ?? 0;
        const currentPrice = toNumber(item.currentPrice) ?? 0;
        const profit = toNumber(item.profit) ?? 0;
        const profitPercent = toNumber(item.profitPercent) ?? 0;
        
        return `${symbol}: Qty: ${quantity}, Buy: $${buyPrice}, Current: $${currentPrice}, Profit: $${profit} (${profitPercent}%)`;
      }).join('\n');

      const prompt = `Optimize the following portfolio based on modern portfolio theory and the user's risk profile:\n\nPortfolio:\n${portfolioText}\n\nRisk Tolerance: ${riskTolerance}\nInvestment Goals: ${investmentGoals}\n\nProvide:\n1. Recommended allocation changes\n2. Suggested additions/removals\n3. Expected improvement in risk-adjusted returns\n4. Rebalancing frequency\n\nFormat your response as valid JSON:\n{\n  "recommendations": [\n    {\n      "symbol": "AAPL",\n      "action": "increase",\n      "currentAllocation": 0.15,\n      "recommendedAllocation": 0.25,\n      "reason": "Strong fundamentals aligned with your growth goals"\n    }\n  ],\n  "suggestedAdditions": ["VOO", "QQQ"],\n  "suggestedRemovals": ["XYZ"],\n  "expectedImprovement": "2.3% increase in annual return with 0.5% reduction in volatility",\n  "rebalancingFrequency": "quarterly"\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a portfolio optimization AI that provides allocation recommendations. Always respond with valid JSON and include a disclaimer that this is not financial advice.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      
      return parsed;
    } catch (error) {
      console.error('Portfolio optimization error:', error);
      return {
        recommendations: [],
        suggestedAdditions: [],
        suggestedRemovals: [],
        expectedImprovement: 'Unable to optimize portfolio at this time',
        rebalancingFrequency: 'monthly'
      };
    }
  }

  /**
   * Generate market trend forecast
   */
  static async generateMarketTrendForecast(
    marketData: Array<Record<string, unknown>>,
    timeframe: string = '1m'
  ): Promise<Record<string, any>> {
    try {
      // Convert market data to a format that can be analyzed
      const dataPoints = marketData.map(point => {
        const date = isString(point.date) ? point.date : '';
        const sp500 = toNumber(point.sp500) ?? 0;
        const nasdaq = toNumber(point.nasdaq) ?? 0;
        const dow = toNumber(point.dow) ?? 0;
        const vix = toNumber(point.vix) ?? 0;
        
        return { date, sp500, nasdaq, dow, vix };
      });

      const prompt = `Based on the following market data, generate a trend forecast for the next ${timeframe}:\n\n${JSON.stringify(dataPoints.slice(-30))}\n\nProvide:\n1. Overall market trend (bullish, bearish, neutral)\n2. Key market indicators to watch\n3. Potential catalysts\n4. Sector performance expectations\n5. Risk factors\n\nFormat your response as valid JSON:\n{\n  "trend": "bullish",\n  "confidence": 0.7,\n  "keyIndicators": ["VIX below 20", "S&P 500 above 50-day MA"],\n  "catalysts": ["Fed rate decision", "earnings season"],\n  "sectorExpectations": {\n    "technology": "outperform",\n    "healthcare": "neutral",\n    "energy": "underperform"\n  },\n  "riskFactors": ["Inflation concerns", "Geopolitical tensions"]\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a market analyst AI that provides trend forecasts. Always respond with valid JSON and include a disclaimer that this is not financial advice.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      
      return parsed;
    } catch (error) {
      console.error('Market trend forecast error:', error);
      return {
        trend: 'neutral',
        confidence: 0.5,
        keyIndicators: [],
        catalysts: [],
        sectorExpectations: {},
        riskFactors: ['Unable to generate forecast at this time']
      };
    }
  }

  /**
   * Process chatbot query
   */
  static async processChatbotQuery(
    userId: string,
    query: string,
    context: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Get user's portfolio and preferences for context
      const portfolio = context.portfolio || [];
      const watchlist = context.watchlist || [];
      const preferences = context.preferences || {};

      const portfolioText = portfolio.map((item: Record<string, unknown>) => {
        const symbol = isString(item.symbol) ? item.symbol : 'Unknown';
        const quantity = toNumber(item.quantity) ?? 0;
        const currentPrice = toNumber(item.currentPrice) ?? 0;
        const profit = toNumber(item.profit) ?? 0;
        const profitPercent = toNumber(item.profitPercent) ?? 0;
        
        return `${symbol}: Qty: ${quantity}, Current: $${currentPrice}, Profit: $${profit} (${profitPercent}%)`;
      }).join('\n');

      const watchlistText = watchlist.map((item: Record<string, unknown>) => {
        const symbol = isString(item.symbol) ? item.symbol : 'Unknown';
        const name = isString(item.name) ? item.name : '';
        return `${symbol} (${name})`;
      }).join('\n');

      const riskTolerance = isString(preferences.riskTolerance) ? preferences.riskTolerance : 'moderate';
      const investmentGoals = isString(preferences.investmentGoals) ? preferences.investmentGoals : 'growth';

      const prompt = `You are a financial assistant chatbot for the FinSight AI platform. Answer the user's question based on their portfolio and preferences.\n\nUser Portfolio:\n${portfolioText}\n\nUser Watchlist:\n${watchlistText}\n\nRisk Tolerance: ${riskTolerance}\nInvestment Goals: ${investmentGoals}\n\nUser Question: ${query}\n\nProvide a helpful, concise response. If you don't know the answer or if the question requires specific financial advice, say so and suggest consulting a financial advisor.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful financial assistant chatbot. Provide accurate information but always include a disclaimer that you are not a financial advisor.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.5,
      });

      const typed = completion as unknown as CompletionResponse;
      const raw = typed.choices?.[0]?.message?.content;

      if (!isString(raw)) {
        throw new Error('No response from AI');
      }

      // Save query and response to database
      await prisma.chatbotQuery.create({
        data: {
          userId,
          query,
          response: raw
        }
      });

      return raw;
    } catch (error) {
      console.error('Chatbot query processing error:', error);
      return 'I apologize, but I\'m unable to process your request at this time. Please try again later or contact support if the issue persists.';
    }
  }
}