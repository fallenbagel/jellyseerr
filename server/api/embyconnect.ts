import ExternalAPI from '@server/api/externalapi';
import { ApiErrorCode } from '@server/constants/error';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { ApiError } from '@server/types/error';
import { getAppVersion } from '@server/utils/appVersion';
import { getHostname } from '@server/utils/getHostname';
import { uniqueId } from 'lodash';
import type { JellyfinLoginResponse } from './jellyfin';

export interface ConnectAuthResponse {
  AccessToken: string;
  User: {
    Id: string;
    Name: string;
    Email: string;
    IsActive: string;
  };
}

export interface LinkedServer {
  Id: string;
  Url: string;
  Name: string;
  SystemId: string;
  AccessKey: string;
  LocalAddress: string;
  UserType: string;
  SupporterKey: string;
}

export interface LocalUserAuthExchangeResponse {
  LocalUserId: string;
  AccessToken: string;
}

export interface EmbyConnectOptions {
  ClientIP?: string;
  DeviceId?: string;
}

const EMBY_CONNECT_URL = 'https://connect.emby.media';

class EmbyConnectAPI extends ExternalAPI {
  private ClientIP?: string;
  private DeviceId?: string;

  constructor(options: EmbyConnectOptions = {}) {
    super(
      EMBY_CONNECT_URL,
      {},
      {
        headers: {
          'X-Application': `Jellyseerr/${getAppVersion()}`,
        },
      }
    );
    this.ClientIP = options.ClientIP;
    this.DeviceId = options.DeviceId;
  }

  public async authenticateConnectUser(Email?: string, Password?: string) {
    logger.debug(`Attempting to authenticate via EmbyConnect with email:`, {
      Email,
    });

    const connectAuthResponse = await this.getConnectUserAccessToken(
      Email,
      Password
    );

    const linkedServers = await this.getValidServers(
      connectAuthResponse.User.Id,
      connectAuthResponse.AccessToken
    );

    const matchingServer = this.findMatchingServer(linkedServers);

    const localUserExchangeResponse = await this.localAuthExchange(
      matchingServer.AccessKey,
      connectAuthResponse.User.Id,
      this.DeviceId
    );

    return {
      User: {
        Name: connectAuthResponse.User.Name,
        Email: connectAuthResponse.User.Email,
        ServerId: matchingServer.SystemId,
        ServerName: matchingServer.Name,
        Id: localUserExchangeResponse.LocalUserId,
        Configuration: {
          GroupedFolders: [],
        },
        Policy: {
          IsAdministrator: false, // This requires an additional EmbyServer API call, skipping for now
        },
      },
      AccessToken: localUserExchangeResponse.AccessToken,
    } as JellyfinLoginResponse;
  }

  private async getConnectUserAccessToken(
    Email?: string,
    Password?: string
  ): Promise<ConnectAuthResponse> {
    try {
      const textResponse = await this.post<string>(
        '/service/user/authenticate',
        { nameOrEmail: Email, rawpw: Password },
        {},
        undefined,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return JSON.parse(textResponse) as ConnectAuthResponse;
    } catch (e) {
      logger.debug(`Failed to authenticate using EmbyConnect: ${e.message}`, {
        label: 'EmbyConnect API',
        ip: this.ClientIP,
      });
      throw new ApiError(
        e.cause?.status ?? 401,
        ApiErrorCode.InvalidCredentials
      );
    }
  }

  private async getValidServers(
    ConnectUserId: string,
    AccessToken: string
  ): Promise<LinkedServer[]> {
    try {
      const textResponse = await this.get<string>(
        `/service/servers`,
        { userId: ConnectUserId },
        undefined,
        {
          headers: {
            'X-Connect-UserToken': AccessToken,
          },
        }
      );

      return JSON.parse(textResponse) as LinkedServer[];
    } catch (e) {
      logger.error(
        `Failed to retrieve EmbyConnect user server list: ${e.message}`,
        {
          label: 'EmbyConnect API',
          ip: this.ClientIP,
        }
      );
      throw new ApiError(e.cause?.status, ApiErrorCode.InvalidAuthToken);
    }
  }

  private findMatchingServer(linkedEmbyServers: LinkedServer[]): LinkedServer {
    const settings = getSettings();
    const matchingServer = linkedEmbyServers.find(
      (server) => server.SystemId === settings.jellyfin.serverId
    );

    if (!matchingServer) {
      throw new Error(
        `No matching linked Emby server found for serverId: ${settings.jellyfin.serverId}`
      );
    }

    return matchingServer;
  }

  private async localAuthExchange(
    accessKey: string,
    userId: string,
    deviceId?: string
  ): Promise<LocalUserAuthExchangeResponse> {
    try {
      const params = new URLSearchParams({
        format: 'json',
        ConnectUserId: userId,
        'X-Emby-Client': 'Jellyseerr',
        'X-Emby-Device-Id': deviceId ?? uniqueId(),
        'X-Emby-Client-Version': getAppVersion(),
        'X-Emby-Device-Name': 'Jellyseerr',
        'X-Emby-Token': accessKey,
      });

      const response = await fetch(
        `${getHostname()}/emby/Connect/Exchange?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(response.statusText, { cause: response });
      }

      return await response.json();
    } catch (e) {
      logger.debug('Failed local user auth exchange');
      throw new ApiError(e.cause?.status, ApiErrorCode.InvalidAuthToken);
    }
  }
}

export default EmbyConnectAPI;
