import TheMovieDb from '@server/api/themoviedb';
import Tvdb from '@server/api/tvdb';
import {
  getSettings,
  IndexerType,
  type MetadataSettings,
} from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

function getTestResultString(testValue: number): string {
  if (testValue === -1) return 'not tested';
  if (testValue === 0) return 'failed';
  return 'ok';
}

const metadataRoutes = Router();

metadataRoutes.get('/', (_req, res) => {
  const settings = getSettings();
  res.status(200).json({
    metadata: {
      tv: settings.metadataSettings.tv,
      anime: settings.metadataSettings.anime,
    },
  });
});

metadataRoutes.put('/', async (req, res) => {
  const settings = getSettings();
  const body = req.body as MetadataSettings;

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
    tv: settings.metadataSettings.tv === IndexerType.TMDB,
    anime: settings.metadataSettings.anime === IndexerType.TMDB,
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
      tmdb: getTestResultString(tmdbTest),
      tvdb: getTestResultString(tvdbTest),
    };

    return res.status(200).json(response);
  } catch (e) {
    logger.error('Failed to test indexers', {
      label: 'Metadata',
      message: e.message,
    });

    const response = {
      tmdb: getTestResultString(tmdbTest),
      tvdb: getTestResultString(tvdbTest),
    };

    return res.status(500).json(response);
  }
});

export default metadataRoutes;
