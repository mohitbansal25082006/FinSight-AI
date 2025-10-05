// F:\finsight-ai\src\app\api\chatbot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdvancedAIService, ChatMessage } from '@/lib/advanced-ai-service';

// Initialize the AI service
AdvancedAIService.initialize();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.chatbotConversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20 // Last 20 messages for context
          }
        }
      });
    }

    if (!conversation) {
      conversation = await prisma.chatbotConversation.create({
        data: {
          userId: session.user.id,
          title: message.length > 50 ? message.substring(0, 50) + '...' : message
        },
        include: {
          messages: true
        }
      });
    }

    // Convert messages to ChatMessage format
    const history: ChatMessage[] = conversation.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      data: msg.data as any,
      sources: msg.sources as any[],
      confidence: msg.confidence || undefined,
      tokens: msg.tokens || undefined,
      responseTime: msg.responseTime || undefined
    }));

    // Get user context
    const userContext = await getUserContext(session.user.id);

    // Process the message
    const response = await AdvancedAIService.processMessage(
      session.user.id,
      message,
      history,
      userContext
    );

    // Save user message
    await prisma.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        tokens: message.length // Approximate token count
      }
    });

    // Save assistant response
    const savedMessage = await prisma.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: response.message,
        data: response.data || {},
        sources: response.sources || [],
        confidence: response.confidence,
        tokens: response.tokens,
        responseTime: response.responseTime
      }
    });

    // Update conversation title if it's the first message
    if (conversation.messages.length === 0) {
      await prisma.chatbotConversation.update({
        where: { id: conversation.id },
        data: {
          title: message.length > 50 ? message.substring(0, 50) + '...' : message
        }
      });
    }

    return NextResponse.json({
      id: savedMessage.id,
      conversationId: conversation.id,
      message: response.message,
      data: response.data,
      sources: response.sources,
      confidence: response.confidence,
      tokens: response.tokens,
      responseTime: response.responseTime,
      followUpQuestions: response.followUpQuestions,
      relatedTopics: response.relatedTopics,
      timestamp: savedMessage.createdAt
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Get specific conversation
      const conversation = await prisma.chatbotConversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      return NextResponse.json(conversation);
    } else {
      // Get all conversations
      const conversations = await prisma.chatbotConversation.findMany({
        where: {
          userId: session.user.id,
          isArchived: false
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Last message for preview
          }
        }
      });

      return NextResponse.json(conversations);
    }
  } catch (error) {
    console.error('Chatbot GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, title, isArchived } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const updatedConversation = await prisma.chatbotConversation.update({
      where: {
        id: conversationId,
        userId: session.user.id
      },
      data: {
        ...(title !== undefined && { title }),
        ...(isArchived !== undefined && { isArchived })
      }
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Chatbot PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    await prisma.chatbotConversation.delete({
      where: {
        id: conversationId,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chatbot DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}

async function getUserContext(userId: string) {
  try {
    const [portfolio, watchlist, preferences] = await Promise.all([
      prisma.portfolio.findMany({
        where: { userId },
        take: 10
      }),
      prisma.watchlist.findMany({
        where: { userId },
        take: 10
      }),
      prisma.userPreferences.findUnique({
        where: { userId }
      })
    ]);

    return {
      portfolio,
      watchlist,
      preferences,
      totalPortfolioValue: portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0)
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return {};
  }
}