import csurf from '@dr.pogodin/csurf';
import PlexAPI from '@server/api/plexapi';
import dataSource, { getRepository, isPgsql } from '@server/datasource';
import DiscoverSlider from '@server/entity/DiscoverSlider';
import { Session } from '@server/entity/Session';
import { User } from '@server/entity/User';
import { startJobs } from '@server/job/schedule';
import notificationManager from '@server/lib/notifications';
import DiscordAgent from '@server/lib/notifications/agents/discord';
import EmailAgent from '@server/lib/notifications/agents/email';
import GotifyAgent from '@server/lib/notifications/agents/gotify';
import LunaSeaAgent from '@server/lib/notifications/agents/lunasea';
import NtfyAgent from '@server/lib/notifications/agents/ntfy';
import PushbulletAgent from '@server/lib/notifications/agents/pushbullet';
import PushoverAgent from '@server/lib/notifications/agents/pushover';
import SlackAgent from '@server/lib/notifications/agents/slack';
import TelegramAgent from '@server/lib/notifications/agents/telegram';
import WebhookAgent from '@server/lib/notifications/agents/webhook';
import WebPushAgent from '@server/lib/notifications/agents/webpush';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import clearCookies from '@server/middleware/clearcookies';
import routes from '@server/routes';
import avatarproxy from '@server/routes/avatarproxy';
import imageproxy from '@server/routes/imageproxy';
import { appDataPermissions } from '@server/utils/appDataVolume';
import { getAppVersion } from '@server/utils/appVersion';
import createCustomProxyAgent from '@server/utils/customProxyAgent';
import { dnsCache } from '@server/utils/dnsCacheManager';
import restartFlag from '@server/utils/restartFlag';
import { getClientIp } from '@supercharge/request-ip';
import { TypeormStore } from 'connect-typeorm/out';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import type { Store } from 'express-session';
import session from 'express-session';
import next from 'next';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import dns from 'node:dns';

const API_SPEC_PATH = path.join(__dirname, '../jellyseerr-api.yml');

logger.info(`Starting Jellyseerr version ${getAppVersion()}`);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

if (!appDataPermissions()) {
  logger.error(
    'Something went wrong while checking config folder! Please ensure the config folder is set up properly.\nhttps://docs.jellyseerr.dev/getting-started'
  );
}

