import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import TheMovieDb from '@server/api/themoviedb';
import type { TmdbMovieDetails } from '@server/api/themoviedb/interfaces';
import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { MediaRequest } from '@server/entity/MediaRequest';
import { User } from '@server/entity/User';
import { setupTestDb } from '@server/test/db';
import { Watchlist } from './Watchlist';

mock.method(MediaRequest, 'sendNotification', async () => undefined);

setupTestDb();

describe('Watchlist.getLocalWatchlist', () => {
  let user: User;

  beforeEach(async () => {
    const userRepository = getRepository(User);
    user = await userRepository.findOneOrFail({
      where: { email: 'friend@seerr.dev' },
    });
    user.userType = UserType.LOCAL;
    user.plexToken = null;
    user = await userRepository.save(user);
  });

  it('filters by type, metadata, and media status for the requesting user', async () => {
    const mediaRepository = getRepository(Media);
    const watchlistRepository = getRepository(Watchlist);

    const movieMedia = await mediaRepository.save(
      new Media({
        tmdbId: 1001,
        mediaType: MediaType.MOVIE,
        status: MediaStatus.PARTIALLY_AVAILABLE,
        status4k: MediaStatus.UNKNOWN,
      })
    );
    const tvMedia = await mediaRepository.save(
      new Media({
        tmdbId: 1002,
        mediaType: MediaType.TV,
        status: MediaStatus.AVAILABLE,
        status4k: MediaStatus.UNKNOWN,
      })
    );

    await watchlistRepository.save(
      new Watchlist({
        ratingKey: 'movie-1001',
        tmdbId: 1001,
        mediaType: MediaType.MOVIE,
        title: 'Alpha Movie',
        overview: 'A movie used by the local watchlist test.',
        releaseDate: '2025-01-01',
        genreIds: '|18|',
        studioIds: '|10|',
        originalLanguage: 'en',
        certification: 'PG-13',
        runtime: 100,
        voteAverage: 8.5,
        voteCount: 500,
        watchProviders: '|8|',
        watchProviderRegions: '|US:8|',
        metadataUpdatedAt: new Date(),
        requestedBy: user,
        media: movieMedia,
      })
    );
    await watchlistRepository.save(
      new Watchlist({
        ratingKey: 'tv-1002',
        tmdbId: 1002,
        mediaType: MediaType.TV,
        title: 'Beta Series',
        releaseDate: '2026-01-01',
        genreIds: '|35|',
        originalLanguage: 'en',
        metadataUpdatedAt: new Date(),
        requestedBy: user,
        media: tvMedia,
      })
    );

    const response = await Watchlist.getLocalWatchlist({
      userId: user.id,
      filters: {
        mediaType: 'movie',
        query: 'alpha',
        genre: '18',
        studio: '10',
        language: 'en',
        certification: 'PG-13',
        watchProviders: '8',
        watchRegion: 'US',
        withRuntimeGte: '90',
        voteAverageGte: '8',
        voteCountGte: '100',
        mediaStatus: 'partiallyavailable',
      },
    });

    assert.equal(response.totalResults, 1);
    assert.equal(response.results[0].tmdbId, 1001);
    assert.equal(
      response.results[0].mediaInfo?.status,
      MediaStatus.PARTIALLY_AVAILABLE
    );
    assert.equal(response.results[0].metadataUpdated, true);

    const notRequested = await Watchlist.getLocalWatchlist({
      userId: user.id,
      filters: { mediaStatus: 'notrequested', sortBy: 'title.asc' },
    });
    assert.deepEqual(
      notRequested.results.map((item) => item.tmdbId),
      [1001, 1002]
    );

    const available = await Watchlist.getLocalWatchlist({
      userId: user.id,
      filters: { mediaStatus: 'available' },
    });
    assert.deepEqual(
      available.results.map((item) => item.tmdbId),
      [1002]
    );

    const sorted = await Watchlist.getLocalWatchlist({
      userId: user.id,
      filters: { sortBy: 'title.desc' },
    });
    assert.deepEqual(
      sorted.results.map((item) => item.title),
      ['Beta Series', 'Alpha Movie']
    );
  });

  it('paginates without duplicates', async () => {
    const watchlistRepository = getRepository(Watchlist);
    await watchlistRepository.save(
      Array.from(
        { length: 21 },
        (_, index) =>
          new Watchlist({
            ratingKey: `pagination-${index}`,
            tmdbId: 2000 + index,
            mediaType: MediaType.MOVIE,
            title: `Pagination ${String(index).padStart(2, '0')}`,
            metadataUpdatedAt: new Date(),
            requestedBy: user,
          })
      )
    );

    const firstPage = await Watchlist.getLocalWatchlist({
      userId: user.id,
      filters: { page: 1, sortBy: 'title.asc' },
    });
    const secondPage = await Watchlist.getLocalWatchlist({
      userId: user.id,
      filters: { page: 2, sortBy: 'title.asc' },
    });

    assert.equal(firstPage.results.length, 20);
    assert.equal(secondPage.results.length, 1);
    assert.equal(firstPage.totalPages, 2);
    assert.equal(
      new Set([
        ...firstPage.results.map((item) => item.tmdbId),
        ...secondPage.results.map((item) => item.tmdbId),
      ]).size,
      21
    );
  });

  it('hydrates legacy entries before applying metadata filters', async () => {
    const watchlistRepository = getRepository(Watchlist);
    const movieMetadata = {
      id: 3001,
      title: 'Hydrated Movie',
      original_title: 'Hydrated Movie',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      overview: 'Metadata fetched for a legacy watchlist entry.',
      release_date: '2024-01-01',
      genres: [{ id: 18, name: 'Drama' }],
      production_companies: [
        { id: 10, name: 'Test Studio', origin_country: 'US' },
      ],
      original_language: 'en',
      status: 'Released',
      runtime: 120,
      vote_average: 8.5,
      vote_count: 500,
      popularity: 42,
      release_dates: { results: [] },
    } as unknown as TmdbMovieDetails;
    let getMovieCallCount = 0;
    const originalGetMovie = Object.getOwnPropertyDescriptor(
      TheMovieDb.prototype,
      'getMovie'
    );
    Object.defineProperty(TheMovieDb.prototype, 'getMovie', {
      get() {
        return async ({ movieId }: { movieId: number }) => {
          getMovieCallCount += 1;
          assert.equal(movieId, 3001);
          return movieMetadata;
        };
      },
      set() {},
      configurable: true,
    });

    try {
      await watchlistRepository.save(
        new Watchlist({
          ratingKey: 'legacy-3001',
          tmdbId: 3001,
          mediaType: MediaType.MOVIE,
          title: 'Legacy title',
          requestedBy: user,
        })
      );

      const response = await Watchlist.getLocalWatchlist({
        userId: user.id,
        filters: { genre: '18', language: 'en' },
      });

      assert.equal(response.totalResults, 1);
      assert.equal(response.results[0].title, 'Hydrated Movie');
      assert.equal(response.results[0].metadataUpdated, true);
      assert.deepEqual(response.results[0].genreIds, [18]);
      assert.equal(getMovieCallCount, 1);

      const persisted = await watchlistRepository.findOneOrFail({
        where: { tmdbId: 3001, requestedBy: { id: user.id } },
      });
      assert.ok(persisted.metadataUpdatedAt);
      assert.equal(persisted.posterPath, '/poster.jpg');
    } finally {
      if (originalGetMovie) {
        Object.defineProperty(
          TheMovieDb.prototype,
          'getMovie',
          originalGetMovie
        );
      } else {
        delete (TheMovieDb.prototype as Partial<TheMovieDb>).getMovie;
      }
    }
  });

  it('excludes another user’s local watchlist items and finds active requests', async () => {
    const mediaRepository = getRepository(Media);
    const watchlistRepository = getRepository(Watchlist);
    const userRepository = getRepository(User);
    const otherUser = await userRepository.save(
      new User({
        email: 'watchlist-other@seerr.dev',
        username: 'watchlist-other',
        userType: UserType.LOCAL,
        permissions: 0,
        avatar: '',
      })
    );
    const media = await mediaRepository.save(
      new Media({
        tmdbId: 1003,
        mediaType: MediaType.MOVIE,
        status: MediaStatus.UNKNOWN,
        status4k: MediaStatus.UNKNOWN,
      })
    );

    await watchlistRepository.save([
      new Watchlist({
        ratingKey: 'mine-1003',
        tmdbId: 1003,
        mediaType: MediaType.MOVIE,
        title: 'Requested Movie',
        metadataUpdatedAt: new Date(),
        requestedBy: user,
        media,
      }),
      new Watchlist({
        ratingKey: 'other-1003',
        tmdbId: 1003,
        mediaType: MediaType.MOVIE,
        title: 'Other User Movie',
        metadataUpdatedAt: new Date(),
        requestedBy: otherUser,
        media,
      }),
    ]);

    await getRepository(MediaRequest).save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.APPROVED,
        requestedBy: user,
        media,
        is4k: false,
      })
    );

    const response = await Watchlist.getLocalWatchlist({
      userId: user.id,
      filters: { mediaStatus: 'requested' },
    });

    assert.equal(response.totalResults, 1);
    assert.equal(response.results[0].title, 'Requested Movie');
    assert.equal(response.results[0].mediaInfo?.hasActiveRequest, true);
  });

  it('removes only the matching user and media type', async () => {
    const watchlistRepository = getRepository(Watchlist);
    const userRepository = getRepository(User);
    const admin = await userRepository.findOneOrFail({ where: { id: 1 } });

    await watchlistRepository.save([
      new Watchlist({
        ratingKey: 'mine-1004',
        tmdbId: 1004,
        mediaType: MediaType.MOVIE,
        title: 'Mine',
        metadataUpdatedAt: new Date(),
        requestedBy: user,
      }),
      new Watchlist({
        ratingKey: 'admin-1004',
        tmdbId: 1004,
        mediaType: MediaType.MOVIE,
        title: 'Admin',
        metadataUpdatedAt: new Date(),
        requestedBy: admin,
      }),
    ]);

    const deleted = await Watchlist.deleteWatchlist(
      1004,
      MediaType.MOVIE,
      user
    );

    assert.equal(deleted?.title, 'Mine');
    assert.equal(
      await watchlistRepository.count({
        where: { tmdbId: 1004, requestedBy: { id: admin.id } },
      }),
      1
    );
  });
});
