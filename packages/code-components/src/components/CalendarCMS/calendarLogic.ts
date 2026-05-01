import { DateTime } from 'luxon';

import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_END_DATE_DAYS,
  DEFAULT_EVENT_TIMEZONE,
  FREQ_TO_WEEKS,
} from './constants';

export interface RecurrenceRule {
  startUTC: Date;
  untilUTC: Date;
  durationMin: number;
  frequencyWeeks: number | null;
  blackoutDatesYMD: Set<string>;
}

export interface Session {
  slug: string;
  name: string;
  type?: string;
  rules: RecurrenceRule[];
}

export interface Occurrence {
  slug: string;
  name: string;
  type?: string;
  startUTC: Date;
  endUTC: Date;
}

export type CMSItem = { fieldData?: Record<string, unknown> };

export function formatRange(startUTC: Date, endUTC: Date, timeZone: string): string {
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

export function ymdInZone(
  dateUTC: Date,
  timeZone: string
): { y: number; m: number; d: number; key: string } {
  try {
    const dt = DateTime.fromJSDate(dateUTC, { zone: timeZone });
    if (!dt.isValid) {
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
    const now = DateTime.now();
    return {
      y: now.year,
      m: now.month,
      d: now.day,
      key: now.toFormat('yyyy-MM-dd'),
    };
  }
}

export function addWeeksInZone(dateUTC: Date, weeks: number, timeZone: string): Date {
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

export function addMonthsInZone(dateUTC: Date, months: number, timeZone: string): Date {
  try {
    const dt = DateTime.fromJSDate(dateUTC, { zone: timeZone });
    if (!dt.isValid) {
      return new Date(NaN);
    }
    const result = dt.plus({ months });
    return result.toJSDate();
  } catch {
    return new Date(NaN);
  }
}

export function parseReadableDate(dateString: string, isStartDate: boolean = true): Date | null {
  if (!dateString || !dateString.trim()) {
    return null;
  }

  const trimmed = dateString.trim();

  const dateTimeMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})$/);
  if (dateTimeMatch) {
    const year = parseInt(dateTimeMatch[1], 10);
    const month = parseInt(dateTimeMatch[2], 10);
    const day = parseInt(dateTimeMatch[3], 10);
    const hour = parseInt(dateTimeMatch[4], 10);
    const minute = parseInt(dateTimeMatch[5], 10);

    const dt = DateTime.fromObject(
      { year, month, day, hour, minute },
      { zone: DEFAULT_EVENT_TIMEZONE }
    );
    if (!dt.isValid) {
      return null;
    }
    return dt.toJSDate();
  }

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10);
    const day = parseInt(dateOnlyMatch[3], 10);
    const hour = isStartDate ? 0 : 23;
    const minute = isStartDate ? 0 : 59;

    const dt = DateTime.fromObject(
      { year, month, day, hour, minute },
      { zone: DEFAULT_EVENT_TIMEZONE }
    );
    if (!dt.isValid) {
      return null;
    }
    return dt.toJSDate();
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

export function parseBlackoutSet(input?: string): Set<string> {
  if (!input) return new Set();
  const parts = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((dateStr) => {
      const [month, day, year] = dateStr.split('/');
      return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
    });
  return new Set(parts);
}

export function blackoutMatches(occUTC: Date, timeZone: string, blackoutRaw: Set<string>): boolean {
  if (blackoutRaw.size === 0) return false;
  const { y, m, d } = ymdInZone(occUTC, timeZone);
  const mmddyyyy = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
  return blackoutRaw.has(mmddyyyy);
}

