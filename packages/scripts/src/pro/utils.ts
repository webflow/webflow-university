import { DateTime } from 'luxon';

export const DEFAULT_DURATION_MINUTES = 60;

export function parseDurationMinutes(
  durationStr: string | null | undefined,
  fallback = DEFAULT_DURATION_MINUTES
): number {
  const duration = parseInt(durationStr || '', 10);

  return Number.isFinite(duration) && duration > 0 ? duration : fallback;
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
