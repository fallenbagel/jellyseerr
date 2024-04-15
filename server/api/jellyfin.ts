/* eslint-disable @typescript-eslint/no-explicit-any */
import availabilitySync from '@server/lib/availabilitySync';
import logger from '@server/logger';
import type { AxiosInstance } from 'axios';
import axios from 'axios';

export interface JellyfinUserResponse {
  Name: string;
  ServerId: string;
  ServerName: string;
  Id: string;
  Configuration: {
    GroupedFolders: string[];
  };
  Policy: {
    IsAdministrator: boolean;
  };
  PrimaryImageTag?: string;
}

export interface JellyfinLoginResponse {
  User: JellyfinUserResponse;
  AccessToken: string;
}

export interface JellyfinUserListResponse {
  users: JellyfinUserResponse[];
}

interface JellyfinMediaFolder {
  Name: string;
  Id: string;
  Type: string;
  CollectionType: string;
}

export interface JellyfinLibrary {
  type: 'show' | 'movie';
  key: string;
  title: string;
  agent: string;
}

export interface JellyfinLibraryItem {
  Name: string;
  Id: string;
  HasSubtitles: boolean;
  Type: 'Movie' | 'Episode' | 'Season' | 'Series';
  LocationType: 'FileSystem' | 'Offline' | 'Remote' | 'Virtual';
  SeriesName?: string;
  SeriesId?: string;
  SeasonId?: string;
  SeasonName?: string;
  IndexNumber?: number;
  IndexNumberEnd?: number;
  ParentIndexNumber?: number;
  MediaType: string;
}

export interface JellyfinMediaStream {
  Codec: string;
  Type: 'Video' | 'Audio' | 'Subtitle';
  Height?: number;
  Width?: number;
  AverageFrameRate?: number;
  RealFrameRate?: number;
  Language?: string;
  DisplayTitle: string;
}

export interface JellyfinMediaSource {
  Protocol: string;
  Id: string;
  Path: string;
  Type: string;
  VideoType: string;
  MediaStreams: JellyfinMediaStream[];
}

export interface JellyfinLibraryItemExtended extends JellyfinLibraryItem {
  ProviderIds: {
    Tmdb?: string;
    Imdb?: string;
    Tvdb?: string;
  };
  MediaSources?: JellyfinMediaSource[];
  Width?: number;
  Height?: number;
  IsHD?: boolean;
  DateCreated?: string;
}

class JellyfinAPI {
  private authToken?: string;
  private userId?: string;
  private jellyfinHost: string;
  private axios: AxiosInstance;

