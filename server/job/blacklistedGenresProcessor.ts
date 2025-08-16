import { SortOptionsIterable } from '@server/api/themoviedb';
import type {
  TmdbSearchMovieResponse,
  TmdbSearchTvResponse,
} from '@server/api/themoviedb/interfaces';
import { MediaType } from '@server/constants/media';
import dataSource from '@server/datasource';
import { Blacklist } from '@server/entity/Blacklist';
import Media from '@server/entity/Media';
import type {
  RunnableScanner,
  StatusBase,
} from '@server/lib/scanners/baseScanner';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { createTmdbWithRegionLanguage } from '@server/routes/discover';
import type { EntityManager } from 'typeorm';

const TMDB_API_DELAY_MS = 250;

class AbortTransaction extends Error {}

class BlacklistedGenreProcessor implements RunnableScanner<StatusBase> {
  private running = false;
  private progress = 0;
  private total = 0;

  public async run() {
    this.running = true;

    try {
      await dataSource.transaction(async (em) => {
        await this.cleanBlacklist(em);
        await this.createBlacklistEntries(em);
      });
    } catch (err) {
      if (err instanceof AbortTransaction) {
        logger.info('Aborting job: Process Blacklisted Genres', {
          label: 'Jobs',
        });
      } else {
        throw err;
      }
    } finally {
      this.reset();
    }
  }

  public status(): StatusBase {
    return {
      running: this.running,
      progress: this.progress,
      total: this.total,
    };
  }

  public cancel() {
    this.running = false;
    this.progress = 0;
    this.total = 0;
  }

  private reset() {
    this.cancel();
  }

  private async createBlacklistEntries(em: EntityManager) {
    const settings = getSettings();

    // Get movie genres settings
    const blacklistedMovieGenres = settings.main.blacklistedGenresMovies || '';
    const blacklistedMovieGenresArr = blacklistedMovieGenres
      .split(',')
      .filter((g) => g.trim());
    const moviePageLimit = settings.main.blacklistedGenresMoviesLimit || 50;

    // Get TV show genres settings
    const blacklistedTvGenres = settings.main.blacklistedGenresTvShows || '';
    const blacklistedTvGenresArr = blacklistedTvGenres
      .split(',')
      .filter((g) => g.trim());
    const tvPageLimit = settings.main.blacklistedGenresTvShowsLimit || 50;

    // Calculate total progress
    this.total =
      blacklistedMovieGenresArr.length *
        moviePageLimit *
        SortOptionsIterable.length +
      blacklistedTvGenresArr.length * tvPageLimit * SortOptionsIterable.length;

    // Process movies
    if (blacklistedMovieGenres.length > 0) {
      await this.processMediaType(
        MediaType.MOVIE,
        blacklistedMovieGenresArr,
        moviePageLimit,
        em
      );
    }

    // Process TV shows
    if (blacklistedTvGenres.length > 0) {
      await this.processMediaType(
        MediaType.TV,
        blacklistedTvGenresArr,
        tvPageLimit,
        em
      );
    }
  }

