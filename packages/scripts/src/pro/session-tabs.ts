import { DateTime } from 'luxon';

import { formatTime, parseDurationMinutes } from './utils';

const DEFAULT_EVENT_TIMEZONE = 'America/New_York';

function parseDateTimeFlatlist(dateTimeFlatlist: string): DateTime[] {
  return dateTimeFlatlist
    .split(',')
    .map((dateString) => dateString.trim())
    .filter(Boolean)
    .map((dateString) => {
      const date = DateTime.fromISO(dateString, { setZone: true });

      if (!date.isValid) {
        console.error(`Invalid datetime in data-datetime-flatlist: ${dateString}`);
        return null;
      }

      return date.setZone(DEFAULT_EVENT_TIMEZONE);
    })
    .filter((date): date is DateTime => date !== null)
    .sort((a, b) => a.toMillis() - b.toMillis());
}

function formatTimeRange(startDate: DateTime, duration: number): string {
  const endDate = startDate.plus({ minutes: duration });
  const startTime = formatTime(startDate.hour, startDate.minute);
  const endTime = formatTime(endDate.hour, endDate.minute);
  const timezoneAbbr = startDate.toFormat('ZZZZ');

  return `${startTime} - ${endTime} ${timezoneAbbr}`;
}

/**
 * Populate the new flatlist session datetime component.
 */
export function initDateTimeFlatlist(): void {
  const container = document.querySelector('#datetimes-flatlist') as HTMLElement | null;
  if (!container) {
    return;
  }

  const dateTimeFlatlist = container.getAttribute('data-datetime-flatlist') || '';
  const duration = parseDurationMinutes(container.getAttribute('data-duration'));
  const occurrences = parseDateTimeFlatlist(dateTimeFlatlist)
    .filter((date) => date > DateTime.now())
    .map((date) => date.setZone('local'));

  const listElement = container.querySelector('ul.cc_pro-session_tab-list');
  if (!listElement) {
    console.error('[initDateTimeFlatlist] List element not found in #datetimes-flatlist');
    return;
  }

  listElement.innerHTML = '';

  if (occurrences.length === 0) {
    (container as HTMLElement).style.display = 'none';
    return;
  }

  (container as HTMLElement).style.display = '';

  occurrences.forEach((occurrence) => {
    const li = document.createElement('li');
    li.className = 'pro-session_list-item';

    const dateDiv = document.createElement('div');
    dateDiv.textContent = occurrence.toFormat('MMM d (EEE)');

    const separatorDiv = document.createElement('div');
    separatorDiv.className = 'dotted-line';

    const timeDiv = document.createElement('div');
    timeDiv.textContent = formatTimeRange(occurrence, duration);

    li.appendChild(dateDiv);
    li.appendChild(separatorDiv);
    li.appendChild(timeDiv);
    listElement.appendChild(li);
  });
}

/**
 * Initialize tab menu scrolling when container is narrow
 */
export function initTabMenuScrolling(): void {
  const tabMenu = document.querySelector('.cc_pro_session-tab-menu') as HTMLElement;
  const tabsContainer = document.querySelector('.cc_pro_session-tabs') as HTMLElement;

  if (!tabMenu) {
    return;
  }

  if (!tabsContainer) {
    return;
  }

  const maxWidthPx = 1200;

  // Check if container width is less than 87rem
  const checkAndSetupScrolling = () => {
    const containerWidth = tabMenu.offsetWidth;

    if (containerWidth < maxWidthPx) {
      // Find the navigation buttons
      const prevButton = document.querySelector('.cc_pro_tabs_button.prev') as HTMLElement;
      const nextButton = document.querySelector('.cc_pro_tabs_button.next') as HTMLElement;

      if (prevButton && nextButton) {
        // Check if buttons are already appended to the parent container
        if (!tabsContainer.contains(prevButton)) {
          tabsContainer.appendChild(prevButton);
        }
        if (!tabsContainer.contains(nextButton)) {
          tabsContainer.appendChild(nextButton);
        }

        // Get the width of a tab link to use as scroll amount
        const tabLink = tabMenu.querySelector('.cc_pro_session-tab') as HTMLElement;
        const scrollAmount = tabLink ? tabLink.offsetWidth : 200; // fallback to 200px

        // Ensure the tab menu is scrollable
        const { overflowX } = getComputedStyle(tabMenu);

        // Enable horizontal scrolling if not already enabled
        if (overflowX !== 'auto' && overflowX !== 'scroll') {
          tabMenu.style.overflowX = 'auto';
        }

        // Function to update button visibility based on scroll position
        const updateScrollState = () => {
          const { scrollLeft } = tabMenu;
          const { scrollWidth } = tabMenu;
          const { clientWidth } = tabMenu;
          // Use a small threshold (1px) to account for sub-pixel rounding
          const isAtLeft = scrollLeft <= 1;
          const isAtRight = scrollLeft + clientWidth >= scrollWidth - 1;

          // Update button visibility based on scroll position
          if (isAtLeft && isAtRight) {
            // No scrolling needed (content fits)
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
          } else if (isAtLeft) {
            // At left edge - hide prev button
            prevButton.style.display = 'none';
            nextButton.style.display = '';
          } else if (isAtRight) {
            // At right edge - hide next button
            prevButton.style.display = '';
            nextButton.style.display = 'none';
          } else {
            // In middle - show both buttons
            prevButton.style.display = '';
            nextButton.style.display = '';
          }
        };

        // Setup scroll event listener to update buttons
        if (!tabMenu.dataset.scrollListenerAttached) {
          tabMenu.addEventListener('scroll', updateScrollState);
          tabMenu.dataset.scrollListenerAttached = 'true';
        }

        // Initial update of scroll state
        updateScrollState();

        // Setup scroll handlers
        if (!prevButton.dataset.scrollHandlerAttached) {
          prevButton.addEventListener('click', () => {
            tabMenu.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            // Update scroll state after scroll animation
            setTimeout(() => {
              updateScrollState();
            }, 300);
          });
          prevButton.dataset.scrollHandlerAttached = 'true';
        }

        if (!nextButton.dataset.scrollHandlerAttached) {
          nextButton.addEventListener('click', () => {
            tabMenu.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            // Update scroll state after scroll animation
            setTimeout(() => {
              updateScrollState();
            }, 300);
          });
          nextButton.dataset.scrollHandlerAttached = 'true';
        }
      }
    }
  };

  // Initial check
  checkAndSetupScrolling();

  // Also check on window resize
  window.addEventListener('resize', checkAndSetupScrolling);
}
