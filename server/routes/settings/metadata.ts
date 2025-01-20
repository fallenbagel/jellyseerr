import Tvdb from '@server/api/tvdb';
import { getSettings, type MetadataSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const metadataRoutes = Router();

metadataRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.metadataSettings);
});

metadataRoutes.put('/', (req, res) => {
  const settings = getSettings();

  const body = req.body as MetadataSettings;

  settings.metadataSettings = {
    providers: body.providers,
    settings: body.settings,
  };
  settings.save();

  return res.status(200).json({
    tvdb: settings.tvdb,
  });
});

metadataRoutes.post('/test', async (req, res, next) => {
  try {
    const tvdb = await Tvdb.getInstance();
    await tvdb.test();

    // TODO: add tmdb test
    return res.status(200).json({ tvdb: true });
  } catch (e) {
    logger.error('Failed to test Tvdb', {
      label: 'Tvdb',
      message: e.message,
    });

    return next({ status: 500, message: 'Failed to connect to Tvdb' });
  }
});

export default metadataRoutes;
