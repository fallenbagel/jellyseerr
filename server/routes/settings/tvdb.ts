import Tvdb from '@server/api/indexer/tvdb';
import type { TvdbSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const tvdbRoutes = Router();

tvdbRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.tvdb);
});

tvdbRoutes.put('/', (req, res) => {
  const settings = getSettings();

  const newTvdb = req.body as TvdbSettings;
  const tvdb = settings.tvdb;

  tvdb.use = newTvdb.use;

  settings.tvdb = tvdb;
  settings.save();

  return res.status(200).json(newTvdb);
});

tvdbRoutes.post('/test', async (req, res, next) => {
  try {
    const tvdb = await Tvdb.getInstance();
    await tvdb.login();
    return res.status(200).json({ message: 'Successfully connected to Tvdb' });
  } catch (e) {
    logger.error('Failed to test Tvdb', {
      label: 'Tvdb',
      message: e.message,
    });

    return next({ status: 500, message: 'Failed to connect to Tvdb' });
  }
});

export default tvdbRoutes;
