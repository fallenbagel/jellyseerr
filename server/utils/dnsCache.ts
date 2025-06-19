import logger from '@server/logger';
import { DnsCacheManager } from 'dns-caching';

const dnsCache = new DnsCacheManager({ logger });
export default dnsCache;
