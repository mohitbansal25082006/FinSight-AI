import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    // Calculate current values and profits
    const portfolioWithValues = await Promise.all(
      portfolio.map(async (item) => {
        try {
          // Fetch current price (you can cache this for better performance)
          const response = await fetch(
            `${process.env.NEXTAUTH_URL}/api/stocks/${item.symbol}`
          );
          const stockData = await response.json();
          
          const currentPrice = stockData.price || item.buyPrice;
          const totalValue = currentPrice * item.quantity;
          const profit = totalValue - (item.buyPrice * item.quantity);
          const profitPercent = ((profit / (item.buyPrice * item.quantity)) * 100);
          
          return {
            ...item,
            currentPrice,
            totalValue,
            profit,
            profitPercent,
          };
        } catch (error) {
          console.error(`Error fetching price for ${item.symbol}:`, error);
          return {
            ...item,
            currentPrice: item.buyPrice,
            totalValue: item.buyPrice * item.quantity,
            profit: 0,
            profitPercent: 0,
          };
        }
      })
    );
    
    return NextResponse.json(portfolioWithValues);
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { symbol, quantity, buyPrice, type = 'stock' } = body;
    
    if (!symbol || !quantity || !buyPrice) {
      return NextResponse.json(
        { error: 'Symbol, quantity, and buy price are required' },
        { status: 400 }
      );
    }
    
    const portfolio = await prisma.portfolio.create({
      data: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        type,
      },
    });
    
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Portfolio creation error:', error);
    return NextResponse.json(
      { error: 'Failed to add to portfolio' },
      { status: 500 }
    );
  }
}