export function extractFieldDataFromElement(element: HTMLDivElement): Record<string, unknown> {
  const fieldData: Record<string, unknown> = {};

  for (const attr of Array.from(element.attributes)) {
    if (
      attr.name.startsWith('data-') &&
      !attr.name.startsWith('data-wf-') &&
      attr.name !== 'data-w-dyn-item'
    ) {
      const fieldName = attr.name.replace(/^data-/, '');
      fieldData[fieldName] = attr.value;
    }
  }

  const fieldElements = element.querySelectorAll('[data-wf-field]');
  for (const fieldEl of fieldElements) {
    const fieldName = fieldEl.getAttribute('data-wf-field');
    if (fieldName) {
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

export function convertElementsToCMSItems(elements: HTMLDivElement[]): CMSItem[] {
  return elements.map((element) => ({
    fieldData: extractFieldDataFromElement(element),
  }));
}

export function buildRecurrenceRule(
  f: Record<string, unknown>,
  ruleNumber: string,
  fallbackDuration: number
): RecurrenceRule | null {
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

  const parsedStart = parseReadableDate(String(startValue), true);
  if (!parsedStart) {
    return null;
  }

  const startUTC = parsedStart;
  let untilUTC: Date;
  const endValue = f[endField];
  if (endValue && String(endValue).trim() !== '') {
    const parsedEnd = parseReadableDate(String(endValue), false);
    if (parsedEnd) {
      untilUTC = parsedEnd;
    } else {
      untilUTC = new Date(startUTC.getTime() + 1000 * 60 * 60 * 24 * DEFAULT_END_DATE_DAYS);
    }
  } else {
    untilUTC = new Date(startUTC.getTime() + 1000 * 60 * 60 * 24 * DEFAULT_END_DATE_DAYS);
  }

  const durationMin =
    typeof f[durationField] === 'number'
      ? (f[durationField] as number)
      : parseInt(String(f[durationField] || fallbackDuration), 10);

  return {
    startUTC,
    untilUTC,
    durationMin,
    frequencyWeeks: mapFreq(String(f[frequencyField] || '')),
    blackoutDatesYMD: parseBlackoutSet(String(f['blackout-date-string'] || '')),
  };
}

export function buildSessionsFromApiItems(items: CMSItem[]): Session[] {
  const sessions: Session[] = [];

  for (const item of items) {
    const f = (item.fieldData || {}) as Record<string, unknown>;
    const slug = typeof f.slug === 'string' ? (f.slug as string) : undefined;
    if (!slug) {
      continue;
    }

    const name = typeof f.name === 'string' ? (f.name as string) : slug;
    const type = typeof f.type === 'string' ? (f.type as string) : undefined;
    const rules: RecurrenceRule[] = [];

    const rule1 = buildRecurrenceRule(f, '1', DEFAULT_DURATION_MINUTES);
    if (rule1) rules.push(rule1);

    const rule2 = buildRecurrenceRule(f, '2', rule1?.durationMin || DEFAULT_DURATION_MINUTES);
    if (rule2) rules.push(rule2);

    if (rules.length > 0) {
      sessions.push({ slug, name, type, rules });
    }
  }

  return sessions;
}

export function generateNextOccurrencesForSession(
  session: Session,
  fromUTC: Date,
  eventTimeZone: string,
  daysLimit: number
): Occurrence[] {
  const occs: Occurrence[] = [];
  const limitUTC = new Date(fromUTC.getTime() + daysLimit * 24 * 60 * 60 * 1000);

  for (const rule of session.rules) {
    const effectiveEndUTC = new Date(Math.min(rule.untilUTC.getTime(), limitUTC.getTime()));
    let current = rule.startUTC;

    while (current.getTime() < fromUTC.getTime()) {
      const next =
        rule.frequencyWeeks === null
          ? addMonthsInZone(current, 1, eventTimeZone)
          : addWeeksInZone(current, rule.frequencyWeeks, eventTimeZone);
      if (next.getTime() === current.getTime()) break;
      current = next;
      if (current.getTime() > effectiveEndUTC.getTime()) break;
    }

    while (current.getTime() <= effectiveEndUTC.getTime()) {
      const isBlackedOut = blackoutMatches(current, eventTimeZone, rule.blackoutDatesYMD);
      if (!isBlackedOut) {
        const endUTC = new Date(current.getTime() + rule.durationMin * 60 * 1000);
        occs.push({
          slug: session.slug,
          name: session.name,
          type: session.type,
          startUTC: current,
          endUTC,
        });
      }

      const next =
        rule.frequencyWeeks === null
          ? addMonthsInZone(current, 1, eventTimeZone)
          : addWeeksInZone(current, rule.frequencyWeeks, eventTimeZone);
      if (next.getTime() === current.getTime()) break;
      current = next;
    }
  }

  return occs.sort((a, b) => a.startUTC.getTime() - b.startUTC.getTime());
}

export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

export function startOfWeekMonday(date: Date): Date {
  const jsDay = date.getUTCDay();
  const mondayIndex = (jsDay + 6) % 7;
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - mondayIndex);
  return d;
}

export function addMonthsUTC(date: Date, diff: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + diff, 1, 12));
}

export function formatMonthTitle(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(date);
}
