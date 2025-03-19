import TheMovieDb from '@server/api/themoviedb';
import Tvdb from '@server/api/tvdb';
import {
  getSettings,
  IndexerType,
  type MetadataSettings,
} from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const metadataRoutes = Router();

metadataRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  res.status(200).json({
    metadata: {
      tv: settings.metadataSettings.tv === IndexerType.TMDB ? 'tmdb' : 'tvdb',
      anime:
        settings.metadataSettings.anime === IndexerType.TMDB ? 'tmdb' : 'tvdb',
    },
  });
});

metadataRoutes.put('/', async (req, res) => {
  const settings = getSettings();

  const body = req.body as MetadataSettings;

  // test indexers
  let tvdbTest = -1;
  let tmdbTest = -1;

  try {
    if (body.tv === IndexerType.TVDB || body.anime === IndexerType.TVDB) {
      tvdbTest = 0;
      const tvdb = await Tvdb.getInstance();
      await tvdb.test();
      tvdbTest = 1;
    }
  } catch (e) {
    logger.error('Failed to test indexers', {
      label: 'Metadata',
      message: e.message,
    });
  }

  try {
    if (body.tv === IndexerType.TMDB || body.anime === IndexerType.TMDB) {
      tmdbTest = 0;
      const tmdb = new TheMovieDb();
      await tmdb.getTvShow({ tvId: 1054 });
      tmdbTest = 1;
    }
  } catch (e) {
    logger.error('Failed to test indexers', {
      label: 'Metadata',
      message: e.message,
    });
  }

  logger.info('Updated metadata settings', {
    label: 'Metadata',
    body: body,
    tmdb: tmdbTest,
    tvdb: tvdbTest,
    tv: body.tv,
    anime: body.anime,
  });

  if (tvdbTest === 0 || tmdbTest === 0) {
    return res.status(500).json({
      tvdb: tvdbTest === 1 ? 'ok' : 'failed',
      tmdb: tmdbTest === 1 ? 'ok' : 'failed',
    });
  }

  settings.metadataSettings = {
    tv: body.tv,
    anime: body.anime,
  };
  await settings.save();

  res.status(200).json({
    tv: settings.metadataSettings.tv === IndexerType.TMDB ? 'tmdb' : 'tvdb',
    anime:
      settings.metadataSettings.anime === IndexerType.TMDB ? 'tmdb' : 'tvdb',
  });
});

metadataRoutes.post('/test', async (req, res) => {
  let tvdbTest = -1;
  let tmdbTest = -1;

  try {
    const body = req.body as { tmdb: boolean; tvdb: boolean };

    try {
      if (body.tmdb) {
        tmdbTest = 0;
        const tmdb = new TheMovieDb();
        await tmdb.getTvShow({ tvId: 1054 });
        tmdbTest = 1;
      }
    } catch (e) {
      logger.error('Failed to test indexers', {
        label: 'Metadata',
        message: e.message,
      });
    }

    try {
      if (body.tvdb) {
        tvdbTest = 0;
        const tvdb = await Tvdb.getInstance();
        await tvdb.test();
        tvdbTest = 1;
      }
    } catch (e) {
      logger.error('Failed to test indexers', {
        label: 'Metadata',
        message: e.message,
      });
    }

    const response = {
      tmdb: tmdbTest === -1 ? 'not tested' : tmdbTest === 0 ? 'failed' : 'ok',
      tvdb: tvdbTest === -1 ? 'not tested' : tvdbTest === 0 ? 'failed' : 'ok',
    };

    return res.status(200).json(response);
  } catch (e) {
    logger.error('Failed to test indexers', {
      label: 'Metadata',
      message: e.message,
    });

    // if tmdbTest != -1 (tested) and tmdbTest === 1 (ok) then fail
    // if tvdbTest != -1 (tested) and tvdbTest === 1 (ok) then fail
    // if test === -1 = 'not tested' if test === 0 = 'failed' if test === 1 = 'ok'
    const response = {
      tmdb: tmdbTest === -1 ? 'not tested' : tmdbTest === 0 ? 'failed' : 'ok',
      tvdb: tvdbTest === -1 ? 'not tested' : tvdbTest === 0 ? 'failed' : 'ok',
    };

    return res.status(500).json(response);
  }
});

export default metadataRoutes;
