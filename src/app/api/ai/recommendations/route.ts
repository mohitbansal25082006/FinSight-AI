// F:\finsight-ai\src\app\api\ai\recommendations\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AiService } from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Types for the recommendations API
interface RecommendationRequest {
  symbols?: string[];
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals?: 'growth' | 'income' | 'balanced';
  timeframe?: 'short' | 'medium' | 'long';
  sector?: string;
  marketCap?: 'small' | 'mid' | 'large';
}

interface StockRecommendationResult {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  priceTarget?: number;
  timeHorizon: string;
}

interface DbRecommendation {
  id: string;
  symbol: string;
  userId: string;
  action: string;
  confidence: number;
  reason: string;
  priceTarget: number | null;
  createdAt: Date;
  updatedAt: Date;
  isRead: boolean;
}

interface RecommendationResponse {
  recommendations: Array<{
    id: string;
    symbol: string;
    companyName?: string;
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    reason: string;
    priceTarget?: number;
    currentPrice?: number;
    upside?: number;
    downside?: number;
    timeHorizon: string;
    riskLevel: 'low' | 'medium' | 'high';
    sector?: string;
    marketCap?: string;
    peRatio?: number;
    dividendYield?: number;
    analystRating?: string;
    keyMetrics?: {
      marketCap?: number;
      volume?: number;
      avgVolume?: number;
      dayHigh?: number;
      dayLow?: number;
      week52High?: number;
      week52Low?: number;
    };
  }>;
  summary: {
    totalRecommendations: number;
    buySignals: number;
    sellSignals: number;
    holdSignals: number;
    avgConfidence: number;
    lastUpdated: string;
  };
  marketContext?: {
    marketTrend: 'bullish' | 'bearish' | 'neutral';
    volatility: 'low' | 'medium' | 'high';
    sentiment: 'positive' | 'negative' | 'neutral';
  };
}

// Type guards for filtering
function isBuyRecommendation(rec: any): rec is { action: 'buy' } {
  return rec.action === 'buy';
}

function isSellRecommendation(rec: any): rec is { action: 'sell' } {
  return rec.action === 'sell';
}

function isHoldRecommendation(rec: any): rec is { action: 'hold' } {
  return rec.action === 'hold';
}

