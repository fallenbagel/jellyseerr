import PlexTvAPI from '@server/api/plextv';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import logger from '@server/logger';

class RefreshToken {
  public async run() {
    const userRepository = getRepository(User);

    const users = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.plexToken')
      .where("user.plexToken != ''")
      .getMany();

    for (const user of users) {
      await this.refreshUserToken(user);
    }
  }

  private async refreshUserToken(user: User) {
    if (!user.plexToken) {
      logger.warn('Skipping user refresh token for user without plex token', {
        label: 'Plex Refresh Token',
        user: user.displayName,
      });
      return;
    }

    const plexTvApi = new PlexTvAPI(user.plexToken);
    plexTvApi.pingToken();
  }
}

const refreshToken = new RefreshToken();

export default refreshToken;
