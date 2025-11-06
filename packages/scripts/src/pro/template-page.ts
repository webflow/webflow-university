import { DateTime } from 'luxon';

import { initTabMenuScrolling } from './session-tabs';
import {
  formatTime,
  getNextOccurrences,
  parseBlackoutDates,
  parseDate,
  type RecurrencePattern,
} from './utils';

interface SessionData {
  recurrences: RecurrencePattern[];
  blackoutDates: DateTime[];
  registrationLinks: string[];
  timezone: string;
  sessionType: 'live-training' | 'workshop' | null;
}

const NUM_OCCURRENCES_TO_SHOW = 3;

/**
 * Parse session data from the #data-saver element
 *
 * Expected data attributes:
 * - data-type: "workshop" or "live-training" (case-insensitive) - determines display format
 * - data-start-1, data-start-2: Date strings in format "YYYY-MM-DD H:mm" (Eastern Time, 24-hour format)
 *   If time is missing (parsed as midnight), defaults to 11:00 AM ET for recurrence 1, 3:00 PM ET for recurrence 2
 * - data-frequency-1, data-frequency-2: "weekly", "daily", "biweekly", "monthly"
 * - data-duration-1, data-duration-2: Duration in minutes
 * - data-end-1, data-end-2: Optional end date in format "YYYY-MM-DD"
 * - data-link-1, data-link-2: Registration links
 * - data-blackout-date-string: Comma-separated dates in MM/DD/YYYY format
 *
 * Display formats:
 * - Live Training: Tabs show day of week, occurrences show "MMM DD - HHAM-HHPM Timezone"
 * - Workshop: Tabs show "HHAM Timezone" (via #datetimes-tab-1-workshop-text, #datetimes-tab-2-workshop-text),
 *   occurrences show "MMM DD ........ DayOfWeek"
 */
function parseSessionData(element: HTMLElement): SessionData | null {
  const timezone = 'America/New_York'; // Default to ET

  // Parse recurrence patterns (up to 2)
  const recurrences: RecurrencePattern[] = [];
  const registrationLinks: string[] = [];

  for (let i = 1; i <= 2; i++) {
    // Access data attributes with hyphens using bracket notation
    const startDateStr = element.getAttribute(`data-start-${i}`);
    const frequency = element.getAttribute(`data-frequency-${i}`);
    const durationStr = element.getAttribute(`data-duration-${i}`);
    const endDateStr = element.getAttribute(`data-end-${i}`);
    const link = element.getAttribute(`data-link-${i}`);

    // Skip if no start date for this recurrence
    if (!startDateStr || !startDateStr.trim()) {
      continue;
    }

    if (!frequency || !durationStr) {
      console.error(`Missing frequency or duration for recurrence ${i}`, element);
      continue;
    }

    let startDate = parseDate(startDateStr, timezone);
    if (!startDate) {
      console.error(`Invalid start date for recurrence ${i}:`, startDateStr);
      continue;
    }

    // Check if date was parsed as midnight (no time provided)
    // If so, check for a separate time attribute or apply default time
    if (startDate.hour === 0 && startDate.minute === 0) {
      // Try to get time from a separate attribute (e.g., data-time-1)
      const timeStr = element.getAttribute(`data-time-${i}`);
      if (timeStr && timeStr.trim()) {
        // Try to parse the time and combine with the date
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeMatch) {
          let hour = parseInt(timeMatch[1], 10);
          const minute = parseInt(timeMatch[2], 10);
          const period = timeMatch[3]?.toUpperCase();

          if (period === 'PM' && hour !== 12) {
            hour += 12;
          } else if (period === 'AM' && hour === 12) {
            hour = 0;
          }

          startDate = startDate.set({ hour, minute });
        }
      } else {
        // Apply default times based on recurrence pattern
        // Recurrence 1 (typically Thursday): 11:00 AM ET
        // Recurrence 2 (typically Tuesday): 3:00 PM ET (15:00)
        const defaultHour = i === 1 ? 11 : 15; // 11 AM for first, 3 PM for second
        const defaultMinute = 0;
        startDate = startDate.set({ hour: defaultHour, minute: defaultMinute });
      }
    }

    const duration = parseInt(durationStr, 10);
    let until: DateTime | undefined;

    if (endDateStr && endDateStr.trim()) {
      until = parseDate(endDateStr, timezone) || undefined;
    }

    recurrences.push({
      startDate,
      frequency,
      duration,
      until,
    });

    registrationLinks.push(link || '');
  }

  if (recurrences.length === 0) {
    console.error('No valid recurrence patterns found', element);
    return null;
  }

  // Parse blackout dates (same as index.ts)
  const blackoutDateString = element.getAttribute('data-blackout-date-string') || '';
  const blackoutDates = parseBlackoutDates(blackoutDateString, timezone);

  // Parse session type (case-insensitive)
  const sessionTypeAttr = element.getAttribute('data-type')?.toLowerCase();
  let sessionType: 'live-training' | 'workshop' | null = null;
  if (sessionTypeAttr === 'workshop') {
    sessionType = 'workshop';
  } else if (sessionTypeAttr === 'live-training') {
    sessionType = 'live-training';
  }

  return {
    recurrences,
    blackoutDates,
    registrationLinks,
    timezone,
    sessionType,
  };
}

