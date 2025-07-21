import TheMovieDb from '@server/api/themoviedb';
import {
  MediaRequestStatus,
  MediaType,
} from '@server/constants/media';
import { getRepository } from '@server/datasource';
import type { DeletionRequestBody } from '@server/interfaces/api/requestInterfaces';
import notificationManager, { Notification } from '@server/lib/notifications';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { DbAwareColumn } from '@server/utils/DbColumnHelper';
import { truncate } from 'lodash';
import {
  AfterInsert,
  AfterUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Media from './Media';
import { User } from './User';

export class DeletionRequestPermissionError extends Error {}

@Entity()
export class DeletionRequest {
  public static async create(
    requestBody: DeletionRequestBody,
    user: User
  ): Promise<DeletionRequest> {
    const requestRepository = getRepository(DeletionRequest);
    const userRepository = getRepository(User);

    let requestUser = user;

    if (
      requestBody.userId &&
      !requestUser.hasPermission([
        Permission.MANAGE_USERS,
        Permission.MANAGE_REQUESTS,
      ])
    ) {
      throw new DeletionRequestPermissionError(
        'You do not have permission to modify the request user.'
      );
    } else if (requestBody.userId) {
      requestUser = await userRepository.findOneOrFail({
        where: { id: requestBody.userId },
      });
    }

    if (!requestUser) {
      throw new Error('User missing from request context.');
    }

    if (!requestUser.hasPermission(Permission.REQUEST_DELETE)) {
      throw new DeletionRequestPermissionError(
        'You do not have permission to request deletions.'
      );
    }

    const mediaRepository = getRepository(Media);
    const media = await mediaRepository.findOne({
      where: {
        tmdbId: requestBody.mediaId,
        mediaType: requestBody.mediaType,
      },
    });

    if (!media) {
      throw new Error('Media not found.');
    }

    // Check if there's already a pending deletion request
    const existing = await requestRepository
      .createQueryBuilder('request')
      .leftJoin('request.media', 'media')
      .where('request.is4k = :is4k', { is4k: requestBody.is4k })
      .andWhere('media.tmdbId = :tmdbId', { tmdbId: requestBody.mediaId })
      .andWhere('media.mediaType = :mediaType', {
        mediaType: requestBody.mediaType,
      })
      .andWhere('request.status = :status', { status: MediaRequestStatus.DELETION_PENDING })
      .getOne();

    if (existing) {
      throw new Error('A deletion request for this media already exists.');
    }

    const request = new DeletionRequest({
      media,
      requestedBy: requestUser,
      // Auto-approve if user has manage requests permission
      status: user.hasPermission(Permission.MANAGE_REQUESTS)
        ? MediaRequestStatus.DELETION_APPROVED
        : MediaRequestStatus.DELETION_PENDING,
      modifiedBy: user.hasPermission(Permission.MANAGE_REQUESTS)
        ? user
        : undefined,
      is4k: requestBody.is4k,
      reason: requestBody.reason,
    });

    await requestRepository.save(request);
    return request;
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'integer' })
  public status: MediaRequestStatus;

  @ManyToOne(() => Media, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public media: Media;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public requestedBy: User;

  @ManyToOne(() => User, {
    nullable: true,
    cascade: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  public modifiedBy?: User;

  @DbAwareColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @DbAwareColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt: Date;

  @Column({ default: false })
  public is4k: boolean;

  @Column({ type: 'text', nullable: true })
  public reason?: string;

  constructor(init?: Partial<DeletionRequest>) {
    Object.assign(this, init);
  }

  @AfterInsert()
  public async notifyNewDeletionRequest(): Promise<void> {
    if (this.status === MediaRequestStatus.DELETION_PENDING) {
      const mediaRepository = getRepository(Media);
      const media = await mediaRepository.findOne({
        where: { id: this.media.id },
      });
      if (!media) {
        logger.error('Media data not found', {
          label: 'Deletion Request',
          requestId: this.id,
          mediaId: this.media.id,
        });
        return;
      }

      DeletionRequest.sendNotification(this, media, Notification.MEDIA_PENDING);
    }
  }

  @AfterUpdate()
  public async notifyApprovedOrDeclined(): Promise<void> {
    if (
      this.status === MediaRequestStatus.DELETION_APPROVED ||
      this.status === MediaRequestStatus.DELETION_DECLINED
    ) {
      const mediaRepository = getRepository(Media);
      const media = await mediaRepository.findOne({
        where: { id: this.media.id },
      });
      if (!media) {
        logger.error('Media data not found', {
          label: 'Deletion Request',
          requestId: this.id,
          mediaId: this.media.id,
        });
        return;
      }

      DeletionRequest.sendNotification(
        this,
        media,
        this.status === MediaRequestStatus.DELETION_APPROVED
          ? Notification.MEDIA_APPROVED
          : Notification.MEDIA_DECLINED
      );
    }
  }

  @AfterInsert()
  public async autoapprovalNotification(): Promise<void> {
    if (this.status === MediaRequestStatus.DELETION_APPROVED) {
      this.notifyApprovedOrDeclined();
    }
  }

  static async sendNotification(
    entity: DeletionRequest,
    media: Media,
    type: Notification
  ) {
    const tmdb = new TheMovieDb();

    try {
      const mediaType = media.mediaType === MediaType.MOVIE ? 'Movie' : 'Series';
      let event: string | undefined;
      let notifyAdmin = true;
      let notifySystem = true;

      switch (type) {
        case Notification.MEDIA_APPROVED:
          event = `${entity.is4k ? '4K ' : ''}${mediaType} Deletion Request Approved`;
          notifyAdmin = false;
          break;
        case Notification.MEDIA_DECLINED:
          event = `${entity.is4k ? '4K ' : ''}${mediaType} Deletion Request Declined`;
          notifyAdmin = false;
          break;
        case Notification.MEDIA_PENDING:
          event = `New ${entity.is4k ? '4K ' : ''}${mediaType} Deletion Request`;
          break;
      }

      if (media.mediaType === MediaType.MOVIE) {
        const movie = await tmdb.getMovie({ movieId: media.tmdbId });
        notificationManager.sendNotification(type, {
          media,
          notifyAdmin,
          notifySystem,
          notifyUser: notifyAdmin ? undefined : entity.requestedBy,
          event,
          subject: `${movie.title}${
            movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ''
          }`,
          message: entity.reason || truncate(movie.overview, {
            length: 500,
            separator: /\s/,
            omission: '…',
          }),
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
        });
      } else if (media.mediaType === MediaType.TV) {
        const tv = await tmdb.getTvShow({ tvId: media.tmdbId });
        notificationManager.sendNotification(type, {
          media,
          notifyAdmin,
          notifySystem,
          notifyUser: notifyAdmin ? undefined : entity.requestedBy,
          event,
          subject: `${tv.name}${
            tv.first_air_date ? ` (${tv.first_air_date.slice(0, 4)})` : ''
          }`,
          message: entity.reason || truncate(tv.overview, {
            length: 500,
            separator: /\s/,
            omission: '…',
          }),
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
        });
      }
    } catch (e) {
      logger.error('Something went wrong sending deletion request notification(s)', {
        label: 'Notifications',
        errorMessage: e.message,
        requestId: entity.id,
        mediaId: entity.media.id,
      });
    }
  }
}

export default DeletionRequest;