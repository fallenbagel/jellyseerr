import type RadarrAPI from '@server/api/servarr/radarr';
import type { RadarrMovie } from '@server/api/servarr/radarr';
import type SonarrAPI from '@server/api/servarr/sonarr';
import type { EpisodeResult } from '@server/api/servarr/sonarr';
import type { Event as BigCalendarEvent } from 'react-big-calendar';

export interface CalendarDisplayEvent extends BigCalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource?: CalendarMediaItem; // Store original Media Item
}

export interface CalendarMediaItem {
  type: CalendarMediaItemType;
  tvShowResource: EpisodeResult | undefined;
  movieResource: RadarrMovie | undefined;
}

export enum CalendarMediaItemType {
  TvShow,
  Movie,
}

export enum CalendarMediaFilter {
  TvShows,
  Movies,
  All,
}

export class Calendar {
  async getSonarrCalendarEvents(
    sonarrAPI: SonarrAPI,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarMediaItem[]> {
    const tvShows = await sonarrAPI.getCalendarByDate(startDate, endDate);
    const mappedTvShows: CalendarMediaItem[] = tvShows.map(
      (episode): CalendarMediaItem => {
        return {
          type: CalendarMediaItemType.TvShow,
          tvShowResource: episode,
          movieResource: undefined,
        };
      }
    );
    return mappedTvShows;
  }
  async getRadarrCalendarEvents(
    radarrAPI: RadarrAPI,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarMediaItem[]> {
    const movies = await radarrAPI.getCalendarByDate(startDate, endDate);

    const mappedMovies: CalendarMediaItem[] = movies.map(
      (movie): CalendarMediaItem => {
        return {
          type: CalendarMediaItemType.Movie,
          tvShowResource: undefined,
          movieResource: movie,
        };
      }
    );
    return mappedMovies;
  }
  async getCombinedEvents(
    sonarrAPI: SonarrAPI,
    radarrAPI: RadarrAPI,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarMediaItem[]> {
    const mappedTvShows = await this.getSonarrCalendarEvents(
      sonarrAPI,
      startDate,
      endDate
    );
    const mappedMovies = await this.getRadarrCalendarEvents(
      radarrAPI,
      startDate,
      endDate
    );

    return [...mappedTvShows, ...mappedMovies];
  }
}

const calendar = new Calendar();
export default calendar;
