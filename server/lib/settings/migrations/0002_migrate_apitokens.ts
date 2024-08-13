import JellyfinAPI from '@server/api/jellyfin';
import { MediaServerType } from '@server/constants/server';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { AllSettings } from '@server/lib/settings';
import { getHostname } from '@server/utils/getHostname';

const migrateApiTokens = async (settings: any): Promise<AllSettings> => {
  const mediaServerType = settings.main.mediaServerType;
  if (
    !settings.jellyfin.apiKey &&
    (mediaServerType === MediaServerType.JELLYFIN ||
      mediaServerType === MediaServerType.EMBY)
  ) {
    const userRepository = getRepository(User);
    const admin = await userRepository.findOne({
      where: { id: 1 },
      select: ['id', 'jellyfinAuthToken', 'jellyfinUserId', 'jellyfinDeviceId'],
      order: { id: 'ASC' },
    });
    if (!admin) {
      return settings;
    }
    const jellyfinClient = new JellyfinAPI(
      getHostname(settings.jellyfin),
      admin.jellyfinAuthToken,
      admin.jellyfinDeviceId
    );
    jellyfinClient.setUserId(admin.jellyfinUserId ?? '');
    const apiKey = await jellyfinClient.createApiToken('Jellyseerr');
    settings.jellyfin.apiKey = apiKey;
  }
  return settings;
};

export default migrateApiTokens;
