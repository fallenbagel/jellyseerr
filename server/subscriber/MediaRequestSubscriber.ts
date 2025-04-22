import TheMovieDb from '@server/api/themoviedb';
import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { MediaRequest } from '@server/entity/MediaRequest';
import notificationManager, { Notification } from '@server/lib/notifications';
import logger from '@server/logger';
import { truncate } from 'lodash';
import type { EntitySubscriberInterface, UpdateEvent } from 'typeorm';
import { EventSubscriber } from 'typeorm';

@EventSubscriber()
export class MediaRequestSubscriber
  implements EntitySubscriberInterface<MediaRequest>
{
  private async notifyAvailableMovie(entity: MediaRequest) {
    if (
      entity.media[entity.is4k ? 'status4k' : 'status'] ===
      MediaStatus.AVAILABLE
    ) {
      const tmdb = new TheMovieDb();

      try {
        const movie = await tmdb.getMovie({
          movieId: entity.media.tmdbId,
        });

        notificationManager.sendNotification(Notification.MEDIA_AVAILABLE, {
          event: `${entity.is4k ? '4K ' : ''}Movie Request Now Available`,
          notifyAdmin: false,
          notifySystem: true,
          notifyUser: entity.requestedBy,
          subject: `${movie.title}${
            movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ''
          }`,
          message: truncate(movie.overview, {
            length: 500,
            separator: /\s/,
            omission: '…',
          }),
          media: entity.media,
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`,
          request: entity,
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

  private async notifyAvailableSeries(entity: MediaRequest) {
    // Find all seasons in the related media entity
    // and see if they are available, then we can check
    // if the request contains the same seasons
    const requestedSeasons =
      entity.seasons?.map((entitySeason) => entitySeason.seasonNumber) ?? [];
    const availableSeasons = entity.media.seasons.filter(
      (season) =>
        season[entity.is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE &&
        requestedSeasons.includes(season.seasonNumber)
    );
    const isMediaAvailable =
      availableSeasons.length > 0 &&
      availableSeasons.length === requestedSeasons.length;

    if (isMediaAvailable) {
      const tmdb = new TheMovieDb();

      try {
        const tv = await tmdb.getTvShow({ tvId: entity.media.tmdbId });

        notificationManager.sendNotification(Notification.MEDIA_AVAILABLE, {
          event: `${entity.is4k ? '4K ' : ''}Series Request Now Available`,
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
          notifyUser: entity.requestedBy,
          image: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tv.poster_path}`,
          media: entity.media,
          extra: [
            {
              name: 'Requested Seasons',
              value: entity.seasons
                .map((season) => season.seasonNumber)
                .join(', '),
            },
          ],
          request: entity,
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

  public afterUpdate(event: UpdateEvent<MediaRequest>): void {
    if (!event.entity) {
      return;
    }

    if (event.entity.status === MediaRequestStatus.COMPLETED) {
      if (event.entity.media.mediaType === MediaType.MOVIE) {
        this.notifyAvailableMovie(event.entity as MediaRequest);
      }
      if (event.entity.media.mediaType === MediaType.TV) {
        this.notifyAvailableSeries(event.entity as MediaRequest);
      }
    }
  }

  public listenTo(): typeof MediaRequest {
    return MediaRequest;
  }
}
