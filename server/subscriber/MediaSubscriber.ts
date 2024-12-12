import TheMovieDb from '@server/api/themoviedb';
import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { MediaRequest } from '@server/entity/MediaRequest';
import Season from '@server/entity/Season';
import notificationManager, { Notification } from '@server/lib/notifications';
import logger from '@server/logger';
import { truncate } from 'lodash';
import type { EntitySubscriberInterface, UpdateEvent } from 'typeorm';
import { EventSubscriber, In, Not } from 'typeorm';

@EventSubscriber()
export class MediaSubscriber implements EntitySubscriberInterface<Media> {
  private async notifyAvailableMovie(
    entity: Media,
    dbEntity: Media,
    is4k: boolean
  ) {
    if (
      entity[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE &&
      dbEntity[is4k ? 'status4k' : 'status'] !== MediaStatus.AVAILABLE
    ) {
      if (entity.mediaType === MediaType.MOVIE) {
        const requestRepository = getRepository(MediaRequest);
        const relatedRequests = await requestRepository.find({
          where: {
            media: {
              id: entity.id,
            },
            is4k,
            status: Not(MediaRequestStatus.DECLINED),
          },
        });

        if (relatedRequests.length > 0) {
          const tmdb = new TheMovieDb();

          try {
            const movie = await tmdb.getMovie({ movieId: entity.tmdbId });

            relatedRequests.forEach((request) => {
              notificationManager.sendNotification(
                Notification.MEDIA_AVAILABLE,
                {
                  event: `${is4k ? '4K ' : ''}Movie Request Now Available`,
                  notifyAdmin: false,
                  notifySystem: true,
                  notifyUser: request.requestedBy,
                  subject: `${movie.title}${
                    movie.release_date
                      ? ` (${movie.release_date.slice(0, 4)})`
                      : ''
                  }`,
                  message: truncate(movie.overview, {
                    length: 500,
                    separator: /\s/,
                    omission: '…',
                  }),
                  media: entity,
                  image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
                  request,
                }
              );
            });
          } catch (e) {
            logger.error('Something went wrong sending media notification(s)', {
              label: 'Notifications',
              errorMessage: e.message,
              mediaId: entity.id,
            });
          }
        }
      }
    }
  }

  private async notifyAvailableSeries(
    entity: Media,
    dbEntity: Media,
    is4k: boolean
  ) {
    const seasonRepository = getRepository(Season);
    const newAvailableSeasons = entity.seasons
      .filter(
        (season) =>
          season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE
      )
      .map((season) => season.seasonNumber);
    const oldSeasonIds = dbEntity.seasons.map((season) => season.id);
    const oldSeasons = await seasonRepository.findBy({ id: In(oldSeasonIds) });
    const oldAvailableSeasons = oldSeasons
      .filter(
        (season) =>
          season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE
      )
      .map((season) => season.seasonNumber);

    const changedSeasons = newAvailableSeasons.filter(
      (seasonNumber) => !oldAvailableSeasons.includes(seasonNumber)
    );

    if (changedSeasons.length > 0) {
      const tmdb = new TheMovieDb();
      const requestRepository = getRepository(MediaRequest);
      const processedSeasons: number[] = [];

      for (const changedSeasonNumber of changedSeasons) {
        const requests = await requestRepository.find({
          where: {
            media: {
              id: entity.id,
            },
            is4k,
            status: Not(MediaRequestStatus.DECLINED),
          },
        });
        const request = requests.find(
          (request) =>
            // Check if the season is complete AND it contains the current season that was just marked available
            request.seasons.every((season) =>
              newAvailableSeasons.includes(season.seasonNumber)
            ) &&
            request.seasons.some(
              (season) => season.seasonNumber === changedSeasonNumber
            )
        );

        if (request && !processedSeasons.includes(changedSeasonNumber)) {
          processedSeasons.push(
            ...request.seasons.map((season) => season.seasonNumber)
          );

          try {
            const tv = await tmdb.getTvShow({ tvId: entity.tmdbId });
            notificationManager.sendNotification(Notification.MEDIA_AVAILABLE, {
              event: `${is4k ? '4K ' : ''}Series Request Now Available`,
              subject: `${tv.name}${
                tv.first_air_date ? ` (${tv.first_air_date.slice(0, 4)})` : ''
              }`,
              message: truncate(tv.overview, {
                length: 500,
                separator: /\s/,
                omission: '…',
              }),
              notifyAdmin: false,
              notifySystem: true,
              notifyUser: request.requestedBy,
              image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
              media: entity,
              extra: [
                {
                  name: 'Requested Seasons',
                  value: request.seasons
                    .map((season) => season.seasonNumber)
                    .join(', '),
                },
              ],
              request,
            });
          } catch (e) {
            logger.error('Something went wrong sending media notification(s)', {
              label: 'Notifications',
              errorMessage: e.message,
              mediaId: entity.id,
            });
          }
        }
      }
    }
  }

  private async updateChildRequestStatus(event: Media, is4k: boolean) {
    const requestRepository = getRepository(MediaRequest);

    const requests = await requestRepository.find({
      where: { media: { id: event.id } },
    });

    for (const request of requests) {
      if (
        request.is4k === is4k &&
        request.status === MediaRequestStatus.PENDING
      ) {
        request.status = MediaRequestStatus.APPROVED;
        await requestRepository.save(request);
      }
    }
  }

  public beforeUpdate(event: UpdateEvent<Media>): void {
    if (!event.entity) {
      return;
    }

    if (
      event.entity.mediaType === MediaType.MOVIE &&
      event.entity.status === MediaStatus.AVAILABLE
    ) {
      this.notifyAvailableMovie(
        event.entity as Media,
        event.databaseEntity,
        false
      );
    }

    if (
      event.entity.mediaType === MediaType.MOVIE &&
      event.entity.status4k === MediaStatus.AVAILABLE
    ) {
      this.notifyAvailableMovie(
        event.entity as Media,
        event.databaseEntity,
        true
      );
    }

    if (
      event.entity.mediaType === MediaType.TV &&
      (event.entity.status === MediaStatus.AVAILABLE ||
        event.entity.status === MediaStatus.PARTIALLY_AVAILABLE)
    ) {
      this.notifyAvailableSeries(
        event.entity as Media,
        event.databaseEntity,
        false
      );
    }

    if (
      event.entity.mediaType === MediaType.TV &&
      (event.entity.status4k === MediaStatus.AVAILABLE ||
        event.entity.status4k === MediaStatus.PARTIALLY_AVAILABLE)
    ) {
      this.notifyAvailableSeries(
        event.entity as Media,
        event.databaseEntity,
        true
      );
    }

    if (
      event.entity.status === MediaStatus.AVAILABLE &&
      event.databaseEntity.status === MediaStatus.PENDING
    ) {
      this.updateChildRequestStatus(event.entity as Media, false);
    }

    if (
      event.entity.status4k === MediaStatus.AVAILABLE &&
      event.databaseEntity.status4k === MediaStatus.PENDING
    ) {
      this.updateChildRequestStatus(event.entity as Media, true);
    }
  }

  public listenTo(): typeof Media {
    return Media;
  }
}
