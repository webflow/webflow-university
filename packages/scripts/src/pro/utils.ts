import { DateTime } from 'luxon';

// Debug flag - set to false in production
export const DEBUG = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (...args: any[]) => {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

export interface RecurrencePattern {
  startDate: DateTime;
  frequency: string;
  duration: number;
  until?: DateTime;
}

/**
 * Check if a date matches any blackout dates (ignoring time)
 */
export function isBlackoutDate(date: DateTime, blackoutDates: DateTime[]): boolean {
  const dateStr = date.toFormat('yyyy-MM-dd');
  return blackoutDates.some((blackout) => blackout.toFormat('yyyy-MM-dd') === dateStr);
}

/**
 * Calculate the next occurrence of a recurring event, skipping blackout dates
 */
export function getNextOccurrence(
  startDate: DateTime,
  frequency: string,
  blackoutDates: DateTime[],
  until?: DateTime
): DateTime | null {
  const now = DateTime.now();
  let nextOccurrence = startDate;
  const maxIterations = 365; // Prevent infinite loops
  let iterations = 0;

  // If the start date is in the future and not a blackout, return it
  if (startDate > now && !isBlackoutDate(startDate, blackoutDates)) {
    return startDate;
  }

  // Calculate next occurrence based on frequency
  const incrementAmount = (() => {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return { days: 1 };
      case 'weekly':
        return { weeks: 1 };
      case 'biweekly':
        return { weeks: 2 };
      case 'monthly':
        return { months: 1 };
      default:
        return null;
    }
  })();

  if (!incrementAmount) {
    // Invalid frequency
    return startDate;
  }

  // Find the next valid occurrence
  while (iterations < maxIterations) {
    // Move to next occurrence if current is in the past
    if (nextOccurrence <= now) {
      nextOccurrence = nextOccurrence.plus(incrementAmount);
    }

    // Check if beyond "until" date
    if (until && nextOccurrence > until) {
      return null;
    }

    // Check if it's a blackout date
    if (isBlackoutDate(nextOccurrence, blackoutDates)) {
      nextOccurrence = nextOccurrence.plus(incrementAmount);
      iterations += 1;
      continue;
    }

    // Found valid occurrence
    return nextOccurrence;
  }

  return null;
}

/**
 * Get the next N occurrences for a recurrence pattern
 */
export function getNextOccurrences(
  startDate: DateTime,
  frequency: string,
  blackoutDates: DateTime[],
  count: number,
  until?: DateTime
): DateTime[] {
  const occurrences: DateTime[] = [];
  let currentDate = startDate;
  const maxIterations = 500; // Prevent infinite loops
  let iterations = 0;

  const incrementAmount = (() => {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return { days: 1 };
      case 'weekly':
        return { weeks: 1 };
      case 'biweekly':
        return { weeks: 2 };
      case 'monthly':
        return { months: 1 };
      default:
        return null;
    }
  })();

  if (!incrementAmount) {
    return occurrences;
  }

  const now = DateTime.now();

  // Move start date forward to first future occurrence if it's in the past
  while (currentDate <= now && iterations < maxIterations) {
    currentDate = currentDate.plus(incrementAmount);
    iterations += 1;
  }

  // Reset iterations for main loop
  iterations = 0;

  // Collect the next N valid occurrences
  while (occurrences.length < count && iterations < maxIterations) {
    // Check if beyond "until" date
    if (until && currentDate > until) {
      break;
    }

    // Check if it's a blackout date
    if (isBlackoutDate(currentDate, blackoutDates)) {
      currentDate = currentDate.plus(incrementAmount);
      iterations += 1;
      continue;
    }

    // Add this occurrence
    occurrences.push(currentDate);

    // Move to next potential occurrence
    currentDate = currentDate.plus(incrementAmount);
    iterations += 1;
  }

  return occurrences;
}

/**
 * Parse a date string in ET timezone
 *
 * Supported formats (in order of preference):
 * 1. ISO 8601: "2025-12-04T15:00:00" (recommended)
 * 2. ISO 8601 (no seconds): "2025-12-04T15:00"
 * 3. Full month name with time: "December 4, 2025 3:00 PM"
 * 4. MM/DD/YYYY with time: "12/04/2025 03:00 PM"
 * 5. Full month name without time: "December 4, 2025"
 * 6. MM/DD/YYYY without time: "12/04/2025"
 */
