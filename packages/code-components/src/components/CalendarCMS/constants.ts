export const ABSOLUTE_SESSIONS_LIST_URL =
  'https://university.webflow.com/app/api/pro/sessions/list';

// For local dev, use Vite proxy to avoid CORS
export function getSessionsListUrl(): string {
  if (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname)) {
    return '/api/pro/sessions/list'; // proxied in vite.config.ts
  }
  return ABSOLUTE_SESSIONS_LIST_URL;
}

// CMS frequency field IDs and text values mapped to week intervals
// Special value: null means monthly (calendar months, not fixed weeks)
export const FREQ_TO_WEEKS: Record<string, number | null> = {
  // CMS field IDs (for backward compatibility)
  '3b17f025f9bfd14755a9fb6b43edf6ca': 1 / 7, // daily (1/7 week = 1 day)
  '9e7cfb792d37ee3143cc9abf946a1ff4': 1, // weekly
  f71eecc4e167da7421c40b7cd2072332: 2, // biweekly
  '9e10de1ae22809260b13717d59023c4d': null, // monthly (calendar months)
  // Text-based frequency values (new format)
  daily: 1 / 7,
  weekly: 1,
  biweekly: 2,
  'bi-weekly': 2,
  monthly: null, // calendar months
};

// Calendar configuration constants
export const DEFAULT_EVENT_TIMEZONE = 'America/New_York';
export const DEFAULT_DURATION_MINUTES = 60;
export const DEFAULT_END_DATE_DAYS = 180; // Default end date if not specified
export const MAX_OCCURRENCES_PER_SESSION = 4; // Limit for upcoming events display
export const GRID_WEEKS_COUNT = 6; // Number of weeks to display in calendar grid
export const DEFAULT_DAYS_LIMIT = 100; // Default number of days from now to calculate occurrences
