import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

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
      filters: { mediaStatus: 'notrequested' },
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
        requestedBy: user,
        media,
      }),
      new Watchlist({
        ratingKey: 'other-1003',
        tmdbId: 1003,
        mediaType: MediaType.MOVIE,
        title: 'Other User Movie',
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
        requestedBy: user,
      }),
      new Watchlist({
        ratingKey: 'admin-1004',
        tmdbId: 1004,
        mediaType: MediaType.MOVIE,
        title: 'Admin',
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
