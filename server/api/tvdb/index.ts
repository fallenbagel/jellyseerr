import ExternalAPI from '@server/api/externalapi';
import type { TvShowIndexer } from '@server/api/indexer';
import TheMovieDb from '@server/api/themoviedb';
import type {
  TmdbSeasonWithEpisodes,
  TmdbTvDetails,
  TmdbTvEpisodeResult,
  TmdbTvSeasonResult,
} from '@server/api/themoviedb/interfaces';
import type {
  TvdbEpisode,
  TvdbLoginResponse,
  TvdbSeasonDetails,
  TvdbTvDetails,
} from '@server/api/tvdb/interfaces';
import cacheManager, { type AvailableCacheIds } from '@server/lib/cache';
import logger from '@server/logger';

interface TvdbConfig {
  baseUrl: string;
  maxRequestsPerSecond: number;
  cachePrefix: AvailableCacheIds;
}

const DEFAULT_CONFIG: TvdbConfig = {
  baseUrl: 'https://api4.thetvdb.com/v4',
  maxRequestsPerSecond: 50,
  cachePrefix: 'tvdb' as const,
};

const enum TvdbIdStatus {
  INVALID = -1,
}

type TvdbId = number;
type ValidTvdbId = Exclude<TvdbId, TvdbIdStatus.INVALID>;

class Tvdb extends ExternalAPI implements TvShowIndexer {
  static instance: Tvdb;
  private readonly tmdb: TheMovieDb;
  private static readonly DEFAULT_CACHE_TTL = 43200;
  private static readonly DEFAULT_LANGUAGE = 'eng';
  private token: string;
  private apiKey?: string;
  private pin?: string;

  constructor(pin?: string) {
    const finalConfig = { ...DEFAULT_CONFIG };
    super(
      finalConfig.baseUrl,
      {
        apiKey: '',
      },
      {
        nodeCache: cacheManager.getCache(finalConfig.cachePrefix).data,
        rateLimit: {
          maxRPS: finalConfig.maxRequestsPerSecond,
          id: finalConfig.cachePrefix,
        },
      }
    );
    this.pin = pin;
    this.tmdb = new TheMovieDb();
  }

  public static async getInstance(): Promise<Tvdb> {
    if (!this.instance) {
      try {
        this.instance = new Tvdb();
        await this.instance.login();
      } catch (error) {
        logger.error(`Failed to login to TVDB: ${error.message}`);
        throw new Error('TVDB API key is not set');
      }
    }

    return this.instance;
  }

  public async test(): Promise<void> {
    try {
      await this.login();
    } catch (error) {
      this.handleError('Login failed', error);
      throw error;
    }
  }

  async handleRenewToken(): Promise<TvdbLoginResponse> {
    throw new Error('Method not implemented.');
  }

  async login(): Promise<TvdbLoginResponse> {
    const response = await this.post<TvdbLoginResponse>('/login', {
      apiKey: process.env.TVDB_API_KEY,
    });

    this.defaultHeaders.Authorization = `Bearer ${response.token}`;
    this.token = response.token;

    return response;
  }

  public async getShowByTvdbId({
    tvdbId,
  }: {
    tvdbId: number;
    language?: string;
  }): Promise<TmdbTvDetails> {
    return await this.get<TmdbTvDetails>(
      `/en/${tvdbId}`,
      {},
      Tvdb.DEFAULT_CACHE_TTL
    );
  }

  public async getTvShow({
    tvId,
    language = Tvdb.DEFAULT_LANGUAGE,
  }: {
    tvId: number;
    language?: string;
  }): Promise<TmdbTvDetails> {
    try {
      const tmdbTvShow = await this.tmdb.getTvShow({ tvId, language });
      const tvdbId = this.getTvdbIdFromTmdb(tmdbTvShow);

      if (this.isValidTvdbId(tvdbId)) {
        return await this.enrichTmdbShowWithTvdbData(tmdbTvShow, tvdbId);
      }

      return tmdbTvShow;
    } catch (error) {
      this.handleError('Failed to fetch TV show details', error);
      throw error;
    }
  }

  public async getTvSeason({
    tvId,
    seasonNumber,
    language = Tvdb.DEFAULT_LANGUAGE,
  }: {
    tvId: number;
    seasonNumber: number;
    language?: string;
  }): Promise<TmdbSeasonWithEpisodes> {
    if (seasonNumber === 0) {
      return this.createEmptySeasonResponse(tvId);
    }

    try {
      const tmdbTvShow = await this.tmdb.getTvShow({ tvId, language });
      const tvdbId = this.getTvdbIdFromTmdb(tmdbTvShow);

      if (!this.isValidTvdbId(tvdbId)) {
        return await this.tmdb.getTvSeason({ tvId, seasonNumber, language });
      }

      return await this.getTvdbSeasonData(tvdbId, seasonNumber, tvId);
    } catch (error) {
      logger.error(
        `[TVDB] Failed to fetch TV season details: ${error.message}`
      );
      return await this.tmdb.getTvSeason({ tvId, seasonNumber, language });
    }
  }

