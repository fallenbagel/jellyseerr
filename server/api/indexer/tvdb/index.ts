import ExternalAPI from '@server/api/externalapi';
import type { TvShowIndexer } from '@server/api/indexer';
import TheMovieDb from '@server/api/indexer/themoviedb';
import type {
  TmdbSeasonWithEpisodes,
  TmdbTvDetails,
} from '@server/api/indexer/themoviedb/interfaces';
import type {
  TvdbLoginResponse,
  TvdbTvShowDetail,
} from '@server/api/indexer/tvdb/interfaces';
import cacheManager from '@server/lib/cache';
import logger from '@server/logger';

class Tvdb extends ExternalAPI implements TvShowIndexer {
  private tmdb: TheMovieDb = new TheMovieDb();

  public constructor() {
    super(
      'https://skyhook.sonarr.tv/v1/tvdb/shows',
      {},
      {
        nodeCache: cacheManager.getCache('tvdb').data,
        rateLimit: {
          maxRPS: 50,
          id: 'tvdb',
        },
      }
    );
  }

  async login() {
    try {
      return await this.get<TvdbLoginResponse>('/en/445009', {});
    } catch (error) {
      throw new Error(`[TVDB] Login failed: ${error.message}`);
    }
  }

  public getTvShow = async ({
    tvId,
  }: {
    tvId: number;
    language?: string;
  }): Promise<TmdbTvDetails> => {
    try {
      const tmdbTvShow = await this.tmdb.getTvShow({ tvId: tvId });
      const tvdbId = this.getTvdbIdFromTmdb(tmdbTvShow);

      if (tvdbId === -1) {
        return tmdbTvShow;
      }

      try {
        const data = await this.get<TvdbTvShowDetail>(
          `/en/${tvdbId}`,
          {},
          43200
        );

        const correctSeasons = data.seasons.filter((value) => {
          return value.seasonNumber !== 0;
        });

        tmdbTvShow.seasons = [];

        for (const season of correctSeasons) {
          if (season.seasonNumber) {
            logger.info(`Fetching TV season ${season.seasonNumber}`);

            try {
              const seasonData = {
                id: tvdbId,
                episode_count: data.episodes.filter((value) => {
                  return value.seasonNumber === season.seasonNumber;
                }).length,
                name: `${season.seasonNumber}`,
                overview: '',
                season_number: season.seasonNumber,
                poster_path: '',
                air_date: '',
                image: '',
              };

              tmdbTvShow.seasons.push(seasonData);
            } catch (error) {
              logger.error(
                `Failed to get season ${season.seasonNumber} for TV show ${tvdbId}: ${error.message}`,
                {
                  label: 'Tvdb',
                  message: `Failed to get season ${season.seasonNumber} for TV show ${tvdbId}`,
                }
              );
            }
          }
        }

        return tmdbTvShow;
      } catch (e) {
        return tmdbTvShow;
      }
    } catch (error) {
      throw new Error(
        `[TVDB] Failed to fetch TV show details: ${error.message}`
      );
    }
  };

  private getTvdbIdFromTmdb(tmdbTvShow: TmdbTvDetails) {
    try {
      return tmdbTvShow.external_ids.tvdb_id || -1;
    } catch (e) {
      return -1;
    }
  }

  public getTvSeason = async ({
    tvId,
    seasonNumber,
    language = 'en',
  }: {
    tvId: number;
    seasonNumber: number;
    language?: string;
  }): Promise<TmdbSeasonWithEpisodes> => {
    if (seasonNumber === 0) {
      return {
        episodes: [],
        external_ids: {
          tvdb_id: tvId,
        },
        name: '',
        overview: '',
        id: seasonNumber,
        air_date: '',
        season_number: 0,
      };
    }

    const tmdbTvShow = await this.tmdb.getTvShow({ tvId: tvId });
    const tvdbId = this.getTvdbIdFromTmdb(tmdbTvShow);

    if (tvdbId === -1) {
      return await this.tmdb.getTvSeason({ tvId, seasonNumber, language });
    }
    try {
      const tvdbSeason = await this.get<TvdbTvShowDetail>(
        `/en/${tvdbId}`,
        { lang: language },
        43200
      );

      const episodes = tvdbSeason.episodes
        .filter((value) => {
          return value.seasonNumber === seasonNumber;
        })
        .map((episode, index) => ({
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
        }));

      return {
        episodes: episodes,
        external_ids: {
          tvdb_id: tvdbSeason.tvdbId,
        },
        name: '',
        overview: '',
        id: tvdbSeason.tvdbId,
        air_date: tvdbSeason.firstAired,
        season_number: episodes.length,
      };
    } catch (error) {
      logger.error(
        `[TVDB] Failed to fetch TV season details: ${error.message}`
      );
      return await this.tmdb.getTvSeason({ tvId, seasonNumber, language });
    }
  };

  getSeasonIdentifier(req: any): number {
    return req.params.seasonId;
  }
}

export default Tvdb;
