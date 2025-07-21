import JellyfinAPI from '@server/api/jellyfin';
import PlexTvAPI from '@server/api/plextv';
import { ApiErrorCode } from '@server/constants/error';
import { MediaServerType, ServerType } from '@server/constants/server';
import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { startJobs } from '@server/job/schedule';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { checkAvatarChanged } from '@server/routes/avatarproxy';
import { ApiError } from '@server/types/error';
import { getAppVersion } from '@server/utils/appVersion';
import { getHostname } from '@server/utils/getHostname';
import axios from 'axios';
import * as EmailValidator from 'email-validator';
import { Router } from 'express';
import net from 'net';
const authRoutes = Router();

authRoutes.get('/me', isAuthenticated(), async (req, res) => {
  const userRepository = getRepository(User);
  if (!req.user) {
    return res.status(500).json({
      status: 500,
      error: 'Please sign in.',
    });
  }
  const user = await userRepository.findOneOrFail({
    where: { id: req.user.id },
  });

  // check if email is required in settings and if user has an valid email
  const settings = await getSettings();
  if (
    settings.notifications.agents.email.options.userEmailRequired &&
    !EmailValidator.validate(user.email)
  ) {
    user.warnings.push('userEmailRequired');
    logger.warn(`User ${user.username} has no valid email address`);
  }

  return res.status(200).json(user);
});

