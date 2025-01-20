import logger from '@server/logger';
import { LRUCache } from 'lru-cache';
import dns from 'node:dns';

interface DnsCache {
  address: string;
  family: number;
  timestamp: number;
}

interface CacheStats {
  hits: number;
  misses: number;
}

class DnsCacheManager {
  private cache: LRUCache<string, DnsCache>;
  private lookupAsync: typeof dns.promises.lookup;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
  };

  constructor(ttlMs = 300000) {
    this.cache = new LRUCache<string, DnsCache>({ max: 500, ttl: ttlMs });
    this.lookupAsync = dns.promises.lookup;
  }

  async lookup(hostname: string): Promise<DnsCache> {
    const cached = this.cache.get(hostname);
    if (cached) {
      this.stats.hits++;
      logger.debug(`DNS cache hit for ${hostname}`, {
        label: 'DNSCache',
        address: cached.address,
        family: cached.family,
        age: Date.now() - cached.timestamp,
      });
      return cached;
    }

    this.stats.misses++;
    try {
      const result = await this.lookupAsync(hostname);
      const dnsCache: DnsCache = {
        address: result.address,
        family: result.family,
        timestamp: Date.now(),
      };

      this.cache.set(hostname, dnsCache);
      logger.debug(`DNS cache miss for ${hostname}, cached new result`, {
        label: 'DNSCache',
        address: dnsCache.address,
        family: dnsCache.family,
      });
      return dnsCache;
    } catch (error) {
      throw new Error(`DNS lookup failed for ${hostname}: ${error.message}`);
    }
  }

  getStats() {
    const entries = [...this.cache.entries()];
    return {
      size: entries.length,
      maxSize: this.cache.max,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses || 1),
    };
  }

  getCacheEntries() {
    const entries: Record<
      string,
      {
        address: string;
        family: number;
        age: number;
        ttl: number;
      }
    > = {};

    for (const [hostname, data] of this.cache.entries()) {
      const age = Date.now() - data.timestamp;
      const ttl = (this.cache.ttl ?? 300000) - age;

      entries[hostname] = {
        address: data.address,
        family: data.family,
        age,
        ttl,
      };
    }

    return entries;
  }

  getCacheEntry(hostname: string) {
    const entry = this.cache.get(hostname);
    if (!entry) {
      return null;
    }

    return {
      address: entry.address,
      family: entry.family,
      age: Date.now() - entry.timestamp,
      ttl: (this.cache.ttl ?? 300000) - (Date.now() - entry.timestamp),
    };
  }

  clear() {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    logger.debug('DNS cache cleared', { label: 'DNSCache' });
  }
}

export const dnsCache = new DnsCacheManager();
