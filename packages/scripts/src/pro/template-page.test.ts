/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadTemplatePage(): Promise<void> {
  vi.resetModules();
  await import('./template-page');
}

describe('template-page empty state', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows a message in #time-slot when the flatlist has no upcoming sessions', async () => {
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'));
    document.body.innerHTML = `
      <aside id="time-slot" class="cc_pro-session_sticky">
        <h2 class="h3">Upcoming sessions</h2>
        <div
          id="datetimes-flatlist"
          data-datetime-flatlist="2026-06-01T14:00:00-04:00"
          data-duration="60"
          class="cc_pro-session_tab-pane with-top"
        >
          <ul role="list" class="cc_pro-session_tab-list"></ul>
          <div class="u-pb-1"></div>
          <a href="https://webflow.zoom.us/meeting/register/example" class="button cc-cta stretch w-inline-block">
            <div class="u-d-inline-block">Register now -></div>
          </a>
        </div>
      </aside>
    `;

    await loadTemplatePage();

    const emptyState = document.querySelector('#pro-session-empty-state');
    expect(document.querySelector('#time-slot')?.contains(emptyState)).toBe(true);
    expect(emptyState?.textContent).toBe(
      'No upcoming sessions scheduled, please check back later.'
    );
    expect(document.querySelector<HTMLElement>('#datetimes-flatlist')?.style.display).toBe('none');
  });

  it('does not show the empty-state message when a future flatlist date renders', async () => {
    vi.setSystemTime(new Date('2026-05-30T12:00:00Z'));
    document.body.innerHTML = `
      <aside id="time-slot" class="cc_pro-session_sticky">
        <h2 class="h3">Upcoming sessions</h2>
        <div
          id="datetimes-flatlist"
          data-datetime-flatlist="2026-06-01T14:00:00-04:00"
          data-duration="60"
          class="cc_pro-session_tab-pane with-top"
        >
          <ul role="list" class="cc_pro-session_tab-list"></ul>
        </div>
      </aside>
    `;

    await loadTemplatePage();

    expect(document.querySelector('#pro-session-empty-state')).toBeNull();
    expect(document.querySelectorAll('.pro-session_list-item')).toHaveLength(1);
  });
});