authRoutes.post('/plex', async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);
  const body = req.body as {
    authToken?: string;
    profileId?: string;
    pin?: string;
    isSetup?: boolean;
  };

  if (!body.authToken) {
    return next({
      status: 500,
      message: 'Authentication token required.',
    });
  }

  if (
    settings.main.mediaServerType != MediaServerType.NOT_CONFIGURED &&
    (settings.main.mediaServerLogin === false ||
      settings.main.mediaServerType != MediaServerType.PLEX)
  ) {
    return res.status(500).json({ error: 'Plex login is disabled' });
  }

  try {
    const plextv = new PlexTvAPI(body.authToken);
    const account = await plextv.getUser();
    const profiles = await plextv.getProfiles();
    const mainUserProfile = profiles.find((p) => p.isMainUser);

    // Special handling for setup process
    if (body.isSetup) {
      let user = await userRepository
        .createQueryBuilder('user')
        .where('user.plexId = :id', { id: account.id })
        .orWhere('user.email = :email', {
          email: account.email.toLowerCase(),
        })
        .getOne();

      // First user setup - create the admin user
      if (!user && !(await userRepository.count())) {
        user = new User({
          email: account.email,
          plexUsername: account.username,
          plexId: account.id,
          plexToken: account.authToken,
          permissions: Permission.ADMIN,
          avatar: account.thumb,
          userType: UserType.PLEX,
          plexProfileId: mainUserProfile?.id || account.id.toString(),
          isPlexProfile: false,
        });

        settings.main.mediaServerType = MediaServerType.PLEX;
        await settings.save();
        startJobs();

        await userRepository.save(user);
      } else if (user) {
        // Update existing user with latest Plex data
        user.plexToken = account.authToken;
        user.plexId = account.id;
        user.avatar = account.thumb;
        user.plexProfileId = mainUserProfile?.id || account.id.toString();

        await userRepository.save(user);
      }

      // Return user directly, bypassing profile selection
      if (user && req.session) {
        req.session.userId = user.id;
      }
      return res.status(200).json(user?.filter() ?? {});
    }

    // Validate PIN for main account
    if (!body.profileId && mainUserProfile?.protected && body.pin) {
      const isPinValid = await plextv.validateProfilePin(
        mainUserProfile.id,
        body.pin
      );
      if (!isPinValid) {
        return next({
          status: 403,
          error: 'INVALID_PIN.',
        });
      }
    }

    // Handle direct profile login
    if (body.profileId) {
      const profileUser = await userRepository.findOne({
        where: { plexProfileId: body.profileId },
      });

      if (profileUser) {
        profileUser.plexToken = body.authToken;
        await userRepository.save(profileUser);

        if (req.session) {
          req.session.userId = profileUser.id;
        }

        return res.status(200).json(profileUser.filter() ?? {});
      } else {
        return next({
          status: 400,
          message: 'Invalid profile selection.',
        });
      }
    }

    // Standard Plex authentication flow
    let user = await userRepository
      .createQueryBuilder('user')
      .where('user.plexId = :id', { id: account.id })
      .orWhere('user.email = :email', {
        email: account.email.toLowerCase(),
      })
      .getOne();

    if (!user && !(await userRepository.count())) {
      // First user setup through standard auth flow
      user = new User({
        email: account.email,
        plexUsername: account.username,
        plexId: account.id,
        plexToken: account.authToken,
        permissions: Permission.ADMIN,
        avatar: account.thumb,
        userType: UserType.PLEX,
        plexProfileId: account.id.toString(),
        isPlexProfile: false,
      });

      settings.main.mediaServerType = MediaServerType.PLEX;
      await settings.save();
      startJobs();

      await userRepository.save(user);
    } else {
      const mainUser = await userRepository.findOneOrFail({
        select: { id: true, plexToken: true, plexId: true, email: true },
        where: { id: 1 },
      });
      const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');

      if (!account.id) {
        logger.error('Plex ID was missing from Plex.tv response', {
          label: 'API',
          ip: req.ip,
          email: account.email,
          plexUsername: account.username,
        });

        return next({
          status: 500,
          message: 'Something went wrong. Try again.',
        });
      }

      if (
        account.id === mainUser.plexId ||
        (account.email === mainUser.email && !mainUser.plexId) ||
        (await mainPlexTv.checkUserAccess(account.id))
      ) {
        if (user) {
          if (!user.plexId) {
            logger.info(
              'Found matching Plex user; updating user with Plex data',
              {
                label: 'API',
                ip: req.ip,
                email: user.email,
                userId: user.id,
                plexId: account.id,
                plexUsername: account.username,
              }
            );
          }
          // Update existing user
          user.plexToken = body.authToken;
          user.plexId = account.id;
          user.avatar = account.thumb;
          user.email = account.email;
          user.plexUsername = account.username;
          user.userType = UserType.PLEX;
          user.plexProfileId = account.id.toString();
          user.isPlexProfile = false;

          await userRepository.save(user);
        } else if (!settings.main.newPlexLogin) {
          logger.warn(
            'Failed sign-in attempt by unimported Plex user with access to the media server',
            {
              label: 'API',
              ip: req.ip,
              email: account.email,
              plexId: account.id,
              plexUsername: account.username,
            }
          );
          return next({
            status: 403,
            error: ApiErrorCode.NewPlexLoginDisabled,
            message: 'Access denied.',
          });
        } else {
          // Create new user
          user = new User({
            email: account.email,
            plexUsername: account.username,
            plexId: account.id,
            plexToken: account.authToken,
            permissions: settings.main.defaultPermissions,
            avatar: account.thumb,
            userType: UserType.PLEX,
            plexProfileId: account.id.toString(),
            isPlexProfile: false,
          });

          await userRepository.save(user);
        }
      } else {
        logger.info(
          'Sign-in attempt from Plex user with access to the media server; creating new Jellyseerr user',
          {
            label: 'API',
            ip: req.ip,
            email: account.email,
            plexId: account.id,
            plexUsername: account.username,
          }
        );
        return next({
          status: 403,
          error: ApiErrorCode.NewPlexLoginDisabled,
          message: 'Access denied.',
        });
      }
    }

    const adminUser = await userRepository.findOne({ where: { id: 1 } });
    const isMainUser = profiles.some(
      (profile) => profile.isMainUser && profile.id === account.id.toString()
    );
    const isAdmin = user?.id === adminUser?.id;

    if (isMainUser || isAdmin) {
      // Only update existing profiles for the main user
      for (const profile of profiles) {
        if (profile.isMainUser) continue;

        const existingProfileUser = await userRepository.findOne({
          where: { plexProfileId: profile.id },
        });

        if (existingProfileUser) {
          // Only update profiles that don't have their own Plex ID
          // or are already marked as profiles
          if (
            !existingProfileUser.plexId ||
            existingProfileUser.plexId === user.plexId ||
            existingProfileUser.isPlexProfile
          ) {
            existingProfileUser.plexToken = user.plexToken;
            existingProfileUser.avatar = profile.thumb;
            existingProfileUser.plexUsername =
              profile.username || profile.title;
            await userRepository.save(existingProfileUser);
          }
        }
      }
    }

    if (isAdmin || isMainUser) {
      // Return main user ID and profiles for selection
      const mainUserIdToSend =
        user?.id && Number(user.id) > 0 ? Number(user.id) : 1;

      return res.status(200).json({
        status: 'REQUIRES_PROFILE',
        mainUserId: mainUserIdToSend,
        profiles: profiles,
      });
    } else {
      // For non-main users, just log them in directly
      if (req.session) {
        req.session.userId = user.id;
      }
      return res.status(200).json(user?.filter() ?? {});
    }
  } catch (e) {
    logger.error('Something went wrong authenticating with Plex account', {
      label: 'API',
      errorMessage: e.message,
      ip: req.ip,
    });
    return next({
      status: 500,
      message: 'Unable to authenticate.',
    });
  }
});

