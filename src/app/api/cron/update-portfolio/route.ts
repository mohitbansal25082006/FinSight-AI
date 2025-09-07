import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔄 Starting portfolio update cron job...');
    
    // Get all unique symbols from portfolios
    const portfolios = await prisma.portfolio.findMany({
      select: { symbol: true },
      distinct: ['symbol'],
    });
    
    const updatePromises = portfolios.map(async (portfolio) => {
      try {
        const response = await fetch(
          `${process.env.NEXTAUTH_URL}/api/stocks/${portfolio.symbol}`
        );
        
        if (response.ok) {
          const stockData = await response.json();
          
          // Update all portfolio items with this symbol
          await prisma.portfolio.updateMany({
            where: { symbol: portfolio.symbol },
            data: {
              currentPrice: stockData.price,
              updatedAt: new Date(),
            },
          });
          
          console.log(`✅ Updated ${portfolio.symbol}: ${stockData.price}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${portfolio.symbol}:`, error);
      }
    });
    
    await Promise.all(updatePromises);
    
    console.log('🎉 Portfolio update cron job completed');
    return NextResponse.json({ 
      message: 'Portfolio updated successfully',
      updatedSymbols: portfolios.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Portfolio update cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}