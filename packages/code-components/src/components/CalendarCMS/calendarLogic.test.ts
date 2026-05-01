import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import {
  addMonthsUTC,
  blackoutMatches,
  buildSessionsFromApiItems,
  formatMonthTitle,
  generateNextOccurrencesForSession,
  monthStart,
  parseBlackoutSet,
  parseReadableDate,
  startOfWeekMonday,
  type Session,
} from './calendarLogic';

const eventTimezone = 'America/New_York';

function dateInZone(iso: string): Date {
  return DateTime.fromISO(iso, { zone: eventTimezone }).toJSDate();
}

describe('calendarLogic date parsing', () => {
  it('parses CMS start dates in the event timezone', () => {
    expect(parseReadableDate('2026-04-16 11:00')?.toISOString()).toBe('2026-04-16T15:00:00.000Z');
  });

  it('parses CMS end dates at the end of the event day', () => {
    expect(parseReadableDate('2026-04-16', false)?.toISOString()).toBe(
      '2026-04-17T03:59:00.000Z'
    );
  });

  it('returns null for invalid CMS dates', () => {
    expect(parseReadableDate('not-a-date')).toBeNull();
  });
});

describe('calendarLogic blackout handling', () => {
  it('normalizes blackout date strings and ignores trailing commas', () => {
    expect(Array.from(parseBlackoutSet('4/6/2026, 04/16/2026, '))).toEqual([
      '04/06/2026',
      '04/16/2026',
    ]);
  });

  it('matches occurrences by event timezone calendar day', () => {
    const blackoutDates = parseBlackoutSet('04/16/2026');
    const occurrence = dateInZone('2026-04-16T23:30:00');

    expect(blackoutMatches(occurrence, eventTimezone, blackoutDates)).toBe(true);
  });
});

describe('calendarLogic recurrence generation', () => {
  it('builds sessions from CMS field data', () => {
    const sessions = buildSessionsFromApiItems([
      {
        fieldData: {
          'blackout-date-string': '04/23/2026',
          'duration-1': '90',
          'end-1': '2026-05-01',
          'frequency-1': 'weekly',
          name: 'SEO & AEO',
          slug: 'seo-aeo',
          'start-1': '2026-04-16 11:00',
          type: 'Workshop',
        },
      },
    ]);

    expect(sessions).toHaveLength(1);
    expect(sessions[0].rules[0].durationMin).toBe(90);
    expect(sessions[0].rules[0].blackoutDatesYMD.has('04/23/2026')).toBe(true);
  });

  it('generates weekly occurrences and skips blackout dates', () => {
    const session: Session = {
      name: 'SEO & AEO',
      rules: [
        {
          blackoutDatesYMD: parseBlackoutSet('04/23/2026'),
          durationMin: 60,
          frequencyWeeks: 1,
          startUTC: dateInZone('2026-04-16T11:00:00'),
          untilUTC: dateInZone('2026-05-15T23:59:00'),
        },
      ],
      slug: 'seo-aeo',
    };

    expect(
      generateNextOccurrencesForSession(
        session,
        dateInZone('2026-04-01T00:00:00'),
        eventTimezone,
        60
      ).map((occ) =>
        DateTime.fromJSDate(occ.startUTC, { zone: eventTimezone }).toFormat('yyyy-MM-dd')
      )
    ).toEqual(['2026-04-16', '2026-04-30', '2026-05-07', '2026-05-14']);
  });

  it.each([
    ['daily', 1 / 7, ['2026-04-16', '2026-04-17', '2026-04-18']],
    ['biweekly', 2, ['2026-04-16', '2026-04-30', '2026-05-14']],
    ['monthly', null, ['2026-04-16', '2026-05-16', '2026-06-16']],
  ])('generates %s occurrences', (_label, frequencyWeeks, expectedDates) => {
    const session: Session = {
      name: 'Recurring session',
      rules: [
        {
          blackoutDatesYMD: new Set(),
          durationMin: 60,
          frequencyWeeks,
          startUTC: dateInZone('2026-04-16T11:00:00'),
          untilUTC: dateInZone('2026-06-30T23:59:00'),
        },
      ],
      slug: 'recurring-session',
    };

    expect(
      generateNextOccurrencesForSession(
        session,
        dateInZone('2026-04-01T00:00:00'),
        eventTimezone,
        90
      )
        .slice(0, 3)
        .map((occ) =>
          DateTime.fromJSDate(occ.startUTC, { zone: eventTimezone }).toFormat('yyyy-MM-dd')
        )
    ).toEqual(expectedDates);
  });

  it('keeps weekly occurrence wall-clock time stable across DST', () => {
    const session: Session = {
      name: 'DST session',
      rules: [
        {
          blackoutDatesYMD: new Set(),
          durationMin: 60,
          frequencyWeeks: 1,
          startUTC: dateInZone('2026-03-05T11:00:00'),
          untilUTC: dateInZone('2026-03-20T23:59:00'),
        },
      ],
      slug: 'dst-session',
    };

    expect(
      generateNextOccurrencesForSession(
        session,
        dateInZone('2026-03-01T00:00:00'),
        eventTimezone,
        30
      ).map((occ) =>
        DateTime.fromJSDate(occ.startUTC, { zone: eventTimezone }).toFormat('yyyy-MM-dd HH:mm ZZZZ')
      )
    ).toEqual(['2026-03-05 11:00 EST', '2026-03-12 11:00 EDT', '2026-03-19 11:00 EDT']);
  });
});

describe('calendarLogic month helpers', () => {
  it('returns the current month start anchored at noon UTC', () => {
    expect(monthStart(new Date('2026-04-16T15:00:00Z')).toISOString()).toBe(
      '2026-04-01T12:00:00.000Z'
    );
  });

  it('finds the Monday that starts the calendar week', () => {
    expect(startOfWeekMonday(new Date('2026-04-01T12:00:00Z')).toISOString()).toBe(
      '2026-03-30T12:00:00.000Z'
    );
  });

  it('adds calendar months in UTC', () => {
    expect(addMonthsUTC(new Date('2026-12-01T12:00:00Z'), 1).toISOString()).toBe(
      '2027-01-01T12:00:00.000Z'
    );
  });

  it('formats month titles in the requested timezone', () => {
    expect(formatMonthTitle(new Date('2026-04-01T12:00:00Z'), eventTimezone)).toBe('April 2026');
  });
});