authRoutes.post('/plex/profile/select', async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);

  const profileId = req.body.profileId;
  const mainUserIdRaw = req.body.mainUserId;
  const pin = req.body.pin;
  const authToken = req.body.authToken;

  if (!profileId) {
    return next({
      status: 400,
      message: 'Profile ID is required.',
    });
  }

  let mainUserId = 1; // Default to admin user

  if (mainUserIdRaw) {
    try {
      mainUserId =
        typeof mainUserIdRaw === 'string'
          ? parseInt(mainUserIdRaw, 10)
          : Number(mainUserIdRaw);

      if (isNaN(mainUserId) || mainUserId <= 0) {
        mainUserId = 1;
      }
    } catch (e) {
      mainUserId = 1;
    }
  }

  try {
    const mainUser = await userRepository.findOne({
      where: { id: mainUserId },
    });

    if (!mainUser) {
      return next({
        status: 404,
        message: 'Main user not found.',
      });
    }

    const tokenToUse = authToken || mainUser.plexToken;

    if (!tokenToUse) {
      return next({
        status: 400,
        message: 'No valid Plex token available.',
      });
    }

    const plextv = new PlexTvAPI(tokenToUse);

    const profiles = await plextv.getProfiles();
    const selectedProfile = profiles.find((p) => p.id === profileId);

    if (!selectedProfile) {
      return next({
        status: 404,
        message: 'Selected profile not found.',
      });
    }

    if (
      profileId === mainUser.plexProfileId ||
      selectedProfile.isMainUser === true
    ) {
      // Check if PIN is required and not provided
      if (selectedProfile.protected && !pin) {
        return res.status(200).json({
          status: 'REQUIRES_PIN',
          profileId: profileId,
          profileName:
            selectedProfile.title || selectedProfile.username || 'Main Account',
          mainUserId: mainUserId,
        });
      }

      if (selectedProfile.protected && pin) {
        const isPinValid = await plextv.validateProfilePin(profileId, pin);

        if (!isPinValid) {
          return next({
            status: 401,
            message: 'Invalid PIN.',
            error: ApiErrorCode.InvalidPin,
          });
        }

        try {
          await plextv.getUser();
        } catch (e) {
          return next({
            status: 401,
            message: 'Invalid PIN.',
            error: ApiErrorCode.InvalidPin,
          });
        }
      }

      if (mainUser.plexProfileId !== profileId && selectedProfile.isMainUser) {
        mainUser.plexProfileId = profileId;
        await userRepository.save(mainUser);
      }

      if (req.session) {
        req.session.userId = mainUser.id;
      }

      return res.status(200).json(mainUser.filter() ?? {});
    }

    if (selectedProfile.protected && !pin) {
      return res.status(200).json({
        status: 'REQUIRES_PIN',
        profileId: profileId,
        profileName:
          selectedProfile.title || selectedProfile.username || 'Unknown',
        mainUserId: mainUserId,
      });
    }

    if (selectedProfile.protected && pin) {
      const isPinValid = await plextv.validateProfilePin(profileId, pin);

      if (!isPinValid) {
        return next({
          status: 401,
          message: 'Invalid PIN.',
          error: ApiErrorCode.InvalidPin,
        });
      }
    }

    const userAccount = await plextv.getUser();
    const adminUser = await userRepository.findOne({ where: { id: 1 } });
    const isMainPlexUser = profiles.some(
      (profile) =>
        profile.isMainUser && profile.id === userAccount.id.toString()
    );
    const isAdminUser = mainUser.id === adminUser?.id;

    let profileUser = await userRepository.findOne({
      where: [
        { plexProfileId: profileId },
        { plexUsername: selectedProfile.username || selectedProfile.title },
      ],
    });
    // Profile doesn't exist yet - only allow creation for admin/main Plex user
    if (!profileUser) {
      // Profile doesn't exist yet
      if (!settings.main.newPlexLogin) {
        return next({
          status: 403,
          error: ApiErrorCode.NewPlexLoginDisabled,
          message: 'Access denied.',
        });
      }

      // Only allow profile creation for main Plex user or admin user
      if (!isMainPlexUser && !isAdminUser) {
        return next({
          status: 403,
          message: 'Only the Plex server owner can create profile users.',
        });
      }

      // Check for existing users that might match this profile
      const emailPrefix = mainUser.email.split('@')[0];
      const domainPart = mainUser.email.includes('@')
        ? mainUser.email.split('@')[1]
        : 'plex.local';

      const safeUsername = (selectedProfile.username || selectedProfile.title)
        .replace(/\s+/g, '.')
        .replace(/[^a-zA-Z0-9._-]/g, '');

      const proposedEmail = `${emailPrefix}+${safeUsername}@${domainPart}`;

      // First check for existing user with this email
      const existingEmailUser = await userRepository.findOne({
        where: { email: proposedEmail },
      });

      if (existingEmailUser) {
        logger.warn('Found existing user with same email as profile', {
          label: 'Auth',
          email: proposedEmail,
          profileId,
          existingUserId: existingEmailUser.id,
        });

        // Use the existing user
        profileUser = existingEmailUser;
      } else {
        // Then check for any other potential matches
        const allUsers = await userRepository.find();
        const matchingUser = allUsers.find(
          (u) =>
            u.plexProfileId?.includes(profileId) ||
            profileId.includes(u.plexProfileId || '')
        );

        if (matchingUser) {
          logger.info('Found matching profile user', {
            label: 'Auth',
            profileId,
            matchingUserId: matchingUser.id,
          });

          profileUser = matchingUser;
        } else {
          // Create a new profile user
          profileUser = new User({
            email: proposedEmail,
            plexUsername: selectedProfile.username || selectedProfile.title,
            plexId: mainUser.plexId,
            plexToken: tokenToUse,
            permissions: settings.main.defaultPermissions,
            avatar: selectedProfile.thumb,
            userType: UserType.PLEX,
            plexProfileId: profileId,
            isPlexProfile: true,
            mainPlexUserId: mainUser.id,
          });

          logger.info('Creating new profile user', {
            label: 'Auth',
            profileId,
            email: proposedEmail,
          });

          await userRepository.save(profileUser);
        }
      }
    } else {
      // Profile exists - only set mainPlexUserId if it's the main user creating it
      if (
        profileUser.plexId &&
        profileUser.plexId !== mainUser.plexId &&
        !profileUser.isPlexProfile
      ) {
        logger.warn('Attempted to use a regular Plex user as a profile', {
          label: 'Auth',
          profileId,
          userId: profileUser.id,
          mainUserId: mainUser.id,
        });

        // Simply use their account without modifying it
        if (req.session) {
          req.session.userId = profileUser.id;
        }
        return res.status(200).json(profileUser.filter() ?? {});
      }

      // Otherwise update and use this profile
      profileUser.plexToken = tokenToUse;
      profileUser.avatar = selectedProfile.thumb;
      profileUser.plexUsername =
        selectedProfile.username || selectedProfile.title;
      profileUser.mainPlexUserId = mainUser.id;
      profileUser.isPlexProfile = true;

      await userRepository.save(profileUser);

      if (req.session) {
        req.session.userId = profileUser.id;
      }
      return res.status(200).json(profileUser.filter() ?? {});
    }
  } catch (e) {
    return next({
      status: 500,
      message: 'Unable to select profile: ' + e.message,
    });
  }
});

