/**
 * @vitest-environment happy-dom
 */
import { expect, it, vi } from 'vitest';

import { initSearchModal } from './search-modal.js';

type MockKeyboardOutput = {
  _className: string;
  validate: () => boolean;
  attach: ReturnType<typeof vi.fn>;
  getElement: () => { 0: HTMLElement };
};

function mockSwiftypeKeyboard(): {
  addQueryOutput: ReturnType<typeof vi.fn>;
  attach: ReturnType<typeof vi.fn>;
} {
  const attach = vi.fn();
  const addQueryOutput = vi.fn();
  const resultsDisplay = {
    _addQueryOutput: addQueryOutput,
    _queryOutputs: [] as MockKeyboardOutput[],
  };

  const KeyboardNavigableList = vi.fn(function (
    this: MockKeyboardOutput,
    _display: unknown,
    element: HTMLElement
  ) {
    this._className = 'Swiftype.QueryOutputs.KeyboardNavigableList';
    this.validate = () => true;
    this.attach = attach;
    this.getElement = () => ({ 0: element });
  });

  const install = {
    getSearchContext: () => ({ _resultsDisplay: resultsDisplay }),
  };

  const onInstallReady = vi.fn((callback: () => void) => callback());
  const st = Object.assign(
    vi.fn((command: string, ...args: unknown[]) => {
      if (command === 'onInstallReady') {
        const cb = args[0] as () => void;
        onInstallReady(cb);
      }
    }),
    {
      _stLoaded: true,
      _widgetManager: {
        onInstallReady,
        _defaultInstall: install,
      },
    }
  );

  Object.assign(window, {
    _st: st,
    _InternalSwiftype: {
      QueryOutputs: { KeyboardNavigableList },
    },
  });

  return { addQueryOutput, attach };
}

