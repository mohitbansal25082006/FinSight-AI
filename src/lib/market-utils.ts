export interface MarketData {
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

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MarketUtils {
  /**
   * Format currency values with proper locale and precision
   */
  static formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Format percentage values with proper sign and precision
   */
  static formatPercentage(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const sign = numValue >= 0 ? '+' : '';
    return `${sign}${numValue.toFixed(2)}%`;
  }

  /**
   * Format large volume numbers with K/M/B suffixes
   */
  static formatVolume(volume: number): string {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  }

  /**
   * Get color class based on price change
   */
  static getChangeColor(change: number): string {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Get background color class based on price change
   */
  static getChangeBgColor(change: number): string {
    return change >= 0 
      ? 'text-green-700 bg-green-100' 
      : 'text-red-700 bg-red-100';
  }

  /**
   * Calculate simple moving average
   */
  static calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const squaredDifferences = prices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / prices.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Determine if market is open (simplified - US market hours)
   */
  static isMarketOpen(): boolean {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const est = new Date(utc.getTime() - 5 * 3600000); // EST offset (note: does not account for DST)
    
    const day = est.getDay();
    const hour = est.getHours();
    const minutes = est.getMinutes();
    
    // Market closed on weekends
    if (day === 0 || day === 6) return false;
    
    // Market hours: 9:30 AM - 4:00 PM EST
    if (hour < 9) return false;
    if (hour === 9 && minutes < 30) return false;
    if (hour > 16) return false;
    if (hour === 16) return false; // close at 16:00

    return true;
  }

  /**
   * Get market status text
   */
  static getMarketStatus(): { status: string; className: string } {
    const isOpen = this.isMarketOpen();
    return {
      status: isOpen ? 'OPEN' : 'CLOSED',
      className: isOpen ? 'text-green-600' : 'text-red-600'
    };
  }

  /**
   * Format date for chart display
   */
  static formatChartDate(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  /**
   * Format date for tooltip
   */
  static formatTooltipDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get chart statistics from data
   */
  static getChartStats(chartData: ChartDataPoint[]) {
    if (chartData.length === 0) return null;

    const highs = chartData.map(d => d.high);
    const lows = chartData.map(d => d.low);
    const volumes = chartData.map(d => d.volume);
    const closes = chartData.map(d => d.close);

    const periodHigh = Math.max(...highs);
    const periodLow = Math.min(...lows);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const volatility = this.calculateVolatility(closes);

    return {
      periodHigh,
      periodLow,
      avgVolume,
      volatility,
      dataPoints: chartData.length
    };
  }

  /**
   * Validate stock symbol format
   */
  static isValidSymbol(symbol: string): boolean {
    // Basic validation for stock symbols (1-5 uppercase letters)
    return /^[A-Z]{1,5}$/.test(symbol.trim().toUpperCase());
  }

  /**
   * Clean and format symbol
   */
  static formatSymbol(symbol: string): string {
    return symbol.trim().toUpperCase();
  }

  /**
   * Generate random color for charts
   */
  static generateChartColor(index: number): string {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // emerald  
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316'  // orange
    ];
    return colors[index % colors.length];
  }

  /**
   * Debounce function for search
   *
   * Note: kept simple to avoid cross-environment timer type mismatches (NodeJS vs DOM).
   */
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return (...args: Parameters<T>): void => {
      if (timeoutId !== undefined) {
        // cast to unknown -> any to satisfy both DOM and Node typings at compile time
        clearTimeout(timeoutId as unknown as number);
      }

      // store timer id (cast) so we can clear it later
      timeoutId = setTimeout(() => {
        // call the original function with captured args
        // using spread keeps correct arguments and types
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        func(...args);
      }, wait) as unknown as ReturnType<typeof setTimeout>;
    };
  }

  /**
   * Calculate performance metrics
   */
  static calculatePerformance(chartData: ChartDataPoint[]) {
    if (chartData.length < 2) return null;

    const firstPrice = chartData[0].close;
    const lastPrice = chartData[chartData.length - 1].close;
    const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Calculate daily returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const dailyReturn = ((chartData[i].close - chartData[i - 1].close) / chartData[i - 1].close) * 100;
      dailyReturns.push(dailyReturn);
    }

    const avgDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const volatility = this.calculateVolatility(dailyReturns);

    return {
      totalReturn,
      avgDailyReturn,
      volatility,
      sharpeRatio: volatility > 0 ? avgDailyReturn / volatility : 0
    };
  }
}

/**
 * API Response wrapper for better error handling
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create standardized API responses
 */
export class ApiResponseHelper {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message
    };
  }

  static error(error: string, data?: unknown): ApiResponse<unknown> {
    return {
      success: false,
      error,
      data
    };
  }
}

/**
 * Cache manager for API responses
 */
export class CacheManager {
  private static cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  static set(key: string, data: unknown, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  static size(): number {
    return this.cache.size;
  }
}