authRoutes.get('/plex/profiles/:userId', async (req, res, next) => {
  const userRepository = getRepository(User);

  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return next({
        status: 400,
        message: 'Invalid user ID format.',
      });
    }

    const mainUser = await userRepository.findOne({
      where: { id: userId },
    });

    if (!mainUser) {
      return next({
        status: 404,
        message: 'User not found.',
      });
    }

    if (mainUser.userType !== UserType.PLEX) {
      return next({
        status: 400,
        message: 'Only Plex users have profiles.',
      });
    }

    if (!mainUser.plexToken) {
      return next({
        status: 400,
        message: 'User has no valid Plex token.',
      });
    }

    const plextv = new PlexTvAPI(mainUser.plexToken);
    const profiles = await plextv.getProfiles();

    const profileUsers = await userRepository.find({
      where: {
        mainPlexUserId: mainUser.id,
        isPlexProfile: true,
      },
    });

    return res.status(200).json({
      profiles,
      profileUsers,
      mainUser: mainUser.filter(),
    });
  } catch (e) {
    logger.error('Failed to fetch Plex profiles', {
      label: 'API',
      errorMessage: e.message,
      ip: req.ip,
    });

    return next({
      status: 500,
      message: 'Unable to fetch profiles.',
    });
  }
});

function getUserAvatarUrl(user: User): string {
  return `/avatarproxy/${user.jellyfinUserId}?v=${user.avatarVersion}`;
}

