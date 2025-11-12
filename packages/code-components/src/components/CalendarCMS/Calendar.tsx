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
import { DateTime } from 'luxon';
import './Calendar.css';
import {
  FREQ_TO_WEEKS,
  DEFAULT_EVENT_TIMEZONE,
  DEFAULT_DURATION_MINUTES,
  DEFAULT_END_DATE_DAYS,
  GRID_WEEKS_COUNT,
  DEFAULT_DAYS_LIMIT,
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

interface RecurrenceRule {
  startUTC: Date; // start instant for first occurrence in UTC
  untilUTC: Date; // end limit (inclusive)
  durationMin: number; // duration in minutes
  frequencyWeeks: number | null; // 1 = weekly, 2 = biweekly, null = monthly (calendar months)
  blackoutDatesYMD: Set<string>; // YYYY-MM-DD in event timezone
}

interface Session {
  slug: string;
  name: string;
  rules: RecurrenceRule[];
}

interface Occurrence {
  slug: string;
  name: string;
  startUTC: Date;
  endUTC: Date;
}

// ---------- Time zone helpers using Luxon ----------

function formatRange(startUTC: Date, endUTC: Date, timeZone: string): string {
  try {
    const start = DateTime.fromJSDate(startUTC, { zone: timeZone });
    const end = DateTime.fromJSDate(endUTC, { zone: timeZone });

    if (!start.isValid || !end.isValid) {
      return 'Invalid time';
    }

    const s = start.toLocaleString({
      hour: 'numeric',
      minute: '2-digit',
    });
    const e = end.toLocaleString({
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${s} – ${e}`;
  } catch {
    return 'Invalid time';
  }
}

function ymdInZone(
  dateUTC: Date,
  timeZone: string
): { y: number; m: number; d: number; key: string } {
  try {
    const dt = DateTime.fromJSDate(dateUTC, { zone: timeZone });
    if (!dt.isValid) {
      // Return safe default
      const now = DateTime.now();
      return {
        y: now.year,
        m: now.month,
        d: now.day,
        key: now.toFormat('yyyy-MM-dd'),
      };
    }
    return {
      y: dt.year,
      m: dt.month,
      d: dt.day,
      key: dt.toFormat('yyyy-MM-dd'),
    };
  } catch {
    // Return safe default
    const now = DateTime.now();
    return {
      y: now.year,
      m: now.month,
      d: now.day,
      key: now.toFormat('yyyy-MM-dd'),
    };
  }
}

function addWeeksInZone(dateUTC: Date, weeks: number, timeZone: string): Date {
  try {
    const dt = DateTime.fromJSDate(dateUTC, { zone: timeZone });
    if (!dt.isValid) {
      return new Date(NaN);
    }
    const result = dt.plus({ weeks });
    return result.toJSDate();
  } catch {
    return new Date(NaN);
  }
}

function addMonthsInZone(dateUTC: Date, months: number, timeZone: string): Date {
  try {
    const dt = DateTime.fromJSDate(dateUTC, { zone: timeZone });
    if (!dt.isValid) {
      return new Date(NaN);
    }
    // Luxon's plus({ months: 1 }) handles calendar months correctly:
    // Jan 31 → Feb 28/29, March 31 → April 30, etc.
    const result = dt.plus({ months });
    return result.toJSDate();
  } catch {
    return new Date(NaN);
  }
}

// ---------- Core logic ----------

// frequencyToWeeks no longer used; CMS IDs are mapped directly

/**
 * Parses date strings in the CMS format:
 * - Start dates: "YYYY-MM-DD H:mm" (e.g., "2025-12-11 11:00")
 * - End dates: "YYYY-MM-DD" (e.g., "2025-12-18")
 * All times are in America/New_York timezone.
 */
function parseReadableDate(dateString: string, isStartDate: boolean = true): Date | null {
  if (!dateString || !dateString.trim()) {
    return null;
  }

  const trimmed = dateString.trim();

  // Try parsing new format: YYYY-MM-DD H:mm (e.g., "2025-12-11 11:00")
  const dateTimeMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})$/);
  if (dateTimeMatch) {
    const year = parseInt(dateTimeMatch[1], 10);
    const month = parseInt(dateTimeMatch[2], 10);
    const day = parseInt(dateTimeMatch[3], 10);
    const hour = parseInt(dateTimeMatch[4], 10);
    const minute = parseInt(dateTimeMatch[5], 10);

    // Create date in event timezone using Luxon
    const dt = DateTime.fromObject(
      { year, month, day, hour, minute },
      { zone: DEFAULT_EVENT_TIMEZONE }
    );
    if (!dt.isValid) {
      return null;
    }
    return dt.toJSDate();
  }

  // Try parsing date-only format: YYYY-MM-DD (e.g., "2025-12-18")
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10);
    const day = parseInt(dateOnlyMatch[3], 10);

    // For end dates, use end of day (23:59), for start dates use beginning of day (00:00)
    const hour = isStartDate ? 0 : 23;
    const minute = isStartDate ? 0 : 59;

    // Create date in event timezone using Luxon
    const dt = DateTime.fromObject(
      { year, month, day, hour, minute },
      { zone: DEFAULT_EVENT_TIMEZONE }
    );
    if (!dt.isValid) {
      return null;
    }
    return dt.toJSDate();
  }

  // Fallback: Try parsing as ISO 8601 or standard format (for backwards compatibility)
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function parseBlackoutSet(input?: string): Set<string> {
  if (!input) return new Set();
  const parts = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((dateStr) => {
      // Normalize date format to MM/DD/YYYY (zero-padded)
      const [month, day, year] = dateStr.split('/');
      return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
    });
  return new Set(parts);
}

function blackoutMatches(occUTC: Date, timeZone: string, blackoutRaw: Set<string>): boolean {
  if (blackoutRaw.size === 0) return false;
  // Build normalized keys to compare; input is MM/DD/YYYY
  const { y, m, d } = ymdInZone(occUTC, timeZone);
  const mmddyyyy = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
  return blackoutRaw.has(mmddyyyy);
}

type CMSItem = { fieldData?: Record<string, unknown> };

/**
 * Extracts field data from a Webflow CMS item HTML element.
 * Webflow stores field data in various ways:
 * - Data attributes on the element (data-[field-name])
 * - Data attributes on nested elements (data-wf-field)
 * - Text content of elements bound to fields
 */
function extractFieldDataFromElement(element: HTMLDivElement): Record<string, unknown> {
  const fieldData: Record<string, unknown> = {};

  // Method 1: Get all data attributes on the element itself (excluding internal Webflow attributes)
  for (const attr of Array.from(element.attributes)) {
    if (
      attr.name.startsWith('data-') &&
      !attr.name.startsWith('data-wf-') &&
      attr.name !== 'data-w-dyn-item'
    ) {
      // Convert data-field-name to field-name
      const fieldName = attr.name.replace(/^data-/, '');
      fieldData[fieldName] = attr.value;
    }
  }

  // Method 2: Check for nested elements with data-wf-field attributes (Webflow field bindings)
  const fieldElements = element.querySelectorAll('[data-wf-field]');
  for (const fieldEl of fieldElements) {
    const fieldName = fieldEl.getAttribute('data-wf-field');
    if (fieldName) {
      // Extract value from element - could be text, src, href, etc.
      const value =
        fieldEl.textContent?.trim() ||
        fieldEl.getAttribute('src') ||
        fieldEl.getAttribute('href') ||
        fieldEl.getAttribute('value') ||
        fieldEl.getAttribute('datetime') ||
        '';
      if (value) {
        fieldData[fieldName] = value;
      }
    }
  }

  // Method 3: Check for elements with data-field attribute (alternative pattern)
  const altFieldElements = element.querySelectorAll('[data-field]');
  for (const fieldEl of altFieldElements) {
    const fieldName = fieldEl.getAttribute('data-field');
    if (fieldName && !fieldData[fieldName]) {
      const value =
        fieldEl.textContent?.trim() ||
        fieldEl.getAttribute('src') ||
        fieldEl.getAttribute('href') ||
        fieldEl.getAttribute('value') ||
        '';
      if (value) {
        fieldData[fieldName] = value;
      }
    }
  }

  return fieldData;
}

/**
 * Converts HTML elements from CMS collection to CMSItem format
 */
function convertElementsToCMSItems(elements: HTMLDivElement[]): CMSItem[] {
  return elements.map((element) => ({
    fieldData: extractFieldDataFromElement(element),
  }));
}

function buildRecurrenceRule(
  f: Record<string, unknown>,
  ruleNumber: string,
  fallbackDuration: number
): RecurrenceRule | null {
  // New field naming: start-1, start-2, end-1, end-2, duration-1, duration-2, frequency-1, frequency-2
  const startField = `start-${ruleNumber}`;
  const endField = `end-${ruleNumber}`;
  const durationField = `duration-${ruleNumber}`;
  const frequencyField = `frequency-${ruleNumber}`;
  const mapFreq = (freq?: string): number | null => {
    if (!freq) return 1;
    const result = FREQ_TO_WEEKS[freq.toLowerCase()];
    return result !== undefined ? result : 1;
  };

  const startValue = f[startField];
  if (!startValue || String(startValue).trim() === '') {
    return null;
  }

  // Parse the start date (handles both readable format and ISO)
  // isStartDate=true means we'll use 10:00 AM as default time
  const parsedStart = parseReadableDate(String(startValue), true);
  if (!parsedStart) {
    return null;
  }

  // No need for DST correction since we're parsing dates directly in the correct timezone
  // The correctDSTIssue function was a workaround for the old API format
  const startUTC = parsedStart;

  // Parse end date if provided
  // isStartDate=false means we'll use 23:59 as default time for end dates
  let untilUTC: Date;
  const endValue = f[endField];
  if (endValue && String(endValue).trim() !== '') {
    const parsedEnd = parseReadableDate(String(endValue), false);
    if (parsedEnd) {
      untilUTC = parsedEnd;
    } else {
      // Fallback to default if parsing fails
      untilUTC = new Date(startUTC.getTime() + 1000 * 60 * 60 * 24 * DEFAULT_END_DATE_DAYS);
    }
  } else {
    // No end date provided, use default
    untilUTC = new Date(startUTC.getTime() + 1000 * 60 * 60 * 24 * DEFAULT_END_DATE_DAYS);
  }

  const durationMin =
    typeof f[durationField] === 'number'
      ? (f[durationField] as number)
      : parseInt(String(f[durationField] || fallbackDuration), 10);

  const rule = {
    startUTC,
    untilUTC,
    durationMin,
    frequencyWeeks: mapFreq(String(f[frequencyField] || '')),
    blackoutDatesYMD: parseBlackoutSet(String(f['blackout-date-string'] || '')),
  };
  return rule;
}

function buildSessionsFromApiItems(items: CMSItem[]): Session[] {
  const sessions: Session[] = [];

  for (const item of items) {
    const f = (item.fieldData || {}) as Record<string, unknown>;
    const slug = typeof f.slug === 'string' ? (f.slug as string) : undefined;
    if (!slug) {
      continue;
    }

    const name = typeof f.name === 'string' ? (f.name as string) : slug;
    const rules: RecurrenceRule[] = [];

    // Build first occurrence rule (rule number "1")
    const rule1 = buildRecurrenceRule(f, '1', DEFAULT_DURATION_MINUTES);
    if (rule1) rules.push(rule1);

    // Build second occurrence rule (rule number "2")
    const rule2 = buildRecurrenceRule(f, '2', rule1?.durationMin || DEFAULT_DURATION_MINUTES);
    if (rule2) rules.push(rule2);

    if (rules.length > 0) {
      sessions.push({ slug, name, rules });
    }
  }

  return sessions;
}

function generateNextOccurrencesForSession(
  session: Session,
  fromUTC: Date,
  eventTimeZone: string,
  daysLimit: number
): Occurrence[] {
  const occs: Occurrence[] = [];
  const limitUTC = new Date(fromUTC.getTime() + daysLimit * 24 * 60 * 60 * 1000);

  for (const rule of session.rules) {
    // Calculate the effective end date (rule end or days limit, whichever comes first)
    const effectiveEndUTC = new Date(Math.min(rule.untilUTC.getTime(), limitUTC.getTime()));

    // Start from the rule's start date
    let current = rule.startUTC;

    // Skip to first occurrence >= fromUTC
    while (current.getTime() < fromUTC.getTime()) {
      const next =
        rule.frequencyWeeks === null
          ? addMonthsInZone(current, 1, eventTimeZone)
          : addWeeksInZone(current, rule.frequencyWeeks, eventTimeZone);
      if (next.getTime() === current.getTime()) break; // safety
      current = next;
      if (current.getTime() > effectiveEndUTC.getTime()) break;
    }

    // Generate occurrences until we hit the effective end date
    while (current.getTime() <= effectiveEndUTC.getTime()) {
      // Check if this occurrence is blacked out
      const isBlackedOut = blackoutMatches(current, eventTimeZone, rule.blackoutDatesYMD);
      if (!isBlackedOut) {
        const endUTC = new Date(current.getTime() + rule.durationMin * 60 * 1000);
        occs.push({
          slug: session.slug,
          name: session.name,
          startUTC: current,
          endUTC,
        });
      }

      // Move to next occurrence
      const next =
        rule.frequencyWeeks === null
          ? addMonthsInZone(current, 1, eventTimeZone)
          : addWeeksInZone(current, rule.frequencyWeeks, eventTimeZone);
      if (next.getTime() === current.getTime()) break; // safety
      current = next;
    }
  }

  // Sort all occurrences by start time and return
  return occs.sort((a, b) => a.startUTC.getTime() - b.startUTC.getTime());
}

function monthStart(date: Date) {
  // Use 12:00 UTC to avoid month shifting when formatted in negative timezones
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

function startOfWeekMonday(date: Date) {
  const jsDay = date.getUTCDay(); // 0=Sun..6=Sat
  const mondayIndex = (jsDay + 6) % 7; // 0=Mon..6=Sun
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - mondayIndex);
  return d;
}

function addMonthsUTC(date: Date, diff: number) {
  // Keep the 12:00 UTC anchor to prevent TZ-induced day flips
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + diff, 1, 12));
}

function formatMonthTitle(date: Date, timeZone: string) {
  // Show title in selected tz for user friendliness
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(date);
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
