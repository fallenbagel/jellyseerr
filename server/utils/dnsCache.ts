import logger from '@server/logger';
import { DnsCacheManager } from 'dns-caching';

const dnsCache = new DnsCacheManager({
  logger: logger,
  forceMaxTtl: Number(process.env.DNS_CACHE_FORCE_MAX_TTL) || -1,
  forceMinTtl: Number(process.env.DNS_CACHE_FORCE_MIN_TTL) || 0,
});
export default dnsCache;
