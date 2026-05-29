import { DateTime } from 'luxon';

import { initTabMenuScrolling } from './session-tabs';
import { formatTime, parseDurationMinutes } from './utils';

/*
EXPECTED HTML STRUCTURE:

<div 
  data-slug="enterprise-collaboration"
  data-datetime-flatlist="2026-05-20T14:00:00-04:00, 2026-06-02T10:00:00-04:00"
  role="listitem" 
  class="w-dyn-item">
  
  <a href="#" class="w-inline-block">
    <h3>Enterprise Collaboration</h3>
    <div id="pro-day">Dec 4</div>
    <div id="pro-time">12PM - 1PM PST</div>
  </a>
</div>

Notes:
- Dates are read from data-datetime-flatlist as comma-separated ISO 8601 datetimes
- ISO offsets are respected, then normalized to America/New_York for the default display
- Script will show the NEXT closest occurrence from the flat list
- Duration is read from data-duration, falling back to 60 minutes
*/

const DEFAULT_TIMEZONE = 'America/New_York';

interface EventData {
  element: HTMLElement;
  slug: string;
  occurrences: DateTime[];
  duration: number;
}

/**
 * Parse event data from DOM element
 */
function parseEventData(element: HTMLElement): EventData | null {
  const { slug } = element.dataset;

  if (!slug) {
    console.error('Missing required data-slug attribute', element);
    return null;
  }

  const datetimeFlatlist = element.getAttribute('data-datetime-flatlist') || '';
  const occurrences = datetimeFlatlist
    .split(',')
    .map((dateString) => dateString.trim())
    .filter(Boolean)
    .map((dateString) => {
      const date = DateTime.fromISO(dateString, { setZone: true });

      if (!date.isValid) {
        console.error(`Invalid datetime in data-datetime-flatlist: ${dateString}`, element);
        return null;
      }

      return date.setZone(DEFAULT_TIMEZONE);
    })
    .filter((date): date is DateTime => date !== null)
    .sort((a, b) => a.toMillis() - b.toMillis());

  if (occurrences.length === 0) {
    console.error('No valid datetimes found in data-datetime-flatlist', element);
    return null;
  }

  return {
    element,
    slug,
    occurrences,
    duration: parseDurationMinutes(element.getAttribute('data-duration')),
  };
}

/**
 * Find the next occurrence from the flat datetime list
 */
function findNextOccurrence(
  eventData: EventData
): { occurrence: DateTime; duration: number } | null {
  const now = DateTime.now();
  const nextOccurrence = eventData.occurrences.find(
    (occurrence) => occurrence.toMillis() > now.toMillis()
  );

  if (!nextOccurrence) {
    return null;
  }

  return {
    occurrence: nextOccurrence,
    duration: eventData.duration,
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
  // Query all event elements with the new flat datetime list
  const eventElements = document.querySelectorAll(
    '[data-slug][data-datetime-flatlist]'
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