/**
 * Update the UI for a recurrence pattern
 * Times are always displayed in the user's local timezone
 *
 * For workshops:
 * - Updates tab text with time and timezone (via #datetimes-tab-{index}-workshop-text)
 * - Displays occurrences as "MMM DD ........ DayOfWeek"
 *
 * For live trainings:
 * - Displays occurrences as "MMM DD - HHAM-HHPM Timezone"
 */
function updateRecurrenceUI(
  index: number,
  recurrence: RecurrencePattern,
  blackoutDates: DateTime[],
  registrationLink: string,
  sessionType: 'live-training' | 'workshop' | null
): void {
  const container = document.querySelector(`#datetimes-${index}`);
  if (!container) {
    console.error(`[updateRecurrenceUI] Container #datetimes-${index} not found`);
    return;
  }

  // Get next NUM_OCCURRENCES_TO_SHOW occurrences
  const occurrences = getNextOccurrences(
    recurrence.startDate,
    recurrence.frequency,
    blackoutDates,
    NUM_OCCURRENCES_TO_SHOW,
    recurrence.until
  );

  if (occurrences.length === 0) {
    // Hide the container if no occurrences
    (container as HTMLElement).style.display = 'none';
    return;
  }

  // Show the container
  (container as HTMLElement).style.display = '';

  // For workshops: Update tab text with time and timezone
  if (sessionType === 'workshop') {
    // Try both getElementById and querySelector for maximum compatibility
    const tabTextElement =
      (document.getElementById(`datetimes-tab-${index}-workshop-text`) as HTMLElement) ||
      (document.querySelector(`#datetimes-tab-${index}-workshop-text`) as HTMLElement);

    if (tabTextElement) {
      // Use the recurrence start date time (in ET, then convert to local for display)
      const tabDate = recurrence.startDate.setZone('local');
      const tabTime = formatTime(tabDate.hour, tabDate.minute);
      const tabTimezone = tabDate.toFormat('ZZZZ');
      const newTabText = `${tabTime} ${tabTimezone}`;

      tabTextElement.textContent = newTabText;
      // Also try innerText and innerHTML as fallbacks
      tabTextElement.innerText = newTabText;
      tabTextElement.innerHTML = newTabText;
    } else {
      console.error(
        `[updateRecurrenceUI] Tab text element #datetimes-tab-${index}-workshop-text not found`
      );
    }
  }

  // Update list items
  const listElement = container.querySelector('ul.cc_pro-session_tab-list');
  if (!listElement) {
    console.error(`[updateRecurrenceUI] List element not found in container ${index}`);
    return;
  }

  // Clear existing items
  listElement.innerHTML = '';

  // Add new items with the new structure
  occurrences.forEach((occurrence) => {
    // Always convert to user's local timezone (dates are input in America/New_York)
    const displayDate = occurrence.setZone('local');

    const li = document.createElement('li');
    li.className = 'pro-session_list-item';

    // Date div (e.g., "Jan 13")
    const dateDiv = document.createElement('div');
    dateDiv.textContent = displayDate.toFormat('MMM d');

    // Dotted line separator
    const separatorDiv = document.createElement('div');
    separatorDiv.className = 'dotted-line';

    let contentDiv: HTMLDivElement;

    if (sessionType === 'workshop') {
      // For workshops: Show day of week (e.g., "Wednesday")
      contentDiv = document.createElement('div');
      const dayOfWeek = displayDate.toFormat('EEEE'); // Full day name
      contentDiv.textContent = dayOfWeek;
    } else {
      // For live trainings: Show time range (e.g., "11AM - 12PM PT")
      const endDate = displayDate.plus({ minutes: recurrence.duration });
      const startTime = formatTime(displayDate.hour, displayDate.minute);
      const endTime = formatTime(endDate.hour, endDate.minute);
      const timezoneAbbr = displayDate.toFormat('ZZZZ'); // "PT", "ET", etc.
      const timeText = `${startTime} - ${endTime} ${timezoneAbbr}`;

      contentDiv = document.createElement('div');
      contentDiv.innerHTML = timeText;
    }

    li.appendChild(dateDiv);
    li.appendChild(separatorDiv);
    li.appendChild(contentDiv);
    listElement.appendChild(li);
  });

  // Update registration link
  const linkElement = container.querySelector('a.button');
  if (linkElement && registrationLink) {
    linkElement.setAttribute('href', registrationLink);
    (linkElement as HTMLElement).style.display = 'inline-block';
  } else if (linkElement) {
    (linkElement as HTMLElement).style.display = 'none';
  }
}

/**
 * Initialize the template page
 * Times are always displayed in the user's local timezone
 */
function initTemplatePage(): void {
  const dataSaver = document.querySelector('#data-saver') as HTMLElement;
  if (!dataSaver) {
    console.error('[initTemplatePage] #data-saver element not found');
    return;
  }

  const sessionData = parseSessionData(dataSaver);
  if (!sessionData) {
    console.error('[initTemplatePage] Failed to parse session data');
    return;
  }

  // Update all recurrences (always show in user's local timezone)
  sessionData.recurrences.forEach((recurrence, index) => {
    updateRecurrenceUI(
      index + 1,
      recurrence,
      sessionData.blackoutDates,
      sessionData.registrationLinks[index],
      sessionData.sessionType
    );
  });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTemplatePage();
    initTabMenuScrolling();
  });
} else {
  initTemplatePage();
  initTabMenuScrolling();
}