app
  .prepare()
  .then(async () => {
    const dbConnection = await dataSource.initialize();

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      if (isPgsql) {
        await dbConnection.runMigrations();
      } else {
        await dbConnection.query('PRAGMA foreign_keys=OFF');
        await dbConnection.runMigrations();
        await dbConnection.query('PRAGMA foreign_keys=ON');
      }
    }

    // Load Settings
    const settings = await getSettings().load();
    restartFlag.initializeSettings(settings);

    const originalDnsLookup = dns.lookup;
    const originalPromisify = originalDnsLookup.__promisify__;

    // Add DNS caching
    dns.lookup = (() => {
      const wrappedLookup = function (
        hostname: string,
        options:
          | number
          | dns.LookupOneOptions
          | dns.LookupOptions
          | dns.LookupAllOptions,
        callback: (
          err: NodeJS.ErrnoException | null,
          address: string | dns.LookupAddress[] | undefined,
          family?: number
        ) => void
      ): void {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }

        dnsCache
          .lookup(hostname)
          .then((result) => {
            if ((options as dns.LookupOptions).all) {
              const allAddresses: dns.LookupAddress[] = [];

              result.addresses.ipv4.forEach((addr) => {
                allAddresses.push({ address: addr, family: 4 });
              });

              result.addresses.ipv6.forEach((addr) => {
                allAddresses.push({ address: addr, family: 6 });
              });

              callback(
                null,
                allAddresses.length > 0
                  ? allAddresses
                  : [{ address: result.activeAddress, family: result.family }]
              );
            } else {
              callback(null, result.activeAddress, result.family);
            }
          })
          .catch((error) => {
            logger.warn(
              `Cached DNS lookup failed for ${hostname}, falling back to native DNS: ${error.message}`,
              {
                label: 'DNSCache',
              }
            );

            try {
              originalDnsLookup(hostname, options as any, (err, addr, fam) => {
                if (!err && addr) {
                  const cacheEntry = {
                    addresses: {
                      ipv4: Array.isArray(addr)
                        ? addr
                            .filter((a) => !a.address.includes(':'))
                            .map((a) => a.address)
                        : typeof addr === 'string' && !addr.includes(':')
                        ? [addr]
                        : [],
                      ipv6: Array.isArray(addr)
                        ? addr
                            .filter((a) => a.address.includes(':'))
                            .map((a) => a.address)
                        : typeof addr === 'string' && addr.includes(':')
                        ? [addr]
                        : [],
                    },
                    activeAddress: Array.isArray(addr)
                      ? addr[0]?.address || ''
                      : addr || '',
                    family: Array.isArray(addr)
                      ? addr[0]?.family || 4
                      : fam || 4,
                    timestamp: Date.now(),
                    ttl: 60000,
                    networkErrors: 0,
                  };

                  dnsCache.updateCache(hostname, cacheEntry).catch(() => {
                    logger.debug(
                      `Failed to update DNS cache for ${hostname}: ${err.message}`,
                      {
                        label: 'DNSCache',
                      }
                    );
                  });
                }
                callback(err, addr, fam);
              });
              return;
            } catch (fallbackError) {
              logger.error(
                `Native DNS fallback also failed for ${hostname}: ${fallbackError.message}`,
                {
                  label: 'DNSCache',
                }
              );
            }

            callback(error, undefined, undefined);
          });
      } as typeof dns.lookup;

      (wrappedLookup as any).__promisify__ = async function (
        hostname: string,
        options?:
          | dns.LookupAllOptions
          | dns.LookupOneOptions
          | number
          | dns.LookupOptions
      ): Promise<dns.LookupAddress[] | { address: string; family: number }> {
        try {
          const result = await dnsCache.lookup(hostname);

          // Check if options has 'all' property and it's true
          if (
            options &&
            typeof options === 'object' &&
            'all' in options &&
            options.all === true
          ) {
            const allAddresses: dns.LookupAddress[] = [];

            result.addresses.ipv4.forEach((addr) => {
              allAddresses.push({ address: addr, family: 4 });
            });

            result.addresses.ipv6.forEach((addr) => {
              allAddresses.push({ address: addr, family: 6 });
            });

            return allAddresses.length > 0
              ? allAddresses
              : [{ address: result.activeAddress, family: result.family }];
          }

          return { address: result.activeAddress, family: result.family };
        } catch (error) {
          try {
            if (originalPromisify) {
              let nativeResult:
                | dns.LookupAddress[]
                | { address: string; family: number };

              if (
                options &&
                typeof options === 'object' &&
                'all' in options &&
                options.all === true
              ) {
                nativeResult = await originalPromisify(
                  hostname,
                  options as dns.LookupAllOptions
                );
              } else if (options && typeof options === 'object') {
                nativeResult = await originalPromisify(
                  hostname,
                  options as dns.LookupOneOptions
                );
              } else if (typeof options === 'number') {
                nativeResult = await originalPromisify(hostname, options);
              } else {
                nativeResult = await originalPromisify(hostname);
              }

              let ipv4Addresses: string[] = [];
              let ipv6Addresses: string[] = [];
              let activeAddress = '';
              let family = 4;

              if (Array.isArray(nativeResult)) {
                ipv4Addresses = nativeResult
                  .filter((a) => a.family === 4)
                  .map((a) => a.address);

                ipv6Addresses = nativeResult
                  .filter((a) => a.family === 6)
                  .map((a) => a.address);

                if (nativeResult.length > 0) {
                  activeAddress = nativeResult[0].address;
                  family = nativeResult[0].family;
                }
              } else {
                activeAddress = nativeResult.address;
                family = nativeResult.family;

                if (family === 4) {
                  ipv4Addresses = [activeAddress];
                } else {
                  ipv6Addresses = [activeAddress];
                }
              }

              const cacheEntry = {
                addresses: {
                  ipv4: ipv4Addresses,
                  ipv6: ipv6Addresses,
                },
                activeAddress,
                family,
                timestamp: Date.now(),
                ttl: 60000,
                networkErrors: 0,
              };

              dnsCache.updateCache(hostname, cacheEntry).catch(() => {
                logger.debug(
                  `Failed to update DNS cache for ${hostname} after native lookup: ${err.message}`,
                  {
                    label: 'DNSCache',
                  }
                );
              });

              return nativeResult;
            }
          } catch (fallbackError) {
            logger.error(
              `Native DNS fallback also failed for ${hostname}: ${fallbackError.message}`,
              {
                label: 'DNSCache',
              }
            );
          }

          throw error;
        }
      };

      return wrappedLookup;
    })();

    // Register HTTP proxy
    if (settings.network.proxy.enabled) {
      await createCustomProxyAgent(settings.network.proxy);
    }

    // Migrate library types
    if (
      settings.plex.libraries.length > 1 &&
      !settings.plex.libraries[0].type
    ) {
      const userRepository = getRepository(User);
      const admin = await userRepository.findOne({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });

      if (admin) {
        logger.info('Migrating Plex libraries to include media type', {
          label: 'Settings',
        });

        const plexapi = new PlexAPI({ plexToken: admin.plexToken });
        await plexapi.syncLibraries();
      }
    }

    // Register Notification Agents
    notificationManager.registerAgents([
      new DiscordAgent(),
      new EmailAgent(),
      new GotifyAgent(),
      new NtfyAgent(),
      new LunaSeaAgent(),
      new PushbulletAgent(),
      new PushoverAgent(),
      new SlackAgent(),
      new TelegramAgent(),
      new WebhookAgent(),
      new WebPushAgent(),
    ]);

    const userRepository = getRepository(User);
    const totalUsers = await userRepository.count();
    if (totalUsers > 0) {
      startJobs();
    } else {
      logger.info(
        `Skipping starting the scheduled jobs as we have no Plex/Jellyfin/Emby servers setup yet`,
        {
          label: 'Server',
        }
      );
    }

    // Bootstrap Discovery Sliders
    await DiscoverSlider.bootstrapSliders();

    const server = express();
    if (settings.network.trustProxy) {
      server.enable('trust proxy');
    }
    server.use(cookieParser());
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));
    server.use((req, _res, next) => {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(req, 'ip');
        if (descriptor?.writable === true) {
          (req as any).ip = getClientIp(req) ?? '';
        }
      } catch (e) {
        logger.error('Failed to attach the ip to the request', {
          label: 'Middleware',
          message: e.message,
        });
      } finally {
        next();
      }
    });
    if (settings.network.csrfProtection) {
      server.use(
        csurf({
          cookie: {
            httpOnly: true,
            sameSite: true,
            secure: !dev,
          },
        })
      );
      server.use((req, res, next) => {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {
          sameSite: true,
          secure: !dev,
        });
        next();
      });
    }

    // Set up sessions
    const sessionRespository = getRepository(Session);
    server.use(
      '/api',
      session({
        secret: settings.clientId,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 30,
          httpOnly: true,
          sameSite: settings.network.csrfProtection ? 'strict' : 'lax',
          secure: 'auto',
        },
        store: new TypeormStore({
          cleanupLimit: 2,
          ttl: 60 * 60 * 24 * 30,
        }).connect(sessionRespository) as Store,
      })
    );
    const apiDocs = YAML.load(API_SPEC_PATH);
    server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocs));
    server.use(
      OpenApiValidator.middleware({
        apiSpec: API_SPEC_PATH,
        validateRequests: true,
      })
    );
    /**
     * This is a workaround to convert dates to strings before they are validated by
     * OpenAPI validator. Otherwise, they are treated as objects instead of strings
     * and response validation will fail
     */
    server.use((_req, res, next) => {
      const original = res.json;
      res.json = function jsonp(json) {
        return original.call(this, JSON.parse(JSON.stringify(json)));
      };
      next();
    });
    server.use('/api/v1', routes);

    // Do not set cookies so CDNs can cache them
    server.use('/imageproxy', clearCookies, imageproxy);
    server.use('/avatarproxy', clearCookies, avatarproxy);

    server.get('*', (req, res) => handle(req, res));
    server.use(
      (
        err: { status: number; message: string; errors: string[] },
        _req: Request,
        res: Response,
        // We must provide a next function for the function signature here even though its not used
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _next: NextFunction
      ) => {
        // format error
        res.status(err.status || 500).json({
          message: err.message,
          errors: err.errors,
        });
      }
    );

    const port = Number(process.env.PORT) || 5055;
    const host = process.env.HOST;
    if (host) {
      server.listen(port, host, () => {
        logger.info(`Server ready on ${host} port ${port}`, {
          label: 'Server',
        });
      });
    } else {
      server.listen(port, () => {
        logger.info(`Server ready on port ${port}`, {
          label: 'Server',
        });
      });
    }
  })
  .catch((err) => {
    logger.error(err.stack);
    process.exit(1);
  });
