import MediaItemModal from '@app/components/MediaItemModal';
import {
  CalendarMediaFilter,
  CalendarMediaItemType,
  type CalendarDisplayEvent,
  type CalendarMediaItem,
} from '@server/lib/calendar';
import axios from 'axios';
import format from 'date-fns/format';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Event as BigCalendarEvent,
  NavigateAction,
  View,
} from 'react-big-calendar';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import CustomToolbar from './CustomToolbar';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

let currentFilter = CalendarMediaFilter.All;

const ReleaseCalendar = () => {
  const [result, setEvents] = useState<CalendarDisplayEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mediaItem, setMediaItem] = useState<CalendarMediaItem>();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  const calculateDateRange = useCallback(
    (date: Date, view: View): { start: string; end: string } | null => {
      let startDate: Date;
      let endDate: Date;

      switch (view) {
        case Views.MONTH:
        case Views.AGENDA: {
          // Get the start/end of the month itself
          const monthStart = getStartOfMonth(date);
          const monthEnd = getEndOfMonth(date);
          // Then find the start/end of the weeks containing those dates
          // This mimics RBC's padding behavior for month view
          startDate = getStartOfWeek(monthStart);
          endDate = getEndOfWeek(monthEnd);
          break;
        }
        case Views.WEEK:
          startDate = getStartOfWeek(date);
          endDate = getEndOfWeek(date);
          break;
        case Views.DAY:
          startDate = getStartOfDay(date);
          endDate = getEndOfDay(date);
          break;
        default:
          console.warn(`Unsupported view for media fetch: ${view}`);
          return null;
      }
      return {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };
    },
    []
  );

  function mediaItemClicked(mediaItem?: CalendarMediaItem) {
    if (mediaItem != null) {
      setMediaItem(mediaItem);
      openModal();
    }
  }

  const fetchEvents = async (
    startRange?: string,
    endRange?: string,
    filter?: CalendarMediaFilter
  ) => {
    try {
      const response = await axios.get<CalendarMediaItem[]>(
        `http://${process.env.HOST || 'localhost'}:${
          process.env.PORT || 5055
        }/api/v1/calendar/${filter}/${startRange}/${endRange}`,
        {
          headers: undefined,
        }
      );

      if (!response) {
        throw new Error(`HTTP error! status: ${response}`);
      }
      const data = response.data;
      const result = mapServarrToRbcEvents(data);
      setEvents(result);
    } catch (e: any) {
      console.error('Failed to fetch calendar events:', e);
    }
  };

  useEffect(() => {
    const range = calculateDateRange(currentDate, currentView);
    if (range) {
      fetchEvents(range.start, range.end, currentFilter);
    }
  }, [currentDate, currentView, calculateDateRange]);

  const handleNavigate = useCallback(
    (newDate: Date, view: View, action: NavigateAction) => {
      console.log('Navigating...', { newDate, view, action });
      setCurrentDate(newDate);
      // The view might also change (e.g., clicking a date in month view goes to day view)
      setCurrentView(view);
    },
    []
  );

  function handleApplyFilter(
    filter: CalendarMediaFilter,
    date: Date,
    view: View
  ): void {
    const dateRange = calculateDateRange(date, view);
    currentFilter = filter;
    fetchEvents(dateRange?.start, dateRange?.end, filter);
  }

  const handleView = useCallback((newView: View) => {
    console.log('Changing view...', newView);
    setCurrentView(newView);
    // Keep currentDate the same when only the view changes
  }, []);

  // Memoize the components prop to prevent unnecessary re-renders of the toolbar
  const calendarComponents = useMemo(
    () => ({
      event: MyEvent,
      toolbar: (toolbarProps) => (
        <CustomToolbar {...toolbarProps} onApplyFilter={handleApplyFilter} />
      ),
    }),
    []
  );

  return (
    <div>
      <Calendar
        localizer={localizer}
        startAccessor="start"
        events={result}
        onSelectEvent={(event) => mediaItemClicked(event.resource)}
        endAccessor="end"
        style={{ height: '100vh' }}
        views={['month', 'week', 'agenda']}
        date={currentDate}
        view={currentView}
        onNavigate={handleNavigate}
        onView={handleView}
        components={calendarComponents}
      />
      <MediaItemModal
        onCancel={closeModal}
        show={isModalOpen}
        mediaItem={mediaItem}
      />
    </div>
  );
};