authRoutes.post('/jellyfin', async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);
  const body = req.body as {
    username?: string;
    password?: string;
    hostname?: string;
    port?: number;
    urlBase?: string;
    useSsl?: boolean;
    email?: string;
    serverType?: number;
  };

  //Make sure jellyfin login is enabled, but only if jellyfin && Emby is not already configured
  if (
    // media server not configured, allow login for setup
    settings.main.mediaServerType != MediaServerType.NOT_CONFIGURED &&
    (settings.main.mediaServerLogin === false ||
      // media server is neither jellyfin or emby
      (settings.main.mediaServerType !== MediaServerType.JELLYFIN &&
        settings.main.mediaServerType !== MediaServerType.EMBY &&
        settings.jellyfin.ip !== ''))
  ) {
    return res.status(500).json({ error: 'Jellyfin login is disabled' });
  }

  if (!body.username) {
    return res.status(500).json({ error: 'You must provide an username' });
  } else if (settings.jellyfin.ip !== '' && body.hostname) {
    return res
      .status(500)
      .json({ error: 'Jellyfin hostname already configured' });
  } else if (settings.jellyfin.ip === '' && !body.hostname) {
    return res.status(500).json({ error: 'No hostname provided.' });
  }

  try {
    const hostname =
      settings.jellyfin.ip !== ''
        ? getHostname()
        : getHostname({
            useSsl: body.useSsl,
            ip: body.hostname,
            port: body.port,
            urlBase: body.urlBase,
          });

    // Try to find deviceId that corresponds to jellyfin user, else generate a new one
    let user = await userRepository.findOne({
      where: { jellyfinUsername: body.username },
      select: { id: true, jellyfinDeviceId: true },
    });

    let deviceId = 'BOT_jellyseerr';
    if (user && user.id === 1) {
      // Admin is always BOT_jellyseerr
      deviceId = 'BOT_jellyseerr';
    } else if (user && user.jellyfinDeviceId) {
      deviceId = user.jellyfinDeviceId;
    } else if (body.username) {
      deviceId = Buffer.from(`BOT_jellyseerr_${body.username}`).toString(
        'base64'
      );
    }

    // First we need to attempt to log the user in to jellyfin
    const jellyfinserver = new JellyfinAPI(hostname ?? '', undefined, deviceId);

    const ip = req.ip;
    let clientIp;

    if (ip) {
      if (net.isIPv4(ip)) {
        clientIp = ip;
      } else if (net.isIPv6(ip)) {
        clientIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
      }
    }

    const account = await jellyfinserver.login(
      body.username,
      body.password,
      clientIp
    );

    // Next let's see if the user already exists
    user = await userRepository.findOne({
      where: { jellyfinUserId: account.User.Id },
    });

    const missingAdminUser = !user && !(await userRepository.count());
    if (
      missingAdminUser ||
      settings.main.mediaServerType === MediaServerType.NOT_CONFIGURED
    ) {
      // Check if user is admin on jellyfin
      if (account.User.Policy.IsAdministrator === false) {
        throw new ApiError(403, ApiErrorCode.NotAdmin);
      }

      if (
        body.serverType !== MediaServerType.JELLYFIN &&
        body.serverType !== MediaServerType.EMBY
      ) {
        throw new ApiError(500, ApiErrorCode.NoAdminUser);
      }
      settings.main.mediaServerType = body.serverType;

      if (missingAdminUser) {
        logger.info(
          'Sign-in attempt from Jellyfin user with access to the media server; creating initial admin user for Jellyseerr',
          {
            label: 'API',
            ip: req.ip,
            jellyfinUsername: account.User.Name,
          }
        );

        // User doesn't exist, and there are no users in the database, we'll create the user
        // with admin permissions

        user = new User({
          id: 1,
          email: body.email || account.User.Name,
          jellyfinUsername: account.User.Name,
          jellyfinUserId: account.User.Id,
          jellyfinDeviceId: deviceId,
          jellyfinAuthToken: account.AccessToken,
          permissions: Permission.ADMIN,
          userType:
            body.serverType === MediaServerType.JELLYFIN
              ? UserType.JELLYFIN
              : UserType.EMBY,
        });
        user.avatar = getUserAvatarUrl(user);

        await userRepository.save(user);
      } else {
        logger.info(
          'Sign-in attempt from Jellyfin user with access to the media server; editing admin user for Jellyseerr',
          {
            label: 'API',
            ip: req.ip,
            jellyfinUsername: account.User.Name,
          }
        );

        // User alread exist but settings.json is not configured, we'll edit the admin user

        user = await userRepository.findOne({
          where: { id: 1 },
        });
        if (!user) {
          throw new Error('Unable to find admin user to edit');
        }
        user.email = body.email || account.User.Name;
        user.jellyfinUsername = account.User.Name;
        user.jellyfinUserId = account.User.Id;
        user.jellyfinDeviceId = deviceId;
        user.jellyfinAuthToken = account.AccessToken;
        user.permissions = Permission.ADMIN;
        user.avatar = getUserAvatarUrl(user);
        user.userType =
          body.serverType === MediaServerType.JELLYFIN
            ? UserType.JELLYFIN
            : UserType.EMBY;

        await userRepository.save(user);
      }

      // Create an API key on Jellyfin from this admin user
      const jellyfinClient = new JellyfinAPI(
        hostname,
        account.AccessToken,
        deviceId
      );
      const apiKey = await jellyfinClient.createApiToken('Jellyseerr');

      const serverName = await jellyfinserver.getServerName();

      settings.jellyfin.name = serverName;
      settings.jellyfin.serverId = account.User.ServerId;
      settings.jellyfin.ip = body.hostname ?? '';
      settings.jellyfin.port = body.port ?? 8096;
      settings.jellyfin.urlBase = body.urlBase ?? '';
      settings.jellyfin.useSsl = body.useSsl ?? false;
      settings.jellyfin.apiKey = apiKey;
      await settings.save();
      startJobs();
    }
    // User already exists, let's update their information
    else if (account.User.Id === user?.jellyfinUserId) {
      logger.info(
        `Found matching ${
          settings.main.mediaServerType === MediaServerType.JELLYFIN
            ? ServerType.JELLYFIN
            : ServerType.EMBY
        } user; updating user with ${
          settings.main.mediaServerType === MediaServerType.JELLYFIN
            ? ServerType.JELLYFIN
            : ServerType.EMBY
        }`,
        {
          label: 'API',
          ip: req.ip,
          jellyfinUsername: account.User.Name,
        }
      );
      user.avatar = getUserAvatarUrl(user);
      user.jellyfinUsername = account.User.Name;

      if (user.username === account.User.Name) {
        user.username = '';
      }

      await userRepository.save(user);
    } else if (!settings.main.newPlexLogin) {
      logger.warn(
        'Failed sign-in attempt by unimported Jellyfin user with access to the media server',
        {
          label: 'API',
          ip: req.ip,
          jellyfinUserId: account.User.Id,
          jellyfinUsername: account.User.Name,
        }
      );
      return next({
        status: 403,
        message: 'Access denied.',
      });
    } else if (!user) {
      logger.info(
        'Sign-in attempt from Jellyfin user with access to the media server; creating new Jellyseerr user',
        {
          label: 'API',
          ip: req.ip,
          jellyfinUsername: account.User.Name,
        }
      );

      user = new User({
        email: body.email,
        jellyfinUsername: account.User.Name,
        jellyfinUserId: account.User.Id,
        jellyfinDeviceId: deviceId,
        permissions: settings.main.defaultPermissions,
        userType:
          settings.main.mediaServerType === MediaServerType.JELLYFIN
            ? UserType.JELLYFIN
            : UserType.EMBY,
      });
      user.avatar = getUserAvatarUrl(user);

      //initialize Jellyfin/Emby users with local login
      const passedExplicitPassword = body.password && body.password.length > 0;
      if (passedExplicitPassword) {
        await user.setPassword(body.password ?? '');
      }
      await userRepository.save(user);
    }

    if (user && user.jellyfinUserId) {
      try {
        const { changed } = await checkAvatarChanged(user);

        if (changed) {
          user.avatar = getUserAvatarUrl(user);
          await userRepository.save(user);
          logger.debug('Avatar updated during login', {
            userId: user.id,
            jellyfinUserId: user.jellyfinUserId,
          });
        }
      } catch (error) {
        logger.error('Error handling avatar during login', {
          label: 'Auth',
          errorMessage: error.message,
        });
      }
    }

    // Set logged in session
    if (req.session) {
      req.session.userId = user?.id;
    }

    return res.status(200).json(user?.filter() ?? {});
  } catch (e) {
    switch (e.errorCode) {
      case ApiErrorCode.InvalidUrl:
        logger.error(
          `The provided ${
            settings.main.mediaServerType === MediaServerType.JELLYFIN
              ? ServerType.JELLYFIN
              : ServerType.EMBY
          } is invalid or the server is not reachable.`,
          {
            label: 'Auth',
            error: e.errorCode,
            status: e.statusCode,
            hostname: getHostname({
              useSsl: body.useSsl,
              ip: body.hostname,
              port: body.port,
              urlBase: body.urlBase,
            }),
          }
        );
        return next({
          status: e.statusCode,
          message: e.errorCode,
        });

      case ApiErrorCode.InvalidCredentials:
        logger.warn(
          'Failed login attempt from user with incorrect Jellyfin credentials',
          {
            label: 'Auth',
            account: {
              ip: req.ip,
              email: body.username,
              password: '__REDACTED__',
            },
          }
        );
        return next({
          status: e.statusCode,
          message: e.errorCode,
        });

      case ApiErrorCode.NotAdmin:
        logger.warn(
          'Failed login attempt from user without admin permissions',
          {
            label: 'Auth',
            account: {
              ip: req.ip,
              email: body.username,
            },
          }
        );
        return next({
          status: e.statusCode,
          message: e.errorCode,
        });

      case ApiErrorCode.NoAdminUser:
        logger.warn(
          'Failed login attempt from user without admin permissions and no admin user exists',
          {
            label: 'Auth',
            account: {
              ip: req.ip,
              email: body.username,
            },
          }
        );
        return next({
          status: e.statusCode,
          message: e.errorCode,
        });

      default:
        logger.error(e.message, { label: 'Auth' });
        return next({
          status: 500,
          message: 'Something went wrong.',
        });
    }
  }
});

