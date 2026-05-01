/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { initTabMenuScrolling } from './session-tabs';

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
