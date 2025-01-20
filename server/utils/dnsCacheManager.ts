import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { LRUCache } from 'lru-cache';
import dns from 'node:dns';

interface DnsCache {
  address: string;
  family: number;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
}

class DnsCacheManager {
  private cache: LRUCache<string, DnsCache>;
  private lookupAsync: typeof dns.promises.lookup;
  private resolver: dns.promises.Resolver;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
  };
  private hardTtlMs: number;

  constructor(maxSize = 500, hardTtlMs = 300000) {
    this.cache = new LRUCache<string, DnsCache>({
      max: maxSize,
      ttl: hardTtlMs,
    });
    this.hardTtlMs = hardTtlMs;
    this.lookupAsync = dns.promises.lookup;
    this.resolver = new dns.promises.Resolver();
  }

  async lookup(hostname: string): Promise<DnsCache> {
    // Ignore for localhost
    if (hostname === 'localhost') {
      return {
        address: '127.0.0.1',
        family: 4,
        timestamp: Date.now(),
        ttl: 0,
      };
    }

    const cached = this.cache.get(hostname);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const ttlRemaining = Math.max(0, cached.ttl - age);

      if (ttlRemaining > 0) {
        this.stats.hits++;
        logger.debug(`DNS cache hit for ${hostname}`, {
          label: 'DNSCache',
          address: cached.address,
          family: cached.family,
          age,
          ttlRemaining,
        });
        return cached;
      }

      // soft expiration using stale entry while refreshing
      if (age < this.hardTtlMs) {
        this.stats.hits++;
        logger.debug(`Using stale DNS cache for ${hostname}`, {
          label: 'DNSCache',
          address: cached.address,
          family: cached.family,
          age,
          ttlRemaining,
        });

        // revalidation
        this.resolveWithTtl(hostname)
          .then((result) => {
            this.cache.set(hostname, {
              address: result.address,
              family: result.family,
              timestamp: Date.now(),
              ttl: result.ttl,
            });
            logger.debug(`DNS cache refreshed for ${hostname}`, {
              label: 'DNSCache',
              address: result.address,
              family: result.family,
              ttl: result.ttl,
            });
          })
          .catch((error) => {
            logger.error(
              `Failed to refresh DNS for ${hostname}: ${error.message}`
            );
          });

        return cached;
      }

      // hard expiration: remove stale entry
      this.cache.delete(hostname);
    }

    this.stats.misses++;
    try {
      const result = await this.resolveWithTtl(hostname);

      const dnsCache: DnsCache = {
        address: result.address,
        family: result.family,
        timestamp: Date.now(),
        ttl: result.ttl,
      };

      this.cache.set(hostname, dnsCache, { ttl: this.hardTtlMs });
      logger.debug(`DNS cache miss for ${hostname}, cached new result`, {
        label: 'DNSCache',
        address: dnsCache.address,
        family: dnsCache.family,
        ttl: result.ttl,
      });

      return dnsCache;
    } catch (error) {
      throw new Error(`DNS lookup failed for ${hostname}: ${error.message}`);
    }
  }

  private async resolveWithTtl(
    hostname: string
  ): Promise<{ address: string; family: number; ttl: number }> {
    if (
      !this.resolver ||
      typeof this.resolver.resolve4 !== 'function' ||
      typeof this.resolver.resolve6 !== 'function'
    ) {
      throw new Error('Resolver is not initialized');
    }

    try {
      const [ipv4Records, ipv6Records] = await Promise.allSettled([
        this.resolver.resolve4(hostname, { ttl: true }),
        this.resolver.resolve6(hostname, { ttl: true }),
      ]);

      let record: { address: string; ttl: number } | null = null;
      let family = 4;

      const settings = getSettings();
      const preferIpv6 = settings.main.forceIpv4First ? false : true;

      if (preferIpv6) {
        if (
          ipv6Records.status === 'fulfilled' &&
          ipv6Records.value.length > 0
        ) {
          record = ipv6Records.value[0];
          family = 6;
        } else if (
          ipv4Records.status === 'fulfilled' &&
          ipv4Records.value.length > 0
        ) {
          record = ipv4Records.value[0];
          family = 4;
        }
      } else {
        if (
          ipv4Records.status === 'fulfilled' &&
          ipv4Records.value.length > 0
        ) {
          record = ipv4Records.value[0];
          family = 4;
        } else if (
          ipv6Records.status === 'fulfilled' &&
          ipv6Records.value.length > 0
        ) {
          record = ipv6Records.value[0];
          family = 6;
        }
      }

      if (!record) {
        throw new Error('No DNS records found for ${hostname');
      }

      const ttl = record.ttl > 0 ? record.ttl * 1000 : 30000;
      logger.debug(
        `Resolved ${hostname} with TTL: ${record.ttl} (Original), ${ttl} (Applied)`
      );

      return { address: record.address, family, ttl };
    } catch (error) {
      logger.error(`Failed to resolve ${hostname} with TTL: ${error.message}`, {
        label: 'DNSCache',
      });
      throw error;
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
      const ttl = Math.max(0, data.ttl - age);

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
