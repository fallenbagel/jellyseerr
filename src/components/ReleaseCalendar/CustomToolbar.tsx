import { useState } from 'react';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { CalendarMediaFilter } from '@server/lib/calendar';
import type { DateLocalizer, View } from 'react-big-calendar';
import { Navigate } from 'react-big-calendar';

export interface CustomToolbarProps {
  date: Date;
  label: string;
  view: View;
  views: View[];
  localizer: DateLocalizer;
  onNavigate: (navigate: 'PREV' | 'NEXT' | 'TODAY' | Date) => void;
  onView: (view: View) => void;
  onApplyFilter: (filter: CalendarMediaFilter, date: Date, view: View) => void;
}

const CustomToolbar = ({
  date,
  label,
  view,
  views,
  onNavigate,
  onView,
  onApplyFilter,
}: CustomToolbarProps) => {
  const [selectedFilter, setSelectedFilter] = useState(CalendarMediaFilter.All);

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  const handleFilterSubmit = () => {
    if (onApplyFilter) {
      onApplyFilter(selectedFilter, date, view);
    }
  };

  const goToBack = () => {
    onNavigate(Navigate.PREVIOUS);
  };

  const goToNext = () => {
    onNavigate(Navigate.NEXT);
  };

  const goToCurrent = () => {
    onNavigate(Navigate.TODAY);
  };

  const viewChange = (newView: View) => {
    onView(newView);
  };

  const handleInfoClick = (e) => {
    // Prevent triggering drilldown if the button itself is clicked
    e.stopPropagation();
    alert(`Info! Fill in with legend and relevant info`);
  };

  const infoButtonStyle = {
    marginLeft: '5px',
    padding: '2px 4px',
    fontSize: '0.8em',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '3px',
  };

  return (
    <div
      className="rbc-toolbar custom-toolbar"
      style={
        {
          /* Base styles */
        }
      }
    >
      <div className="rbc-btn-group">
        <button type="button" onClick={goToBack} aria-label="Previous Period">
          &lt;
        </button>
        <button type="button" onClick={goToCurrent} aria-label="Go to Today">
          Today
        </button>
        <button type="button" onClick={goToNext} aria-label="Next Period">
          &gt;
        </button>
      </div>

      <button
        type="button"
        onClick={handleInfoClick}
        style={infoButtonStyle}
        aria-label={`More information`}
      >
        <InformationCircleIcon height={30} width={30} />
      </button>

      <div
        className="rbc-btn-group"
        style={{ display: 'flex', alignItems: 'center', margin: '0 10px' }}
      >
        <select
          value={selectedFilter}
          onChange={handleFilterChange}
          style={{ marginRight: '5px', padding: '3px' }}
          aria-label="Filter events"
        >
          <option value="all">All Events</option>
          <option value="movies">Movies Only</option>
          <option value="tv_shows">TV Shows Only</option>
        </select>
        <button
          type="button"
          onClick={handleFilterSubmit}
          style={{ padding: '3px 6px' }}
        >
          Apply Filter
        </button>
      </div>

      <div
        className="rbc-toolbar-label"
        style={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}
      >
        {label}
      </div>

      <div className="rbc-btn-group">
        {views.map((viewName) => (
          <button
            key={viewName}
            type="button"
            onClick={() => viewChange(viewName)}
            className={view === viewName ? 'rbc-active' : ''}
            aria-pressed={view === viewName}
            style={view === viewName ? { backgroundColor: '#e0e0e0' } : {}}
          >
            {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomToolbar;
