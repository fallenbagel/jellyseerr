import ExternalAPI from '@server/api/externalapi';
import type { TvShowIndexer } from '@server/api/indexer';
import TheMovieDb from '@server/api/indexer/themoviedb';
import type {
  TmdbSeasonWithEpisodes,
  TmdbTvDetails,
} from '@server/api/indexer/themoviedb/interfaces';
import type {
  TvdbEpisodeTranslation,
  TvdbLoginResponse,
  TvdbSeasonDetails,
  TvdbTvDetails,
} from '@server/api/indexer/tvdb/interfaces';
import cacheManager from '@server/lib/cache';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

class Tvdb extends ExternalAPI implements TvShowIndexer {
  static instance: Tvdb;
  private dateTokenExpires?: Date;
  private pin?: string;

  private constructor(apiKey: string, pin?: string) {
    super(
      'https://api4.thetvdb.com/v4',
      {
        apiKey: apiKey,
      },
      {
        nodeCache: cacheManager.getCache('tvdb').data,
        rateLimit: {
          maxRPS: 50,
          id: 'tmdb',
        },
      }
    );
    this.pin = pin;
  }

  public static async getInstance() {
    if (!this.instance) {
      const settings = getSettings();
      if (!settings.tvdb.apiKey) {
        throw new Error('TVDB API key is not set');
      }
      this.instance = new Tvdb(settings.tvdb.apiKey, settings.tvdb.pin);
      await this.instance.login();
      logger.info(
        'Tvdb instance created with token => ' +
          this.instance.defaultHeaders.Authorization
      );
    }
    return this.instance;
  }

  async login() {
    try {
      const res = await this.post<TvdbLoginResponse>('/login', {
        apiKey: this.params.apiKey,
        pin: this.pin,
      });
      this.defaultHeaders.Authorization = `Bearer ${res.data.token}`;
      this.dateTokenExpires = new Date();
      this.dateTokenExpires.setMonth(this.dateTokenExpires.getMonth() + 1);
      return res;
    } catch (error) {
      throw new Error(`[TVDB] Login failed: ${error.message}`);
    }
  }

  public getTvShow = async ({
    tvId,
    language = 'en',
  }: {
    tvId: number;
    language?: string;
  }): Promise<TmdbTvDetails> => {
    try {
      const tmdb = new TheMovieDb();
      const tmdbTvShow = await tmdb.getTvShow({ tvId: tvId });

      const tvdbId = tmdbTvShow.external_ids.tvdb_id;

      if (!tvdbId) {
        return tmdbTvShow;
      }

      const data = await this.get<TvdbTvDetails>(
        `/series/${tvdbId}/extended`,
        {
          short: 'true',
        },
        43200
      );

      const correctSeasons = data.data.seasons.filter(
        (season: TvdbSeasonDetails) =>
          season.id && season.number > 0 && season.type.name === 'Aired Order'
      );

      tmdbTvShow.seasons = [];

      for (const season of correctSeasons) {
        if (season.id) {
          logger.info(`Fetching TV season ${season.id}`);

          try {
            const tvdbSeason = await this.getTvSeason({
              tvId: tvdbId,
              seasonNumber: season.id,
              language,
            });
            const seasonData = {
              id: season.id,
              episode_count: tvdbSeason.episodes.length,
              name: tvdbSeason.name,
              overview: tvdbSeason.overview,
              season_number: season.number,
              poster_path: '',
              air_date: '',
              image: tvdbSeason.poster_path,
            };

            tmdbTvShow.seasons.push(seasonData);
          } catch (error) {
            logger.error(
              `Failed to get season ${season.id} for TV show ${tvdbId}: ${error.message}`,
              {
                label: 'Tvdb',
                message: `Failed to get season ${season.id} for TV show ${tvdbId}`,
              }
            );
          }
        }
      }

      return tmdbTvShow;
    } catch (error) {
      throw new Error(
        `[TVDB] Failed to fetch TV show details: ${error.message}`
      );
    }
  };

  getEpisode = async (
    episodeId: number,
    language: string
  ): Promise<TvdbEpisodeTranslation> => {
    try {
      const tvdbEpisode = await this.get<TvdbEpisodeTranslation>(
        `/episodes/${episodeId}/translations/${language}`,
        {},
        43200
      );

      return tvdbEpisode;
    } catch (error) {
      throw new Error(
        `[TVDB] Failed to fetch TV episode details: ${error.message}`
      );
    }
  };

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
    try {
      const tvdbSeason = await this.get<TvdbSeasonDetails>(
        `/seasons/${seasonNumber}/extended`,
        { lang: language },
        43200
      );

      const episodes = tvdbSeason.data.episodes.map((episode) => ({
        id: episode.id,
        air_date: episode.aired,
        episode_number: episode.number,
        name: episode.name,
        overview: episode.overview || '',
        season_number: episode.seasonNumber,
        production_code: '',
        show_id: tvId,
        still_path: episode.image,
        vote_average: 1,
        vote_cuont: 1,
      }));

      return {
        episodes: episodes,
        external_ids: {
          tvdb_id: tvdbSeason.seriesId,
        },
        name: '',
        overview: '',
        id: tvdbSeason.id,
        air_date: tvdbSeason.year,
        season_number: tvdbSeason.number,
      };
    } catch (error) {
      throw new Error(
        `[TVDB] Failed to fetch TV season details: ${error.message}`
      );
    }
  };
}

export default Tvdb;
