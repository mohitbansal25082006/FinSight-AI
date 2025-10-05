// F:\finsight-ai\src\app\api\ai\chatbot\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AiService } from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get user's portfolio and watchlist for context
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id }
    });

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.user.id }
    });

    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id }
    });

    // Process chatbot query
    const response = await AiService.processChatbotQuery(
      session.user.id,
      query,
      {
        portfolio,
        watchlist,
        preferences: userPreferences || {}
      }
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chatbot query processing error:', error);
    return NextResponse.json({ error: 'Failed to process chatbot query' }, { status: 500 });
  }
}