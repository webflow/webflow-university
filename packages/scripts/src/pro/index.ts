import { DateTime } from 'luxon';

import { initTabMenuScrolling } from './session-tabs';
import {
  formatTime,
  getNextOccurrence,
  parseBlackoutDates,
  parseDate,
  type RecurrencePattern,
} from './utils';

/*
EXPECTED HTML STRUCTURE:

<div 
  data-slug="enterprise-collaboration"
  data-start-1="2025-12-09 11:00"  <!-- ISO 8601 with space (recommended) -->
  data-frequency-1="weekly"
  data-duration-1="60"
  data-until-1=""  <!-- Optional end date (date-only, e.g., "2025-12-19") -->
  data-start-2="2025-12-04 15:00"  <!-- Optional second recurrence -->
  data-frequency-2="weekly"               <!-- Optional -->
  data-duration-2="60"                      <!-- Optional -->
  data-until-2=""          <!-- Optional -->
  data-blackout-date-string="10/21/2025, 10/28/2025, 11/25/2025"  <!-- Optional comma-separated dates -->
  role="listitem" 
  class="w-dyn-item">
  
  <a href="#" class="w-inline-block">
    <h3>Enterprise Collaboration</h3>
    <div id="pro-day">Dec 4</div>
    <div id="pro-time">12PM - 1PM PST</div>
  </a>
</div>

Notes:
- All dates are assumed to be in America/New_York (ET) timezone
- Recommended date format: ISO 8601 with space (e.g., "2025-12-04 15:00" for Dec 4, 3PM ET)
- Alternative formats supported: "2025-12-04T15:00", "December 4, 2025 3:00 PM", "12/04/2025 03:00 PM"
- Until dates can be date-only: "2025-12-19" (assumed midnight ET)
- Supports up to 2 recurrence patterns per event
- data-start-2, data-frequency-2, etc. are optional
- data-blackout-date-string is optional, format: "MM/DD/YYYY, MM/DD/YYYY"
- Script will show the NEXT closest occurrence across all recurrence patterns
- Blackout dates will be skipped automatically
*/

interface EventData {
  element: HTMLElement;
  slug: string;
  recurrences: RecurrencePattern[];
  blackoutDates: DateTime[];
  timezone: string;
}

/**
 * Parse event data from DOM element
 */
function parseEventData(element: HTMLElement): EventData | null {
  const { slug } = element.dataset;
  const timezone = 'America/New_York'; // Default to ET

  if (!slug) {
    console.error('Missing required data-slug attribute', element);
    return null;
  }

  // Parse recurrence patterns (up to 2)
  const recurrences: RecurrencePattern[] = [];

  for (let i = 1; i <= 2; i++) {
    // Access data attributes with hyphens using bracket notation
    const startDateStr = element.getAttribute(`data-start-${i}`);
    const frequency = element.getAttribute(`data-frequency-${i}`);
    const durationStr = element.getAttribute(`data-duration-${i}`);
    const untilStr = element.getAttribute(`data-until-${i}`);

    // Skip if no start date for this recurrence
    if (!startDateStr || !startDateStr.trim()) {
      continue;
    }

    if (!frequency || !durationStr) {
      console.error(`Missing frequency or duration for recurrence ${i}`, element);
      continue;
    }

    const startDate = parseDate(startDateStr, timezone);
    if (!startDate) {
      console.error(`Invalid start date for recurrence ${i}:`, startDateStr);
      continue;
    }

    const duration = parseInt(durationStr, 10);
    let until: DateTime | undefined;

    if (untilStr && untilStr.trim()) {
      until = parseDate(untilStr, timezone) || undefined;
    }

    recurrences.push({
      startDate,
      frequency,
      duration,
      until,
    });
  }

  if (recurrences.length === 0) {
    console.error('No valid recurrence patterns found', element);
    return null;
  }

  // Parse blackout dates
  const blackoutDateString = element.getAttribute('data-blackout-date-string') || '';
  const blackoutDates = parseBlackoutDates(blackoutDateString, timezone);

  return {
    element,
    slug,
    recurrences,
    blackoutDates,
    timezone,
  };
}

/**
 * Find the next occurrence across all recurrence patterns
 */
function findNextOccurrence(
  eventData: EventData
): { occurrence: DateTime; duration: number } | null {
  let closestOccurrence: DateTime | null = null;
  let closestDuration = 0;

  // Check each recurrence pattern
  for (const recurrence of eventData.recurrences) {
    const nextOccurrence = getNextOccurrence(
      recurrence.startDate,
      recurrence.frequency,
      eventData.blackoutDates,
      recurrence.until
    );

    if (!nextOccurrence) {
      continue;
    }

    // Keep track of the earliest occurrence
    if (!closestOccurrence || nextOccurrence < closestOccurrence) {
      closestOccurrence = nextOccurrence;
      closestDuration = recurrence.duration;
    }
  }

  if (!closestOccurrence) {
    return null;
  }

  return {
    occurrence: closestOccurrence,
    duration: closestDuration,
  };
}

/**
 * Update event display with next occurrence
 */
function updateEventDisplay(eventData: EventData, showInUserTimezone: boolean): void {
  const next = findNextOccurrence(eventData);

  if (!next) {
    // Event series has ended
    return;
  }

  const { occurrence: nextOccurrence, duration } = next;

  // Convert to user's timezone if checkbox is checked
  const displayDate = showInUserTimezone ? nextOccurrence.setZone('local') : nextOccurrence;

  // Calculate end time based on duration
  const endDate = displayDate.plus({ minutes: duration });

  // Find the day and time elements within this event
  const dayElement = eventData.element.querySelector('#pro-day') as HTMLElement;
  const timeElement = eventData.element.querySelector('#pro-time') as HTMLElement;

  if (dayElement) {
    // Format: "Oct 22"
    dayElement.textContent = displayDate.toFormat('MMM d');
  }

  if (timeElement) {
    // Format: "11AM - 12PM PT" or "3PM - 4PM ET"
    const startTime = formatTime(displayDate.hour, displayDate.minute);
    const endTime = formatTime(endDate.hour, endDate.minute);
    const timezoneAbbr = displayDate.toFormat('ZZZZ'); // "PT" or "ET"

    timeElement.textContent = `${startTime} - ${endTime} ${timezoneAbbr}`;
  }
}

/**
 * Initialize event display updates
 */
function initProEvents(): void {
  // Query all event elements (look for data-slug and data-start-1)
  const eventElements = document.querySelectorAll(
    '[data-slug][data-start-1]'
  ) as NodeListOf<HTMLElement>;

  // Query the timezone toggle checkbox
  const tzCheckbox = document.querySelector('#pro-show-in-my-tz') as HTMLInputElement;

  if (eventElements.length === 0) {
    return;
  }

  // Parse all events
  const events: EventData[] = [];
  eventElements.forEach((element) => {
    const eventData = parseEventData(element);
    if (eventData) {
      events.push(eventData);
    }
  });

  // Function to update all events
  const updateAllEvents = () => {
    const showInUserTimezone = tzCheckbox?.checked || false;
    events.forEach((event) => updateEventDisplay(event, showInUserTimezone));
  };

  // Initial update
  updateAllEvents();

  // Listen for checkbox changes
  if (tzCheckbox) {
    tzCheckbox.addEventListener('change', updateAllEvents);
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initProEvents();
    initTabMenuScrolling();
  });
} else {
  initProEvents();
  initTabMenuScrolling();
}
