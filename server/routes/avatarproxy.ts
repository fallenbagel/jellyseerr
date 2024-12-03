import { MediaServerType } from '@server/constants/server';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import ImageProxy from '@server/lib/imageproxy';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { getAppVersion } from '@server/utils/appVersion';
import { getHostname } from '@server/utils/getHostname';
import { Router } from 'express';
import gravatarUrl from 'gravatar-url';

const router = Router();

let _avatarImageProxy: ImageProxy | null = null;
async function initAvatarImageProxy() {
  if (!_avatarImageProxy) {
    const userRepository = getRepository(User);
    const admin = await userRepository.findOne({
      where: { id: 1 },
      select: ['id', 'jellyfinUserId', 'jellyfinDeviceId'],
      order: { id: 'ASC' },
    });
    const deviceId = admin?.jellyfinDeviceId;
    const authToken = getSettings().jellyfin.apiKey;
    _avatarImageProxy = new ImageProxy('avatar', '', {
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Jellyseerr", Device="Jellyseerr", DeviceId="${deviceId}", Version="${getAppVersion()}", Token="${authToken}"`,
      },
    });
  }
  return _avatarImageProxy;
}

router.get('/:jellyfinUserId', async (req, res) => {
  try {
    if (!req.params.jellyfinUserId.match(/^[a-f0-9]{32}$/)) {
      const mediaServerType = getSettings().main.mediaServerType;
      throw new Error(
        `Provided URL is not ${
          mediaServerType === MediaServerType.JELLYFIN
            ? 'a Jellyfin'
            : 'an Emby'
        } avatar.`
      );
    }

    const avatarImageCache = await initAvatarImageProxy();

    const user = await getRepository(User).findOne({
      where: { jellyfinUserId: req.params.jellyfinUserId },
    });

    const fallbackUrl = gravatarUrl(user?.email || 'none', {
      default: 'mm',
      size: 200,
    });

    const setttings = getSettings();
    const jellyfinAvatarUrl =
      setttings.main.mediaServerType === MediaServerType.JELLYFIN
        ? `${getHostname()}/UserImage?UserId=${req.params.jellyfinUserId}`
        : `${getHostname()}/Users/${
            req.params.jellyfinUserId
          }/Images/Primary?quality=90`;

    let imageData = await avatarImageCache.getImage(
      jellyfinAvatarUrl,
      fallbackUrl
    );

    if (imageData.meta.extension === 'json') {
      // this is a 404
      imageData = await avatarImageCache.getImage(fallbackUrl);
    }

    res.writeHead(200, {
      'Content-Type': `image/${imageData.meta.extension}`,
      'Content-Length': imageData.imageBuffer.length,
      'Cache-Control': `public, max-age=${imageData.meta.curRevalidate}`,
      'OS-Cache-Key': imageData.meta.cacheKey,
      'OS-Cache-Status': imageData.meta.cacheMiss ? 'MISS' : 'HIT',
    });

    res.end(imageData.imageBuffer);
  } catch (e) {
    logger.error('Failed to proxy avatar image', {
      errorMessage: e.message,
    });
  }
});

export default router;
