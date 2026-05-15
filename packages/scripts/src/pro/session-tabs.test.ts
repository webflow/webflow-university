/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { initDateTimeFlatlist, initTabMenuScrolling } from './session-tabs';

function setReadonlyNumber(element: HTMLElement, property: string, value: number): void {
  Object.defineProperty(element, property, {
    configurable: true,
    value,
  });
}

function setupTabsDom(): {
  nextButton: HTMLElement;
  prevButton: HTMLElement;
  tabMenu: HTMLElement;
  tabsContainer: HTMLElement;
} {
  document.body.innerHTML = `
    <div class="cc_pro_session-tabs">
      <div class="cc_pro_session-tab-menu">
        <a class="cc_pro_session-tab">One</a>
        <a class="cc_pro_session-tab">Two</a>
      </div>
    </div>
    <button class="cc_pro_tabs_button prev">Previous</button>
    <button class="cc_pro_tabs_button next">Next</button>
  `;

  const tabMenu = document.querySelector<HTMLElement>('.cc_pro_session-tab-menu')!;
  const tabLink = document.querySelector<HTMLElement>('.cc_pro_session-tab')!;
  const tabsContainer = document.querySelector<HTMLElement>('.cc_pro_session-tabs')!;
  const prevButton = document.querySelector<HTMLElement>('.cc_pro_tabs_button.prev')!;
  const nextButton = document.querySelector<HTMLElement>('.cc_pro_tabs_button.next')!;

  setReadonlyNumber(tabMenu, 'offsetWidth', 800);
  setReadonlyNumber(tabMenu, 'clientWidth', 500);
  setReadonlyNumber(tabMenu, 'scrollWidth', 1000);
  setReadonlyNumber(tabLink, 'offsetWidth', 250);
  Object.defineProperty(tabMenu, 'scrollBy', {
    configurable: true,
    value: vi.fn(),
  });

  return { nextButton, prevButton, tabMenu, tabsContainer };
}

describe('initTabMenuScrolling', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('moves scroll buttons into the tabs container and attaches handlers', () => {
    const { nextButton, prevButton, tabMenu, tabsContainer } = setupTabsDom();

    initTabMenuScrolling();

    expect(tabsContainer.contains(prevButton)).toBe(true);
    expect(tabsContainer.contains(nextButton)).toBe(true);
    expect(tabMenu.dataset.scrollListenerAttached).toBe('true');
    expect(prevButton.dataset.scrollHandlerAttached).toBe('true');
    expect(nextButton.dataset.scrollHandlerAttached).toBe('true');
    expect(tabMenu.style.overflowX).toBe('auto');
    expect(prevButton.style.display).toBe('none');
    expect(nextButton.style.display).toBe('');
  });

  it('scrolls by one tab width when navigation buttons are clicked', () => {
    vi.useFakeTimers();
    const { nextButton, prevButton, tabMenu } = setupTabsDom();
    const scrollBy = vi.mocked(tabMenu.scrollBy);

    initTabMenuScrolling();
    nextButton.click();
    prevButton.click();

    expect(scrollBy).toHaveBeenCalledWith({ behavior: 'smooth', left: 250 });
    expect(scrollBy).toHaveBeenCalledWith({ behavior: 'smooth', left: -250 });
    vi.runOnlyPendingTimers();
  });

  it('does nothing when required elements are missing', () => {
    expect(() => initTabMenuScrolling()).not.toThrow();
  });
});

describe('initDateTimeFlatlist', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('hydrates the flatlist session dates with local time ranges', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    document.body.innerHTML = `
      <div
        id="datetimes-flatlist"
        data-datetime-flatlist="2026-05-21T10:00:00-04:00, 2026-06-16T14:00:00-04:00, 2026-06-25T10:00:00-04:00"
        class="cc_pro-session_tab-pane with-top"
      >
        <ul role="list" class="cc_pro-session_tab-list">
          <li class="pro-session_list-item"><div>Placeholder</div></li>
        </ul>
      </div>
    `;

    initDateTimeFlatlist();

    const items = Array.from(document.querySelectorAll('.pro-session_list-item'));
    expect(items).toHaveLength(3);
    expect(items[0].children[0].textContent).toBe('Thu, May 21');
    expect(items[0].children[1].className).toBe('dotted-line');
    expect(items[0].children[2].textContent).toMatch(/10AM - 11AM EDT|7AM - 8AM PDT|2PM - 3PM UTC/);
  });

  it('uses the optional duration data attribute', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    document.body.innerHTML = `
      <div
        id="datetimes-flatlist"
        data-duration="90"
        data-datetime-flatlist="2026-05-21T10:00:00-04:00"
      >
        <ul role="list" class="cc_pro-session_tab-list"></ul>
      </div>
    `;

    initDateTimeFlatlist();

    const timeText = document.querySelector('.pro-session_list-item')?.children[2].textContent;
    expect(timeText).toMatch(/10AM - 11:30AM EDT|7AM - 8:30AM PDT|2PM - 3:30PM UTC/);
  });

  it('only targets the #datetimes-flatlist component', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    document.body.innerHTML = `
      <div data-datetime-flatlist="2026-05-21T10:00:00-04:00">
        <ul class="cc_pro-session_tab-list">
          <li class="pro-session_list-item"><div>Do not touch</div></li>
        </ul>
      </div>
    `;

    initDateTimeFlatlist();

    expect(document.querySelector('.pro-session_list-item')?.textContent).toBe('Do not touch');
  });
});
