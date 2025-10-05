// F:\finsight-ai\src\app\api\ai\optimize\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AiService } from '@/lib/ai-service';

// Types for the portfolio optimization API
interface OptimizationRequest {
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals?: 'growth' | 'income' | 'balanced';
  timeframe?: 'short' | 'medium' | 'long';
  initialCapital?: number;
}

interface OptimizationResponse {
  recommendations: Array<{
    symbol: string;
    action: 'increase' | 'decrease' | 'maintain' | 'add' | 'remove';
    currentAllocation?: number;
    recommendedAllocation?: number;
    reason: string;
  }>;
  suggestedAdditions: string[];
  suggestedRemovals: string[];
  expectedImprovement: string;
  rebalancingFrequency: string;
  riskMetrics: {
    currentVolatility: number;
    optimizedVolatility: number;
    currentReturn: number;
    optimizedReturn: number;
    sharpeRatio: number;
  };
  assetAllocation: {
    stocks: number;
    bonds: number;
    cash: number;
    alternatives: number;
  };
}

// GET handler for retrieving portfolio optimization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's portfolio and preferences
    const [portfolio, userPreferences] = await Promise.all([
      prisma.portfolio.findMany({
        where: { userId: session.user.id },
      }),
      prisma.userPreferences.findUnique({
        where: { userId: session.user.id },
      }),
    ]);
    
    const preferences = userPreferences || {
      riskTolerance: 'moderate',
      investmentGoals: 'growth',
    };
    
    // Generate optimization
    const optimization = await AiService.optimizePortfolio(
      session.user.id,
      portfolio,
      preferences.riskTolerance || 'moderate',
      preferences.investmentGoals || 'growth'
    );
    
    // Calculate current portfolio metrics
    const portfolioValue = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const totalInvested = portfolio.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);
    const totalReturn = portfolioValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    
    // Calculate volatility (simplified)
    const returns = portfolio.map(item => item.profitPercent || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Mock optimized metrics (in a real app, these would be calculated)
    const optimizedVolatility = volatility * 0.85; // Assume 15% reduction
    const optimizedReturn = returnPercent * 1.1; // Assume 10% improvement
    const sharpeRatio = optimizedReturn / optimizedVolatility;
    
    const response: OptimizationResponse = {
      recommendations: optimization.recommendations || [],
      suggestedAdditions: optimization.suggestedAdditions || [],
      suggestedRemovals: optimization.suggestedRemovals || [],
      expectedImprovement: optimization.expectedImprovement || 'Portfolio optimization completed successfully',
      rebalancingFrequency: optimization.rebalancingFrequency || 'quarterly',
      riskMetrics: {
        currentVolatility: volatility,
        optimizedVolatility,
        currentReturn: returnPercent,
        optimizedReturn,
        sharpeRatio,
      },
      assetAllocation: {
        stocks: 0.7,
        bonds: 0.2,
        cash: 0.05,
        alternatives: 0.05,
      },
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Portfolio optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize portfolio' },
      { status: 500 }
    );
  }
}

// POST handler for generating new optimization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body: OptimizationRequest = await request.json();
    const { 
      riskTolerance = 'moderate', 
      investmentGoals = 'growth',
      timeframe = 'medium',
      initialCapital
    } = body;
    
    // Get user's portfolio
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });
    
    // Generate optimization
    const optimization = await AiService.optimizePortfolio(
      session.user.id,
      portfolio,
      riskTolerance,
      investmentGoals
    );
    
    // Calculate portfolio metrics
    const portfolioValue = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const totalInvested = portfolio.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);
    const totalReturn = portfolioValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    
    // Calculate volatility
    const returns = portfolio.map(item => item.profitPercent || 0);
    const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length : 0;
    const volatility = Math.sqrt(variance);
    
    // Generate asset allocation based on risk tolerance
    const getAssetAllocation = (risk: string) => {
      switch (risk) {
        case 'conservative':
          return { stocks: 0.4, bonds: 0.5, cash: 0.07, alternatives: 0.03 };
        case 'aggressive':
          return { stocks: 0.85, bonds: 0.1, cash: 0.02, alternatives: 0.03 };
        default:
          return { stocks: 0.7, bonds: 0.2, cash: 0.05, alternatives: 0.05 };
      }
    };
    
    const assetAllocation = getAssetAllocation(riskTolerance);
    
    // Mock optimized metrics
    const volatilityReduction = riskTolerance === 'conservative' ? 0.3 : riskTolerance === 'aggressive' ? 0.1 : 0.2;
    const returnImprovement = riskTolerance === 'aggressive' ? 0.15 : riskTolerance === 'conservative' ? 0.05 : 0.1;
    
    const optimizedVolatility = volatility * (1 - volatilityReduction);
    const optimizedReturn = returnPercent * (1 + returnImprovement);
    const sharpeRatio = optimizedVolatility > 0 ? optimizedReturn / optimizedVolatility : 0;
    
    const response: OptimizationResponse = {
      recommendations: optimization.recommendations || [],
      suggestedAdditions: optimization.suggestedAdditions || [],
      suggestedRemovals: optimization.suggestedRemovals || [],
      expectedImprovement: optimization.expectedImprovement || `Expected ${returnImprovement * 100}% improvement in returns with ${volatilityReduction * 100}% reduction in volatility`,
      rebalancingFrequency: optimization.rebalancingFrequency || 'quarterly',
      riskMetrics: {
        currentVolatility: volatility,
        optimizedVolatility,
        currentReturn: returnPercent,
        optimizedReturn,
        sharpeRatio,
      },
      assetAllocation,
    };
    
    // Save optimization to user preferences
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        riskTolerance,
        investmentGoals,
      },
      create: {
        userId: session.user.id,
        riskTolerance,
        investmentGoals,
      },
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Portfolio optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize portfolio' },
      { status: 500 }
    );
  }
}

// PUT handler for updating optimization preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { riskTolerance, investmentGoals, rebalancingFrequency } = await request.json();
    
    // Update user preferences
    const updatedPreferences = await prisma.userPreferences.update({
      where: { userId: session.user.id },
      data: {
        riskTolerance,
        investmentGoals,
      },
    });
    
    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error('Update optimization preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}