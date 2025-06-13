import RadarrAPI from '@server/api/servarr/radarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import type { CalendarMediaItem } from '@server/lib/calendar';
import calendar, { CalendarMediaFilter } from '@server/lib/calendar';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const calendarRoutes = Router();

calendarRoutes.get('/:filter/:startDate/:endDate', async (req, res, next) => {
  try {
    const filter = req.params.filter;
    const startDate = new Date(req.params.startDate);
    const endDate = new Date(req.params.endDate);
    const settings = getSettings();
    const sonarr = settings.sonarr[0];
    const sonarrAPI = new SonarrAPI({
      apiKey: sonarr.apiKey,
      url: SonarrAPI.buildUrl(sonarr, '/api/v3'),
    });

    const radarr = settings.radarr[0];
    const radarrAPI = new RadarrAPI({
      apiKey: radarr.apiKey,
      url: RadarrAPI.buildUrl(radarr, '/api/v3'),
    });
    let mappedEvents: CalendarMediaItem[];
    if (filter == CalendarMediaFilter.TvShows.toString()) {
      mappedEvents = await calendar.getSonarrCalendarEvents(
        sonarrAPI,
        startDate,
        endDate
      );
    } else if (filter == CalendarMediaFilter.Movies.toString()) {
      mappedEvents = await calendar.getRadarrCalendarEvents(
        radarrAPI,
        startDate,
        endDate
      );
    } else if (filter == CalendarMediaFilter.All.toString()) {
      mappedEvents = await calendar.getCombinedEvents(
        sonarrAPI,
        radarrAPI,
        startDate,
        endDate
      );
    } else {
      throw new Error('Unexpected filter type');
    }

    return res.status(200).json(mappedEvents);
  } catch (e) {
    logger.debug('Something went wrong going to calendar', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to go to calendar.',
    });
  }
});

export default calendarRoutes;
