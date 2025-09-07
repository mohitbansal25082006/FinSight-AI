import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { watchlist: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user.watchlist);

  } catch (error) {
    console.error('Watchlist GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { symbol, name, type } = await request.json();

    if (!symbol || !name || !type) {
      return NextResponse.json(
        { error: 'Symbol, name, and type are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol: symbol.toUpperCase()
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already in watchlist' },
        { status: 409 }
      );
    }

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: user.id,
        symbol: symbol.toUpperCase(),
        name,
        type
      }
    });

    return NextResponse.json(watchlistItem, { status: 201 });

  } catch (error) {
    console.error('Watchlist POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}