authRoutes.post('/local', async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);
  const body = req.body as { email?: string; password?: string };

  if (!settings.main.localLogin) {
    return res.status(500).json({ error: 'Password sign-in is disabled.' });
  } else if (!body.email || !body.password) {
    return res.status(500).json({
      error: 'You must provide both an email address and a password.',
    });
  }
  try {
    const user = await userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.password', 'user.plexId'])
      .where('user.email = :email', { email: body.email.toLowerCase() })
      .getOne();

    if (!user || !(await user.passwordMatch(body.password))) {
      logger.warn('Failed sign-in attempt using invalid Jellyseerr password', {
        label: 'API',
        ip: req.ip,
        email: body.email,
        userId: user?.id,
      });
      return next({
        status: 403,
        message: 'Access denied.',
      });
    }

    const mainUser = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true, plexId: true },
      where: { id: 1 },
    });
    const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');

    if (!user.plexId) {
      try {
        const plexUsersResponse = await mainPlexTv.getUsers();
        const account = plexUsersResponse.MediaContainer.User.find(
          (account) =>
            account.$.email &&
            account.$.email.toLowerCase() === user.email.toLowerCase()
        )?.$;

        if (
          account &&
          (await mainPlexTv.checkUserAccess(parseInt(account.id)))
        ) {
          logger.info(
            'Found matching Plex user; updating user with Plex data',
            {
              label: 'API',
              ip: req.ip,
              email: body.email,
              userId: user.id,
              plexId: account.id,
              plexUsername: account.username,
            }
          );

          user.plexId = parseInt(account.id);
          user.avatar = account.thumb;
          user.email = account.email;
          user.plexUsername = account.username;
          user.userType = UserType.PLEX;

          await userRepository.save(user);
        }
      } catch (e) {
        logger.error('Something went wrong fetching Plex users', {
          label: 'API',
          errorMessage: e.message,
        });
      }
    }

    if (
      user.plexId &&
      user.plexId !== mainUser.plexId &&
      !(await mainPlexTv.checkUserAccess(user.plexId))
    ) {
      logger.warn(
        'Failed sign-in attempt from Plex user without access to the media server',
        {
          label: 'API',
          account: {
            ip: req.ip,
            email: body.email,
            userId: user.id,
            plexId: user.plexId,
          },
        }
      );
      return next({
        status: 403,
        message: 'Access denied.',
      });
    }

    // Set logged in session
    if (user && req.session) {
      req.session.userId = user.id;
    }

    return res.status(200).json(user?.filter() ?? {});
  } catch (e) {
    logger.error(
      'Something went wrong authenticating with Jellyseerr password',
      {
        label: 'API',
        errorMessage: e.message,
        ip: req.ip,
        email: body.email,
      }
    );
    return next({
      status: 500,
      message: 'Unable to authenticate.',
    });
  }
});

