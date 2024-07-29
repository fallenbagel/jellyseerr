import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { UserSettings } from '@server/entity/UserSettings';
import type {
  UserSettingsGeneralResponse,
  UserSettingsNotificationsResponse,
} from '@server/interfaces/api/userSettingsInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import { canMakePermissionsChange } from '.';

const isOwnProfileOrAdmin = (): Middleware => {
  const authMiddleware: Middleware = (req, res, next) => {
    if (
      !req.user?.hasPermission(Permission.MANAGE_USERS) &&
      req.user?.id !== Number(req.params.id)
    ) {
      return next({
        status: 403,
        message: "You do not have permission to view this user's settings.",
      });
    }

    next();
  };
  return authMiddleware;
};

const userSettingsRoutes = Router({ mergeParams: true });

userSettingsRoutes.get<{ id: string }, UserSettingsGeneralResponse>(
  '/main',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const {
      main: { defaultQuotas },
    } = getSettings();
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      return res.status(200).json({
        username: user.username,
        email: user.email,
        discordId: user.settings?.discordId,
        locale: user.settings?.locale,
        region: user.settings?.region,
        originalLanguage: user.settings?.originalLanguage,
        movieQuotaLimit: user.movieQuotaLimit,
        movieQuotaDays: user.movieQuotaDays,
        tvQuotaLimit: user.tvQuotaLimit,
        tvQuotaDays: user.tvQuotaDays,
        globalMovieQuotaDays: defaultQuotas.movie.quotaDays,
        globalMovieQuotaLimit: defaultQuotas.movie.quotaLimit,
        globalTvQuotaDays: defaultQuotas.tv.quotaDays,
        globalTvQuotaLimit: defaultQuotas.tv.quotaLimit,
        watchlistSyncMovies: user.settings?.watchlistSyncMovies,
        watchlistSyncTv: user.settings?.watchlistSyncTv,
      });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<
  { id: string },
  UserSettingsGeneralResponse,
  UserSettingsGeneralResponse
>('/main', isOwnProfileOrAdmin(), async (req, res, next) => {
  const userRepository = getRepository(User);

  try {
    const user = await userRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!user) {
      return next({ status: 404, message: 'User not found.' });
    }

    // "Owner" user settings cannot be modified by other users
    if (user.id === 1 && req.user?.id !== 1) {
      return next({
        status: 403,
        message: "You do not have permission to modify this user's settings.",
      });
    }

    user.username = req.body.username;
    if (user.jellyfinUsername) {
      user.email = req.body.email || user.jellyfinUsername || user.email;
    }

    // Update quota values only if the user has the correct permissions
    if (
      !user.hasPermission(Permission.MANAGE_USERS) &&
      req.user?.id !== user.id
    ) {
      user.movieQuotaDays = req.body.movieQuotaDays;
      user.movieQuotaLimit = req.body.movieQuotaLimit;
      user.tvQuotaDays = req.body.tvQuotaDays;
      user.tvQuotaLimit = req.body.tvQuotaLimit;
    }

    if (!user.settings) {
      user.settings = new UserSettings({
        user: req.user,
        discordId: req.body.discordId,
        locale: req.body.locale,
        region: req.body.region,
        originalLanguage: req.body.originalLanguage,
        watchlistSyncMovies: req.body.watchlistSyncMovies,
        watchlistSyncTv: req.body.watchlistSyncTv,
      });
    } else {
      user.settings.discordId = req.body.discordId;
      user.settings.locale = req.body.locale;
      user.settings.region = req.body.region;
      user.settings.originalLanguage = req.body.originalLanguage;
      user.settings.watchlistSyncMovies = req.body.watchlistSyncMovies;
      user.settings.watchlistSyncTv = req.body.watchlistSyncTv;
    }

    const savedUser = await userRepository.save(user);

    return res.status(200).json({
      username: savedUser.username,
      discordId: savedUser.settings?.discordId,
      locale: savedUser.settings?.locale,
      region: savedUser.settings?.region,
      originalLanguage: savedUser.settings?.originalLanguage,
      watchlistSyncMovies: savedUser.settings?.watchlistSyncMovies,
      watchlistSyncTv: savedUser.settings?.watchlistSyncTv,
      email: savedUser.email,
    });
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

userSettingsRoutes.get<{ id: string }, { hasPassword: boolean }>(
  '/password',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
        select: ['id', 'password'],
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      return res.status(200).json({ hasPassword: !!user.password });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<
  { id: string },
  null,
  { currentPassword?: string; newPassword: string }
>('/password', isOwnProfileOrAdmin(), async (req, res, next) => {
  const userRepository = getRepository(User);

  try {
    const user = await userRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    const userWithPassword = await userRepository.findOne({
      select: ['id', 'password'],
      where: { id: Number(req.params.id) },
    });

    if (!user || !userWithPassword) {
      return next({ status: 404, message: 'User not found.' });
    }

    if (req.body.newPassword.length < 8) {
      return next({
        status: 400,
        message: 'Password must be at least 8 characters.',
      });
    }

    if (
      (user.id === 1 && req.user?.id !== 1) ||
      (user.hasPermission(Permission.ADMIN) &&
        user.id !== req.user?.id &&
        req.user?.id !== 1)
    ) {
      return next({
        status: 403,
        message: "You do not have permission to modify this user's password.",
      });
    }

    // If the user has the permission to manage users and they are not
    // editing themselves, we will just set the new password
    if (
      req.user?.hasPermission(Permission.MANAGE_USERS) &&
      req.user?.id !== user.id
    ) {
      await user.setPassword(req.body.newPassword);
      await userRepository.save(user);
      logger.debug('Password overriden by user.', {
        label: 'User Settings',
        userEmail: user.email,
        changingUser: req.user.email,
      });
      return res.status(204).send();
    }

    // If the user has a password, we need to check the currentPassword is correct
    if (
      user.password &&
      (!req.body.currentPassword ||
        !(await userWithPassword.passwordMatch(req.body.currentPassword)))
    ) {
      logger.debug(
        'Attempt to change password for user failed. Invalid current password provided.',
        { label: 'User Settings', userEmail: user.email }
      );
      return next({ status: 403, message: 'Current password is invalid.' });
    }

    await user.setPassword(req.body.newPassword);
    await userRepository.save(user);

    return res.status(204).send();
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

userSettingsRoutes.get<{ id: string }, UserSettingsNotificationsResponse>(
  '/notifications',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);
    const settings = getSettings()?.notifications.agents;

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      return res.status(200).json({
        emailEnabled: settings.email.enabled,
        pgpKey: user.settings?.pgpKey,
        discordEnabled:
          settings?.discord.enabled && settings.discord.options.enableMentions,
        discordEnabledTypes:
          settings?.discord.enabled && settings.discord.options.enableMentions
            ? settings.discord.types
            : 0,
        discordId: user.settings?.discordId,
        pushbulletAccessToken: user.settings?.pushbulletAccessToken,
        pushoverApplicationToken: user.settings?.pushoverApplicationToken,
        pushoverUserKey: user.settings?.pushoverUserKey,
        pushoverSound: user.settings?.pushoverSound,
        telegramEnabled: settings.telegram.enabled,
        telegramBotUsername: settings.telegram.options.botUsername,
        telegramChatId: user.settings?.telegramChatId,
        telegramSendSilently: user.settings?.telegramSendSilently,
        webPushEnabled: settings.webpush.enabled,
        notificationTypes: user.settings?.notificationTypes ?? {},
      });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<{ id: string }, UserSettingsNotificationsResponse>(
  '/notifications',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      // "Owner" user settings cannot be modified by other users
      if (user.id === 1 && req.user?.id !== 1) {
        return next({
          status: 403,
          message: "You do not have permission to modify this user's settings.",
        });
      }

      if (!user.settings) {
        user.settings = new UserSettings({
          user: req.user,
          pgpKey: req.body.pgpKey,
          discordId: req.body.discordId,
          pushbulletAccessToken: req.body.pushbulletAccessToken,
          pushoverApplicationToken: req.body.pushoverApplicationToken,
          pushoverUserKey: req.body.pushoverUserKey,
          telegramChatId: req.body.telegramChatId,
          telegramSendSilently: req.body.telegramSendSilently,
          notificationTypes: req.body.notificationTypes,
        });
      } else {
        user.settings.pgpKey = req.body.pgpKey;
        user.settings.discordId = req.body.discordId;
        user.settings.pushbulletAccessToken = req.body.pushbulletAccessToken;
        user.settings.pushoverApplicationToken =
          req.body.pushoverApplicationToken;
        user.settings.pushoverUserKey = req.body.pushoverUserKey;
        user.settings.pushoverSound = req.body.pushoverSound;
        user.settings.telegramChatId = req.body.telegramChatId;
        user.settings.telegramSendSilently = req.body.telegramSendSilently;
        user.settings.notificationTypes = Object.assign(
          {},
          user.settings.notificationTypes,
          req.body.notificationTypes
        );
      }

      userRepository.save(user);

      return res.status(200).json({
        pgpKey: user.settings.pgpKey,
        discordId: user.settings.discordId,
        pushbulletAccessToken: user.settings.pushbulletAccessToken,
        pushoverApplicationToken: user.settings.pushoverApplicationToken,
        pushoverUserKey: user.settings.pushoverUserKey,
        pushoverSound: user.settings.pushoverSound,
        telegramChatId: user.settings.telegramChatId,
        telegramSendSilently: user.settings.telegramSendSilently,
        notificationTypes: user.settings.notificationTypes,
      });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.get<{ id: string }, { permissions?: number }>(
  '/permissions',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      return res.status(200).json({ permissions: user.permissions });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<
  { id: string },
  { permissions?: number },
  { permissions: number }
>(
  '/permissions',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      // "Owner" user permissions cannot be modified, and users cannot set their own permissions
      if (user.id === 1 || req.user?.id === user.id) {
        return next({
          status: 403,
          message: 'You do not have permission to modify this user',
        });
      }

      if (!canMakePermissionsChange(req.body.permissions, req.user)) {
        return next({
          status: 403,
          message: 'You do not have permission to grant this level of access',
        });
      }
      user.permissions = req.body.permissions;

      await userRepository.save(user);

      return res.status(200).json({ permissions: user.permissions });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

export default userSettingsRoutes;
