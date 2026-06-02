import { initDateTimeFlatlist, initTabMenuScrolling } from './session-tabs';

const EMPTY_STATE_ID = 'pro-session-empty-state';
const EMPTY_STATE_MESSAGE = 'No upcoming sessions are scheduled right now. Check back soon.';

function showNoUpcomingSessionsMessage(): void {
  const tabsContainer = document.querySelector('.cc_pro_session-tabs') as HTMLElement | null;
  if (!tabsContainer || document.getElementById(EMPTY_STATE_ID)) {
    return;
  }

  const tabMenu = document.querySelector('.cc_pro_session-tab-menu') as HTMLElement | null;
  const tabButtons = document.querySelectorAll<HTMLElement>('.cc_pro_tabs_button');
  tabMenu?.style.setProperty('display', 'none');
  tabButtons.forEach((button) => {
    button.style.display = 'none';
  });

  const emptyState = document.createElement('p');
  emptyState.id = EMPTY_STATE_ID;
  emptyState.className = 'cc_pro-session_empty-state';
  emptyState.textContent = EMPTY_STATE_MESSAGE;
  emptyState.setAttribute('role', 'status');
  emptyState.style.margin = '1.5rem 0 0';
  emptyState.style.color = 'rgba(255, 255, 255, 0.7)';
  emptyState.style.fontSize = '1rem';
  emptyState.style.lineHeight = '1.5';

  tabsContainer.appendChild(emptyState);
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