authRoutes.post('/logout', async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(200).json({ status: 'ok' });
    }

    const settings = getSettings();
    const isJellyfinOrEmby =
      settings.main.mediaServerType === MediaServerType.JELLYFIN ||
      settings.main.mediaServerType === MediaServerType.EMBY;

    if (isJellyfinOrEmby) {
      const user = await getRepository(User)
        .createQueryBuilder('user')
        .addSelect(['user.jellyfinUserId', 'user.jellyfinDeviceId'])
        .where('user.id = :id', { id: userId })
        .getOne();

      if (user?.jellyfinUserId && user.jellyfinDeviceId) {
        try {
          const baseUrl = getHostname();
          try {
            await axios.delete(`${baseUrl}/Devices`, {
              params: { Id: user.jellyfinDeviceId },
              headers: {
                'X-Emby-Authorization': `MediaBrowser Client="Jellyseerr", Device="Jellyseerr", DeviceId="jellyseerr", Version="${getAppVersion()}", Token="${
                  settings.jellyfin.apiKey
                }"`,
              },
            });
          } catch (error) {
            logger.error('Failed to delete Jellyfin device', {
              label: 'Auth',
              error: error instanceof Error ? error.message : 'Unknown error',
              userId: user.id,
              jellyfinUserId: user.jellyfinUserId,
            });
          }
        } catch (error) {
          logger.error('Failed to delete Jellyfin device', {
            label: 'Auth',
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: user.id,
            jellyfinUserId: user.jellyfinUserId,
          });
        }
      }
    }

    req.session?.destroy((err: Error | null) => {
      if (err) {
        logger.error('Failed to destroy session', {
          label: 'Auth',
          error: err.message,
          userId,
        });
        return next({ status: 500, message: 'Failed to destroy session.' });
      }
      logger.info('Successfully logged out user', {
        label: 'Auth',
        userId,
      });
      res.status(200).json({ status: 'ok' });
    });
  } catch (error) {
    logger.error('Error during logout process', {
      label: 'Auth',
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.session?.userId,
    });
    next({ status: 500, message: 'Error during logout process.' });
  }
});