  private async processMediaType(
    mediaType: MediaType,
    genreIds: string[],
    pageLimit: number,
    em: EntityManager
  ) {
    const tmdb = createTmdbWithRegionLanguage();
    const settings = getSettings();
    const invalidGenres = new Set<string>();

    const getDiscover =
      mediaType === MediaType.MOVIE
        ? tmdb.getDiscoverMovies
        : tmdb.getDiscoverTv;
    const availableGenres =
      mediaType === MediaType.MOVIE
        ? await tmdb.getMovieGenres()
        : await tmdb.getTvGenres();

    for (const genreId of genreIds) {
      const genreDetails = availableGenres.find(
        (g) => g.id === Number(genreId)
      );

      if (!genreDetails) {
        logger.warn('Skipping invalid genre in blacklisted genres', {
          label: 'Blacklisted Genres Processor',
          genreId: genreId,
          mediaType: mediaType,
        });
        invalidGenres.add(genreId);
        continue;
      }

      let queryMax = pageLimit * SortOptionsIterable.length;
      let fixedSortMode = false;

      for (const sortBy of SortOptionsIterable) {
        for (let page = 1; page <= pageLimit; page++) {
          if (!this.running) {
            throw new AbortTransaction();
          }

          if (fixedSortMode && page > queryMax) {
            break;
          }

          try {
            const response = await getDiscover({
              page,
              sortBy,
              genre: genreId,
            });

            await this.processResults(response, genreId, mediaType, em);
            await new Promise((res) => setTimeout(res, TMDB_API_DELAY_MS));

            this.progress++;
            if (page === 1 && response.total_pages <= queryMax) {
              this.progress += queryMax - response.total_pages;
              fixedSortMode = true;
              queryMax = response.total_pages;
            }
          } catch (error) {
            logger.error('Error processing genre in blacklisted genres', {
              label: 'Blacklisted Genres Processor',
              genreId: genreId,
              mediaType: mediaType,
              errorMessage: error.message,
            });
          }
        }
      }
    }

    // Clean up invalid genres
    if (invalidGenres.size > 0) {
      const currentGenres = genreIds.filter(
        (genre) => !invalidGenres.has(genre)
      );
      const cleanedGenres = currentGenres.join(',');

      const originalGenres =
        mediaType === MediaType.MOVIE
          ? settings.main.blacklistedGenresMovies
          : settings.main.blacklistedGenresTvShows;

      if (cleanedGenres !== originalGenres) {
        if (mediaType === MediaType.MOVIE) {
          settings.main.blacklistedGenresMovies = cleanedGenres;
        } else {
          settings.main.blacklistedGenresTvShows = cleanedGenres;
        }
        await settings.save();

        logger.info('Cleaned up invalid genres from settings', {
          label: 'Blacklisted Genres Processor',
          mediaType: mediaType,
          removedGenres: Array.from(invalidGenres),
          newBlacklistedGenres: cleanedGenres,
        });
      }
    }
  }

  private async processResults(
    response: TmdbSearchMovieResponse | TmdbSearchTvResponse,
    genreId: string,
    mediaType: MediaType,
    em: EntityManager
  ) {
    const blacklistRepository = em.getRepository(Blacklist);

    for (const entry of response.results) {
      const blacklistEntry = await blacklistRepository.findOne({
        where: { tmdbId: entry.id },
      });

      const genreField =
        mediaType === MediaType.MOVIE
          ? 'blacklistedGenresMovies'
          : 'blacklistedGenresTvShows';

      if (blacklistEntry) {
        const currentGenres = blacklistEntry[genreField];
        if (currentGenres && !currentGenres.includes(`,${genreId},`)) {
          await blacklistRepository.update(blacklistEntry.id, {
            [genreField]: `${currentGenres}${genreId},`,
          });
        } else if (!currentGenres) {
          await blacklistRepository.update(blacklistEntry.id, {
            [genreField]: `,${genreId},`,
          });
        }
      } else {
        const blacklistRequest: {
          mediaType: MediaType;
          title: string;
          tmdbId: number;
          blacklistedGenresMovies?: string;
          blacklistedGenresTvShows?: string;
        } = {
          mediaType,
          title: 'title' in entry ? entry.title : entry.name,
          tmdbId: entry.id,
        };
        blacklistRequest[genreField] = `,${genreId},`;

        await Blacklist.addToBlacklist(
          {
            blacklistRequest,
          },
          em
        );
      }
    }
  }

  private async cleanBlacklist(em: EntityManager) {
    const mediaRepository = em.getRepository(Media);
    const mediaToRemove = await mediaRepository
      .createQueryBuilder('media')
      .innerJoinAndSelect(Blacklist, 'blist', 'blist.tmdbId = media.tmdbId')
      .where(
        `blist.blacklistedGenresMovies IS NOT NULL OR blist.blacklistedGenresTvShows IS NOT NULL`
      )
      .getMany();

    for (let i = 0; i < mediaToRemove.length; i += 500) {
      await mediaRepository.remove(mediaToRemove.slice(i, i + 500));
    }
  }
}

const blacklistedGenresProcessor = new BlacklistedGenreProcessor();

export default blacklistedGenresProcessor;
