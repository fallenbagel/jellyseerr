import ExternalAPI from '@server/api/externalapi';
import cacheManager from '@server/lib/cache';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import type { MbAlbumDetails, MbArtistDetails } from './interfaces';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

class MusicBrainz extends ExternalAPI {
  constructor() {
    super(
      'https://musicbrainz.org/ws/2',
      {},
      {
        headers: {
          'User-Agent':
            'Jellyseerr/1.0.0 (https://github.com/Fallenbagel/jellyseerr)',
          Accept: 'application/json',
        },
        nodeCache: cacheManager.getCache('musicbrainz').data,
        rateLimit: {
          maxRPS: 1,
          id: 'musicbrainz',
        },
      }
    );
  }

  public async searchAlbum({
    query,
    limit = 30,
    offset = 0,
  }: {
    query: string;
    limit?: number;
    offset?: number;
  }): Promise<MbAlbumDetails[]> {
    try {
      const data = await this.get<{
        created: string;
        count: number;
        offset: number;
        'release-groups': MbAlbumDetails[];
      }>(
        '/release-group',
        {
          query,
          fmt: 'json',
          limit: limit.toString(),
          offset: offset.toString(),
        },
        43200
      );

      return data['release-groups'];
    } catch (e) {
      throw new Error(`[MusicBrainz] Failed to search albums: ${e.message}`);
    }
  }

  public async searchArtist({
    query,
    limit = 50,
    offset = 0,
  }: {
    query: string;
    limit?: number;
    offset?: number;
  }): Promise<MbArtistDetails[]> {
    try {
      const data = await this.get<{
        created: string;
        count: number;
        offset: number;
        artists: MbArtistDetails[];
      }>(
        '/artist',
        {
          query,
          fmt: 'json',
          limit: limit.toString(),
          offset: offset.toString(),
        },
        43200
      );

      return data.artists;
    } catch (e) {
      throw new Error(`[MusicBrainz] Failed to search artists: ${e.message}`);
    }
  }

  public async getArtistWikipediaExtract({
    artistMbid,
    language = 'en',
  }: {
    artistMbid: string;
    language?: string;
  }): Promise<{ title: string; url: string; content: string } | null> {
    if (
      !artistMbid ||
      typeof artistMbid !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
        artistMbid
      )
    ) {
      throw new Error('Invalid MusicBrainz artist ID format');
    }

    try {
      const safeUrl = `https://musicbrainz.org/artist/${artistMbid}/wikipedia-extract`;

      const response = await fetch(safeUrl, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': language,
          'User-Agent':
            'Jellyseerr/1.0.0 (https://github.com/Fallenbagel/jellyseerr)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.wikipediaExtract || !data.wikipediaExtract.content) {
        return null;
      }

      const cleanContent = purify.sanitize(data.wikipediaExtract.content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      return {
        title: data.wikipediaExtract.title,
        url: data.wikipediaExtract.url,
        content: cleanContent.trim(),
      };
    } catch (error) {
      throw new Error(
        `[MusicBrainz] Failed to fetch Wikipedia extract: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  public async getReleaseGroup({
    releaseId,
  }: {
    releaseId: string;
  }): Promise<string | null> {
    try {
      const data = await this.get<{
        'release-group': {
          id: string;
        };
      }>(
        `/release/${releaseId}`,
        {
          inc: 'release-groups',
          fmt: 'json',
        },
        43200
      );

      return data['release-group']?.id ?? null;
    } catch (e) {
      throw new Error(
        `[MusicBrainz] Failed to fetch release group: ${e.message}`
      );
    }
  }
}

export default MusicBrainz;
