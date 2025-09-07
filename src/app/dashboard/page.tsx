'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Search, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  lastUpdated: string;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: string;
  addedAt: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  matchScore?: string;
  marketOpen?: string;
  marketClose?: string;
}

interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stockData, setStockData] = useState<{ [key: string]: StockData }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('watchlist');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch watchlist on component mount
  useEffect(() => {
    fetchWatchlist();
  }, []);

  // Fetch stock data for watchlist items
  useEffect(() => {
    if (watchlist.length > 0) {
      fetchStockDataForWatchlist();
    }
  }, [watchlist]);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Failed to load watchlist');
    }
  };

  const fetchStockDataForWatchlist = async () => {
    setLoading(true);
    try {
      const promises = watchlist.map(async (item) => {
        const response = await fetch(`/api/stocks/${item.symbol}`);
        if (response.ok) {
          const data = await response.json();
          return { symbol: item.symbol, data };
        }
        return null;
      });
      const results = await Promise.all(promises);
      const newStockData: { [key: string]: StockData } = {};
      
      results.forEach((result) => {
        if (result) {
          newStockData[result.symbol] = result.data;
        }
      });
      setStockData(newStockData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const refreshStockData = async () => {
    setRefreshing(true);
    await fetchStockDataForWatchlist();
    setRefreshing(false);
    toast.success('Stock data refreshed');
  };

  const searchStocks = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    setLoading(true);
    setSearchResults([]);
    try {
      console.log('🔍 Searching for:', searchQuery);
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
      
      console.log('📡 Search response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Search results received:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setSearchResults(data);
          toast.success(`Found ${data.length} results for "${searchQuery}"`);
        } else {
          toast.error('No results found. Try a different search term.');
          setSearchResults([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Search failed:', errorData);
        
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a minute and try again.');
        } else if (response.status === 404) {
          toast.error('No results found for this search term.');
        } else {
          toast.error(errorData.error || 'Search failed. Please try again.');
        }
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      toast.error('Network error. Please check your connection.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (stock: SearchResult) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          type: stock.type.toLowerCase()
        })
      });
      if (response.ok) {
        toast.success(`${stock.symbol} added to watchlist`);
        fetchWatchlist();
        setSearchResults([]);
        setSearchQuery('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add to watchlist');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      const response = await fetch(`/api/watchlist/${symbol}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success(`${symbol} removed from watchlist`);
        fetchWatchlist();
        setStockData(prev => {
          const newData = { ...prev };
          delete newData[symbol];
          return newData;
        });
        // Clear chart if the removed symbol was selected
        if (selectedStock === symbol) {
          setSelectedStock(null);
          setChartData([]);
        }
      } else {
        toast.error('Failed to remove from watchlist');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };

  const fetchChartData = async (symbol: string) => {
    setChartLoading(true);
    try {
      const response = await fetch(`/api/stocks/${symbol}/chart`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
        setSelectedStock(symbol);
        // Switch to charts tab
        setCurrentTab('charts');
        toast.success(`Chart loaded for ${symbol}`);
      } else {
        toast.error('Failed to load chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: string | number) => {
    // Handle undefined or null values
    if (value === undefined || value === null) {
      return 'N/A';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Handle NaN values
    if (isNaN(numValue)) {
      return 'N/A';
    }
    
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };

  const formatVolume = (volume: number | undefined) => {
    // Handle undefined or null values
    if (volume === undefined || volume === null) {
      return 'N/A';
    }
    
    // Handle NaN values
    if (isNaN(volume)) {
      return 'N/A';
    }
    
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  // Loading skeleton component
  const StockCardSkeleton = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session?.user?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Track your investments and market insights
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Button
              onClick={refreshStockData}
              disabled={refreshing || loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Badge variant="outline" className="text-sm">
              Real-time Data
            </Badge>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Stocks & Crypto
            </CardTitle>
            <CardDescription>
              Find and add stocks or cryptocurrencies to your watchlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter symbol or company name (e.g., AAPL, Tesla, Microsoft)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchStocks()}
                className="flex-1"
              />
              <Button onClick={searchStocks} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Enhanced search results section */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">
                  Found {searchResults.length} results for "{searchQuery}"
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((stock, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600">{stock.symbol}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{stock.type}</span>
                          {stock.matchScore && (
                            <span className="text-xs text-gray-500">
                              Match: {Math.round(parseFloat(stock.matchScore) * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-800 font-medium mt-1">{stock.name}</div>
                        <div className="text-xs text-gray-500">
                          {stock.region} • {stock.currency}
                          {stock.marketOpen && stock.marketClose && (
                            <> • Market: {stock.marketOpen} - {stock.marketClose}</>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToWatchlist(stock)}
                        className="flex items-center gap-1 ml-4"
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="mt-2"
                >
                  Clear Results
                </Button>
              </div>
            )}
            
            {/* Add loading state display */}
            {loading && searchQuery && (
              <div className="mt-4 text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <span className="text-sm text-gray-500">Searching for "{searchQuery}"...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Dashboard Content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="watchlist" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Watchlist
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
          </TabsList>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-4">
            {watchlist.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Your watchlist is empty
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by searching and adding stocks or cryptocurrencies above
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {watchlist.map((item) => {
                  const data = stockData[item.symbol];
                  const isLoading = loading && !data;
                  
                  if (isLoading) {
                    return <StockCardSkeleton key={item.id} />;
                  }
                  return (
                    <Card key={item.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-bold">{item.symbol}</CardTitle>
                            <CardDescription className="text-sm line-clamp-1">
                              {item.name}
                            </CardDescription>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {item.type.toUpperCase()}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {data ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">
                                {formatCurrency(data.price)}
                              </span>
                              <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                                data.change >= 0 
                                  ? 'text-green-700 bg-green-100' 
                                  : 'text-red-700 bg-red-100'
                              }`}>
                                {data.change >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {formatPercentage(data.changePercent)}
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Change:</span>
                                <span className={data.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {data.change >= 0 ? '+' : ''}{formatCurrency(data.change)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Open:</span>
                                <span>{formatCurrency(data.open)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>High:</span>
                                <span className="text-green-600">{formatCurrency(data.high)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Low:</span>
                                <span className="text-red-600">{formatCurrency(data.low)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Volume:</span>
                                <span>{formatVolume(data.volume)}</span>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchChartData(item.symbol)}
                                disabled={chartLoading}
                                className="w-full flex items-center gap-2"
                              >
                                <BarChart3 className="h-4 w-4" />
                                {chartLoading && selectedStock === item.symbol 
                                  ? 'Loading Chart...' 
                                  : 'View Chart'
                                }
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <span className="text-sm text-gray-500">Loading data...</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            {selectedStock && chartData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {selectedStock} Price Chart
                    {stockData[selectedStock] && (
                      <div className={`ml-auto flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
                        stockData[selectedStock].change >= 0 
                          ? 'text-green-700 bg-green-100' 
                          : 'text-red-700 bg-red-100'
                      }`}>
                        {stockData[selectedStock].change >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatCurrency(stockData[selectedStock].price)} 
                        ({formatPercentage(stockData[selectedStock].changePercent)})
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Historical price data for the last 30 trading days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          formatter={(value: number, name) => [
                            formatCurrency(value),
                            name === 'close' ? 'Close Price' : 
                            name === 'high' ? 'High' :
                            name === 'low' ? 'Low' : 'Open'
                          ]}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#colorPrice)"
                        />
                        <Line
                          type="monotone"
                          dataKey="high"
                          stroke="#10b981"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="low"
                          stroke="#ef4444"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Chart Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    {chartData.length > 0 && (
                      <>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">30-Day High</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(Math.max(...chartData.map(d => d.high)))}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">30-Day Low</p>
                          <p className="text-lg font-semibold text-red-600">
                            {formatCurrency(Math.min(...chartData.map(d => d.low)))}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Avg Volume</p>
                          <p className="text-lg font-semibold">
                            {formatVolume(chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Data Points</p>
                          <p className="text-lg font-semibold">
                            {chartData.length} days
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : chartLoading ? (
              <Card>
                <CardHeader>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No chart selected
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click "View Chart" on any stock in your watchlist to display its price chart here
                  </p>
                  {watchlist.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {watchlist.slice(0, 5).map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          size="sm"
                          onClick={() => fetchChartData(item.symbol)}
                          disabled={chartLoading}
                        >
                          View {item.symbol}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Portfolio Tab (Placeholder for Part 3) */}
          <TabsContent value="portfolio" className="space-y-4">
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                🚀 Portfolio simulation features will be available in Part 3 of this project.
                Stay tuned for advanced portfolio tracking, virtual trading, and AI-powered investment insights!
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Portfolio Coming Soon
                </h3>
                <p className="text-gray-600 mb-4">
                  Part 3 will include portfolio simulation, virtual trading, AI insights, and much more!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Market Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Watchlist</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{watchlist.length}</div>
              <p className="text-xs text-muted-foreground">
                {watchlist.length === 1 ? '1 symbol tracked' : `${watchlist.length} symbols tracked`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Open</div>
              <p className="text-xs text-muted-foreground">
                US Markets (Live Data)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gainers Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(stockData).filter(data => data.change > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Positive performers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Losers Today</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {Object.values(stockData).filter(data => data.change < 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Negative performers
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}