  private async enrichTmdbShowWithTvdbData(
    tmdbTvShow: TmdbTvDetails,
    tvdbId: ValidTvdbId
  ): Promise<TmdbTvDetails> {
    try {
      const tvdbData = await this.fetchTvdbShowData(tvdbId);
      const seasons = this.processSeasons(tvdbData);

      if (!seasons.length) {
        return tmdbTvShow;
      }

      return { ...tmdbTvShow, seasons };
    } catch (error) {
      logger.error(
        `Failed to enrich TMDB show with TVDB data: ${error.message}`
      );
      return tmdbTvShow;
    }
  }

  private async fetchTvdbShowData(tvdbId: number): Promise<TvdbTvDetails> {
    return await this.get<TvdbTvDetails>(
      `/series/${tvdbId}/extended?meta=episodes`,
      {
        short: 'true',
      },
      Tvdb.DEFAULT_CACHE_TTL
    );
  }

  private processSeasons(tvdbData: TvdbTvDetails): TmdbTvSeasonResult[] {
    if (!tvdbData || !tvdbData.seasons || !tvdbData.episodes) {
      return [];
    }

    return tvdbData.seasons
      .filter(
        (season) =>
          season.number > 0 && season.type && season.type.type === 'official'
      )
      .map((season) => this.createSeasonData(season, tvdbData));
  }

  private createSeasonData(
    season: TvdbSeasonDetails,
    tvdbData: TvdbTvDetails
  ): TmdbTvSeasonResult {
    if (!season.number) {
      return {
        id: 0,
        episode_count: 0,
        name: '',
        overview: '',
        season_number: 0,
        poster_path: '',
        air_date: '',
      };
    }

    const episodeCount = tvdbData.episodes.filter(
      (episode) => episode.seasonNumber === season.number
    ).length;

    return {
      id: tvdbData.id,
      episode_count: episodeCount,
      name: `${season.number}`,
      overview: '',
      season_number: season.number,
      poster_path: '',
      air_date: '',
    };
  }

  private async getTvdbSeasonData(
    tvdbId: number,
    seasonNumber: number,
    tvId: number,
    language: string = Tvdb.DEFAULT_LANGUAGE
  ): Promise<TmdbSeasonWithEpisodes> {
    const tvdbData = await this.fetchTvdbShowData(tvdbId);

    if (!tvdbData) {
      return this.createEmptySeasonResponse(tvId);
    }

    const seasons = await this.get<TvdbSeasonDetails>(
      `/series/${tvdbId}/episodes/official/${language}`,
      {}
    );

    const episodes = this.processEpisodes(seasons, seasonNumber, tvId);

    return {
      episodes,
      external_ids: { tvdb_id: tvdbId },
      name: '',
      overview: '',
      id: seasons.id,
      air_date: seasons.firstAired,
      season_number: episodes.length,
    };
  }

  private processEpisodes(
    tvdbSeason: TvdbSeasonDetails,
    seasonNumber: number,
    tvId: number
  ): TmdbTvEpisodeResult[] {
    if (!tvdbSeason || !tvdbSeason.episodes) {
      return [];
    }

    return tvdbSeason.episodes
      .filter((episode) => episode.seasonNumber === seasonNumber)
      .map((episode, index) => this.createEpisodeData(episode, index, tvId));
  }

  private createEpisodeData(
    episode: TvdbEpisode,
    index: number,
    tvId: number
  ): TmdbTvEpisodeResult {
    return {
      id: episode.id,
      air_date: episode.aired,
      episode_number: episode.number,
      name: episode.name || `Episode ${index + 1}`,
      overview: episode.overview || '',
      season_number: episode.seasonNumber,
      production_code: '',
      show_id: tvId,
      still_path: episode.image || '',
      vote_average: 1,
      vote_count: 1,
    };
  }

  private createEmptySeasonResponse(tvId: number): TmdbSeasonWithEpisodes {
    return {
      episodes: [],
      external_ids: { tvdb_id: tvId },
      name: '',
      overview: '',
      id: 0,
      air_date: '',
      season_number: 0,
    };
  }

  private getTvdbIdFromTmdb(tmdbTvShow: TmdbTvDetails): TvdbId {
    return tmdbTvShow?.external_ids?.tvdb_id ?? TvdbIdStatus.INVALID;
  }

  private isValidTvdbId(tvdbId: TvdbId): tvdbId is ValidTvdbId {
    return tvdbId !== TvdbIdStatus.INVALID;
  }

  private handleError(context: string, error: Error): void {
    throw new Error(`[TVDB] ${context}: ${error.message}`);
  }
}

export default Tvdb;
