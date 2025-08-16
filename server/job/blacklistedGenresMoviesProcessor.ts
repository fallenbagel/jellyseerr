import { SortOptionsIterable } from '@server/api/themoviedb';
import type { TmdbSearchMovieResponse } from '@server/api/themoviedb/interfaces';
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

class BlacklistedGenresMoviesProcessor implements RunnableScanner<StatusBase> {
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
        logger.info('Aborting job: Process Blacklisted Movie Genres', {
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
    const tmdb = createTmdbWithRegionLanguage();
    const settings = getSettings();

    const blacklistedGenres = settings.main.blacklistedGenresMovies || '';
    const blacklistedGenresArr = blacklistedGenres
      .split(',')
      .filter((g) => g.trim());
    const pageLimit = settings.main.blacklistedGenresMoviesLimit || 50;
    const invalidGenres = new Set<string>();

    if (blacklistedGenres.length === 0) {
      return;
    }

    this.total =
      blacklistedGenresArr.length * pageLimit * SortOptionsIterable.length;

    const availableGenres = await tmdb.getMovieGenres();

    for (const genreId of blacklistedGenresArr) {
      const genreDetails = availableGenres.find(
        (g) => g.id === Number(genreId)
      );

      if (!genreDetails) {
        logger.warn('Skipping invalid genre in blacklisted movie genres', {
          label: 'Blacklisted Movie Genres Processor',
          genreId: genreId,
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
            const response = await tmdb.getDiscoverMovies({
              page,
              sortBy,
              genre: genreId,
            });

            await this.processResults(response, genreId, em);
            await new Promise((res) => setTimeout(res, TMDB_API_DELAY_MS));

            this.progress++;
            if (page === 1 && response.total_pages <= queryMax) {
              this.progress += queryMax - response.total_pages;
              fixedSortMode = true;
              queryMax = response.total_pages;
            }
          } catch (error) {
            logger.error('Error processing genre in blacklisted movie genres', {
              label: 'Blacklisted Movie Genres Processor',
              genreId: genreId,
              errorMessage: error.message,
            });
          }
        }
      }
    }

    // Clean up invalid genres
    if (invalidGenres.size > 0) {
      const currentGenres = blacklistedGenresArr.filter(
        (genre) => !invalidGenres.has(genre)
      );
      const cleanedGenres = currentGenres.join(',');

      if (cleanedGenres !== blacklistedGenres) {
        settings.main.blacklistedGenresMovies = cleanedGenres;
        await settings.save();

        logger.info('Cleaned up invalid movie genres from settings', {
          label: 'Blacklisted Movie Genres Processor',
          removedGenres: Array.from(invalidGenres),
          newBlacklistedGenres: cleanedGenres,
        });
      }
    }
  }

  private async processResults(
    response: TmdbSearchMovieResponse,
    genreId: string,
    em: EntityManager
  ) {
    const blacklistRepository = em.getRepository(Blacklist);

    for (const entry of response.results) {
      const blacklistEntry = await blacklistRepository.findOne({
        where: { tmdbId: entry.id },
      });

      if (blacklistEntry) {
        const currentGenres = blacklistEntry.blacklistedGenresMovies;
        if (currentGenres && !currentGenres.includes(`,${genreId},`)) {
          await blacklistRepository.update(blacklistEntry.id, {
            blacklistedGenresMovies: `${currentGenres}${genreId},`,
          });
        } else if (!currentGenres) {
          await blacklistRepository.update(blacklistEntry.id, {
            blacklistedGenresMovies: `,${genreId},`,
          });
        }
      } else {
        await Blacklist.addToBlacklist(
          {
            blacklistRequest: {
              mediaType: MediaType.MOVIE,
              title: entry.title,
              tmdbId: entry.id,
              blacklistedGenresMovies: `,${genreId},`,
            },
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
        `blist.blacklistedGenresMovies IS NOT NULL AND media.mediaType = 'movie'`
      )
      .getMany();

    for (let i = 0; i < mediaToRemove.length; i += 500) {
      await mediaRepository.remove(mediaToRemove.slice(i, i + 500));
    }
  }
}

const blacklistedGenresMoviesProcessor = new BlacklistedGenresMoviesProcessor();

export default blacklistedGenresMoviesProcessor;
