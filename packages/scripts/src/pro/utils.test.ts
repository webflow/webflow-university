import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import { formatDateTime, formatFullDateTime, formatTime, parseDurationMinutes } from './utils';

const timezone = 'America/New_York';

describe('parseDurationMinutes', () => {
  it('parses valid minute values', () => {
    expect(parseDurationMinutes('75')).toBe(75);
  });

  it('falls back to 60 minutes when the value is missing or invalid', () => {
    expect(parseDurationMinutes(null)).toBe(60);
    expect(parseDurationMinutes('')).toBe(60);
    expect(parseDurationMinutes('not-a-number')).toBe(60);
    expect(parseDurationMinutes('0')).toBe(60);
  });
});

describe('formatters', () => {
  it.each([
    [0, 0, '12AM'],
    [9, 5, '9:05AM'],
    [12, 0, '12PM'],
    [15, 30, '3:30PM'],
  ])('formats %d:%d', (hour, minute, expected) => {
    expect(formatTime(hour, minute)).toBe(expected);
  });

  it('formats time ranges with and without timezone labels', () => {
    const date = DateTime.fromISO('2026-04-16T11:00:00', { zone: timezone });

    expect(formatDateTime(date, 90)).toBe('11AM - 12:30PM EDT');
    expect(formatDateTime(date, 90, false)).toBe('11AM - 12:30PM');
  });

  it('formats full date strings', () => {
    const date = DateTime.fromISO('2026-04-16T11:00:00', { zone: timezone });

    expect(formatFullDateTime(date, 60, false)).toBe('Thursday, April 16, 2026 at 11AM - 12PM');
  });
});
