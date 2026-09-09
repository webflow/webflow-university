const MODAL_SELECTOR = '[data-sm-modal="true"]';
const SEARCH_RESULTS_SELECTOR = '.st-search-results';
const SEARCH_KEYBOARD_CLASS = 'st-search-keyboard-navigable';
const OVERLAY_INPUT_SELECTOR = '#st-overlay-search-input';

type SearchWindow = Window & { __wfuSearchModal?: boolean };

type SwiftypeKeyboardOutput = {
  _className?: string;
  validate: () => boolean;
  attach: () => void;
  getElement?: () => { [0]?: Element };
};

type SwiftypeResultsDisplay = {
  _addQueryOutput: (output: SwiftypeKeyboardOutput) => void;
  _queryOutputs: SwiftypeKeyboardOutput[];
};

type SwiftypeInstall = {
  getSearchContext: () => { _resultsDisplay: SwiftypeResultsDisplay };
};

type SwiftypeWindow = Window & {
  _st?: ((command: string, ...args: unknown[]) => void) & {
    _stLoaded?: boolean;
    _widgetManager?: {
      onInstallReady: (callback: () => void) => void;
      _defaultInstall?: SwiftypeInstall;
    };
  };
  _InternalSwiftype?: {
    QueryOutputs?: {
      KeyboardNavigableList: new (
        resultsDisplay: SwiftypeResultsDisplay,
        element: Element
      ) => SwiftypeKeyboardOutput;
    };
  };
};

function wireNativeResultScroll(results: HTMLElement): boolean {
  const input = document.querySelector<HTMLInputElement>(OVERLAY_INPUT_SELECTOR);
  if (!input) return false;
  if (input.dataset.wfuSearchScroll === 'true') return true;

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    // Swiftype updates `st-keyboard-active-item` in its own keydown handler.
    // Wait until that handler finishes, then keep the selected result in view.
    window.requestAnimationFrame(() => {
      results
        .querySelector<HTMLElement>('.st-keyboard-active-item')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  });
  input.dataset.wfuSearchScroll = 'true';
  return true;
}

/**
 * Swiftype only binds overlay arrow-key navigation to `.st-search-keyboard-navigable`.
 * The default overlay template omits that class, so autocomplete gets ↑/↓ and the results
 * overlay does not. Mark the native results host and attach Swiftype's own KeyboardNavigableList.
 */
function enableNativeOverlayKeyboardNavigation(): void {
  const swiftypeWindow = window as SwiftypeWindow;
  let attempts = 0;

  const wire = (): boolean => {
    const results = document.querySelector<HTMLElement>(SEARCH_RESULTS_SELECTOR);
    const KeyboardNavigableList =
      swiftypeWindow._InternalSwiftype?.QueryOutputs?.KeyboardNavigableList;
    const install = swiftypeWindow._st?._widgetManager?._defaultInstall;
    if (!results || !KeyboardNavigableList || !install) return false;
    if (results.dataset.wfuSearchKeyboard === 'true') return wireNativeResultScroll(results);

    const resultsDisplay = install.getSearchContext()._resultsDisplay;
    const alreadyAttached = resultsDisplay._queryOutputs.some(
      (output) =>
        output._className?.includes('KeyboardNavigableList') && output.getElement?.()[0] === results
    );
    if (alreadyAttached) {
      results.classList.add(SEARCH_KEYBOARD_CLASS);
      results.dataset.wfuSearchKeyboard = 'true';
      return wireNativeResultScroll(results);
    }

    results.classList.add(SEARCH_KEYBOARD_CLASS);
    results.setAttribute('data-st-target-element', OVERLAY_INPUT_SELECTOR);

    const output = new KeyboardNavigableList(resultsDisplay, results);
    if (!output.validate()) {
      results.classList.remove(SEARCH_KEYBOARD_CLASS);
      results.removeAttribute('data-st-target-element');
      return false;
    }

    resultsDisplay._addQueryOutput(output);
    output.attach();
    results.dataset.wfuSearchKeyboard = 'true';
    return wireNativeResultScroll(results);
  };

  const tryWire = (): void => {
    if (wire()) return;
    attempts += 1;
    if (attempts < 40) window.setTimeout(tryWire, 100);
  };

  const onReady = (): void => {
    tryWire();
  };

  try {
    if (swiftypeWindow._st?._stLoaded) {
      swiftypeWindow._st('onInstallReady', onReady);
      return;
    }
  } catch {
    // Install may not be registered yet; fall through to polling.
  }

  const poll = window.setInterval(() => {
    if (!swiftypeWindow._st?._stLoaded) return;
    window.clearInterval(poll);
    try {
      swiftypeWindow._st?.('onInstallReady', onReady);
    } catch {
      onReady();
    }
  }, 50);
  window.setTimeout(() => window.clearInterval(poll), 15000);
}

