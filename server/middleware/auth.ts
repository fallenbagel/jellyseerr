import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type {
  Permission,
  PermissionCheckOptions,
} from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';

export const checkUser: Middleware = async (req, _res, next) => {
  const settings = getSettings();
  let user: User | undefined | null;

  const userRepository = getRepository(User);
  let trustedProxy = false;
  // Client IP addresses are appended in this header.
  // The first header should be the client IP and the last header
  // should be the address of proxy just upstream of us. We use that
  // address to figure out if it should be trusted
  // Default to the remote address
  let proxyIP = req.connection.remoteAddress;

  if (req.header('X-Forwarded-For')) {
    const addresses = req
      .header('X-Forwarded-For')!
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val.length > 0);

    if (addresses.length > 0) {
      proxyIP = addresses.pop();
    }
  }

  if (proxyIP && proxyIP.indexOf('.') != -1) {
    trustedProxy = settings.network.trustedProxies.v4.includes(proxyIP);
  } else if (proxyIP) {
    trustedProxy = settings.network.trustedProxies.v6.includes(proxyIP);
  }

  if (req.header('X-API-Key') === settings.main.apiKey) {
    let userId = 1; // Work on original administrator account

    // If a User ID is provided, we will act on that user's behalf
    if (req.header('X-API-User')) {
      userId = Number(req.header('X-API-User'));
    }

    user = await userRepository.findOne({ where: { id: userId } });
  } else if (settings.network.forwardAuth.enabled && trustedProxy) {
    const userValue = req.header(settings.network.forwardAuth.userHeader) ?? '';
    const emailValue =
      (settings.network.forwardAuth.emailHeader &&
        settings.network.forwardAuth.emailHeader != '' &&
        req.header(settings.network.forwardAuth.emailHeader)) ??
      '';

    let query: object[] = [];

    if (
      settings.network.forwardAuth.emailHeader &&
      settings.network.forwardAuth.emailHeader != '' &&
      emailValue != ''
    ) {
      // email header was specified so we must verify it
      query = [
        {
          jellyfinUsername: userValue,
          email: emailValue,
        },
        {
          plexUsername: userValue,
          email: emailValue,
        },
      ];
    } else if (userValue != '') {
      // email header not specified, just check the user header
      query = [
        {
          jellyfinUsername: userValue,
        },
        {
          plexUsername: userValue,
        },
      ];
    }

    if (query.length > 0) {
      user = await userRepository.findOne({
        where: query,
      });
    }
  } else if (req.session?.userId) {
    user = await userRepository.findOne({
      where: { id: req.session.userId },
    });
  }

  if (user) {
    req.user = user;
  }

  req.locale = user?.settings?.locale
    ? user.settings.locale
    : settings.main.locale;

  next();
};

export const isAuthenticated = (
  permissions?: Permission | Permission[],
  options?: PermissionCheckOptions
): Middleware => {
  const authMiddleware: Middleware = (req, res, next) => {
    if (!req.user || !req.user.hasPermission(permissions ?? 0, options)) {
      res.status(403).json({
        status: 403,
        error: 'You do not have permission to access this endpoint',
      });
    } else {
      next();
    }
  };
  return authMiddleware;
};
