import TheMovieDb from '@server/api/themoviedb';
import type {
  TmdbMovieDetails,
  TmdbTvDetails,
  TmdbWatchProviders,
} from '@server/api/themoviedb/interfaces';
import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { User } from '@server/entity/User';
import type {
  WatchlistItem,
  WatchlistQuery,
  WatchlistResponse,
} from '@server/interfaces/api/watchlistInterfaces';
import logger from '@server/logger';
import { DbAwareColumn, resolveDbType } from '@server/utils/DbColumnHelper';
import {
  Brackets,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { ZodNumber, ZodOptional, ZodString } from 'zod';

export class DuplicateWatchlistRequestError extends Error {}
export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

@Entity()
@Unique('UNIQUE_USER_DB', ['tmdbId', 'mediaType', 'requestedBy'])
export class Watchlist {
  private static metadataRefreshes = new Map<number, Promise<void>>();

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  public ratingKey = '';

  @Column({ type: 'varchar' })
  public mediaType: MediaType;

  @Column({ type: 'varchar' })
  title = '';

  @Column()
  @Index()
  public tmdbId: number;

  @Column({ type: 'varchar', nullable: true })
  public posterPath?: string | null;

  @Column({ type: 'varchar', nullable: true })
  public backdropPath?: string | null;

  @Column({ type: 'text', nullable: true })
  public overview?: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index('IDX_watchlist_release_date')
  public releaseDate?: string | null;

  /** Delimited values keep this snapshot portable between SQLite and Postgres. */
  @Column({ type: 'text', nullable: true })
  public genreIds?: string | null;

  @Column({ type: 'text', nullable: true })
  public studioIds?: string | null;

  @Column({ type: 'varchar', nullable: true })
  public originalLanguage?: string | null;

  @Column({ type: 'varchar', nullable: true })
  public certification?: string | null;

  @Column({ type: 'varchar', nullable: true })
  public tmdbStatus?: string | null;

  @Column({ type: 'integer', nullable: true })
  public runtime?: number | null;

  @Column({ type: 'real', nullable: true })
  public voteAverage?: number | null;

  @Column({ type: 'integer', nullable: true })
  public voteCount?: number | null;

  @Column({ type: 'real', nullable: true })
  public popularity?: number | null;

  @Column({ type: 'text', nullable: true })
  public watchProviders?: string | null;

  @Column({ type: 'text', nullable: true })
  public watchProviderRegions?: string | null;

  @DbAwareColumn({ type: 'datetime', nullable: true })
  public metadataUpdatedAt?: Date | null;

  @ManyToOne(() => User, (user) => user.watchlists, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @Index()
  public requestedBy: User;

  @ManyToOne(() => Media, (media) => media.watchlists, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @Index()
  public media: Media;

  @DbAwareColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @UpdateDateColumn({
    type: resolveDbType('datetime'),
    default: () => 'CURRENT_TIMESTAMP',
  })
  public updatedAt: Date;

  constructor(init?: Partial<Watchlist>) {
    Object.assign(this, init);
  }

  private static serializeIds(ids: number[]): string | null {
    return ids.length ? `|${[...new Set(ids)].join('|')}|` : null;
  }

  private static getProviderIds(providers?: {
    [iso_3166_1: string]: TmdbWatchProviders;
  }): number[] {
    return Object.values(providers ?? {}).flatMap((provider) => [
      ...(provider.buy ?? []).map((item) => item.provider_id),
      ...(provider.flatrate ?? []).map((item) => item.provider_id),
      ...(provider.rent ?? []).map((item) => item.provider_id),
      ...(provider.free ?? []).map((item) => item.provider_id),
      ...(provider.ads ?? []).map((item) => item.provider_id),
    ]);
  }

  private static serializeProviderRegions(providers?: {
    [iso_3166_1: string]: TmdbWatchProviders;
  }): string | null {
    const regionProviderIds = Object.entries(providers ?? {}).flatMap(
      ([region, provider]) =>
        Watchlist.getProviderIds({ [region]: provider }).map(
          (providerId) => `${region}:${providerId}`
        )
    );

    return regionProviderIds.length ? `|${regionProviderIds.join('|')}|` : null;
  }

  public applyMetadata(metadata: TmdbMovieDetails | TmdbTvDetails): void {
    const isMovie = 'title' in metadata;
    const certification = isMovie
      ? metadata.release_dates?.results
          ?.find((release) => release.iso_3166_1 === 'US')
          ?.release_dates.find((release) => !!release.certification)
          ?.certification
      : metadata.content_ratings?.results?.find(
          (rating) => rating.iso_3166_1 === 'US'
        )?.rating;

    Object.assign(this, {
      title: isMovie ? metadata.title : metadata.name,
      posterPath: metadata.poster_path,
      backdropPath: metadata.backdrop_path,
      overview: metadata.overview,
      releaseDate: isMovie ? metadata.release_date : metadata.first_air_date,
      genreIds: Watchlist.serializeIds(
        metadata.genres.map((genre) => genre.id)
      ),
      studioIds: Watchlist.serializeIds(
        metadata.production_companies.map((company) => company.id)
      ),
      originalLanguage: metadata.original_language,
      certification: certification || null,
      tmdbStatus: metadata.status,
      runtime: isMovie
        ? (metadata.runtime ?? null)
        : (metadata.episode_run_time?.[0] ?? null),
      voteAverage: metadata.vote_average,
      voteCount: metadata.vote_count,
      popularity: metadata.popularity,
      watchProviders: Watchlist.serializeIds(
        Watchlist.getProviderIds(metadata['watch/providers']?.results)
      ),
      watchProviderRegions: Watchlist.serializeProviderRegions(
        metadata['watch/providers']?.results
      ),
      metadataUpdatedAt: new Date(),
    });
  }

  public toWatchlistItem(media?: Media): WatchlistItem {
    return {
      id: this.tmdbId,
      ratingKey: this.ratingKey,
      tmdbId: this.tmdbId,
      mediaType: this.mediaType,
      title: this.title,
      originalTitle: this.title,
      posterPath: this.posterPath,
      backdropPath: this.backdropPath,
      overview: this.overview,
      releaseDate: this.releaseDate,
      genreIds: this.genreIds
        ? this.genreIds.split('|').filter(Boolean).map(Number)
        : undefined,
      studioIds: this.studioIds
        ? this.studioIds.split('|').filter(Boolean).map(Number)
        : undefined,
      originalLanguage: this.originalLanguage,
      certification: this.certification,
      runtime: this.runtime,
      voteAverage: this.voteAverage,
      voteCount: this.voteCount,
      popularity: this.popularity,
      watchProviders: this.watchProviders
        ? this.watchProviders.split('|').filter(Boolean).map(Number)
        : undefined,
      metadataUpdated: !!this.metadataUpdatedAt,
      mediaInfo: media
        ? {
            status: media.status,
            hasActiveRequest: media.hasActiveRequest,
          }
        : undefined,
      createdAt: this.createdAt?.toISOString(),
    };
  }

  private static async refreshMissingMetadata(userId: number): Promise<void> {
    const pendingRefresh = this.metadataRefreshes.get(userId);
    if (pendingRefresh) {
      return pendingRefresh;
    }

    const refresh = (async () => {
      const repository = getRepository(this);
      const missingMetadata = await repository
        .createQueryBuilder('watchlist')
        .leftJoin('watchlist.requestedBy', 'requestedBy')
        .where('requestedBy.id = :userId', { userId })
        .andWhere('watchlist.metadataUpdatedAt IS NULL')
        .getMany();

      if (missingMetadata.length === 0) {
        return;
      }

      const tmdb = new TheMovieDb();

      for (const watchlist of missingMetadata) {
        try {
          const metadata =
            watchlist.mediaType === MediaType.MOVIE
              ? await tmdb.getMovie({ movieId: watchlist.tmdbId })
              : await tmdb.getTvShow({ tvId: watchlist.tmdbId });

          watchlist.applyMetadata(metadata);
          await repository.save(watchlist);
        } catch (error) {
          logger.warn('Unable to refresh Watchlist metadata', {
            label: 'Watchlist',
            userId,
            tmdbId: watchlist.tmdbId,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          });
        }
      }
    })().finally(() => {
      this.metadataRefreshes.delete(userId);
    });

    this.metadataRefreshes.set(userId, refresh);
    await refresh;
  }

  public static async getLocalWatchlist({
    userId,
    filters = {},
  }: {
    userId: number;
    filters?: WatchlistQuery;
  }): Promise<WatchlistResponse> {
    await this.refreshMissingMetadata(userId);

    const itemsPerPage = 20;
    const page = Math.max(1, Number(filters.page) || 1);
    const query = getRepository(this)
      .createQueryBuilder('watchlist')
      .leftJoin('watchlist.media', 'media')
      .leftJoin('watchlist.requestedBy', 'requestedBy')
      .where('requestedBy.id = :userId', { userId });

    if (filters.mediaType && filters.mediaType !== 'all') {
      query.andWhere('watchlist.mediaType = :mediaType', {
        mediaType: filters.mediaType,
      });
    }

    if (filters.query) {
      query.andWhere('LOWER(watchlist.title) LIKE :titleQuery', {
        titleQuery: `%${filters.query.toLowerCase()}%`,
      });
    }

    if (filters.studio) {
      const studioIds = filters.studio.split(',').filter(Boolean);
      studioIds.forEach((studioId, index) => {
        query.andWhere(`watchlist.studioIds LIKE :studioId${index}`, {
          [`studioId${index}`]: `%|${studioId}|%`,
        });
      });
    }

    if (filters.genre) {
      filters.genre
        .split(',')
        .filter(Boolean)
        .forEach((genreId, index) => {
          query.andWhere(`watchlist.genreIds LIKE :genreId${index}`, {
            [`genreId${index}`]: `%|${genreId}|%`,
          });
        });
    }

    if (filters.language) {
      const languages = filters.language.split('|').filter(Boolean);
      if (languages.length) {
        query.andWhere('watchlist.originalLanguage IN (:...languages)', {
          languages,
        });
      }
    }

    if (filters.certification) {
      const certifications = filters.certification.split('|').filter(Boolean);
      if (certifications.length) {
        query.andWhere('watchlist.certification IN (:...certifications)', {
          certifications,
        });
      }
    }

    if (filters.status) {
      const statuses = filters.status.split('|').filter(Boolean);
      if (statuses.length) {
        query.andWhere('watchlist.tmdbStatus IN (:...tmdbStatuses)', {
          tmdbStatuses: statuses,
        });
      }
    }

    if (filters.watchProviders) {
      const providers = filters.watchProviders.split('|').filter(Boolean);
      if (providers.length) {
        const providerColumn = filters.watchRegion
          ? 'watchlist.watchProviderRegions'
          : 'watchlist.watchProviders';
        const providerValues = filters.watchRegion
          ? providers.map(
              (providerId) =>
                `${filters.watchRegion!.toUpperCase()}:${providerId}`
            )
          : providers;
        query.andWhere(
          new Brackets((where) => {
            providerValues.forEach((providerId, index) => {
              where.orWhere(`${providerColumn} LIKE :provider${index}`, {
                [`provider${index}`]: `%|${providerId}|%`,
              });
            });
          })
        );
      }
    }

    const releaseDateGte =
      filters.primaryReleaseDateGte ?? filters.firstAirDateGte;
    const releaseDateLte =
      filters.primaryReleaseDateLte ?? filters.firstAirDateLte;

    if (releaseDateGte) {
      query.andWhere('watchlist.releaseDate >= :releaseDateGte', {
        releaseDateGte,
      });
    }

    if (releaseDateLte) {
      query.andWhere('watchlist.releaseDate <= :releaseDateLte', {
        releaseDateLte,
      });
    }

    if (filters.releaseState && filters.releaseState !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      query.andWhere(
        filters.releaseState === 'released'
          ? "watchlist.releaseDate IS NOT NULL AND watchlist.releaseDate != '' AND watchlist.releaseDate <= :today"
          : "watchlist.releaseDate IS NOT NULL AND watchlist.releaseDate != '' AND watchlist.releaseDate > :today",
        { today }
      );
    }

    if (filters.withRuntimeGte) {
      query.andWhere('watchlist.runtime >= :runtimeGte', {
        runtimeGte: Number(filters.withRuntimeGte),
      });
    }

    if (filters.withRuntimeLte) {
      query.andWhere('watchlist.runtime <= :runtimeLte', {
        runtimeLte: Number(filters.withRuntimeLte),
      });
    }

    if (filters.voteAverageGte) {
      query.andWhere('watchlist.voteAverage >= :voteAverageGte', {
        voteAverageGte: Number(filters.voteAverageGte),
      });
    }

    if (filters.voteAverageLte) {
      query.andWhere('watchlist.voteAverage <= :voteAverageLte', {
        voteAverageLte: Number(filters.voteAverageLte),
      });
    }

    if (filters.voteCountGte) {
      query.andWhere('watchlist.voteCount >= :voteCountGte', {
        voteCountGte: Number(filters.voteCountGte),
      });
    }

    if (filters.voteCountLte) {
      query.andWhere('watchlist.voteCount <= :voteCountLte', {
        voteCountLte: Number(filters.voteCountLte),
      });
    }

    const activeRequestQuery = query
      .subQuery()
      .select('activeRequest.id')
      .from('media_request', 'activeRequest')
      .where('activeRequest.mediaId = media.id')
      .andWhere('activeRequest.status IN (:...activeRequestStatuses)')
      .getQuery();
    query.setParameter('activeRequestStatuses', [
      MediaRequestStatus.PENDING,
      MediaRequestStatus.APPROVED,
    ]);

    switch (filters.mediaStatus) {
      case 'notrequested':
        query.andWhere(`NOT EXISTS ${activeRequestQuery}`);
        break;
      case 'requested':
        query.andWhere(`EXISTS ${activeRequestQuery}`);
        break;
      case 'available':
        query.andWhere('media.status = :availableStatus', {
          availableStatus: MediaStatus.AVAILABLE,
        });
        break;
      case 'partiallyavailable':
        query.andWhere('media.status = :partiallyAvailableStatus', {
          partiallyAvailableStatus: MediaStatus.PARTIALLY_AVAILABLE,
        });
        break;
    }

    switch (filters.sortBy) {
      case 'watchlistAddedAsc':
        query.orderBy('watchlist.createdAt', 'ASC');
        break;
      case 'title.asc':
        query.orderBy('watchlist.title', 'ASC');
        break;
      case 'title.desc':
        query.orderBy('watchlist.title', 'DESC');
        break;
      case 'releaseDate.asc':
        query.orderBy('watchlist.releaseDate', 'ASC');
        break;
      case 'releaseDate.desc':
        query.orderBy('watchlist.releaseDate', 'DESC');
        break;
      case 'voteAverage.desc':
      case 'vote_average.desc':
        query.orderBy('watchlist.voteAverage', 'DESC');
        break;
      case 'vote_average.asc':
        query.orderBy('watchlist.voteAverage', 'ASC');
        break;
      case 'release_date.asc':
      case 'primary_release_date.asc':
      case 'first_air_date.asc':
        query.orderBy('watchlist.releaseDate', 'ASC');
        break;
      case 'release_date.desc':
      case 'primary_release_date.desc':
      case 'first_air_date.desc':
        query.orderBy('watchlist.releaseDate', 'DESC');
        break;
      case 'original_title.asc':
      case 'original_name.asc':
        query.orderBy('watchlist.title', 'ASC');
        break;
      case 'original_title.desc':
      case 'original_name.desc':
        query.orderBy('watchlist.title', 'DESC');
        break;
      case 'popularity.asc':
        query.orderBy('watchlist.popularity', 'ASC');
        break;
      case 'popularity.desc':
        query.orderBy('watchlist.popularity', 'DESC');
        break;
      case 'watchlistAddedDesc':
      default:
        query.orderBy('watchlist.createdAt', 'DESC');
        break;
    }

    query.addOrderBy('watchlist.id', 'ASC');

    const [result, total] = await query
      .take(itemsPerPage)
      .skip((page - 1) * itemsPerPage)
      .getManyAndCount();

    const relatedMedia = await Media.getRelatedMedia(
      new User({ id: userId }),
      result.map((item) => ({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
      })),
      { includeActiveRequest: true, forceActiveRequest: true }
    );

    const mediaByKey = new Map(
      relatedMedia.map((media) => [`${media.mediaType}:${media.tmdbId}`, media])
    );

    return {
      page,
      totalPages: Math.max(1, Math.ceil(total / itemsPerPage)),
      totalResults: total,
      results: result.map((item) =>
        item.toWatchlistItem(mediaByKey.get(`${item.mediaType}:${item.tmdbId}`))
      ),
    };
  }

  public static async createWatchlist({
    watchlistRequest,
    user,
  }: {
    watchlistRequest: {
      mediaType: MediaType;
      ratingKey?: ZodOptional<ZodString>['_output'];
      title?: ZodOptional<ZodString>['_output'];
      tmdbId: ZodNumber['_output'];
    };
    user: User;
  }): Promise<Watchlist> {
    const watchlistRepository = getRepository(this);
    const mediaRepository = getRepository(Media);
    const tmdb = new TheMovieDb();

    const tmdbMedia =
      watchlistRequest.mediaType === MediaType.MOVIE
        ? await tmdb.getMovie({ movieId: watchlistRequest.tmdbId })
        : await tmdb.getTvShow({ tvId: watchlistRequest.tmdbId });

    const existing = await watchlistRepository
      .createQueryBuilder('watchlist')
      .leftJoinAndSelect('watchlist.requestedBy', 'user')
      .where('user.id = :userId', { userId: user.id })
      .andWhere('watchlist.tmdbId = :tmdbId', {
        tmdbId: watchlistRequest.tmdbId,
      })
      .andWhere('watchlist.mediaType = :mediaType', {
        mediaType: watchlistRequest.mediaType,
      })
      .getMany();

    if (existing && existing.length > 0) {
      logger.warn('Duplicate request for watchlist blocked', {
        tmdbId: watchlistRequest.tmdbId,
        mediaType: watchlistRequest.mediaType,
        label: 'Watchlist',
      });

      throw new DuplicateWatchlistRequestError();
    }

    let media = await mediaRepository.findOne({
      where: {
        tmdbId: watchlistRequest.tmdbId,
        mediaType: watchlistRequest.mediaType,
      },
    });

    if (!media) {
      media = new Media({
        tmdbId: tmdbMedia.id,
        tvdbId: tmdbMedia.external_ids.tvdb_id,
        mediaType: watchlistRequest.mediaType,
      });
    }

    const watchlist = new this({
      ...watchlistRequest,
      requestedBy: user,
      media,
    });
    watchlist.applyMetadata(tmdbMedia);

    await mediaRepository.save(media);
    await watchlistRepository.save(watchlist);
    return watchlist;
  }

  public static async deleteWatchlist(
    tmdbId: Watchlist['tmdbId'],
    mediaType: MediaType,
    user: User
  ): Promise<Watchlist | null> {
    const watchlistRepository = getRepository(this);
    const watchlist = await watchlistRepository.findOneBy({
      tmdbId,
      mediaType,
      requestedBy: { id: user.id },
    });
    if (!watchlist) {
      throw new NotFoundError('not Found');
    }

    if (watchlist) {
      await watchlistRepository.delete(watchlist.id);
    }

    return watchlist;
  }
}
