import { DateTime } from 'luxon';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  formatDateTime,
  formatFullDateTime,
  formatTime,
  getNextOccurrence,
  getNextOccurrences,
  isBlackoutDate,
  parseBlackoutDates,
  parseDate,
} from './utils';

const timezone = 'America/New_York';

describe('parseBlackoutDates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('parses comma-separated blackout dates', () => {
    const dates = parseBlackoutDates('04/16/2026, 04/21/2026', timezone);

    expect(dates.map((date) => date.toFormat('yyyy-MM-dd'))).toEqual(['2026-04-16', '2026-04-21']);
  });

  it('ignores a trailing comma without logging an error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dates = parseBlackoutDates('04/16/2026, 04/21/2026, ', timezone);

    expect(dates.map((date) => date.toFormat('yyyy-MM-dd'))).toEqual(['2026-04-16', '2026-04-21']);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('skips extra empty comma segments', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dates = parseBlackoutDates('04/16/2026, , 04/21/2026,, ', timezone);

    expect(dates.map((date) => date.toFormat('yyyy-MM-dd'))).toEqual(['2026-04-16', '2026-04-21']);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('logs an error for non-empty invalid dates', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dates = parseBlackoutDates('04/16/2026, not-a-date', timezone);

    expect(dates.map((date) => date.toFormat('yyyy-MM-dd'))).toEqual(['2026-04-16']);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[Blackout Dates] Failed to parse date "not-a-date"')
    );
  });
});

describe('parseDate', () => {
  it.each([
    ['2026-04-16 11:00', '2026-04-16T11:00:00.000-04:00'],
    ['2026-04-16 9:05', '2026-04-16T09:05:00.000-04:00'],
    ['2026-04-16T15:30:00', '2026-04-16T15:30:00.000-04:00'],
    ['April 16, 2026 3:30 PM', '2026-04-16T15:30:00.000-04:00'],
    ['04/16/2026 03:30 PM', '2026-04-16T15:30:00.000-04:00'],
    ['April 16, 2026', '2026-04-16T00:00:00.000-04:00'],
    ['04/16/2026', '2026-04-16T00:00:00.000-04:00'],
  ])('parses %s in the requested timezone', (input, expectedIso) => {
    expect(parseDate(input, timezone)?.toISO()).toBe(expectedIso);
  });

  it('returns null for invalid dates', () => {
    expect(parseDate('not-a-date', timezone)).toBeNull();
  });
});

describe('isBlackoutDate', () => {
  it('matches blackout dates by calendar day only', () => {
    const blackout = DateTime.fromISO('2026-04-16T00:00:00', { zone: timezone });
    const session = DateTime.fromISO('2026-04-16T15:30:00', { zone: timezone });

    expect(isBlackoutDate(session, [blackout])).toBe(true);
  });

  it('returns false for different calendar days', () => {
    const blackout = DateTime.fromISO('2026-04-16T00:00:00', { zone: timezone });
    const session = DateTime.fromISO('2026-04-17T11:00:00', { zone: timezone });

    expect(isBlackoutDate(session, [blackout])).toBe(false);
  });
});

describe('getNextOccurrence', () => {
  it('returns a future start date when it is not blacked out', () => {
    vi.setSystemTime(new Date('2026-04-01T12:00:00Z'));
    const startDate = DateTime.fromISO('2026-04-16T11:00:00', { zone: timezone });

    expect(getNextOccurrence(startDate, 'weekly', [])?.toISO()).toBe(startDate.toISO());
  });

  it('advances past blacked-out weekly dates', () => {
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
    const startDate = DateTime.fromISO('2026-04-16T11:00:00', { zone: timezone });
    const blackoutDates = [
      DateTime.fromISO('2026-04-23T00:00:00', { zone: timezone }),
      DateTime.fromISO('2026-04-30T00:00:00', { zone: timezone }),
    ];

    expect(getNextOccurrence(startDate, 'weekly', blackoutDates)?.toFormat('yyyy-MM-dd')).toBe(
      '2026-05-07'
    );
  });

  it('returns null when the next occurrence is beyond the until date', () => {
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
    const startDate = DateTime.fromISO('2026-04-16T11:00:00', { zone: timezone });
    const until = DateTime.fromISO('2026-04-18T00:00:00', { zone: timezone });

    expect(getNextOccurrence(startDate, 'weekly', [], until)).toBeNull();
  });
});

describe('getNextOccurrences', () => {
  it('returns the requested number of future occurrences while skipping blackout dates', () => {
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
    const startDate = DateTime.fromISO('2026-04-16T11:00:00', { zone: timezone });
    const blackoutDates = [DateTime.fromISO('2026-04-30T00:00:00', { zone: timezone })];

    expect(
      getNextOccurrences(startDate, 'weekly', blackoutDates, 3).map((date) =>
        date.toFormat('yyyy-MM-dd')
      )
    ).toEqual(['2026-04-23', '2026-05-07', '2026-05-14']);
  });

  it('stops at the until date', () => {
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
    const startDate = DateTime.fromISO('2026-04-16T11:00:00', { zone: timezone });
    const until = DateTime.fromISO('2026-04-30T23:59:00', { zone: timezone });

    expect(
      getNextOccurrences(startDate, 'weekly', [], 3, until).map((date) =>
        date.toFormat('yyyy-MM-dd')
      )
    ).toEqual(['2026-04-23', '2026-04-30']);
  });

  it('returns an empty list for invalid frequencies', () => {
    const startDate = DateTime.fromISO('2026-04-16T11:00:00', { zone: timezone });

    expect(getNextOccurrences(startDate, 'yearly', [], 3)).toEqual([]);
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
