// Utility functions for API calls with error handling and caching

interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading?: boolean;
}

export class ApiClient {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 60000; // 1 minute

  static async get<T>(
    url: string,
    options: RequestInit = {},
    useCache = true
  ): Promise<ApiResponse<T>> {
    try {
      // Check cache first
      if (useCache) {
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
          return { data: cached.data };
        }
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.error || 'Network error occurred' };
      }

      const data = await response.json();

      // Cache the response
      if (useCache) {
        this.cache.set(url, { data, timestamp: Date.now() });
      }

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Failed to fetch data' };
    }
  }

  static async post<T>(
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.error || 'Network error occurred' };
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Failed to post data' };
    }
  }

  static async delete<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.error || 'Network error occurred' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Failed to delete data' };
    }
  }

  static clearCache() {
    this.cache.clear();
  }
}