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

interface StrategyParameters {
  riskLevel?: 'low' | 'medium' | 'high';
  expectedAnnualReturn?: number;
  maxDrawdown?: number;
  winRate?: number;
  [key: string]: any;
}

interface StrategyPerformance {
  winRate?: number;
  profitFactor?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  annualReturn?: number;
  [key: string]: any;
}

interface StrategyResponse {
  strategies: Array<{
    id: string;
    name: string;
    description: string;
    parameters: StrategyParameters;
    performance?: StrategyPerformance;
    isActive: boolean;
    createdAt: string;
    riskLevel?: 'low' | 'medium' | 'high';
    expectedAnnualReturn?: number;
    maxDrawdown?: number;
    winRate?: number;
  }>;
  backtestResults?: {
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    volatility: number;
  };
}

interface BacktestRequest {
  strategyId: string;
  timeframe: string;
}

interface BacktestResponse {
  performance: {
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    volatility: number;
  };
}

// Helper function to safely validate risk tolerance
function validateRiskTolerance(riskTolerance: any): 'conservative' | 'moderate' | 'aggressive' {
  if (riskTolerance === 'conservative' || riskTolerance === 'moderate' || riskTolerance === 'aggressive') {
    return riskTolerance;
  }
  return 'moderate';
}

// Helper function to safely validate investment goals
function validateInvestmentGoals(investmentGoals: any): 'growth' | 'income' | 'balanced' {
  if (investmentGoals === 'growth' || investmentGoals === 'income' || investmentGoals === 'balanced') {
    return investmentGoals;
  }
  return 'growth';
}

// Helper function to map risk tolerance to risk level
function mapRiskToleranceToLevel(riskTolerance: 'conservative' | 'moderate' | 'aggressive'): 'low' | 'medium' | 'high' {
  switch (riskTolerance) {
    case 'conservative':
      return 'low';
    case 'moderate':
      return 'medium';
    case 'aggressive':
      return 'high';
    default:
      return 'medium';
  }
}

// Helper function to map risk level to risk tolerance (for back compatibility)
function mapRiskLevelToTolerance(riskLevel: 'low' | 'medium' | 'high'): 'conservative' | 'moderate' | 'aggressive' {
  switch (riskLevel) {
    case 'low':
      return 'conservative';
    case 'medium':
      return 'moderate';
    case 'high':
      return 'aggressive';
    default:
      return 'moderate';
  }
}

// Helper function to safely access strategy parameters
function getStrategyParameters(parameters: any): StrategyParameters {
  if (!parameters || typeof parameters !== 'object') {
    return {};
  }
  
  return {
    riskLevel: parameters.riskLevel,
    expectedAnnualReturn: parameters.expectedAnnualReturn,
    maxDrawdown: parameters.maxDrawdown,
    winRate: parameters.winRate,
    ...parameters
  };
}

// Helper function to safely access strategy performance
function getStrategyPerformance(performance: any): StrategyPerformance {
  if (!performance || typeof performance !== 'object') {
    return {};
  }
  
  return {
    winRate: performance.winRate,
    profitFactor: performance.profitFactor,
    maxDrawdown: performance.maxDrawdown,
    sharpeRatio: performance.sharpeRatio,
    annualReturn: performance.annualReturn,
    ...performance
  };
}

// Helper function to get performance metrics based on risk level
function getPerformanceMetrics(riskLevel: 'low' | 'medium' | 'high') {
  const riskTolerance = mapRiskLevelToTolerance(riskLevel);
  
  switch (riskTolerance) {
    case 'aggressive':
      return {
        annualReturn: 0.15,
        maxDrawdown: 0.25,
        winRate: 0.55,
        totalReturn: 18.5,
        sharpeRatio: 1.0,
        volatility: 0.25
      };
    case 'conservative':
      return {
        annualReturn: 0.08,
        maxDrawdown: 0.10,
        winRate: 0.75,
        totalReturn: 8.5,
        sharpeRatio: 1.4,
        volatility: 0.12
      };
    case 'moderate':
    default:
      return {
        annualReturn: 0.12,
        maxDrawdown: 0.15,
        winRate: 0.65,
        totalReturn: 12.5,
        sharpeRatio: 1.2,
        volatility: 0.18
      };
  }
}

