import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // use next-auth/next for server sessions
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Handler for DELETE /api/portfolio/[id]
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
): Promise<NextResponse> {
  try {
    // server session (works with next-auth v4+)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to match Next.js App Router typing (params may be a promise)
    const resolvedParams = await context.params;

    // defensively read id (params.id may be string | string[])
    const rawId = resolvedParams?.id;
    const id =
      typeof rawId === 'string' ? rawId : Array.isArray(rawId) && rawId.length > 0 ? rawId[0] : undefined;

    if (!id) {
      return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
    }

    // Verify the portfolio item belongs to the user
    const portfolioItem = await prisma.portfolio.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!portfolioItem) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    await prisma.portfolio.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Portfolio item deleted successfully' });
  } catch (error: unknown) {
    console.error('Portfolio deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete portfolio item' }, { status: 500 });
  }
}
