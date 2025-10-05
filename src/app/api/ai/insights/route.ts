// F:\finsight-ai\src\app\api\ai\insights\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AiService } from '@/lib/ai-service';
import { CacheManager } from '@/lib/market-utils';

// Types for the enhanced insights API
interface InsightRequest {
  symbols: string[];
  type?: 'technical' | 'fundamental' | 'sentiment' | 'comprehensive';
  timeframe?: '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
  compare?: boolean; // Compare with previous insights
  export?: 'json' | 'csv' | 'pdf';
}

interface InsightResponse {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  category: string;
  type: string;
  timeframe: string;
  keyPoints: string[];
  prediction?: string;
  riskFactors?: string[];
  opportunities?: string[];
  technicalIndicators?: Record<string, any>;
  createdAt: string;
  previousInsight?: {
    id: string;
    createdAt: string;
    sentiment: string;
    confidence: number;
  };
}

// GET handler for retrieving insights
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') as any || 'comprehensive';
    const timeframe = searchParams.get('timeframe') as any || '1m';
    const compare = searchParams.get('compare') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // If symbol is provided, get insights for that specific symbol
    if (symbol) {
      return await getSymbolInsights(session.user.id, symbol.toUpperCase(), type, timeframe, compare);
    }
    
    // Otherwise, get all insights for the user with pagination
    return await getAllUserInsights(session.user.id, limit, offset);
  } catch (error) {
    console.error('AI insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for generating new insights
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body: InsightRequest = await request.json();
    const { symbols, type = 'comprehensive', timeframe = '1m', compare = false } = body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }
    
    // Process each symbol
    const results: InsightResponse[] = [];
    
    for (const symbol of symbols) {
      try {
        const insight = await generateInsight(
          session.user.id, 
          symbol.toUpperCase(), 
          type, 
          timeframe, 
          compare
        );
        results.push(insight);
      } catch (error) {
        console.error(`Error generating insight for ${symbol}:`, error);
        // Continue with other symbols even if one fails
      }
    }
    
    return NextResponse.json({ insights: results });
  } catch (error) {
    console.error('AI insights generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

// PUT handler for updating insights
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { insightId, isRead } = await request.json();
    
    if (!insightId) {
      return NextResponse.json(
        { error: 'Insight ID is required' },
        { status: 400 }
      );
    }
    
    // Update the insight
    const updatedInsight = await prisma.aiInsight.update({
      where: {
        id: insightId,
        userId: session.user.id,
      },
      data: {
        isRead: isRead !== undefined ? isRead : undefined,
      },
    });
    
    return NextResponse.json(updatedInsight);
  } catch (error) {
    console.error('AI insights update error:', error);
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting insights
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get('id');
    const symbol = searchParams.get('symbol');
    
    if (insightId) {
      // Delete specific insight
      await prisma.aiInsight.delete({
        where: {
          id: insightId,
          userId: session.user.id,
        },
      });
      
      return NextResponse.json({ success: true });
    } else if (symbol) {
      // Delete all insights for a symbol
      await prisma.aiInsight.deleteMany({
        where: {
          userId: session.user.id,
          symbol: symbol.toUpperCase(),
        },
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Insight ID or symbol is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('AI insights deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete insight' },
      { status: 500 }
    );
  }
}

// Helper function to get insights for a specific symbol
async function getSymbolInsights(
  userId: string, 
  symbol: string, 
  type: string, 
  timeframe: string, 
  compare: boolean
): Promise<NextResponse> {
  try {
    // Check cache first
    const cacheKey = `insight_${userId}_${symbol}_${type}_${timeframe}`;
    const cachedInsight = CacheManager.get<InsightResponse>(cacheKey);
    
    if (cachedInsight) {
      return NextResponse.json(cachedInsight);
    }
    
    // Check if we have recent insights (less than 4 hours old)
    const existingInsight = await prisma.aiInsight.findFirst({
      where: {
        userId,
        symbol,
        createdAt: {
          gte: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (existingInsight) {
      // Get previous insight for comparison if requested
      let previousInsight = null;
      
      if (compare) {
        previousInsight = await prisma.aiInsight.findFirst({
          where: {
            userId,
            symbol,
            id: { not: existingInsight.id },
            createdAt: {
              lt: existingInsight.createdAt,
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
      
      const response: InsightResponse = {
        id: existingInsight.id,
        symbol: existingInsight.symbol,
        title: existingInsight.title,
        summary: existingInsight.summary,
        sentiment: existingInsight.sentiment as any,
        confidence: existingInsight.confidence,
        category: existingInsight.category,
        type: existingInsight.type || 'comprehensive',
        timeframe: existingInsight.timeframe || '1m',
        keyPoints: Array.isArray(existingInsight.keyPoints) ? existingInsight.keyPoints as string[] : [],
        prediction: existingInsight.prediction || undefined,
        riskFactors: Array.isArray(existingInsight.riskFactors) ? existingInsight.riskFactors as string[] : undefined,
        opportunities: Array.isArray(existingInsight.opportunities) ? existingInsight.opportunities as string[] : undefined,
        technicalIndicators: existingInsight.technicalIndicators as Record<string, any> || undefined,
        createdAt: existingInsight.createdAt.toISOString(),
        previousInsight: previousInsight ? {
          id: previousInsight.id,
          createdAt: previousInsight.createdAt.toISOString(),
          sentiment: previousInsight.sentiment,
          confidence: previousInsight.confidence,
        } : undefined,
      };
      
      // Cache the response
      CacheManager.set(cacheKey, response, 60 * 60 * 1000); // 1 hour
      
      return NextResponse.json(response);
    }
    
    // Generate new insight
    const newInsight = await generateInsight(userId, symbol, type, timeframe, compare);
    
    // Cache the response
    CacheManager.set(cacheKey, newInsight, 60 * 60 * 1000); // 1 hour
    
    return NextResponse.json(newInsight);
  } catch (error) {
    console.error(`Error getting insights for ${symbol}:`, error);
    
    // Create a fallback insight
    const fallbackInsight = await prisma.aiInsight.create({
      data: {
        userId,
        symbol,
        title: `Analysis for ${symbol}`,
        summary: `AI analysis is currently unavailable for ${symbol}. Please try again later.`,
        sentiment: 'neutral',
        confidence: 0.5,
        category: 'analysis',
        type,
        timeframe,
        keyPoints: [],
      },
    });
    
    return NextResponse.json({
      id: fallbackInsight.id,
      symbol: fallbackInsight.symbol,
      title: fallbackInsight.title,
      summary: fallbackInsight.summary,
      sentiment: fallbackInsight.sentiment as any,
      confidence: fallbackInsight.confidence,
      category: fallbackInsight.category,
      type: fallbackInsight.type || 'comprehensive',
      timeframe: fallbackInsight.timeframe || '1m',
      keyPoints: [],
      createdAt: fallbackInsight.createdAt.toISOString(),
    });
  }
}

// Helper function to get all insights for a user with pagination
async function getAllUserInsights(
  userId: string, 
  limit: number, 
  offset: number
): Promise<NextResponse> {
  try {
    const insights = await prisma.aiInsight.findMany({
      where: {
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    const total = await prisma.aiInsight.count({
      where: {
        userId,
      },
    });
    
    const response = {
      insights: insights.map(insight => ({
        id: insight.id,
        symbol: insight.symbol,
        title: insight.title,
        summary: insight.summary,
        sentiment: insight.sentiment,
        confidence: insight.confidence,
        category: insight.category,
        type: insight.type || 'comprehensive',
        timeframe: insight.timeframe || '1m',
        isRead: insight.isRead,
        createdAt: insight.createdAt.toISOString(),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting all insights:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve insights' },
      { status: 500 }
    );
  }
}

// Helper function to generate a new insight
async function generateInsight(
  userId: string, 
  symbol: string, 
  type: string, 
  timeframe: string, 
  compare: boolean
): Promise<InsightResponse> {
  try {
    // Get user preferences for personalized insights
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });
    
    // Get previous insight for comparison if requested
    let previousInsight = null;
    
    if (compare) {
      previousInsight = await prisma.aiInsight.findFirst({
        where: {
          userId,
          symbol,
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    
    // Fetch data based on insight type
    let insightData: any = {};
    
    switch (type) {
      case 'technical':
        insightData = await generateTechnicalInsight(symbol, timeframe);
        break;
      case 'fundamental':
        insightData = await generateFundamentalInsight(symbol);
        break;
      case 'sentiment':
        insightData = await generateSentimentInsight(symbol);
        break;
      case 'comprehensive':
      default:
        insightData = await generateComprehensiveInsight(symbol, timeframe);
        break;
    }
    
    // Save to database
    const savedInsight = await prisma.aiInsight.create({
      data: {
        userId,
        symbol,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis for ${symbol}`,
        summary: insightData.summary,
        sentiment: insightData.sentiment,
        confidence: insightData.confidence,
        category: insightData.category || 'analysis',
        type,
        timeframe,
        keyPoints: insightData.keyPoints || [],
        prediction: insightData.prediction,
        riskFactors: insightData.riskFactors || [],
        opportunities: insightData.opportunities || [],
        technicalIndicators: insightData.technicalIndicators || {},
      },
    });
    
    // Return the insight with comparison data if requested
    const response: InsightResponse = {
      id: savedInsight.id,
      symbol: savedInsight.symbol,
      title: savedInsight.title,
      summary: savedInsight.summary,
      sentiment: savedInsight.sentiment as any,
      confidence: savedInsight.confidence,
      category: savedInsight.category,
      type: savedInsight.type,
      timeframe: savedInsight.timeframe,
      keyPoints: Array.isArray(savedInsight.keyPoints) ? savedInsight.keyPoints as string[] : [],
      prediction: savedInsight.prediction || undefined,
      riskFactors: Array.isArray(savedInsight.riskFactors) ? savedInsight.riskFactors as string[] : undefined,
      opportunities: Array.isArray(savedInsight.opportunities) ? savedInsight.opportunities as string[] : undefined,
      technicalIndicators: savedInsight.technicalIndicators as Record<string, any> || undefined,
      createdAt: savedInsight.createdAt.toISOString(),
      previousInsight: previousInsight ? {
        id: previousInsight.id,
        createdAt: previousInsight.createdAt.toISOString(),
        sentiment: previousInsight.sentiment,
        confidence: previousInsight.confidence,
      } : undefined,
    };
    
    return response;
  } catch (error) {
    console.error(`Error generating insight for ${symbol}:`, error);
    throw error;
  }
}

// Helper function to generate technical analysis insight
async function generateTechnicalInsight(symbol: string, timeframe: string): Promise<any> {
  try {
    // Fetch chart data
    const chartResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${symbol}/chart?timeframe=${timeframe}`
    );
    
    if (!chartResponse.ok) {
      throw new Error('Failed to fetch chart data');
    }
    
    const chartData = await chartResponse.json();
    
    // Use AI service to analyze technical indicators
    const technicalAnalysis = await AiService.analyzeTechnicalIndicators(chartData, symbol);
    
    return {
      summary: technicalAnalysis.summary,
      sentiment: technicalAnalysis.sentiment,
      confidence: technicalAnalysis.confidence,
      category: 'technical',
      keyPoints: technicalAnalysis.keyPoints,
      prediction: technicalAnalysis.prediction,
      technicalIndicators: technicalAnalysis.indicators,
    };
  } catch (error) {
    console.error('Error generating technical insight:', error);
    return {
      summary: `Technical analysis for ${symbol} is currently unavailable. Please try again later.`,
      sentiment: 'neutral',
      confidence: 0.3,
      category: 'technical',
      keyPoints: ['Unable to analyze technical indicators at this time'],
    };
  }
}

// Helper function to generate fundamental analysis insight
async function generateFundamentalInsight(symbol: string): Promise<any> {
  try {
    // Fetch stock data
    const stockResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${symbol}`
    );
    
    if (!stockResponse.ok) {
      throw new Error('Failed to fetch stock data');
    }
    
    const stockData = await stockResponse.json();
    
    // Use AI service to analyze fundamentals
    const fundamentalAnalysis = await AiService.analyzeFundamentals(stockData, symbol);
    
    return {
      summary: fundamentalAnalysis.summary,
      sentiment: fundamentalAnalysis.sentiment,
      confidence: fundamentalAnalysis.confidence,
      category: 'fundamental',
      keyPoints: fundamentalAnalysis.keyPoints,
      prediction: fundamentalAnalysis.prediction,
      riskFactors: fundamentalAnalysis.riskFactors,
      opportunities: fundamentalAnalysis.opportunities,
    };
  } catch (error) {
    console.error('Error generating fundamental insight:', error);
    return {
      summary: `Fundamental analysis for ${symbol} is currently unavailable. Please try again later.`,
      sentiment: 'neutral',
      confidence: 0.3,
      category: 'fundamental',
      keyPoints: ['Unable to analyze fundamentals at this time'],
    };
  }
}

// Helper function to generate sentiment analysis insight
async function generateSentimentInsight(symbol: string): Promise<any> {
  try {
    // Fetch news data
    const newsResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/news/${symbol}`
    );
    
    let newsData = { news: [] };
    if (newsResponse.ok) {
      newsData = await newsResponse.json();
    }
    
    // Fetch social media sentiment
    const sentimentResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/sentiment?symbol=${symbol}`
    );
    
    let sentimentData = null;
    if (sentimentResponse.ok) {
      sentimentData = await sentimentResponse.json();
    }
    
    // Use AI service to analyze sentiment
    const sentimentAnalysis = await AiService.analyzeSentiment(
      newsData.news || [], 
      sentimentData, 
      symbol
    );
    
    return {
      summary: sentimentAnalysis.summary,
      sentiment: sentimentAnalysis.sentiment,
      confidence: sentimentAnalysis.confidence,
      category: 'sentiment',
      keyPoints: sentimentAnalysis.keyPoints,
      prediction: sentimentAnalysis.prediction,
    };
  } catch (error) {
    console.error('Error generating sentiment insight:', error);
    return {
      summary: `Sentiment analysis for ${symbol} is currently unavailable. Please try again later.`,
      sentiment: 'neutral',
      confidence: 0.3,
      category: 'sentiment',
      keyPoints: ['Unable to analyze sentiment at this time'],
    };
  }
}

// Helper function to generate comprehensive insight
async function generateComprehensiveInsight(symbol: string, timeframe: string): Promise<any> {
  try {
    // Fetch all necessary data
    const [stockResponse, chartResponse, newsResponse, sentimentResponse] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${symbol}`),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${symbol}/chart?timeframe=${timeframe}`),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/news/${symbol}`),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/sentiment?symbol=${symbol}`),
    ]);
    
    let stockData = null;
    if (stockResponse.ok) {
      stockData = await stockResponse.json();
    }
    
    let chartData = [];
    if (chartResponse.ok) {
      chartData = await chartResponse.json();
    }
    
    let newsData = { news: [] };
    if (newsResponse.ok) {
      newsData = await newsResponse.json();
    }
    
    let sentimentData = null;
    if (sentimentResponse.ok) {
      sentimentData = await sentimentResponse.json();
    }
    
    // Use AI service to generate comprehensive analysis
    const comprehensiveAnalysis = await AiService.generateComprehensiveAnalysis(
      stockData,
      chartData,
      newsData.news || [],
      sentimentData,
      symbol,
      timeframe
    );
    
    return {
      summary: comprehensiveAnalysis.summary,
      sentiment: comprehensiveAnalysis.sentiment,
      confidence: comprehensiveAnalysis.confidence,
      category: 'comprehensive',
      keyPoints: comprehensiveAnalysis.keyPoints,
      prediction: comprehensiveAnalysis.prediction,
      riskFactors: comprehensiveAnalysis.riskFactors,
      opportunities: comprehensiveAnalysis.opportunities,
      technicalIndicators: comprehensiveAnalysis.technicalIndicators,
    };
  } catch (error) {
    console.error('Error generating comprehensive insight:', error);
    
    // Fall back to news-based analysis if comprehensive analysis fails
    try {
      const newsResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/news/${symbol}`
      );
      
      let newsData = { news: [] };
      if (newsResponse.ok) {
        newsData = await newsResponse.json();
      }
      
      if (newsData.news && newsData.news.length > 0) {
        const aiInsight = await AiService.summarizeNews(newsData.news, symbol);
        
        return {
          summary: aiInsight.summary,
          sentiment: aiInsight.sentiment,
          confidence: aiInsight.confidence,
          category: 'comprehensive',
          keyPoints: aiInsight.keyPoints,
          prediction: aiInsight.prediction,
        };
      }
    } catch (newsError) {
      console.error('Error in fallback news analysis:', newsError);
    }
    
    return {
      summary: `Comprehensive analysis for ${symbol} is currently unavailable. Please try again later.`,
      sentiment: 'neutral',
      confidence: 0.3,
      category: 'comprehensive',
      keyPoints: ['Unable to perform comprehensive analysis at this time'],
    };
  }
}