authRoutes.post('/reset-password', async (req, res, next) => {
  const userRepository = getRepository(User);
  const body = req.body as { email?: string };

  if (!body.email) {
    return next({
      status: 500,
      message: 'Email address required.',
    });
  }

  const user = await userRepository
    .createQueryBuilder('user')
    .where('user.email = :email', { email: body.email.toLowerCase() })
    .getOne();

  if (user) {
    await user.resetPassword();
    userRepository.save(user);
    logger.info('Successfully sent password reset link', {
      label: 'API',
      ip: req.ip,
      email: body.email,
    });
  } else {
    logger.error('Something went wrong sending password reset link', {
      label: 'API',
      ip: req.ip,
      email: body.email,
    });
  }

  return res.status(200).json({ status: 'ok' });
});

authRoutes.post('/reset-password/:guid', async (req, res, next) => {
  const userRepository = getRepository(User);

  if (!req.body.password || req.body.password?.length < 8) {
    logger.warn('Failed password reset attempt using invalid new password', {
      label: 'API',
      ip: req.ip,
      guid: req.params.guid,
    });
    return next({
      status: 500,
      message: 'Password must be at least 8 characters long.',
    });
  }

  const user = await userRepository.findOne({
    where: { resetPasswordGuid: req.params.guid },
  });

  if (!user) {
    logger.warn('Failed password reset attempt using invalid recovery link', {
      label: 'API',
      ip: req.ip,
      guid: req.params.guid,
    });
    return next({
      status: 500,
      message: 'Invalid password reset link.',
    });
  }

  if (
    !user.recoveryLinkExpirationDate ||
    user.recoveryLinkExpirationDate <= new Date()
  ) {
    logger.warn('Failed password reset attempt using expired recovery link', {
      label: 'API',
      ip: req.ip,
      guid: req.params.guid,
      email: user.email,
    });
    return next({
      status: 500,
      message: 'Invalid password reset link.',
    });
  }
  user.recoveryLinkExpirationDate = null;
  await user.setPassword(req.body.password);
  userRepository.save(user);
  logger.info('Successfully reset password', {
    label: 'API',
    ip: req.ip,
    guid: req.params.guid,
    email: user.email,
  });

  return res.status(200).json({ status: 'ok' });
});

export default authRoutes;