export function parseDate(dateStr: string, timezone: string): DateTime | null {
  const trimmed = dateStr.trim();

  // Try ISO date format with space separator FIRST (most common format for CMS)
  // Parse without timezone first, then explicitly set it to avoid parsing issues
  // e.g., "2025-12-04 15:00" (24-hour with leading zeros)
  let date: DateTime | null = null;

  // Try HH:mm format first (two digit hour, two digit minutes)
  date = DateTime.fromFormat(trimmed, 'yyyy-MM-dd HH:mm', { zone: 'utc' });
  if (date.isValid) {
    // Convert to the target timezone, keeping the wall-clock time
    return date.setZone(timezone, { keepLocalTime: true });
  }

  // Try H:mm format (single digit hour, two digit minutes)
  date = DateTime.fromFormat(trimmed, 'yyyy-MM-dd H:mm', { zone: 'utc' });
  if (date.isValid) {
    return date.setZone(timezone, { keepLocalTime: true });
  }

  // Try HH:m format (two digit hour, single digit minutes)
  date = DateTime.fromFormat(trimmed, 'yyyy-MM-dd HH:m', { zone: 'utc' });
  if (date.isValid) {
    return date.setZone(timezone, { keepLocalTime: true });
  }

  // Try H:m format (single digit hour, single digit minutes)
  date = DateTime.fromFormat(trimmed, 'yyyy-MM-dd H:m', { zone: 'utc' });
  if (date.isValid) {
    return date.setZone(timezone, { keepLocalTime: true });
  }

  // Try ISO date-only format (for until dates) - e.g., "2025-12-04"
  date = DateTime.fromFormat(trimmed, 'yyyy-MM-dd', { zone: 'utc' });
  if (date.isValid) {
    return date.setZone(timezone, { keepLocalTime: true }).startOf('day');
  }

  if (!date.isValid) {
    // Try ISO 8601 format (with T separator) - e.g., "2025-12-04T15:00:00"
    date = DateTime.fromISO(dateStr, { zone: timezone });
  }

  if (!date.isValid) {
    // Try parsing with time - formats like "December 4, 2025 3:00 PM"
    date = DateTime.fromFormat(dateStr, 'MMMM d, yyyy h:mm a', { zone: timezone });
  }

  if (!date.isValid) {
    // Try MM/DD/YYYY format with time - formats like "12/04/2025 03:00 PM"
    date = DateTime.fromFormat(dateStr, 'M/d/yyyy h:mm a', { zone: timezone });
  }

  if (!date.isValid) {
    // Try MM/DD/YYYY format with time and leading zeros
    date = DateTime.fromFormat(dateStr, 'MM/dd/yyyy h:mm a', { zone: timezone });
  }

  if (!date.isValid) {
    // Try MM/DD/YYYY format with time and leading zeros in 24hr format
    date = DateTime.fromFormat(dateStr, 'MM/dd/yyyy HH:mm a', { zone: timezone });
  }

  if (!date.isValid) {
    // Try ISO date format with space separator and AM/PM - e.g., "2025-12-04 3:00 PM"
    date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd h:mm a', { zone: timezone });
  }

  if (!date.isValid) {
    // Try without time - formats like "December 4, 2025"
    date = DateTime.fromFormat(dateStr, 'MMMM d, yyyy', { zone: timezone });
  }

  if (!date.isValid) {
    // Try MM/DD/YYYY format without time
    date = DateTime.fromFormat(dateStr, 'M/d/yyyy', { zone: timezone });
  }

  if (!date.isValid) {
    // Try MM/DD/YYYY format with leading zeros
    date = DateTime.fromFormat(dateStr, 'MM/dd/yyyy', { zone: timezone });
  }

  return date.isValid ? date : null;
}

/**
 * Parse blackout dates from data attribute string
 */
export function parseBlackoutDates(blackoutDateString: string, timezone: string): DateTime[] {
  const blackoutDates: DateTime[] = [];

  if (!blackoutDateString || !blackoutDateString.trim()) {
    return blackoutDates;
  }

  // Split by comma and parse each date
  const dateStrings = blackoutDateString.split(',').map((d) => d.trim());

  dateStrings.forEach((dateStr, index) => {
    if (!dateStr) {
      console.error(
        `[Blackout Dates] Empty date at position ${index + 1} in: "${blackoutDateString}"`
      );
      return;
    }

    // Try parsing as MM/DD/YYYY first (most common format)
    let date = DateTime.fromFormat(dateStr, 'M/d/yyyy', { zone: timezone });

    if (!date.isValid) {
      // Try with leading zeros: MM/DD/YYYY
      date = DateTime.fromFormat(dateStr, 'MM/dd/yyyy', { zone: timezone });
    }

    if (!date.isValid) {
      // Try other common formats
      const parsedDate = parseDate(dateStr, timezone);
      if (parsedDate) {
        date = parsedDate;
        console.error(
          `[Blackout Dates] Date "${dateStr}" was parsed but uses non-standard format. ` +
            `Please use MM/DD/YYYY format (e.g., "10/21/2025" or "1/5/2025")`
        );
      }
    }

    if (date && date.isValid) {
      blackoutDates.push(date);
      debug(`  ✓ Parsed: "${dateStr}" → ${date.toFormat('MMM d, yyyy')}`);
    } else {
      console.error(
        `[Blackout Dates] Failed to parse date "${dateStr}" at position ${index + 1}. ` +
          `Expected format: MM/DD/YYYY (e.g., "10/21/2025" or "1/5/2025"). ` +
          `Full string: "${blackoutDateString}"`
      );
    }
  });

  return blackoutDates;
}

/**
 * Format time with or without minutes
 */
export function formatTime(hour: number, minute: number): string {
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? 'PM' : 'AM';
  return minute === 0 ? `${h}${period}` : `${h}:${minute.toString().padStart(2, '0')}${period}`;
}

/**
 * Format a date and time with timezone
 */
export function formatDateTime(date: DateTime, duration: number, includeTimezone = true): string {
  const endDate = date.plus({ minutes: duration });
  const startTime = formatTime(date.hour, date.minute);
  const endTime = formatTime(endDate.hour, endDate.minute);

  if (includeTimezone) {
    const timezoneAbbr = date.toFormat('ZZZZ');
    return `${startTime} - ${endTime} ${timezoneAbbr}`;
  }

  return `${startTime} - ${endTime}`;
}

/**
 * Format a full date with time range
 */
export function formatFullDateTime(
  date: DateTime,
  duration: number,
  includeTimezone = true
): string {
  const dateStr = date.toFormat('EEEE, MMMM d, yyyy'); // "Monday, October 21, 2025"
  const timeStr = formatDateTime(date, duration, includeTimezone);
  return `${dateStr} at ${timeStr}`;
}