  constructor(jellyfinHost: string, authToken?: string, deviceId?: string) {
    this.jellyfinHost = jellyfinHost;
    this.authToken = authToken;

    let authHeaderVal = '';
    if (this.authToken) {
      authHeaderVal = `MediaBrowser Client="Overseerr", Device="Axios", DeviceId="${deviceId}", Version="10.8.0", Token="${authToken}"`;
    } else {
      authHeaderVal = `MediaBrowser Client="Overseerr", Device="Axios", DeviceId="${deviceId}", Version="10.8.0"`;
    }

    this.axios = axios.create({
      baseURL: this.jellyfinHost,
      headers: {
        'X-Emby-Authorization': authHeaderVal,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  public async login(
    Username?: string,
    Password?: string
  ): Promise<JellyfinLoginResponse> {
    try {
      const account = await this.axios.post<JellyfinLoginResponse>(
        '/Users/AuthenticateByName',
        {
          Username: Username,
          Pw: Password,
        }
      );
      return account.data;
    } catch (e) {
      throw new Error('Unauthorized');
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    return;
  }

  public async getServerName(): Promise<string> {
    try {
      const account = await this.axios.get<JellyfinUserResponse>(
        "/System/Info/Public'}"
      );
      return account.data.ServerName;
    } catch (e) {
      logger.error(
        `Something went wrong while getting the server name from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('girl idk');
    }
  }

  public async getUsers(): Promise<JellyfinUserListResponse> {
    try {
      const account = await this.axios.get(`/Users`);
      return { users: account.data };
    } catch (e) {
      logger.error(
        `Something went wrong while getting the account from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getUser(): Promise<JellyfinUserResponse> {
    try {
      const account = await this.axios.get<JellyfinUserResponse>(
        `/Users/${this.userId ?? 'Me'}`
      );
      return account.data;
    } catch (e) {
      logger.error(
        `Something went wrong while getting the account from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getLibraries(): Promise<JellyfinLibrary[]> {
    try {
      const mediaFolders = await this.axios.get<any>(`/Library/MediaFolders`);

      return this.mapLibraries(mediaFolders.data.Items);
    } catch (mediaFoldersError) {
      // fallback to user views to get libraries
      // this only affects LDAP users
      try {
        const mediaFolders = await this.axios.get<any>(
          `/Users/${this.userId ?? 'Me'}/Views`
        );

        return this.mapLibraries(mediaFolders.data.Items);
      } catch (e) {
        logger.error(
          `Something went wrong while getting libraries from the Jellyfin server: ${e.message}`,
          { label: 'Jellyfin API' }
        );
        return [];
      }
    }
  }

  private mapLibraries(mediaFolders: JellyfinMediaFolder[]): JellyfinLibrary[] {
    const excludedTypes = [
      'music',
      'books',
      'musicvideos',
      'homevideos',
      'boxsets',
    ];

    return mediaFolders
      .filter((Item: JellyfinMediaFolder) => {
        return (
          Item.Type === 'CollectionFolder' &&
          !excludedTypes.includes(Item.CollectionType)
        );
      })
      .map((Item: JellyfinMediaFolder) => {
        return <JellyfinLibrary>{
          key: Item.Id,
          title: Item.Name,
          type: Item.CollectionType === 'movies' ? 'movie' : 'show',
          agent: 'jellyfin',
        };
      });
  }

  public async getLibraryContents(id: string): Promise<JellyfinLibraryItem[]> {
    try {
      const contents = await this.axios.get<any>(
        `/Users/${this.userId}/Items?SortBy=SortName&SortOrder=Ascending&IncludeItemTypes=Series,Movie,Others&Recursive=true&StartIndex=0&ParentId=${id}&collapseBoxSetItems=false`
      );

      return contents.data.Items.filter(
        (item: JellyfinLibraryItem) => item.LocationType !== 'Virtual'
      );
    } catch (e) {
      logger.error(
        `Something went wrong while getting library content from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getRecentlyAdded(id: string): Promise<JellyfinLibraryItem[]> {
    try {
      const contents = await this.axios.get<any>(
        `/Users/${this.userId}/Items/Latest?Limit=12&ParentId=${id}`
      );

      return contents.data;
    } catch (e) {
      logger.error(
        `Something went wrong while getting library content from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getItemData(
    id: string
  ): Promise<JellyfinLibraryItemExtended | undefined> {
    try {
      const contents = await this.axios.get<any>(
        `/Users/${this.userId}/Items/${id}`
      );

      return contents.data;
    } catch (e) {
      if (availabilitySync.running) {
        if (e.response && e.response.status === 500) {
          return undefined;
        }
      }
      logger.error(
        `Something went wrong while getting library content from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getSeasons(seriesID: string): Promise<JellyfinLibraryItem[]> {
    try {
      const contents = await this.axios.get<any>(`/Shows/${seriesID}/Seasons`);

      return contents.data.Items;
    } catch (e) {
      logger.error(
        `Something went wrong while getting the list of seasons from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getEpisodes(
    seriesID: string,
    seasonID: string
  ): Promise<JellyfinLibraryItem[]> {
    try {
      const contents = await this.axios.get<any>(
        `/Shows/${seriesID}/Episodes?seasonId=${seasonID}`
      );

      return contents.data.Items.filter(
        (item: JellyfinLibraryItem) => item.LocationType !== 'Virtual'
      );
    } catch (e) {
      logger.error(
        `Something went wrong while getting the list of episodes from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }
}

export default JellyfinAPI;
