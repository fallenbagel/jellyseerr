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
  const clientIP = req.header('X-Forwarded-For');
  let trustedProxy = false;

  if (clientIP && clientIP.indexOf('.') != -1) {
    trustedProxy = settings.network.trustedProxies.v4.includes(clientIP);
  } else if (clientIP) {
    trustedProxy = settings.network.trustedProxies.v6.includes(clientIP);
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
