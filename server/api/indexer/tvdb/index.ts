import ExternalAPI from '@server/api/externalapi';
import type { TvShowIndexer } from '@server/api/indexer';
import TheMovieDb from '@server/api/indexer/themoviedb';
import type {
  TmdbSeasonWithEpisodes,
  TmdbTvDetails,
} from '@server/api/indexer/themoviedb/interfaces';
import type {
  TvdbEpisode,
  TvdbLoginResponse,
  TvdbSeason,
  TvdbTvShowDetail,
} from '@server/api/indexer/tvdb/interfaces';
import cacheManager, { type AvailableCacheIds } from '@server/lib/cache';
import logger from '@server/logger';

interface TvdbConfig {
  baseUrl: string;
  maxRequestsPerSecond: number;
  cachePrefix: AvailableCacheIds;
}

const DEFAULT_CONFIG: TvdbConfig = {
  baseUrl: 'https://skyhook.sonarr.tv/v1/tvdb/shows',
  maxRequestsPerSecond: 50,
  cachePrefix: 'tvdb' as const,
};

const enum TvdbIdStatus {
  INVALID = -1,
}

type TvdbId = number;
type ValidTvdbId = Exclude<TvdbId, TvdbIdStatus.INVALID>;

class Tvdb extends ExternalAPI implements TvShowIndexer {
  private readonly tmdb: TheMovieDb;
  private static readonly DEFAULT_CACHE_TTL = 43200;
  private static readonly DEFAULT_LANGUAGE = 'en';

  constructor(config: Partial<TvdbConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    super(
      finalConfig.baseUrl,
      {},
      {
        nodeCache: cacheManager.getCache(finalConfig.cachePrefix).data,
        rateLimit: {
          maxRPS: finalConfig.maxRequestsPerSecond,
          id: finalConfig.cachePrefix,
        },
      }
    );
    this.tmdb = new TheMovieDb();
  }

  public async login(): Promise<TvdbLoginResponse> {
    try {
      return await this.get<TvdbLoginResponse>('/en/445009', {});
    } catch (error) {
      this.handleError('Login failed', error);
      throw error;
    }
  }

  public async getTvShow({
    tvId,
    language = Tvdb.DEFAULT_LANGUAGE,
  }: {
    tvId: number;
    language?: string;
  }): Promise<TmdbTvDetails> {
    try {
      const tmdbTvShow = await this.tmdb.getTvShow({ tvId });
      const tvdbId = this.getTvdbIdFromTmdb(tmdbTvShow);

      if (this.isValidTvdbId(tvdbId)) {
        return await this.enrichTmdbShowWithTvdbData(
          tmdbTvShow,
          tvdbId,
          language
        );
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
      const tmdbTvShow = await this.tmdb.getTvShow({ tvId });
      const tvdbId = this.getTvdbIdFromTmdb(tmdbTvShow);

      if (!this.isValidTvdbId(tvdbId)) {
        return await this.tmdb.getTvSeason({ tvId, seasonNumber, language });
      }

      return await this.getTvdbSeasonData(tvdbId, seasonNumber, tvId, language);
    } catch (error) {
      logger.error(
        `[TVDB] Failed to fetch TV season details: ${error.message}`
      );
      return await this.tmdb.getTvSeason({ tvId, seasonNumber, language });
    }
  }

  public getSeasonIdentifier(req: any): number {
    return req.params.seasonId;
  }

  private async enrichTmdbShowWithTvdbData(
    tmdbTvShow: TmdbTvDetails,
    tvdbId: ValidTvdbId,
    language: string
  ): Promise<TmdbTvDetails> {
    try {
      const tvdbData = await this.fetchTvdbShowData(tvdbId, language);
      const seasons = this.processSeasons(tvdbData);
      return { ...tmdbTvShow, seasons };
    } catch (error) {
      logger.error(
        `Failed to enrich TMDB show with TVDB data: ${error.message}`
      );
      return tmdbTvShow;
    }
  }

  private async fetchTvdbShowData(
    tvdbId: number,
    language: string
  ): Promise<TvdbTvShowDetail> {
    return await this.get<TvdbTvShowDetail>(
      `/${language}/${tvdbId}`,
      {},
      Tvdb.DEFAULT_CACHE_TTL
    );
  }

  private processSeasons(tvdbData: TvdbTvShowDetail): any[] {
    return tvdbData.seasons
      .filter((season) => season.seasonNumber !== 0)
      .map((season) => this.createSeasonData(season, tvdbData));
  }

  private createSeasonData(
    season: TvdbSeason,
    tvdbData: TvdbTvShowDetail
  ): any {
    if (!season.seasonNumber) return null;

    const episodeCount = tvdbData.episodes.filter(
      (episode) => episode.seasonNumber === season.seasonNumber
    ).length;

    return {
      id: tvdbData.tvdbId,
      episode_count: episodeCount,
      name: `${season.seasonNumber}`,
      overview: '',
      season_number: season.seasonNumber,
      poster_path: '',
      air_date: '',
      image: '',
    };
  }

  private async getTvdbSeasonData(
    tvdbId: number,
    seasonNumber: number,
    tvId: number,
    language: string
  ): Promise<TmdbSeasonWithEpisodes> {
    const tvdbSeason = await this.fetchTvdbShowData(tvdbId, language);

    const episodes = this.processEpisodes(tvdbSeason, seasonNumber, tvId);

    return {
      episodes,
      external_ids: { tvdb_id: tvdbSeason.tvdbId },
      name: '',
      overview: '',
      id: tvdbSeason.tvdbId,
      air_date: tvdbSeason.firstAired,
      season_number: episodes.length,
    };
  }

  private processEpisodes(
    tvdbSeason: TvdbTvShowDetail,
    seasonNumber: number,
    tvId: number
  ): any[] {
    return tvdbSeason.episodes
      .filter((episode) => episode.seasonNumber === seasonNumber)
      .map((episode, index) => this.createEpisodeData(episode, index, tvId));
  }

  private createEpisodeData(
    episode: TvdbEpisode,
    index: number,
    tvId: number
  ): any {
    return {
      id: episode.tvdbId,
      air_date: episode.airDate,
      episode_number: episode.episodeNumber,
      name: episode.title || `Episode ${index + 1}`,
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
