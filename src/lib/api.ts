// Utility functions for API calls with error handling and caching

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading?: boolean;
}

export class ApiClient {
  private static cache = new Map<string, { data: unknown; timestamp: number }>();
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
          return { data: cached.data as T };
        }
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const message = (errorData && (errorData.error as string)) || 'Network error occurred';
        return { error: message };
      }

      const data = (await response.json()) as T;

      // Cache the response
      if (useCache) {
        this.cache.set(url, { data, timestamp: Date.now() });
      }

      return { data };
    } catch (error) {
      const err = error as unknown;
      console.error('API Error (GET):', err);
      return { error: 'Failed to fetch data' };
    }
  }

  static async post<T>(
    url: string,
    data: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        },
        body: JSON.stringify(data ?? {}),
        ...options,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const message = (errorData && (errorData.error as string)) || 'Network error occurred';
        return { error: message };
      }

      const responseData = (await response.json()) as T;
      return { data: responseData };
    } catch (error) {
      const err = error as unknown;
      console.error('API Error (POST):', err);
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
          ...(options.headers as Record<string, string>),
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const message = (errorData && (errorData.error as string)) || 'Network error occurred';
        return { error: message };
      }

      const data = (await response.json()) as T;
      return { data };
    } catch (error) {
      const err = error as unknown;
      console.error('API Error (DELETE):', err);
      return { error: 'Failed to delete data' };
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}
