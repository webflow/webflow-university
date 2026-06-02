import { initDateTimeFlatlist, initTabMenuScrolling } from './session-tabs';

const EMPTY_STATE_ID = 'pro-session-empty-state';
const EMPTY_STATE_MESSAGE = 'No upcoming sessions scheduled, please check back later.';

function showNoUpcomingSessionsMessage(): void {
  const timeSlot = document.querySelector('#time-slot') as HTMLElement | null;
  if (!timeSlot || document.getElementById(EMPTY_STATE_ID)) {
    return;
  }

  const emptyState = document.createElement('p');
  emptyState.id = EMPTY_STATE_ID;
  emptyState.className = 'cc_pro-session_empty-state';
  emptyState.textContent = EMPTY_STATE_MESSAGE;
  emptyState.setAttribute('role', 'status');
  emptyState.style.margin = '1.5rem 0 0';
  emptyState.style.color = 'rgba(255, 255, 255, 0.7)';
  emptyState.style.fontSize = '1rem';
  emptyState.style.lineHeight = '1.5';

  timeSlot.appendChild(emptyState);
}

/**
 * Initialize the template page flatlist dates.
 *
 * Expected data attributes:
 * - #datetimes-flatlist[data-datetime-flatlist]: comma-separated ISO 8601 datetimes
 * - #datetimes-flatlist[data-duration]: optional duration in minutes, defaults to 60
 *
 * Times are always displayed in the user's local timezone.
 */
function initTemplatePage(): boolean {
  const hasUpcomingSessions = initDateTimeFlatlist();
  if (!hasUpcomingSessions) {
    showNoUpcomingSessionsMessage();
  }

  return hasUpcomingSessions;
}

function initTemplatePageWithTabs(): void {
  const hasUpcomingSessions = initTemplatePage();

  if (hasUpcomingSessions) {
    initTabMenuScrolling();
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTemplatePageWithTabs);
} else {
  initTemplatePageWithTabs();
}