it('keeps Popular custom while leaving non-empty queries entirely to Swiftype', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = `
    <div class="st-default-autocomplete st-install-8tPjZM7QFLqxMEpVo-ws">
      <div class="st-ui-autocomplete">
        <div class="st-query-present"></div>
      </div>
    </div>
    <section class="st-ui-content st-search-results"></section>
    <input id="st-overlay-search-input" />
    <div data-sm-modal="true" class="active">
      <div class="sm-ovl-root">
        <button class="g_search-close-bg" type="button"></button>
        <div class="sm-ovl__panel">
          <div class="sm-ovl__field">
            <input id="g-search" />
            <button class="sm-kbd" type="button">Esc</button>
          </div>
        </div>
      </div>
    </div>
    <button id="outside-search" type="button">Outside search</button>
  `;
  document.documentElement.style.setProperty('scrollbar-gutter', 'stable both-edges', 'important');
  document.documentElement.style.overflow = 'clip';
  document.body.style.paddingRight = '8px';
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockImplementation(() =>
    document.body.style.position === 'fixed' ? 1024 : 1009
  );
  let fieldBottom = 126.4;
  vi.spyOn(
    document.querySelector<HTMLElement>('.sm-ovl__field')!,
    'getBoundingClientRect'
  ).mockImplementation(() => ({ bottom: fieldBottom }) as DOMRect);

  const results = document.querySelector<HTMLElement>('.st-search-results')!;
  const { addQueryOutput, attach } = mockSwiftypeKeyboard();
  const requestAnimationFrame = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      callback(0);
      return 1;
    });

  delete (window as Window & { __wfuSearchModal?: boolean }).__wfuSearchModal;
  initSearchModal();

  expect(results.classList.contains('st-search-keyboard-navigable')).toBe(true);
  expect(results.getAttribute('data-st-target-element')).toBe('#st-overlay-search-input');
  expect(results.dataset.wfuSearchKeyboard).toBe('true');
  expect(addQueryOutput).toHaveBeenCalledTimes(1);
  expect(attach).toHaveBeenCalledTimes(1);

  const activeNativeResult = document.createElement('a');
  activeNativeResult.className = 'st-ui-result st-keyboard-active-item';
  activeNativeResult.scrollIntoView = vi.fn();
  results.appendChild(activeNativeResult);
  requestAnimationFrame.mockClear();
  document
    .querySelector<HTMLInputElement>('#st-overlay-search-input')!
    .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  expect(activeNativeResult.scrollIntoView).toHaveBeenCalledWith({
    block: 'nearest',
    inline: 'nearest',
  });

  const input = document.querySelector<HTMLInputElement>('#g-search');
  const searchControl = document.querySelector<HTMLButtonElement>('.sm-kbd');
  const autocomplete = document.querySelector<HTMLElement>('.st-default-autocomplete');
  const popular = document.querySelector<HTMLElement>('.sm-popular');
  const popularFooter = document.querySelector<HTMLElement>(
    '[data-sm-modal] .sm-ovl__panel > .sm-search-footer'
  );
  const suggestionsFooter = document.querySelector<HTMLElement>(
    '.st-ui-autocomplete > .sm-search-footer'
  );
  expect(input).not.toBeNull();
  expect(searchControl?.textContent).toBe('Esc');
  expect(popular?.hidden).toBe(false);
  expect(autocomplete?.parentElement).toBe(document.body);
  expect(popularFooter?.textContent).toContain('to navigate');
  expect(popularFooter?.textContent).toContain('to select');
  expect(popularFooter?.textContent).toContain('to close');
  expect(suggestionsFooter?.innerHTML).toBe(popularFooter?.innerHTML);
  expect(document.documentElement.style.getPropertyValue('scrollbar-gutter')).toBe(
    'stable both-edges'
  );
  expect(document.documentElement.style.getPropertyPriority('scrollbar-gutter')).toBe('important');
  expect(document.documentElement.style.overflow).toBe('clip');
  expect(document.body.style.paddingRight).toBe('23px');

  const swiftypeKeydown = vi.fn();
  const swiftypeSearch = vi.fn();
  input!.addEventListener('keydown', (event) => {
    swiftypeKeydown(event);
    if (event.which === 13) swiftypeSearch();
  });
  input!.value = 'grid';
  input!.dispatchEvent(new Event('input', { bubbles: true }));

  expect(popular?.hidden).toBe(true);
  expect(searchControl?.textContent).toBe('↵');
  expect(searchControl?.getAttribute('aria-label')).toBe('Submit search');
  expect(autocomplete?.parentElement).toBe(document.body);
  expect(document.body.style.position).toBe('fixed');
  const autocompletePanel = autocomplete?.querySelector<HTMLElement>('.st-ui-autocomplete');
  expect(autocompletePanel?.style.getPropertyValue('top')).toBe('126px');
  expect(autocompletePanel?.style.getPropertyPriority('top')).toBe('important');
  fieldBottom = 110.2;
  window.dispatchEvent(new Event('resize'));
  expect(autocompletePanel?.style.getPropertyValue('top')).toBe('110px');

  searchControl?.click();
  expect(swiftypeKeydown).toHaveBeenCalledTimes(1);
  const clickedEnter = swiftypeKeydown.mock.calls[0]?.[0] as KeyboardEvent;
  expect(clickedEnter.key).toBe('Enter');
  expect(clickedEnter.which).toBe(13);
  expect(swiftypeSearch).toHaveBeenCalledTimes(1);
  swiftypeKeydown.mockClear();

  input!.focus();
  const typedTab = new KeyboardEvent('keydown', {
    key: 'Tab',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(typedTab);

  expect(typedTab.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(input);

  const typedShiftTab = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey: true,
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(typedShiftTab);

  expect(typedShiftTab.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(input);

  const typedArrow = new KeyboardEvent('keydown', {
    key: 'ArrowDown',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(typedArrow);

  const typedEnter = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(typedEnter);

  expect(swiftypeKeydown).toHaveBeenCalledTimes(2);
  expect(typedArrow.defaultPrevented).toBe(false);
  expect(typedEnter.defaultPrevented).toBe(false);
  vi.runOnlyPendingTimers();
  expect(document.querySelector('[data-sm-modal="true"]')?.classList.contains('active')).toBe(true);
  expect(document.body.style.position).toBe('fixed');

  requestAnimationFrame.mockImplementation(() => 2);

  const nativeOverlay = document.createElement('div');
  nativeOverlay.className = 'st-ui-overlay';
  nativeOverlay.innerHTML =
    '<div class="st-ui-injected-overlay-container">' +
    '<a id="native-result" href="#native-result">Result</a>' +
    '<button class="st-ui-close-button"></button>' +
    '</div>';
  const nativeContainer = nativeOverlay.querySelector<HTMLElement>(
    '.st-ui-injected-overlay-container'
  )!;
  nativeContainer.style.opacity = '0';
  vi.spyOn(nativeContainer, 'getBoundingClientRect').mockReturnValue({
    width: 600,
    height: 560,
  } as DOMRect);
  document.body.appendChild(nativeOverlay);
  await Promise.resolve();

  expect(nativeOverlay.querySelector('.sm-search-footer')).toBeNull();
  expect(document.querySelector('[data-sm-modal="true"]')?.classList.contains('active')).toBe(true);
  const handoffFrame = requestAnimationFrame.mock.lastCall?.[0];
  expect(handoffFrame).not.toBeNull();

  nativeContainer.style.opacity = '1';
  if (!handoffFrame) throw new Error('Expected a pending native handoff frame');
  handoffFrame(0);
  await Promise.resolve();

  expect(document.querySelector('[data-sm-modal="true"]')?.classList.contains('active')).toBe(
    false
  );
  expect(document.body.style.position).toBe('');
  expect(document.body.style.paddingRight).toBe('8px');
  expect(document.documentElement.style.getPropertyValue('scrollbar-gutter')).toBe(
    'stable both-edges'
  );

  const nativeResult = nativeOverlay.querySelector<HTMLAnchorElement>('#native-result')!;
  const nativeClose = nativeOverlay.querySelector<HTMLButtonElement>('.st-ui-close-button')!;
  const outsideSearch = document.querySelector<HTMLButtonElement>('#outside-search')!;

  outsideSearch.focus();
  const outsideTab = new KeyboardEvent('keydown', {
    key: 'Tab',
    bubbles: true,
    cancelable: true,
  });
  outsideSearch.dispatchEvent(outsideTab);
  expect(outsideTab.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(nativeResult);

  nativeClose.focus();
  const lastTab = new KeyboardEvent('keydown', {
    key: 'Tab',
    bubbles: true,
    cancelable: true,
  });
  nativeClose.dispatchEvent(lastTab);
  expect(lastTab.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(nativeResult);

  nativeResult.focus();
  const firstShiftTab = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey: true,
    bubbles: true,
    cancelable: true,
  });
  nativeResult.dispatchEvent(firstShiftTab);
  expect(firstShiftTab.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(nativeClose);

  nativeOverlay.classList.add('dismiss');
  await Promise.resolve();
  expect(document.documentElement.style.getPropertyValue('scrollbar-gutter')).toBe(
    'stable both-edges'
  );
  expect(document.documentElement.style.getPropertyPriority('scrollbar-gutter')).toBe('important');
  expect(document.documentElement.style.overflow).toBe('clip');

  document.querySelector('[data-sm-modal="true"]')?.classList.add('active');
  nativeOverlay.classList.remove('dismiss');
  await Promise.resolve();
  nativeOverlay.querySelector<HTMLButtonElement>('.st-ui-close-button')?.click();
  expect(document.querySelector('[data-sm-modal="true"]')?.classList.contains('active')).toBe(
    false
  );
  nativeOverlay.classList.add('dismiss');
  await Promise.resolve();
  expect(document.documentElement.style.getPropertyValue('scrollbar-gutter')).toBe(
    'stable both-edges'
  );

  swiftypeKeydown.mockClear();
  document.querySelector('[data-sm-modal="true"]')?.classList.add('active');
  input!.value = '';
  input!.dispatchEvent(new Event('input', { bubbles: true }));
  expect(popular?.hidden).toBe(false);
  expect(searchControl?.textContent).toBe('Esc');
  expect(searchControl?.getAttribute('aria-label')).toBe('Close search');

  const emptyArrow = new KeyboardEvent('keydown', {
    key: 'ArrowDown',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(emptyArrow);

  const popularRow = document.querySelector<HTMLAnchorElement>('.sm-popular__row');
  expect(popularRow?.getAttribute('aria-selected')).toBe('true');
  popularRow!.href = '#popular';

  const emptyEnter = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(emptyEnter);

  expect(swiftypeKeydown).not.toHaveBeenCalled();
  expect(emptyArrow.defaultPrevented).toBe(true);
  expect(emptyEnter.defaultPrevented).toBe(true);
  window.dispatchEvent(new Event('pagehide'));
  expect(document.body.style.paddingRight).toBe('8px');
  document.body.style.paddingRight = '';
  document.documentElement.style.removeProperty('scrollbar-gutter');
  document.documentElement.style.overflow = '';
  vi.restoreAllMocks();
  vi.useRealTimers();
});