// Helper function to fetch stock data
async function fetchStockData(symbol: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${symbol}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

// Helper function to create keyMetrics safely
function createKeyMetrics(stockData: any): RecommendationResponse['recommendations'][number]['keyMetrics'] | undefined {
  if (!stockData) return undefined;

  const metrics: any = {};
  
  if (typeof stockData.marketCap === 'number') metrics.marketCap = stockData.marketCap;
  if (typeof stockData.volume === 'number') metrics.volume = stockData.volume;
  if (typeof stockData.avgVolume === 'number') metrics.avgVolume = stockData.avgVolume;
  if (typeof stockData.high === 'number') metrics.dayHigh = stockData.high;
  if (typeof stockData.low === 'number') metrics.dayLow = stockData.low;
  if (typeof stockData.week52High === 'number') metrics.week52High = stockData.week52High;
  if (typeof stockData.week52Low === 'number') metrics.week52Low = stockData.week52Low;

  return Object.keys(metrics).length > 0 ? metrics : undefined;
}

// GET handler for retrieving stock recommendations
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/ai/recommendations called");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("❌ Unauthorized request");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`✅ User authenticated: ${session.user.id}`);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sector = searchParams.get('sector');
    const marketCap = searchParams.get('marketCap');

    // Get user's portfolio and preferences
    const [portfolio, userPreferences] = await Promise.all([
      prisma.portfolio.findMany({
        where: { userId: session.user.id }
      }).catch(() => []),
      prisma.userPreferences.findUnique({
        where: { userId: session.user.id }
      }).catch(() => null)
    ]);

    console.log(`📊 Portfolio items: ${portfolio.length}`);
    console.log(`⚙️ User preferences:`, userPreferences);

    // Provide default preferences if none exist
    const preferences = userPreferences || {
      riskTolerance: 'moderate',
      investmentGoals: 'growth'
    };

    // Get existing recommendations from database
    const existingRecommendations = await prisma.stockRecommendation.findMany({
      where: { 
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }).catch(() => []);

    console.log(`📋 Existing recommendations: ${existingRecommendations.length}`);

    // If we have recent recommendations, return them
    if (existingRecommendations.length > 0) {
      console.log("✅ Returning existing recommendations");

      // Fetch stock data for existing recommendations
      const stockDataPromises = existingRecommendations.map(rec => fetchStockData(rec.symbol));
      const stockDataArray = await Promise.all(stockDataPromises);

      const response: RecommendationResponse = {
        recommendations: existingRecommendations.map((rec, index) => {
          const stockData = stockDataArray[index];
          const currentPrice = stockData?.price;
          const priceTarget = rec.priceTarget ?? undefined;
          const upside = priceTarget && currentPrice ? 
            ((priceTarget - currentPrice) / currentPrice * 100) : undefined;
          const downside = priceTarget && currentPrice && priceTarget < currentPrice ? 
            Math.abs(upside!) : (currentPrice && stockData?.week52Low ? 
            ((currentPrice - stockData.week52Low) / currentPrice * 100) * -1 : undefined);

          return {
            id: rec.id,
            symbol: rec.symbol,
            companyName: stockData?.companyName,
            action: rec.action as 'buy' | 'sell' | 'hold',
            confidence: rec.confidence,
            reason: rec.reason,
            priceTarget,
            currentPrice,
            upside,
            downside,
            timeHorizon: 'medium-term',
            riskLevel: preferences.riskTolerance === 'aggressive' ? 'high' : 
                       preferences.riskTolerance === 'conservative' ? 'low' : 'medium',
            sector: stockData?.sector,
            marketCap: stockData?.marketCap,
            peRatio: stockData?.peRatio,
            dividendYield: stockData?.dividendYield,
            analystRating: stockData?.analystRating,
            keyMetrics: createKeyMetrics(stockData),
            isRead: rec.isRead
          };
        }),
        summary: {
          totalRecommendations: existingRecommendations.length,
          buySignals: existingRecommendations.filter(isBuyRecommendation).length,
          sellSignals: existingRecommendations.filter(isSellRecommendation).length,
          holdSignals: existingRecommendations.filter(isHoldRecommendation).length,
          avgConfidence: existingRecommendations.reduce((sum, r) => sum + r.confidence, 0) / existingRecommendations.length,
          lastUpdated: new Date().toISOString()
        },
        marketContext: {
          marketTrend: 'neutral',
          volatility: 'medium',
          sentiment: 'neutral'
        }
      };

      console.log("📤 Response:", response);
      return NextResponse.json(response);
    }

    // Generate new recommendations if none exist
    console.log("🔄 Generating new recommendations");
    try {
      const recommendations = await AiService.generateStockRecommendations(
        session.user.id,
        portfolio,
        preferences
      );

      console.log(`🤖 AI generated ${recommendations.length} recommendations:`, recommendations);

      // Fetch stock data for new recommendations
      const stockDataPromises = recommendations.map(rec => fetchStockData(rec.symbol));
      const stockDataArray = await Promise.all(stockDataPromises);

      const response: RecommendationResponse = {
        recommendations: recommendations.map((rec, index) => {
          const stockData = stockDataArray[index];
          const currentPrice = stockData?.price;
          const priceTarget = rec.priceTarget;
          const upside = priceTarget && currentPrice ? 
            ((priceTarget - currentPrice) / currentPrice * 100) : undefined;
          const downside = priceTarget && currentPrice && priceTarget < currentPrice ? 
            Math.abs(upside!) : (currentPrice && stockData?.week52Low ? 
            ((currentPrice - stockData.week52Low) / currentPrice * 100) * -1 : undefined);

          return {
            id: `rec-${Date.now()}-${index}`,
            symbol: rec.symbol,
            companyName: stockData?.companyName,
            action: rec.action,
            confidence: rec.confidence,
            reason: rec.reason,
            priceTarget,
            currentPrice,
            upside,
            downside,
            timeHorizon: rec.timeHorizon,
            riskLevel: preferences.riskTolerance === 'aggressive' ? 'high' : 
                       preferences.riskTolerance === 'conservative' ? 'low' : 'medium',
            sector: stockData?.sector,
            marketCap: stockData?.marketCap,
            peRatio: stockData?.peRatio,
            dividendYield: stockData?.dividendYield,
            analystRating: stockData?.analystRating,
            keyMetrics: createKeyMetrics(stockData)
          };
        }),
        summary: {
          totalRecommendations: recommendations.length,
          buySignals: recommendations.filter(isBuyRecommendation).length,
          sellSignals: recommendations.filter(isSellRecommendation).length,
          holdSignals: recommendations.filter(isHoldRecommendation).length,
          avgConfidence: recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length,
          lastUpdated: new Date().toISOString()
        },
        marketContext: {
          marketTrend: 'neutral',
          volatility: 'medium',
          sentiment: 'neutral'
        }
      };

      console.log("📤 Response:", response);
      return NextResponse.json(response);
    } catch (aiError) {
      console.error('❌ AI service error:', aiError);
      
      // Return fallback recommendations
      const fallbackRecommendations = [
        {
          id: 'fallback-1',
          symbol: 'SPY',
          companyName: 'SPDR S&P 500 ETF Trust',
          action: 'buy' as const,
          confidence: 0.7,
          reason: 'Diversified exposure to the US stock market with low fees',
          priceTarget: 500,
          timeHorizon: 'long-term',
          riskLevel: 'medium' as const,
          sector: 'ETF',
          marketCap: 'Large'
        },
        {
          id: 'fallback-2',
          symbol: 'QQQ',
          companyName: 'Invesco QQQ Trust',
          action: 'buy' as const,
          confidence: 0.65,
          reason: 'Exposure to technology sector growth with Nasdaq 100',
          priceTarget: 400,
          timeHorizon: 'medium-term',
          riskLevel: 'high' as const,
          sector: 'Technology',
          marketCap: 'Large'
        },
        {
          id: 'fallback-3',
          symbol: 'VTI',
          companyName: 'Vanguard Total Stock Market ETF',
          action: 'hold' as const,
          confidence: 0.6,
          reason: 'Broad market diversification suitable for most portfolios',
          priceTarget: 250,
          timeHorizon: 'long-term',
          riskLevel: 'medium' as const,
          sector: 'ETF',
          marketCap: 'Large'
        },
        {
          id: 'fallback-4',
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          action: 'sell' as const,
          confidence: 0.55,
          reason: 'Recent overvaluation concerns and slowing growth',
          priceTarget: 150,
          timeHorizon: 'short-term',
          riskLevel: 'medium' as const,
          sector: 'Technology',
          marketCap: 'Large'
        }
      ];

      console.log("📤 Fallback response:", fallbackRecommendations);
      const response: RecommendationResponse = {
        recommendations: fallbackRecommendations,
        summary: {
          totalRecommendations: fallbackRecommendations.length,
          buySignals: fallbackRecommendations.filter(isBuyRecommendation).length,
          sellSignals: fallbackRecommendations.filter(isSellRecommendation).length,
          holdSignals: fallbackRecommendations.filter(isHoldRecommendation).length,
          avgConfidence: fallbackRecommendations.reduce((sum, r) => sum + r.confidence, 0) / fallbackRecommendations.length,
          lastUpdated: new Date().toISOString()
        },
        marketContext: {
          marketTrend: 'neutral',
          volatility: 'medium',
          sentiment: 'neutral'
        }
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('❌ Stock recommendations error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate stock recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler for generating new recommendations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RecommendationRequest = await request.json();
    const { 
      symbols,
      riskTolerance = 'moderate',
      investmentGoals = 'growth',
      timeframe = 'medium',
      sector,
      marketCap
    } = body;

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id }
    }).catch(() => []);

    // Update or create user preferences
    const preferences = {
      riskTolerance,
      investmentGoals
    };

    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: preferences,
      create: {
        userId: session.user.id,
        ...preferences
      }
    }).catch(() => {
      // Ignore errors if preferences table doesn't exist yet
    });

    // Generate new recommendations
    const recommendations = await AiService.generateStockRecommendations(
      session.user.id,
      portfolio,
      preferences
    );

    // Save recommendations to database
    const savedRecommendations: DbRecommendation[] = [];
    
    for (const rec of recommendations) {
      try {
        const saved = await prisma.stockRecommendation.create({
          data: {
            userId: session.user.id,
            symbol: rec.symbol,
            action: rec.action,
            confidence: rec.confidence,
            reason: rec.reason,
            priceTarget: rec.priceTarget,
          }
        });
        savedRecommendations.push(saved);
      } catch (error) {
        console.error(`Failed to save recommendation for ${rec.symbol}:`, error);
      }
    }

    // Get stock data for additional context
    const stockDataPromises = recommendations.map(async (rec) => {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks/${rec.symbol}`);
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch {
        return null;
      }
    });

    const stockDataArray = await Promise.all(stockDataPromises);

    const response: RecommendationResponse = {
      recommendations: recommendations.map((rec, index) => {
        const stockData = stockDataArray[index];
        const savedRec = savedRecommendations[index];
        const currentPrice = stockData?.price;
        const priceTarget = savedRec?.priceTarget ?? rec.priceTarget;
        const upside = priceTarget && currentPrice ? 
          ((priceTarget - currentPrice) / currentPrice * 100) : undefined;
        const downside = priceTarget && currentPrice && priceTarget < currentPrice ? 
          Math.abs(upside!) : (currentPrice && stockData?.week52Low ? 
          ((currentPrice - stockData.week52Low) / currentPrice * 100) * -1 : undefined);

        return {
          id: savedRec?.id || `rec-${Date.now()}-${index}`,
          symbol: rec.symbol,
          companyName: stockData?.companyName,
          action: rec.action,
          confidence: rec.confidence,
          reason: rec.reason,
          priceTarget,
          currentPrice,
          upside,
          downside,
          timeHorizon: rec.timeHorizon,
          riskLevel: riskTolerance === 'aggressive' ? 'high' : 
                     riskTolerance === 'conservative' ? 'low' : 'medium',
          sector: stockData?.sector,
          marketCap: stockData?.marketCap,
          peRatio: stockData?.peRatio,
          dividendYield: stockData?.dividendYield,
          analystRating: stockData?.analystRating,
          keyMetrics: createKeyMetrics(stockData)
        };
      }),
      summary: {
        totalRecommendations: recommendations.length,
        buySignals: recommendations.filter(isBuyRecommendation).length,
        sellSignals: recommendations.filter(isSellRecommendation).length,
        holdSignals: recommendations.filter(isHoldRecommendation).length,
        avgConfidence: recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length,
        lastUpdated: new Date().toISOString()
      },
      marketContext: {
        marketTrend: 'neutral',
        volatility: 'medium',
        sentiment: 'neutral'
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Stock recommendations generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate stock recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT handler for updating recommendation status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recommendationId, isRead } = await request.json();
    
    if (!recommendationId) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    // Update recommendation
    const updatedRecommendation = await prisma.stockRecommendation.update({
      where: {
        id: recommendationId,
        userId: session.user.id
      },
      data: {
        isRead: isRead !== undefined ? isRead : undefined
      }
    }).catch(() => {
      throw new Error('Failed to update recommendation');
    });

    return NextResponse.json(updatedRecommendation);
  } catch (error) {
    console.error('Update recommendation error:', error);
    return NextResponse.json({ 
      error: 'Failed to update recommendation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE handler for deleting recommendations
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recommendationId = searchParams.get('id');
    const symbol = searchParams.get('symbol');
    
    if (recommendationId) {
      // Delete specific recommendation
      await prisma.stockRecommendation.delete({
        where: {
          id: recommendationId,
          userId: session.user.id
        }
      }).catch(() => {
        throw new Error('Failed to delete recommendation');
      });
      
      return NextResponse.json({ success: true });
    } else if (symbol) {
      // Delete all recommendations for a symbol
      await prisma.stockRecommendation.deleteMany({
        where: {
          userId: session.user.id,
          symbol: symbol.toUpperCase()
        }
      }).catch(() => {
        throw new Error('Failed to delete recommendations');
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Recommendation ID or symbol is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Delete recommendation error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete recommendation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}