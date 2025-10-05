// F:\finsight-ai\src\app\api\ai\strategies\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AiService } from '@/lib/ai-service';

// Types for the trading strategies API
interface StrategyRequest {
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals?: 'growth' | 'income' | 'balanced';
  initialCapital?: number;
  strategyType?: 'momentum' | 'value' | 'growth' | 'income' | 'balanced';
}

interface StrategyResponse {
  strategies: Array<{
    id: string;
    name: string;
    description: string;
    parameters: Record<string, any>;
    performance?: {
      winRate?: number;
      profitFactor?: number;
      maxDrawdown?: number;
      sharpeRatio?: number;
      annualReturn?: number;
    };
    isActive: boolean;
    createdAt: string;
  }>;
  backtestResults?: {
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    volatility: number;
  };
}

// GET handler for retrieving trading strategies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's strategies
    const strategies = await prisma.tradingStrategy.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    // Get user's portfolio for capital calculation
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });
    
    const portfolioValue = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const initialCapital = portfolioValue > 0 ? portfolioValue : 10000;
    
    // Get user preferences
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });
    
    const preferences = userPreferences || {
      riskTolerance: 'moderate',
      investmentGoals: 'growth',
    };
    
    // If no strategies exist, generate default ones
    if (strategies.length === 0) {
      const generatedStrategies = await AiService.generateTradingStrategies(
        session.user.id,
        preferences.riskTolerance || 'moderate',
        preferences.investmentGoals || 'growth',
        initialCapital
      );
      
      const response: StrategyResponse = {
        strategies: generatedStrategies.map((strategy, index) => ({
          id: `strategy-${index}`,
          name: strategy.name,
          description: strategy.description,
          parameters: strategy.parameters,
          performance: strategy.performance,
          isActive: false,
          createdAt: new Date().toISOString(),
        })),
        backtestResults: {
          totalReturn: 12.5,
          winRate: 0.65,
          maxDrawdown: 0.15,
          sharpeRatio: 1.2,
          volatility: 0.18,
        },
      };
      
      return NextResponse.json(response);
    }
    
    // Format existing strategies
    const response: StrategyResponse = {
      strategies: strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        description: strategy.description,
        parameters: strategy.parameters as Record<string, any>,
        performance: strategy.performance as Record<string, any>,
        isActive: strategy.isActive,
        createdAt: strategy.createdAt.toISOString(),
      })),
      backtestResults: {
        totalReturn: 12.5,
        winRate: 0.65,
        maxDrawdown: 0.15,
        sharpeRatio: 1.2,
        volatility: 0.18,
      },
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Trading strategies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trading strategies' },
      { status: 500 }
    );
  }
}

// POST handler for generating new trading strategies
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body: StrategyRequest = await request.json();
    const { 
      riskTolerance = 'moderate', 
      investmentGoals = 'growth',
      initialCapital = 10000,
      strategyType
    } = body;
    
    // Get user's portfolio for capital calculation
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });
    
    const portfolioValue = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const finalInitialCapital = portfolioValue > 0 ? portfolioValue : initialCapital;
    
    // Generate new strategies
    const generatedStrategies = await AiService.generateTradingStrategies(
      session.user.id,
      riskTolerance,
      investmentGoals,
      finalInitialCapital
    );
    
    // Save strategies to database
    const savedStrategies = [];
    for (const strategy of generatedStrategies) {
      const saved = await prisma.tradingStrategy.create({
        data: {
          userId: session.user.id,
          name: strategy.name,
          description: strategy.description,
          parameters: strategy.parameters,
          performance: strategy.performance,
          isActive: false,
        },
      });
      
      savedStrategies.push({
        id: saved.id,
        name: saved.name,
        description: saved.description,
        parameters: saved.parameters as Record<string, any>,
        performance: saved.performance as Record<string, any>,
        isActive: saved.isActive,
        createdAt: saved.createdAt.toISOString(),
      });
    }
    
    // Generate mock backtest results
    const backtestResults = {
      totalReturn: riskTolerance === 'aggressive' ? 18.5 : riskTolerance === 'conservative' ? 8.5 : 12.5,
      winRate: riskTolerance === 'aggressive' ? 0.55 : riskTolerance === 'conservative' ? 0.75 : 0.65,
      maxDrawdown: riskTolerance === 'aggressive' ? 0.25 : riskTolerance === 'conservative' ? 0.1 : 0.15,
      sharpeRatio: riskTolerance === 'aggressive' ? 1.0 : riskTolerance === 'conservative' ? 1.4 : 1.2,
      volatility: riskTolerance === 'aggressive' ? 0.25 : riskTolerance === 'conservative' ? 0.12 : 0.18,
    };
    
    const response: StrategyResponse = {
      strategies: savedStrategies,
      backtestResults,
    };
    
    // Update user preferences
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
    console.error('Trading strategies generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate trading strategies' },
      { status: 500 }
    );
  }
}

// PUT handler for updating trading strategies
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { strategyId, isActive, parameters } = await request.json();
    
    if (!strategyId) {
      return NextResponse.json(
        { error: 'Strategy ID is required' },
        { status: 400 }
      );
    }
    
    // Update the strategy
    const updatedStrategy = await prisma.tradingStrategy.update({
      where: {
        id: strategyId,
        userId: session.user.id,
      },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        parameters: parameters !== undefined ? parameters : undefined,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(updatedStrategy);
  } catch (error) {
    console.error('Trading strategies update error:', error);
    return NextResponse.json(
      { error: 'Failed to update trading strategy' },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting trading strategies
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get('id');
    
    if (!strategyId) {
      return NextResponse.json(
        { error: 'Strategy ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the strategy
    await prisma.tradingStrategy.delete({
      where: {
        id: strategyId,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Trading strategies deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete trading strategy' },
      { status: 500 }
    );
  }
}