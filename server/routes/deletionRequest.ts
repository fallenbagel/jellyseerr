import RadarrAPI from '@server/api/servarr/radarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { getRepository } from '@server/datasource';
import DeletionRequest, {
  DeletionRequestPermissionError,
} from '@server/entity/DeletionRequest';
import Media from '@server/entity/Media';
import { User } from '@server/entity/User';
import type { DeletionRequestBody } from '@server/interfaces/api/requestInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const deletionRequestRoutes = Router();

deletionRequestRoutes.get('/', isAuthenticated(), async (req, res, next) => {
  try {
    const user = req.user as User;

    if (
      !user?.hasPermission([Permission.MANAGE_REQUESTS, Permission.REQUEST_DELETE], {
        type: 'or',
      })
    ) {
      return res.status(403).json({
        error: 'You do not have permission to view deletion requests',
      });
    }

    const pageSize = req.query.take ? Number(req.query.take) : 10;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const requestedBy = req.query.requestedBy
      ? Number(req.query.requestedBy)
      : null;

    let statusFilter: MediaRequestStatus[];

    switch (req.query.filter) {
      case 'approved':
        statusFilter = [MediaRequestStatus.DELETION_APPROVED];
        break;
      case 'pending':
        statusFilter = [MediaRequestStatus.DELETION_PENDING];
        break;
      case 'declined':
        statusFilter = [MediaRequestStatus.DELETION_DECLINED];
        break;
      default:
        statusFilter = [
          MediaRequestStatus.DELETION_PENDING,
          MediaRequestStatus.DELETION_APPROVED,
          MediaRequestStatus.DELETION_DECLINED,
        ];
    }

    const requestRepository = getRepository(DeletionRequest);

    const query = requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.media', 'media')
      .leftJoinAndSelect('request.requestedBy', 'requestedBy')
      .leftJoinAndSelect('request.modifiedBy', 'modifiedBy')
      .where('request.status IN (:...statusFilter)', { statusFilter });

    if (requestedBy) {
      query.andWhere('requestedBy.id = :requestedBy', { requestedBy });
    }

    // Non-admin users can only see their own requests
    if (!user.hasPermission(Permission.MANAGE_REQUESTS)) {
      query.andWhere('requestedBy.id = :userId', { userId: user.id });
    }

    query
      .orderBy('request.createdAt', 'DESC')
      .take(pageSize)
      .skip(skip);

    const [requests, totalCount] = await query.getManyAndCount();

    return res.status(200).json({
      pageInfo: {
        pages: Math.ceil(totalCount / pageSize),
        pageSize,
        results: totalCount,
        page: Math.floor(skip / pageSize) + 1,
      },
      results: requests,
    });
  } catch (e) {
    logger.error('Something went wrong getting deletion requests', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({ status: 500, message: 'Unable to get deletion requests.' });
  }
});

deletionRequestRoutes.post('/', isAuthenticated(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const body: DeletionRequestBody = req.body;

    const request = await DeletionRequest.create(body, user);

    return res.status(201).json(request);
  } catch (e) {
    logger.error('Something went wrong creating a new deletion request', {
      label: 'API',
      errorMessage: e.message,
    });

    if (e instanceof DeletionRequestPermissionError) {
      return next({
        status: 403,
        message: e.message,
        code: 'NO_PERMISSION',
      });
    }

    return next({
      status: 500,
      message: 'Unable to create deletion request.',
    });
  }
});

deletionRequestRoutes.put('/:requestId', isAuthenticated(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const requestId = Number(req.params.requestId);

    if (!user?.hasPermission(Permission.MANAGE_REQUESTS)) {
      return res.status(403).json({
        error: 'You do not have permission to modify deletion requests',
      });
    }

    const requestRepository = getRepository(DeletionRequest);
    const deletionRequest = await requestRepository.findOneOrFail({
      where: { id: requestId },
      relations: ['media'],
    });

    if (req.body.status === MediaRequestStatus.DELETION_APPROVED) {
      const settings = getSettings();
      
      try {
        if (deletionRequest.media.mediaType === MediaType.MOVIE) {
          // Delete from Radarr
          const radarrSettings = settings.radarr.find(
            (radarr) => radarr.is4k === deletionRequest.is4k && radarr.isDefault
          );
          
          if (radarrSettings) {
            const radarr = new RadarrAPI({
              apiKey: radarrSettings.apiKey,
              url: RadarrAPI.buildUrl(radarrSettings, '/api/v3'),
            });

            // Delete the movie from Radarr using tmdbId
            if (deletionRequest.media.tmdbId) {
              await radarr.removeMovie(deletionRequest.media.tmdbId);
              logger.info('Movie deleted from Radarr', {
                label: 'Deletion Request',
                requestId: deletionRequest.id,
                tmdbId: deletionRequest.media.tmdbId,
              });
            } else {
              logger.warn('Cannot delete movie: tmdbId is missing', {
                label: 'Deletion Request',
                requestId: deletionRequest.id,
              });
            }
          }
        } else if (deletionRequest.media.mediaType === MediaType.TV) {
          // Delete from Sonarr
          const sonarrSettings = settings.sonarr.find(
            (sonarr) => sonarr.is4k === deletionRequest.is4k && sonarr.isDefault
          );
          
          if (sonarrSettings) {
            const sonarr = new SonarrAPI({
              apiKey: sonarrSettings.apiKey,
              url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
            });

            // Delete the series from Sonarr using tvdbId
            if (deletionRequest.media.tvdbId) {
              await sonarr.removeSerie(deletionRequest.media.tvdbId);
              logger.info('Series deleted from Sonarr', {
                label: 'Deletion Request',
                requestId: deletionRequest.id,
                tvdbId: deletionRequest.media.tvdbId,
              });
            } else {
              logger.warn('Cannot delete series: tvdbId is missing', {
                label: 'Deletion Request',
                requestId: deletionRequest.id,
              });
            }
          }
        }

        // Update media status to deleted
        const mediaRepository = getRepository(Media);
        const media = await mediaRepository.findOneOrFail({
          where: { id: deletionRequest.media.id },
        });
        
        if (deletionRequest.is4k) {
          media.status4k = MediaStatus.DELETED;
        } else {
          media.status = MediaStatus.DELETED;
        }
        
        await mediaRepository.save(media);

      } catch (deleteError) {
        logger.error('Failed to delete from *arr service', {
          label: 'Deletion Request',
          errorMessage: deleteError.message,
          requestId: deletionRequest.id,
        });
      }
    }

    deletionRequest.status = req.body.status;
    deletionRequest.modifiedBy = user;

    await requestRepository.save(deletionRequest);

    return res.status(200).json(deletionRequest);
  } catch (e) {
    logger.error('Something went wrong updating deletion request', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to update deletion request.',
    });
  }
});

deletionRequestRoutes.delete('/:requestId', isAuthenticated(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const requestId = Number(req.params.requestId);

    const requestRepository = getRepository(DeletionRequest);
    const deletionRequest = await requestRepository.findOneOrFail({
      where: { id: requestId },
    });

    if (
      !user?.hasPermission(Permission.MANAGE_REQUESTS) &&
      deletionRequest.requestedBy.id !== user.id
    ) {
      return res.status(403).json({
        error: 'You do not have permission to delete this deletion request',
      });
    }

    await requestRepository.remove(deletionRequest);

    return res.status(204).send();
  } catch (e) {
    logger.error('Something went wrong deleting deletion request', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to delete deletion request.',
    });
  }
});

export default deletionRequestRoutes;