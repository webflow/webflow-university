/**
 * Calendar Component
 *
 * A React calendar component that displays recurring events from a CMS API.
 * Features include:
 * - Monthly calendar grid view with navigation
 * - Support for recurring events with configurable frequency (weekly/biweekly)
 * - Blackout date support to exclude specific dates
 * - Timezone handling with display toggle between event timezone and local timezone
 * - Optional weekend display (defaults to weekdays only)
 * - Event occurrence generation based on recurrence rules
 * - Responsive design with CSS Grid layout
 *
 * The component extracts session data from CMS collection items via slots
 * and generates calendar occurrences based on recurrence rules, handling
 * timezone conversions and DST corrections automatically.
 */

import React, { useEffect, useMemo, useState } from 'react';
import './Calendar.css';
import {
  addMonthsUTC,
  buildSessionsFromApiItems,
  convertElementsToCMSItems,
  formatMonthTitle,
  formatRange,
  generateNextOccurrencesForSession,
  monthStart,
  startOfWeekMonday,
  type Occurrence,
  type Session,
  ymdInZone,
} from './calendarLogic';
import {
  DEFAULT_DAYS_LIMIT,
  DEFAULT_EVENT_TIMEZONE,
  GRID_WEEKS_COUNT,
} from './constants';
import PrevIcon from './PrevIcon';
import NextIcon from './NextIcon';
import { useCMSCollectionItems } from './useCMSCollectionItems';

// Frequency handled by CMS IDs; no local enum needed

interface CalendarProps {
  cmsCollectionComponentSlot: React.ReactNode;
  showCMSCollectionComponent?: boolean;
  eventTimezone?: string; // IANA TZ, default America/New_York
  showWeekends?: boolean; // Whether to show Saturday and Sunday columns, default false
  debugNoData?: boolean; // Debug flag to prevent data loading, default false
  daysLimit?: number; // Number of days from now to calculate occurrences, default 120
  showLegend?: boolean; // Whether to show the upcoming events legend, default true
}