const MyEvent = ({ event }: { event: BigCalendarEvent }) => {
  return (
    <div>
      {(event.resource as CalendarMediaItem).type ==
      CalendarMediaItemType.TvShow ? (
        <div className="rbc-event-content">
          <div className="rbc-series-title">
            {
              (event.resource as CalendarMediaItem)?.tvShowResource?.series
                .title
            }
            :
          </div>
          <div>
            {(event.resource as CalendarMediaItem)?.tvShowResource?.title}
          </div>
          <div>
            S
            {String(
              (event.resource as CalendarMediaItem)?.tvShowResource
                ?.seasonNumber
            ).padStart(2, '0')}
            E
            {String(
              (event.resource as CalendarMediaItem)?.tvShowResource
                ?.episodeNumber
            ).padStart(2, '0')}
          </div>
          <div>
            {event.start?.toLocaleTimeString([], { timeStyle: 'short' })} -{' '}
            {event.end?.toLocaleTimeString([], { timeStyle: 'short' })}
          </div>
          <div className="rbc-bottom-indicator" />
        </div>
      ) : (
        <div className="rbc-event-content">
          <div className="rbc-series-title">
            {(event.resource as CalendarMediaItem)?.movieResource?.title}
          </div>
          <div>
            {event.start?.toLocaleTimeString([], { timeStyle: 'short' })} -{' '}
            {event.end?.toLocaleTimeString([], { timeStyle: 'short' })}
          </div>
          <div className="rbc-bottom-indicator" />
        </div>
      )}
    </div>
  );
};

// Helper to get the start of the day (00:00:00.000)
function getStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

// Helper to get the end of the day (23:59:59.999)
function getEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

// Helper to get the start of the week (assuming Sunday as start, adjust if needed)
function getStartOfWeek(date: Date, startOfWeekDay = 0): Date {
  // 0 = Sunday, 1 = Monday
  const newDate = new Date(date);
  const dayOfWeek = newDate.getDay(); // 0 for Sunday, 1 for Monday, ...
  const diff =
    newDate.getDate() -
    dayOfWeek +
    (dayOfWeek === 0 ? -6 * (1 - startOfWeekDay) : startOfWeekDay); // Adjust calculation based on start day
  newDate.setDate(diff);
  return getStartOfDay(newDate);
}

// Helper to get the end of the week (assuming Saturday as end)
function getEndOfWeek(date: Date, startOfWeekDay = 0): Date {
  const newDate = new Date(date);
  const dayOfWeek = newDate.getDay();
  const diff =
    newDate.getDate() +
    (6 - dayOfWeek) +
    (dayOfWeek === 0 ? -6 * (1 - startOfWeekDay) : startOfWeekDay); // Adjust calculation
  newDate.setDate(diff);
  return getEndOfDay(newDate);
}

// Helper to get the start of the month
function getStartOfMonth(date: Date): Date {
  const newDate = new Date(date.getFullYear(), date.getMonth(), 1);
  return getStartOfDay(newDate);
}

// Helper to get the end of the month
function getEndOfMonth(date: Date): Date {
  const newDate = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Day 0 of next month = last day of current month
  return getEndOfDay(newDate);
}

/**
 * Maps an array of Sonarr calendar API events to the format required
 * by React Big Calendar.
 *
 * @param mediaItems - Array of event objects from servarr APIs.
 * @returns An array of event objects formatted for React Big Calendar.
 */
function mapServarrToRbcEvents(
  mediaItems: CalendarMediaItem[]
): CalendarDisplayEvent[] {
  if (!Array.isArray(mediaItems)) {
    console.error('Invalid input: mediaItems is not an array.');
    return [];
  }

  return mediaItems.map((item) => {
    let allDay: boolean;
    let startDate: Date;
    let endDate: Date;
    let displayTitle: string;
    let rbcEvent: CalendarDisplayEvent;

    if (
      item.type == CalendarMediaItemType.TvShow &&
      item.tvShowResource != null
    ) {
      const tvShow = item.tvShowResource;
      allDay = true;
      startDate = new Date(tvShow.airDateUtc);
      endDate = new Date(startDate.getTime() + tvShow.runtime * 60000);

      //TODO to be added: finaleType can be "series", "season", "midseason" or null

      //example: SeriesTitle: EpisodeTitle S01E01
      displayTitle = `${tvShow.series.title}: \n${tvShow.title}\nS${String(
        tvShow.seasonNumber
      ).padStart(2, '0')}E${String(tvShow.episodeNumber).padStart(
        2,
        '0'
      )}\n${startDate.toLocaleTimeString([], { timeStyle: 'short' })}`;
      rbcEvent = {
        title: displayTitle,
        start: startDate,
        end: endDate,
        allDay: allDay,
        resource: item,
      };
    } else if (
      item.type == CalendarMediaItemType.Movie &&
      item.movieResource != null
    ) {
      const movie = item.movieResource;
      allDay = true;
      startDate = new Date(movie.releaseDate);
      endDate = new Date(startDate.getTime() + movie.runtime * 60000);

      displayTitle = `${movie.title}\n${startDate.toLocaleTimeString([], {
        timeStyle: 'short',
      })}`;
      rbcEvent = {
        title: displayTitle,
        start: startDate,
        end: endDate,
        allDay: allDay,
        resource: item,
      };
    } else {
      console.error('Invalid media item type');
      rbcEvent = {
        title: '',
        start: new Date(),
        end: new Date(),
        allDay: true,
      };
    }

    return rbcEvent;
  });
}

export default ReleaseCalendar;