// GET handler for retrieving trading strategies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const enhanced = searchParams.get('enhanced') === 'true';
    
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
    
    const validatedRiskTolerance = validateRiskTolerance(userPreferences?.riskTolerance);
    const validatedInvestmentGoals = validateInvestmentGoals(userPreferences?.investmentGoals);
    
    const preferences = {
      riskTolerance: validatedRiskTolerance,
      investmentGoals: validatedInvestmentGoals,
    };
    
    // If no strategies exist, generate default ones
    if (strategies.length === 0) {
      const generatedStrategies = await AiService.generateTradingStrategies(
        session.user.id,
        preferences.riskTolerance,
        preferences.investmentGoals,
        initialCapital
      );
      
      const riskLevel = mapRiskToleranceToLevel(preferences.riskTolerance);
      const metrics = getPerformanceMetrics(riskLevel);
      
      const response: StrategyResponse = {
        strategies: generatedStrategies.map((strategy, index) => {
          const params = getStrategyParameters(strategy.parameters);
          const perf = getStrategyPerformance(strategy.performance);
          
          return {
            id: `strategy-${index}`,
            name: strategy.name,
            description: strategy.description,
            parameters: params,
            performance: perf,
            isActive: false,
            riskLevel: riskLevel,
            expectedAnnualReturn: perf.annualReturn || metrics.annualReturn,
            maxDrawdown: perf.maxDrawdown || metrics.maxDrawdown,
            winRate: perf.winRate || metrics.winRate,
            createdAt: new Date().toISOString(),
          };
        }),
        backtestResults: {
          totalReturn: metrics.totalReturn,
          winRate: metrics.winRate,
          maxDrawdown: metrics.maxDrawdown,
          sharpeRatio: metrics.sharpeRatio,
          volatility: metrics.volatility,
        },
      };
      
      return NextResponse.json(response);
    }
    
    // Format existing strategies
    const response: StrategyResponse = {
      strategies: strategies.map(strategy => {
        const params = getStrategyParameters(strategy.parameters);
        const perf = getStrategyPerformance(strategy.performance);
        
        return {
          id: strategy.id,
          name: strategy.name,
          description: strategy.description,
          parameters: params,
          performance: perf,
          isActive: strategy.isActive,
          riskLevel: params.riskLevel || 'medium',
          expectedAnnualReturn: params.expectedAnnualReturn || 0.12,
          maxDrawdown: params.maxDrawdown || 0.15,
          winRate: params.winRate || 0.65,
          createdAt: strategy.createdAt.toISOString(),
        };
      }),
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
    
    const body = await request.json();
    const validatedRiskTolerance = validateRiskTolerance(body.riskTolerance);
    const validatedInvestmentGoals = validateInvestmentGoals(body.investmentGoals);
    
    const { 
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
      validatedRiskTolerance,
      validatedInvestmentGoals,
      finalInitialCapital
    );
    
    const riskLevel = mapRiskToleranceToLevel(validatedRiskTolerance);
    const metrics = getPerformanceMetrics(riskLevel);
    
    // Save strategies to database
    const savedStrategies = [];
    for (const strategy of generatedStrategies) {
      const strategyParams = {
        ...getStrategyParameters(strategy.parameters),
        riskLevel: riskLevel,
        expectedAnnualReturn: metrics.annualReturn,
        maxDrawdown: metrics.maxDrawdown,
        winRate: metrics.winRate,
      };
      
      const saved = await prisma.tradingStrategy.create({
        data: {
          userId: session.user.id,
          name: strategy.name,
          description: strategy.description,
          parameters: strategyParams,
          performance: getStrategyPerformance(strategy.performance),
          isActive: false,
        },
      });
      
      const savedParams = getStrategyParameters(saved.parameters);
      
      savedStrategies.push({
        id: saved.id,
        name: saved.name,
        description: saved.description,
        parameters: savedParams,
        performance: getStrategyPerformance(saved.performance),
        isActive: saved.isActive,
        riskLevel: savedParams.riskLevel || 'medium',
        expectedAnnualReturn: savedParams.expectedAnnualReturn || 0.12,
        maxDrawdown: savedParams.maxDrawdown || 0.15,
        winRate: savedParams.winRate || 0.65,
        createdAt: saved.createdAt.toISOString(),
      });
    }
    
    // Generate mock backtest results
    const backtestResults = {
      totalReturn: metrics.totalReturn,
      winRate: metrics.winRate,
      maxDrawdown: metrics.maxDrawdown,
      sharpeRatio: metrics.sharpeRatio,
      volatility: metrics.volatility,
    };
    
    const response: StrategyResponse = {
      strategies: savedStrategies,
      backtestResults,
    };
    
    // Update user preferences
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        riskTolerance: validatedRiskTolerance,
        investmentGoals: validatedInvestmentGoals,
      },
      create: {
        userId: session.user.id,
        riskTolerance: validatedRiskTolerance,
        investmentGoals: validatedInvestmentGoals,
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

// POST handler for running backtests - Renamed to avoid conflict
export async function runBacktest(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { strategyId, timeframe = '1Y' } = await request.json();
    
    if (!strategyId) {
      return NextResponse.json(
        { error: 'Strategy ID is required' },
        { status: 400 }
      );
    }
    
    // Get the strategy
    const strategy = await prisma.tradingStrategy.findUnique({
      where: { id: strategyId, userId: session.user.id },
    });
    
    if (!strategy) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }
    
    // Get user's portfolio for context
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });
    
    const portfolioValue = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    
    // Generate mock backtest results based on strategy parameters
    const strategyParams = getStrategyParameters(strategy.parameters);
    const riskLevel = strategyParams.riskLevel || 'medium';
    const metrics = getPerformanceMetrics(riskLevel);
    
    // Adjust based on timeframe
    let timeframeMultiplier = 1;
    if (timeframe === '1M') timeframeMultiplier = 1/12;
    else if (timeframe === '3M') timeframeMultiplier = 0.25;
    else if (timeframe === '6M') timeframeMultiplier = 0.5;
    else if (timeframe === '1Y') timeframeMultiplier = 1;
    
    const totalReturn = metrics.totalReturn * timeframeMultiplier;
    const volatility = metrics.volatility * Math.sqrt(timeframeMultiplier);
    const maxDrawdown = metrics.maxDrawdown;
    const winRate = metrics.winRate;
    const sharpeRatio = totalReturn / (volatility || 1);
    
    const performance = {
      totalReturn,
      winRate,
      maxDrawdown,
      sharpeRatio,
      volatility,
    };
    
    // Update the strategy with backtest results
    await prisma.tradingStrategy.update({
      where: { id: strategyId },
      data: {
        performance,
      },
    });
    
    return NextResponse.json({ performance });
  } catch (error) {
    console.error('Backtest error:', error);
    return NextResponse.json(
      { error: 'Failed to run backtest' },
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