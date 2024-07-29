import type { RateLimitOptions } from '@server/utils/rateLimit';
import rateLimit from '@server/utils/rateLimit';
import type NodeCache from 'node-cache';

// 5 minute default TTL (in seconds)
const DEFAULT_TTL = 300;

// 10 seconds default rolling buffer (in ms)
const DEFAULT_ROLLING_BUFFER = 10000;

interface ExternalAPIOptions {
  nodeCache?: NodeCache;
  headers?: Record<string, unknown>;
  rateLimit?: RateLimitOptions;
}

class ExternalAPI {
  protected fetch: typeof fetch;
  protected params: Record<string, string>;
  protected defaultHeaders: { [key: string]: string };
  private baseUrl: string;
  private cache?: NodeCache;

  constructor(
    baseUrl: string,
    params: Record<string, string> = {},
    options: ExternalAPIOptions = {}
  ) {
    if (options.rateLimit) {
      this.fetch = rateLimit(fetch, options.rateLimit);
    } else {
      this.fetch = fetch;
    }

    this.baseUrl = baseUrl;
    this.params = params;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };
    this.cache = options.nodeCache;
  }

  protected async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    ttl?: number,
    config?: RequestInit
  ): Promise<T> {
    const cacheKey = this.serializeCacheKey(endpoint, {
      ...this.params,
      ...params,
    });
    const cachedItem = this.cache?.get<T>(cacheKey);
    if (cachedItem) {
      return cachedItem;
    }

    const url = this.formatUrl(endpoint, params);
    const response = await this.fetch(url, {
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config?.headers,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `${response.status} ${response.statusText}${text ? ': ' + text : ''}`,
        {
          cause: response,
        }
      );
    }
    const data = await this.getDataFromResponse(response);

    if (this.cache) {
      this.cache.set(cacheKey, data, ttl ?? DEFAULT_TTL);
    }

    return data;
  }

  protected async post<T>(
    endpoint: string,
    data: Record<string, unknown>,
    params?: Record<string, string>,
    ttl?: number,
    config?: RequestInit
  ): Promise<T> {
    const cacheKey = this.serializeCacheKey(endpoint, {
      config: { ...this.params, ...params },
      data,
    });
    const cachedItem = this.cache?.get<T>(cacheKey);
    if (cachedItem) {
      return cachedItem;
    }

    const url = this.formatUrl(endpoint, params);
    const response = await this.fetch(url, {
      method: 'POST',
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config?.headers,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `${response.status} ${response.statusText}${text ? ': ' + text : ''}`,
        {
          cause: response,
        }
      );
    }
    const resData = await this.getDataFromResponse(response);

    if (this.cache) {
      this.cache.set(cacheKey, resData, ttl ?? DEFAULT_TTL);
    }

    return resData;
  }

  protected async put<T>(
    endpoint: string,
    data: Record<string, unknown>,
    params?: Record<string, string>,
    ttl?: number,
    config?: RequestInit
  ): Promise<T> {
    const cacheKey = this.serializeCacheKey(endpoint, {
      config: { ...this.params, ...params },
      data,
    });
    const cachedItem = this.cache?.get<T>(cacheKey);
    if (cachedItem) {
      return cachedItem;
    }

    const url = this.formatUrl(endpoint, params);
    const response = await this.fetch(url, {
      method: 'PUT',
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config?.headers,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `${response.status} ${response.statusText}${text ? ': ' + text : ''}`,
        {
          cause: response,
        }
      );
    }
    const resData = await this.getDataFromResponse(response);

    if (this.cache) {
      this.cache.set(cacheKey, resData, ttl ?? DEFAULT_TTL);
    }

    return resData;
  }

  protected async delete<T>(
    endpoint: string,
    params?: Record<string, string>,
    config?: RequestInit
  ): Promise<T> {
    const url = this.formatUrl(endpoint, params);
    const response = await this.fetch(url, {
      method: 'DELETE',
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config?.headers,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `${response.status} ${response.statusText}${text ? ': ' + text : ''}`,
        {
          cause: response,
        }
      );
    }
    const data = await this.getDataFromResponse(response);

    return data;
  }

  protected async getRolling<T>(
    endpoint: string,
    params?: Record<string, string>,
    ttl?: number,
    config?: RequestInit,
    overwriteBaseUrl?: string
  ): Promise<T> {
    const cacheKey = this.serializeCacheKey(endpoint, {
      ...this.params,
      ...params,
    });
    const cachedItem = this.cache?.get<T>(cacheKey);

    if (cachedItem) {
      const keyTtl = this.cache?.getTtl(cacheKey) ?? 0;

      // If the item has passed our rolling check, fetch again in background
      if (
        keyTtl - (ttl ?? DEFAULT_TTL) * 1000 <
        Date.now() - DEFAULT_ROLLING_BUFFER
      ) {
        const url = this.formatUrl(endpoint, params, overwriteBaseUrl);
        this.fetch(url, {
          ...config,
          headers: {
            ...this.defaultHeaders,
            ...config?.headers,
          },
        }).then(async (response) => {
          if (!response.ok) {
            const text = await response.text();
            throw new Error(
              `${response.status} ${response.statusText}${
                text ? ': ' + text : ''
              }`,
              {
                cause: response,
              }
            );
          }
          const data = await this.getDataFromResponse(response);
          this.cache?.set(cacheKey, data, ttl ?? DEFAULT_TTL);
        });
      }
      return cachedItem;
    }

    const url = this.formatUrl(endpoint, params, overwriteBaseUrl);
    const response = await this.fetch(url, {
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config?.headers,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `${response.status} ${response.statusText}${text ? ': ' + text : ''}`,
        {
          cause: response,
        }
      );
    }
    const data = await this.getDataFromResponse(response);

    if (this.cache) {
      this.cache.set(cacheKey, data, ttl ?? DEFAULT_TTL);
    }

    return data;
  }

  private formatUrl(
    endpoint: string,
    params?: Record<string, string>,
    overwriteBaseUrl?: string
  ): string {
    const baseUrl = overwriteBaseUrl || this.baseUrl;
    const href =
      baseUrl +
      (baseUrl.endsWith('/') ? '' : '/') +
      (endpoint.startsWith('/') ? endpoint.slice(1) : endpoint);
    const searchParams = new URLSearchParams({
      ...this.params,
      ...params,
    });
    return `${href}?${searchParams.toString()}`;
  }

  private serializeCacheKey(
    endpoint: string,
    params?: Record<string, unknown>
  ) {
    if (!params) {
      return `${this.baseUrl}${endpoint}`;
    }

    return `${this.baseUrl}${endpoint}${JSON.stringify(params)}`;
  }

  private async getDataFromResponse(response: Response) {
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else if (
      contentType?.includes('application/xml') ||
      contentType?.includes('text/html') ||
      contentType?.includes('text/plain')
    ) {
      return await response.text();
    } else {
      try {
        return await response.json();
      } catch {
        try {
          return await response.blob();
        } catch {
          return null;
        }
      }
    }
  }
}

export default ExternalAPI;