/**
 * Keeps the Webflow search launcher and its empty-state Popular links while leaving every
 * non-empty query, autocomplete result, and submitted search to Swiftype.
 */
export function initSearchModal(): void {
  const modal = document.querySelector<HTMLElement>(MODAL_SELECTOR);
  const searchWindow = window as SearchWindow;
  if (!modal || searchWindow.__wfuSearchModal) return;
  searchWindow.__wfuSearchModal = true;

  let popularIndex = -1;
  let savedScrollY = 0;
  let isLocked = false;
  let heightFrame = 0;
  let viewportFrame = 0;
  let nativeHandoffObserver: MutationObserver | null = null;

  function getInput(): HTMLInputElement | null {
    return modal?.querySelector<HTMLInputElement>('#g-search') || null;
  }

  function getPopularRows(): HTMLAnchorElement[] {
    return Array.from(modal?.querySelectorAll<HTMLAnchorElement>('.sm-popular__row') || []);
  }

  function ensurePopular(): void {
    const panel = modal?.querySelector<HTMLElement>('.sm-ovl__panel');
    if (!panel || panel.querySelector('.sm-popular')) return;

    const field = panel.querySelector<HTMLElement>('.sm-ovl__field');
    if (!field) return;

    const popular = document.createElement('div');
    popular.id = 'wfu-popular-results';
    popular.className = 'sm-popular';
    popular.setAttribute('role', 'listbox');
    popular.setAttribute('aria-label', 'Popular');
    popular.innerHTML =
      '<div class="sm-popular__group">Popular</div>' +
      '<a id="wfu-popular-result-0" class="sm-popular__row" role="option" aria-selected="false" href="/courses/getting-started-with-webflow">' +
      '<span class="sm-popular__icon sm-popular__icon--course" aria-hidden="true"></span>' +
      '<span class="sm-popular__text">Getting started with Webflow</span>' +
      '<span class="sm-popular__arrow" aria-hidden="true"></span>' +
      '</a>' +
      '<a id="wfu-popular-result-1" class="sm-popular__row" role="option" aria-selected="false" href="/courses/cms-and-dynamic-content">' +
      '<span class="sm-popular__icon sm-popular__icon--course" aria-hidden="true"></span>' +
      '<span class="sm-popular__text">Design &amp; manage CMS content in Webflow</span>' +
      '<span class="sm-popular__arrow" aria-hidden="true"></span>' +
      '</a>' +
      '<a id="wfu-popular-result-2" class="sm-popular__row" role="option" aria-selected="false" href="/learning-paths/webflow-design-basics">' +
      '<span class="sm-popular__icon sm-popular__icon--learning-path" aria-hidden="true"></span>' +
      '<span class="sm-popular__text">Webflow design basics</span>' +
      '<span class="sm-popular__arrow" aria-hidden="true"></span>' +
      '</a>';
    field.insertAdjacentElement('afterend', popular);
  }

  function contentTypeFromHref(href: string | null): string {
    let path = '';
    try {
      path = new URL(href || '', window.location.href).pathname;
    } catch {
      path = href || '';
    }

    if (/\/learning-paths?\//i.test(path)) return 'Learning path';
    if (/\/courses?\//i.test(path)) return 'Course';
    return 'Resource';
  }

  function decoratePopular(): void {
    getPopularRows().forEach((row) => {
      const host = row.querySelector<HTMLElement>('.sm-popular__text');
      if (!host || host.querySelector('.sm-result-type')) return;

      const title = document.createElement('span');
      title.className = 'sm-popular__title';
      while (host.firstChild) title.appendChild(host.firstChild);

      const badge = document.createElement('span');
      badge.className = 'sm-result-type';
      badge.textContent = contentTypeFromHref(row.getAttribute('href'));

      host.appendChild(badge);
      host.appendChild(title);
      row.dataset.wfuContentType = 'true';
      row.dataset.contentType = badge.textContent;
    });
  }

  function setPopularActive(index: number): void {
    const input = getInput();
    const rows = getPopularRows();
    if (!input || !rows.length) return;

    popularIndex = index;
    rows.forEach((row, rowIndex) => {
      const isActive = rowIndex === popularIndex;
      row.classList.toggle('is-keyboard-active', isActive);
      row.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const activeRow = rows[popularIndex];
    if (activeRow) input.setAttribute('aria-activedescendant', activeRow.id);
  }

  function clearPopularActive(): void {
    const input = getInput();
    popularIndex = -1;

    getPopularRows().forEach((row) => {
      row.classList.remove('is-keyboard-active');
      row.setAttribute('aria-selected', 'false');
    });

    if (
      input &&
      (input.getAttribute('aria-activedescendant') || '').startsWith('wfu-popular-result-')
    ) {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function releaseRootOverflow(): void {
    if (document.documentElement.style.overflow !== '') {
      document.documentElement.style.overflow = '';
    }
  }

  function lockPageScroll(): void {
    if (isLocked) return;
    isLocked = true;
    savedScrollY = window.scrollY || window.pageYOffset || 0;

    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = -savedScrollY + 'px';
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    releaseRootOverflow();
  }

  function unlockPageScroll(): void {
    if (!isLocked) return;
    isLocked = false;

    const body = document.body;
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    releaseRootOverflow();
    window.scrollTo(0, savedScrollY);
  }

  function syncListHeight(): void {
    heightFrame = 0;
    const popular = modal?.querySelector<HTMLElement>('.sm-popular');
    if (
      !popular ||
      popular.hidden ||
      !window.visualViewport ||
      !modal?.classList.contains('active') ||
      !popular.getClientRects().length
    ) {
      modal?.style.removeProperty('--sm-list-max');
      return;
    }

    const available = window.visualViewport.height - popular.getBoundingClientRect().top - 9;
    modal.style.setProperty('--sm-list-max', Math.max(160, Math.round(available)) + 'px');
  }

  function scheduleListHeight(): void {
    if (heightFrame) return;
    heightFrame = window.requestAnimationFrame(syncListHeight);
  }

  function syncOverlayViewport(): void {
    viewportFrame = 0;
    const root = modal?.querySelector<HTMLElement>('.sm-ovl-root');
    if (!root) return;

    if (!window.visualViewport || !modal?.classList.contains('active')) {
      root.style.removeProperty('top');
      return;
    }

    const top = Math.round(window.visualViewport.offsetTop) + 'px';
    if (root.style.top !== top) root.style.top = top;
  }

  function scheduleOverlayViewport(): void {
    if (viewportFrame) return;
    viewportFrame = window.requestAnimationFrame(syncOverlayViewport);
  }

  function wakePopularScroller(): void {
    const popular = modal?.querySelector<HTMLElement>('.sm-popular');
    if (!popular || popular.hidden) return;

    const signature = popular.scrollHeight + 'x' + popular.clientHeight;
    if (popular.dataset.smWoken === signature) return;
    popular.dataset.smWoken = signature;
    popular.style.setProperty('overflow-y', 'hidden', 'important');
    void popular.offsetHeight;
    popular.style.removeProperty('overflow-y');
  }

  function syncModalState(): void {
    const input = getInput();
    const isActive = modal?.classList.contains('active');
    const isEmpty = !input?.value.trim();

    if (isActive) {
      lockPageScroll();
      syncOverlayViewport();

      if (isEmpty) {
        scheduleListHeight();
        wakePopularScroller();
      } else {
        modal?.style.removeProperty('--sm-list-max');
      }

      return;
    }

    clearNativeHandoff();
    unlockPageScroll();
    syncOverlayViewport();
    modal?.style.removeProperty('--sm-list-max');
  }

  function syncEmptyState(): void {
    const input = getInput();
    const popular = modal?.querySelector<HTMLElement>('.sm-popular');
    if (!input || !popular) return;

    const isEmpty = input.value.trim().length === 0;
    modal?.classList.toggle('is-empty', isEmpty);
    popular.hidden = !isEmpty;

    if (isEmpty) {
      input.setAttribute('aria-controls', popular.id);
    } else {
      clearPopularActive();
      if (input.getAttribute('aria-controls') === popular.id)
        input.removeAttribute('aria-controls');
    }

    syncModalState();
  }

  function handleArrowKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    const input = getInput();
    if (!input || event.target !== input || input.value.trim().length > 0) return;

    const rows = getPopularRows();
    if (!rows.length) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (event.key === 'ArrowDown') {
      setPopularActive(popularIndex < rows.length - 1 ? popularIndex + 1 : 0);
    } else {
      setPopularActive(popularIndex > 0 ? popularIndex - 1 : rows.length - 1);
    }
  }

  function nativeResultsAreVisible(): boolean {
    const container = document.querySelector('.st-ui-injected-overlay-container');
    if (!container) return false;

    return Boolean(
      document.body.classList.contains('st-ui-overlay-active') ||
        container.closest('div.st-ui-overlay:not(.dismiss)')
    );
  }

  function clearNativeHandoff(): void {
    nativeHandoffObserver?.disconnect();
    nativeHandoffObserver = null;
  }

  function deactivateLauncher(): void {
    clearNativeHandoff();
    modal?.classList.remove('active');
    unlockPageScroll();
  }

  function waitForNativeResults(): void {
    clearNativeHandoff();

    if (nativeResultsAreVisible()) {
      deactivateLauncher();
      return;
    }

    nativeHandoffObserver = new MutationObserver(() => {
      if (nativeResultsAreVisible()) deactivateLauncher();
    });
    nativeHandoffObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
  }

  function handleEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.type !== 'keydown' || event.repeat) return;

    const input = getInput();
    if (!input || event.target !== input) return;

    if (input.value.trim().length > 0) {
      // Do not interfere with Swiftype's handler. Keep the launcher covering the page until
      // Swiftype's results overlay is present, then hand off without exposing the page between.
      waitForNativeResults();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const target = popularIndex >= 0 ? getPopularRows()[popularIndex] || null : null;
    if (target?.href) window.location.assign(target.href);
  }

  function closeSearch(): void {
    const backdrop = modal?.querySelector<HTMLElement>('.g_search-close-bg');
    if (backdrop) {
      backdrop.click();
      return;
    }

    deactivateLauncher();
    const input = getInput();
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
  }

  function handleNativeClose(event: MouseEvent): void {
    if (!(event.target instanceof Element) || !event.target.closest('.st-ui-close-button')) {
      return;
    }

    deactivateLauncher();
    const input = getInput();
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
  }

  function wireInput(): void {
    const input = getInput();
    if (!input || input.dataset.smWired === 'true') return;
    input.dataset.smWired = 'true';
    input.addEventListener('input', syncEmptyState);
    input.addEventListener('search', syncEmptyState);
    input.addEventListener('focus', () => {
      window.setTimeout(scheduleListHeight, 350);
      window.setTimeout(scheduleListHeight, 700);
    });
    input.addEventListener('blur', () => window.setTimeout(scheduleListHeight, 350));
  }

  function wireCloseButton(): void {
    const button = modal?.querySelector<HTMLButtonElement>('.sm-kbd');
    if (!button || button.dataset.smWired === 'true') return;
    button.dataset.smWired = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      closeSearch();
    });
  }

  ensurePopular();
  decoratePopular();
  wireInput();
  wireCloseButton();
  syncEmptyState();
  enableNativeOverlayKeyboardNavigation();

  const stateObserver = new MutationObserver(syncModalState);
  stateObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('keydown', handleArrowKey, true);
  document.addEventListener('keydown', handleEnter, true);
  document.addEventListener('click', handleNativeClose, true);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleListHeight);
    window.visualViewport.addEventListener('resize', scheduleOverlayViewport);
    window.visualViewport.addEventListener('scroll', scheduleOverlayViewport);
  }

  window.addEventListener('pagehide', unlockPageScroll);
}
