// F:\finsight-ai\src\components\chatbot\advanced-chatbot.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MessageCircle,
  Send,
  Plus,
  Settings,
  Archive,
  Trash2,
  Edit3,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  Zap,
  Brain,
  BarChart3,
  DollarSign,
  Eye,
  EyeOff,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  sources?: any[];
  confidence: number;
  tokens: number;
  responseTime: number;
  timestamp: string;
  followUpQuestions?: string[];
  relatedTopics?: string[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface AdvancedChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Normalize a raw message object (from server or local) into our Message type.
 * Ensures `role` is narrowed to 'user' | 'assistant'.
 */
const normalizeMessage = (m: any): Message => {
  const roleRaw = (m?.role ?? 'assistant') as string;
  const role: 'user' | 'assistant' = roleRaw === 'user' ? 'user' : 'assistant';

  return {
    id: String(m?.id ?? Date.now().toString()),
    role,
    content: String(m?.content ?? m?.message ?? ''),
    data: m?.data,
    sources: Array.isArray(m?.sources) ? m.sources : undefined,
    confidence: typeof m?.confidence === 'number' ? m.confidence : 1,
    tokens: typeof m?.tokens === 'number' ? m.tokens : (m?.content ? String(m.content).length : 0),
    responseTime: typeof m?.responseTime === 'number' ? m.responseTime : 0,
    timestamp: m?.timestamp ? String(m.timestamp) : new Date().toISOString(),
    followUpQuestions: Array.isArray(m?.followUpQuestions) ? m.followUpQuestions : undefined,
    relatedTopics: Array.isArray(m?.relatedTopics) ? m.relatedTopics : undefined
  };
};

/**
 * Normalize a raw conversation object into our Conversation type.
 * Defensive: ensures fields exist and messages are normalized.
 */
const normalizeConversation = (c: any): Conversation => {
  return {
    id: String(c?.id ?? c?.conversationId ?? Date.now().toString()),
    title: String(c?.title ?? 'Conversation'),
    messages: Array.isArray(c?.messages)
      ? c.messages.map(normalizeMessage)
      : (Array.isArray(c?.msgs) ? c.msgs.map(normalizeMessage) : []),
    createdAt: c?.createdAt ? String(c.createdAt) : new Date().toISOString(),
    updatedAt: c?.updatedAt ? String(c.updatedAt) : new Date().toISOString()
  };
};

export default function AdvancedChatbot({ isOpen, onClose }: AdvancedChatbotProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // ScrollArea might not forward a specific type; use any for its ref
  const scrollAreaRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll detection for scroll-to-bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom && scrollHeight > clientHeight);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [activeConversation]);

  // Fetch conversations on mount when open and user available
  useEffect(() => {
    if (session?.user?.id && isOpen) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.messages?.length, isLoading]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end'
    });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chatbot');
      if (response.ok) {
        const data = await response.json();
        // Normalize all conversations
        const normalized: Conversation[] = Array.isArray(data)
          ? data.map(normalizeConversation)
          : [];
        setConversations(normalized);
        if (normalized.length > 0 && !activeConversation) {
          setActiveConversation(normalized[0]);
        }
      } else {
        console.error('Failed to fetch conversations:', response.statusText);
        toast.error('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello! I\'m your financial assistant. How can I help you today?' })
      });

      if (response.ok) {
        const data = await response.json();

        // Attempt to fetch latest conversations (server is source of truth)
        await fetchConversations();

        // Build a normalized conversation from returned data (defensive)
        const newConv: Conversation = normalizeConversation({
          id: data.conversationId ?? data.id,
          title: data.title ?? 'New Conversation',
          messages: [
            {
              id: data.id ?? Date.now().toString(),
              role: data.role ?? 'assistant',
              content: data.message ?? data.content ?? '',
              confidence: data.confidence,
              tokens: data.tokens,
              responseTime: data.responseTime,
              timestamp: data.timestamp,
              followUpQuestions: data.followUpQuestions,
              relatedTopics: data.relatedTopics
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        setActiveConversation(newConv);

        // Also ensure it's present in the conversation list UI
        setConversations(prev => [newConv, ...prev.filter(c => c.id !== newConv.id)]);

        // Close sidebar on mobile after selecting conversation
        if (isMobile) {
          setShowSidebar(false);
        }
      } else {
        console.error('Create conversation failed:', response.statusText);
        toast.error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      confidence: 1,
      tokens: message.length,
      responseTime: 0,
      timestamp: new Date().toISOString()
    };

    // Add user message to the conversation UI immediately
    if (activeConversation) {
      setActiveConversation(prev =>
        prev
          ? { ...prev, messages: [...prev.messages, userMessage], updatedAt: new Date().toISOString() }
          : null
      );
      setConversations(prev => prev.map(conv => conv.id === activeConversation.id ? {
        ...conv,
        messages: [...conv.messages, userMessage],
        updatedAt: new Date().toISOString()
      } : conv));
    }

    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: activeConversation?.id
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Normalize assistant message
        const assistantMessage = normalizeMessage({
          id: data.id ?? Date.now().toString(),
          role: data.role ?? 'assistant',
          content: data.message ?? data.content ?? '',
          data: data.data,
          sources: data.sources,
          confidence: data.confidence,
          tokens: data.tokens,
          responseTime: data.responseTime,
          timestamp: data.timestamp ?? new Date().toISOString(),
          followUpQuestions: data.followUpQuestions,
          relatedTopics: data.relatedTopics
        });

        // Update activeConversation with assistant response
        setActiveConversation(prev =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, assistantMessage],
                updatedAt: new Date().toISOString()
              }
            : null
        );

        // Update conversation in the global list
        setConversations(prev =>
          prev.map(conv =>
            conv.id === (data.conversationId ?? activeConversation?.id ?? conv.id)
              ? { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date().toISOString() }
              : conv
          )
        );
      } else {
        console.error('Send message failed:', response.statusText);
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateConversationTitle = async (conversationId: string, newTitle: string) => {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, title: newTitle })
      });

      if (response.ok) {
        setConversations(prev => prev.map(conv => conv.id === conversationId ? { ...conv, title: newTitle } : conv));
        if (activeConversation?.id === conversationId) {
          setActiveConversation(prev => prev ? { ...prev, title: newTitle } : null);
        }
      } else {
        console.error('Update title failed:', response.statusText);
        toast.error('Failed to update title');
      }
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    }
    setEditingTitle(null);
    setTempTitle('');
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, isArchived: true })
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        if (activeConversation?.id === conversationId) {
          setActiveConversation(conversations.find(conv => conv.id !== conversationId) || null);
        }
        toast.success('Conversation archived');
      } else {
        console.error('Archive failed:', response.statusText);
        toast.error('Failed to archive conversation');
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive conversation');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await fetch(`/api/chatbot?conversationId=${conversationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        if (activeConversation?.id === conversationId) {
          setActiveConversation(conversations.find(conv => conv.id !== conversationId) || null);
        }
        toast.success('Conversation deleted');
      } else {
        console.error('Delete failed:', response.statusText);
        toast.error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleConversationSelect = (conv: Conversation) => {
    setActiveConversation(conv);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';

    return (
      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-2`}>
        <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%]`}>
          <div className={`rounded-lg p-3 sm:p-4 ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <div className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.content}</div>

            {/* Show data visualization if available */}
            {msg.data && (
              <div className="mt-3 space-y-2">
                {msg.data.stock_price && (
                  <div className="bg-white/10 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{msg.data.stock_price.symbol}</span>
                      <span className={msg.data.stock_price.change >= 0 ? 'text-green-300' : 'text-red-300'}>
                        {msg.data.stock_price.change >= 0 ? '+' : ''}{msg.data.stock_price.changePercent}%
                      </span>
                    </div>
                    <div className="text-sm">
                      ${msg.data.stock_price.price}
                    </div>
                  </div>
                )}

                {msg.data.portfolio_analysis && (
                  <div className="bg-white/10 rounded p-2">
                    <div className="font-semibold text-sm">Portfolio Analysis</div>
                    <div className="text-xs space-y-1">
                      <div>Total Value: ${msg.data.portfolio_analysis.totalValue.toFixed(2)}</div>
                      <div>Total Profit: ${msg.data.portfolio_analysis.totalProfit.toFixed(2)}</div>
                      <div>Holdings: {msg.data.portfolio_analysis.holdings}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show sources if available */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 text-xs opacity-75">
                Sources: {msg.sources.map((s, i) => s.title ?? s.name ?? `Source ${i+1}`).join(', ')}
              </div>
            )}

            {/* Show follow-up questions */}
            {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="text-xs font-semibold opacity-90">Follow-up questions:</div>
                {msg.followUpQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 text-xs sm:text-sm hover:bg-white/10 rounded transition-colors duration-200 break-words"
                    onClick={() => setMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {/* Show related topics */}
            {msg.relatedTopics && msg.relatedTopics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {msg.relatedTopics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 mt-1 text-xs ${
            isUser ? 'text-blue-600 justify-end' : 'text-gray-500 justify-start'
          }`}>
            <Clock className="w-3 h-3" />
            {format(new Date(msg.timestamp), 'HH:mm')}
            {msg.responseTime > 0 && (
              <span>{msg.responseTime}ms</span>
            )}
            {msg.confidence < 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Confidence: {(msg.confidence * 100).toFixed(0)}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
      <Card className="w-full h-full sm:h-[90vh] sm:max-w-6xl flex flex-col bg-white sm:rounded-lg overflow-hidden">
        <CardHeader className="flex-shrink-0 pb-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2 h-auto"
              >
                {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Brain className="w-5 h-5" />
                <span className="hidden sm:inline">FinSight AI Assistant</span>
                <span className="sm:hidden">AI Assistant</span>
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="hidden sm:flex"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2 h-auto">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex overflow-hidden p-0 relative">
          {/* Sidebar */}
          <div className={`
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
            ${isMobile ? 'absolute inset-y-0 left-0 z-20 w-[280px] shadow-xl' : 'relative w-64'}
            flex flex-col border-r bg-white transition-transform duration-300 ease-in-out
          `}>
            <div className="p-3 border-b flex-shrink-0">
              <Button
                onClick={createNewConversation}
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            <ScrollArea className="flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400" ref={scrollAreaRef}>
              <div className="p-2 space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200 ${
                      activeConversation?.id === conv.id ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                    onClick={() => handleConversationSelect(conv)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {editingTitle === conv.id ? (
                        <Input
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onBlur={() => updateConversationTitle(conv.id, tempTitle)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateConversationTitle(conv.id, tempTitle);
                            }
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          <div
                            className="flex-1 text-sm font-medium truncate"
                            onDoubleClick={() => {
                              setEditingTitle(conv.id);
                              setTempTitle(conv.title);
                            }}
                          >
                            {conv.title}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitle(conv.id);
                                setTempTitle(conv.title);
                              }}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveConversation(conv.id);
                              }}
                            >
                              <Archive className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(conv.updatedAt), 'MMM d, HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Overlay for mobile sidebar */}
          {isMobile && showSidebar && (
            <div 
              className="absolute inset-0 bg-black/30 z-10"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {activeConversation ? (
              <>
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
                >
                  <div className="p-2 sm:p-4 space-y-2 min-h-full">
                    {activeConversation.messages.map(renderMessage)}
                    {isLoading && (
                      <div className="flex justify-start px-2">
                        <div className="bg-gray-100 rounded-lg p-3 sm:p-4 max-w-[90%] sm:max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>

                {showScrollButton && (
                  <button
                    onClick={() => scrollToBottom('smooth')}
                    className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                    aria-label="Scroll to bottom"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}

                <div className="border-t p-2 sm:p-4 flex-shrink-0 bg-white">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about stocks, portfolio, market trends..."
                      className="flex-1 text-sm sm:text-base"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !message.trim()}
                      size="sm"
                      className="flex-shrink-0 px-3 sm:px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Quick actions */}
                  <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage('What are the top gaining stocks today?')}
                      className="text-xs h-7 px-2 sm:px-3"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span className="hidden xs:inline">Top Gainers</span>
                      <span className="xs:hidden">Gainers</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage('How is my portfolio performing?')}
                      className="text-xs h-7 px-2 sm:px-3"
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      <span className="hidden xs:inline">Portfolio</span>
                      <span className="xs:hidden">Portfolio</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage('What\'s the market sentiment?')}
                      className="text-xs h-7 px-2 sm:px-3"
                    >
                      <Brain className="w-3 h-3 mr-1" />
                      <span className="hidden xs:inline">Sentiment</span>
                      <span className="xs:hidden">Sentiment</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
                <div className="text-center max-w-md mx-auto">
                  <Brain className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Welcome to FinSight AI
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    Your intelligent financial assistant is ready to help with stocks, portfolio analysis, and market insights.
                  </p>
                  <Button onClick={createNewConversation} size="sm" className="mb-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Conversation
                  </Button>

                  {/* Quick start options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div 
                      className="p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => {
                        createNewConversation();
                        setTimeout(() => setMessage('Show me my portfolio performance'), 100);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-sm">Portfolio Analysis</span>
                      </div>
                      <p className="text-xs text-gray-600">Get insights on your investments</p>
                    </div>
                    <div 
                      className="p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => {
                        createNewConversation();
                        setTimeout(() => setMessage('What are today\'s market trends?'), 100);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-sm">Market Trends</span>
                      </div>
                      <p className="text-xs text-gray-600">Latest market updates</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }
      `}</style>
    </div>
  );
}