const CalendarCMS = (props: CalendarProps) => {
  const eventTZ = props.eventTimezone || DEFAULT_EVENT_TIMEZONE;
  const showWeekends = props.showWeekends ?? false; // Default to false (hide weekends)
  const debugNoData = props.debugNoData ?? false; // Default to false (load data normally)
  const daysLimit = props.daysLimit ?? DEFAULT_DAYS_LIMIT; // Default to 120 days
  // Removed enableTimezoneCorrection - no longer needed since we parse dates correctly
  const showLegend = props.showLegend ?? true; // Default to true (show legend)

  // Dynamic day labels based on showWeekends prop
  const DAY_LABELS = showWeekends
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Extract CMS collection items from Webflow slot
  const { cmsCollectionComponentSlotRef, items } = useCMSCollectionItems(
    'cmsCollectionComponentSlot'
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const loading = items === null && !debugNoData;
  const error: string | null = null;

  // Generate session detail URL from slug
  const getSessionUrl = (slug: string): string => {
    return `/pro/sessions/${slug}`;
  };

  useEffect(() => {
    if (debugNoData) {
      setSessions([]);
      return;
    }

    if (items && items.length > 0) {
      const cmsItems = convertElementsToCMSItems(items);
      const built = buildSessionsFromApiItems(cmsItems);
      setSessions(built);
    } else if (items && items.length === 0) {
      // Items loaded but empty
      setSessions([]);
    }
    // If items is null, still loading (handled by loading state)
  }, [items, debugNoData]);

  const [tzMode, setTzMode] = useState<'event' | 'local'>('local');
  const displayTZ = tzMode === 'event' ? eventTZ : Intl.DateTimeFormat().resolvedOptions().timeZone;

  const nowUTC = useMemo(() => new Date(), []);

  const perSessionNext4 = useMemo(() => {
    return sessions.map((s) => generateNextOccurrencesForSession(s, nowUTC, eventTZ, daysLimit));
  }, [sessions, nowUTC, eventTZ, daysLimit]);

  // Flatten events for plotting
  const allUpcoming = useMemo(() => perSessionNext4.flat(), [perSessionNext4]);

  const [currentMonthUTC, setCurrentMonthUTC] = useState(() => monthStart(nowUTC));

  // Keyboard navigation: arrow keys to navigate months
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentMonthUTC((d) => addMonthsUTC(d, -1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentMonthUTC((d) => addMonthsUTC(d, 1));
          break;
        case 'Home':
          e.preventDefault();
          setCurrentMonthUTC(() => monthStart(nowUTC));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nowUTC]);

  // Build month grid
  const gridColumnCount = useMemo(() => (showWeekends ? 7 : 5), [showWeekends]);
  const gridStyle = useMemo(
    () => ({ '--calendar-columns': gridColumnCount }) as React.CSSProperties,
    [gridColumnCount]
  );

  const gridCells = useMemo(() => {
    const gridStart = startOfWeekMonday(currentMonthUTC);
    const maxCells = GRID_WEEKS_COUNT * gridColumnCount;
    const cells: Date[] = [];

    for (let i = 0; i < 100 && cells.length < maxCells; i++) {
      const d = new Date(gridStart);
      d.setUTCDate(gridStart.getUTCDate() + i);
      const dayOfWeek = d.getUTCDay();

      if (showWeekends || (dayOfWeek >= 1 && dayOfWeek <= 5)) {
        cells.push(d);
      }
    }

    return cells;
  }, [currentMonthUTC, gridColumnCount, showWeekends]);

  // Map events to YYYY-MM-DD keys in selected display timezone
  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const occ of allUpcoming) {
      const { key } = ymdInZone(occ.startUTC, displayTZ);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(occ);
    }
    // sort events within day by time
    for (const arr of map.values()) arr.sort((a, b) => a.startUTC.getTime() - b.startUTC.getTime());
    return map;
  }, [allUpcoming, displayTZ]);

  const isCurrentMonth = (d: Date) => d.getUTCMonth() === currentMonthUTC.getUTCMonth();
  const todayKey = ymdInZone(nowUTC, displayTZ).key;

  return (
    <div className="wf-calendar">
      {/* Hidden container for CMS collection slot */}
      <div
        ref={cmsCollectionComponentSlotRef}
        style={{ display: props.showCMSCollectionComponent ? 'block' : 'none' }}
      >
        {props.cmsCollectionComponentSlot}
      </div>
      <div className="wf-cal-header">
        <div className="wf-cal-monthnav">
          <button
            className="wf-cal-navbtn"
            aria-label="Previous month (or press Left Arrow)"
            title="Previous month (Left Arrow)"
            onClick={() => setCurrentMonthUTC((d) => addMonthsUTC(d, -1))}
          >
            <PrevIcon />
          </button>
          <button
            className="wf-cal-navbtn"
            aria-label="Next month (or press Right Arrow)"
            title="Next month (Right Arrow)"
            onClick={() => setCurrentMonthUTC((d) => addMonthsUTC(d, 1))}
          >
            <NextIcon />
          </button>
          <div className="wf-cal-title">{formatMonthTitle(currentMonthUTC, displayTZ)}</div>
        </div>

        <div className="wf-cal-tzselect">
          <label>
            <span className="sr-only">Timezone</span>
            <div className="wf-cal-tzselect-wrapper">
              <svg
                className="wf-cal-tzselect-clock-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.99992 14.6663C11.6818 14.6663 14.6666 11.6816 14.6666 7.99967C14.6666 4.31778 11.6818 1.33301 7.99992 1.33301C4.31802 1.33301 1.33325 4.31778 1.33325 7.99967C1.33325 11.6816 4.31802 14.6663 7.99992 14.6663Z"
                  stroke="var(--theme--t_text-primary, white)"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 4V8L10.6667 9.33333"
                  stroke="var(--theme--t_text-primary, white)"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <select
                className="wf-cal-tzselect-select"
                value={tzMode}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTzMode(e.target.value as 'event' | 'local')
                }
              >
                <option value="local">My local time</option>
                <option value="event">Eastern Time</option>
              </select>
              <svg
                className="wf-cal-tzselect-chevron-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.26047 5.79352C5.07301 5.98097 5.07301 6.28489 5.26047 6.47234C5.44792 6.65979 5.75184 6.65979 5.93929 6.47234L7.99988 4.41175L10.0605 6.47234C10.2479 6.65979 10.5518 6.65979 10.7393 6.47234C10.9267 6.28489 10.9267 5.98097 10.7393 5.79352L8.33929 3.39352C8.24927 3.3035 8.12717 3.25293 7.99988 3.25293C7.87257 3.25293 7.75048 3.3035 7.66047 3.39352L5.26047 5.79352ZM10.7393 10.2057C10.9267 10.0182 10.9267 9.71431 10.7393 9.52685C10.5518 9.33941 10.2479 9.33941 10.0605 9.52685L7.99988 11.5874L5.93929 9.52685C5.75184 9.33941 5.44792 9.33941 5.26047 9.52685C5.07301 9.71431 5.07301 10.0182 5.26047 10.2057L7.66047 12.6057C7.84792 12.7931 8.15184 12.7931 8.33929 12.6057L10.7393 10.2057Z"
                  fill="var(--theme--t_text-secondary, #ababab)"
                />
              </svg>
            </div>
          </label>
        </div>
      </div>

      <div className="wf-cal-content">
        {(loading || error) && (
          <div className="wf-cal-status-overlay">
            {loading && (
              <div className="wf-cal-status">
                <div className="wf-cal-spinner"></div>
                <div className="wf-cal-status-text">Loading…</div>
              </div>
            )}
            {error && (
              <div className="wf-cal-status">
                <div className="wf-cal-status-text wf-cal-error">{error}</div>
              </div>
            )}
          </div>
        )}

        <div className="wf-cal-daylabels" style={gridStyle}>
          {DAY_LABELS.map((lbl) => (
            <div key={lbl} className="wf-cal-daylabel">
              {lbl}
            </div>
          ))}
        </div>

        <div
          className="wf-cal-grid"
          style={gridStyle}
          role="grid"
          aria-label={`Calendar for ${formatMonthTitle(currentMonthUTC, displayTZ)}`}
        >
          {gridCells.map((day, idx) => {
            const { key, d } = ymdInZone(day, displayTZ);
            const events = eventsByDayKey.get(key) || [];
            const isToday = key === todayKey;
            const outside = !isCurrentMonth(day);
            const dayLabel = new Intl.DateTimeFormat(undefined, {
              timeZone: displayTZ,
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).format(day);
            return (
              <div
                key={idx}
                className={`wf-cal-cell ${outside ? 'outside' : ''} ${isToday ? 'today' : ''}`}
                role="gridcell"
                aria-label={`${dayLabel}${isToday ? ', today' : ''}${
                  events.length > 0
                    ? `, ${events.length} session${events.length === 1 ? '' : 's'}`
                    : ''
                }`}
              >
                <div className="wf-cal-cellheader">
                  <span className="wf-cal-date">{d}</span>
                </div>
                <div className="wf-cal-events">
                  {events.map((ev, i) => (
                    <a
                      href={getSessionUrl(ev.slug)}
                      className="wf-cal-event"
                      key={i}
                      data-type={ev.type}
                      title={`${ev.name} - ${formatRange(ev.startUTC, ev.endUTC, displayTZ)}`}
                      aria-label={`${ev.name} on ${new Intl.DateTimeFormat(undefined, {
                        timeZone: displayTZ,
                        month: 'long',
                        day: 'numeric',
                      }).format(ev.startUTC)} from ${formatRange(
                        ev.startUTC,
                        ev.endUTC,
                        displayTZ
                      )}`}
                    >
                      <div className="wf-cal-eventtitle">{ev.name}</div>
                      <div className="wf-cal-eventtime">
                        {formatRange(ev.startUTC, ev.endUTC, displayTZ)}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showLegend && (
          <div className="wf-cal-legend">
            <div className="wf-cal-legend-title">Upcoming (next {daysLimit} days)</div>
            {sessions.map((s, idx) => {
              const list = perSessionNext4[idx] || [];
              return (
                <div key={s.slug} className="wf-cal-legend-row">
                  <div className="wf-cal-legend-slug">
                    <a
                      href={getSessionUrl(s.slug)}
                      className="wf-cal-legend-link"
                      aria-label={`${s.name} session details`}
                    >
                      {s.name}
                    </a>
                  </div>
                  <ul>
                    {list.map((ev, i) => (
                      <li key={i}>
                        {new Intl.DateTimeFormat(undefined, {
                          timeZone: displayTZ,
                          month: 'short',
                          day: 'numeric',
                        }).format(ev.startUTC)}
                        {', '}
                        {formatRange(ev.startUTC, ev.endUTC, displayTZ)}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarCMS;
