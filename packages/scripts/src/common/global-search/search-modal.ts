const MODAL_SELECTOR = '[data-sm-modal="true"]';
const SEARCH_RESULTS_SELECTOR = '.st-search-results';
const SEARCH_KEYBOARD_CLASS = 'st-search-keyboard-navigable';
const OVERLAY_INPUT_SELECTOR = '#st-overlay-search-input';
const AUTOCOMPLETE_SELECTOR = '.st-default-autocomplete .st-ui-autocomplete';
const KEYBOARD_FOOTER_CLASS = 'sm-search-footer';
const RETURN_KEY_SYMBOL = '↵';
const KEYBOARD_FOOTER_HTML =
  '<span class="sm-search-footer__hint"><kbd class="sm-search-footer__key">↑↓</kbd><span>to navigate</span></span>' +
  `<span class="sm-search-footer__hint"><kbd class="sm-search-footer__key">${RETURN_KEY_SYMBOL}</kbd><span>to select</span></span>` +
  '<span class="sm-search-footer__hint"><kbd class="sm-search-footer__key">Esc</kbd><span>to close</span></span>';

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
  let hasSavedScrollbarGutter = false;
  let savedScrollbarGutter = '';
  let savedScrollbarGutterPriority = '';
  let hasSavedBodyPaddingRight = false;
  let savedBodyPaddingRight = '';
  let savedBodyPaddingRightPriority = '';
  let savedBodyBoxSizing = '';
  let savedBodyBoxSizingPriority = '';
  let heightFrame = 0;
  let viewportFrame = 0;
  let nativeHandoffFrame = 0;
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

  function appendKeyboardFooter(parent: HTMLElement): void {
    if (
      Array.from(parent.children).some((child) => child.classList.contains(KEYBOARD_FOOTER_CLASS))
    ) {
      return;
    }

    const footer = document.createElement('div');
    footer.className = KEYBOARD_FOOTER_CLASS;
    footer.setAttribute('aria-label', 'Keyboard shortcuts');
    footer.innerHTML = KEYBOARD_FOOTER_HTML;
    parent.appendChild(footer);
  }

  function ensureKeyboardFooters(): void {
    const panel = modal?.querySelector<HTMLElement>('.sm-ovl__panel');
    if (panel?.querySelector('.sm-popular')) appendKeyboardFooter(panel);

    const autocomplete = document.querySelector<HTMLElement>(AUTOCOMPLETE_SELECTOR);
    if (autocomplete?.querySelector('.st-query-present')) appendKeyboardFooter(autocomplete);
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

  function reserveScrollbarGutter(): void {
    if (hasSavedScrollbarGutter) return;

    const rootStyle = document.documentElement.style;
    const currentScrollbarGutter = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('scrollbar-gutter');
    if (currentScrollbarGutter.includes('stable')) return;

    hasSavedScrollbarGutter = true;
    savedScrollbarGutter = rootStyle.getPropertyValue('scrollbar-gutter');
    savedScrollbarGutterPriority = rootStyle.getPropertyPriority('scrollbar-gutter');
    rootStyle.setProperty('scrollbar-gutter', 'stable');
  }

  function restoreScrollbarGutter(): void {
    if (!hasSavedScrollbarGutter) return;

    const rootStyle = document.documentElement.style;
    if (savedScrollbarGutter) {
      rootStyle.setProperty('scrollbar-gutter', savedScrollbarGutter, savedScrollbarGutterPriority);
    } else {
      rootStyle.removeProperty('scrollbar-gutter');
    }

    hasSavedScrollbarGutter = false;
    savedScrollbarGutter = '';
    savedScrollbarGutterPriority = '';
  }

  function lockPageScroll(): void {
    if (isLocked) return;
    isLocked = true;
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    reserveScrollbarGutter();

    const body = document.body;
    const unlockedClientWidth = document.documentElement.clientWidth;
    const unlockedPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    hasSavedBodyPaddingRight = true;
    savedBodyPaddingRight = body.style.getPropertyValue('padding-right');
    savedBodyPaddingRightPriority = body.style.getPropertyPriority('padding-right');
    savedBodyBoxSizing = body.style.getPropertyValue('box-sizing');
    savedBodyBoxSizingPriority = body.style.getPropertyPriority('box-sizing');
    body.style.position = 'fixed';
    body.style.top = -savedScrollY + 'px';
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    // Some browsers release the viewport gutter once the body becomes fixed, even when
    // `scrollbar-gutter: stable` is present. Compensate only for the measured width change.
    const releasedGutter = document.documentElement.clientWidth - unlockedClientWidth;
    if (releasedGutter > 0) {
      body.style.setProperty('box-sizing', 'border-box', 'important');
      body.style.setProperty(
        'padding-right',
        unlockedPaddingRight + releasedGutter + 'px',
        'important'
      );
    }
  }

  function unlockPageScroll(preserveScrollbarGutter = false): void {
    if (isLocked) {
      isLocked = false;

      const body = document.body;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      if (hasSavedBodyPaddingRight) {
        if (savedBodyPaddingRight) {
          body.style.setProperty(
            'padding-right',
            savedBodyPaddingRight,
            savedBodyPaddingRightPriority
          );
        } else {
          body.style.removeProperty('padding-right');
        }
        if (savedBodyBoxSizing) {
          body.style.setProperty('box-sizing', savedBodyBoxSizing, savedBodyBoxSizingPriority);
        } else {
          body.style.removeProperty('box-sizing');
        }
        hasSavedBodyPaddingRight = false;
        savedBodyPaddingRight = '';
        savedBodyPaddingRightPriority = '';
        savedBodyBoxSizing = '';
        savedBodyBoxSizingPriority = '';
      }
      window.scrollTo(0, savedScrollY);
    }

    if (!preserveScrollbarGutter) restoreScrollbarGutter();
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

    const footer = modal?.querySelector<HTMLElement>('.sm-ovl__panel > .sm-search-footer');
    const available =
      window.visualViewport.height -
      popular.getBoundingClientRect().top -
      (footer?.offsetHeight || 0) -
      9;
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

  function syncAutocompletePosition(): void {
    const input = getInput();
    const field = modal?.querySelector<HTMLElement>('.sm-ovl__field');
    const autocomplete = document.querySelector<HTMLElement>(AUTOCOMPLETE_SELECTOR);
    if (!input?.value.trim() || !modal?.classList.contains('active') || !field || !autocomplete) {
      return;
    }

    const top = Math.round(field.getBoundingClientRect().bottom) + 'px';
    if (autocomplete.style.getPropertyValue('top') !== top) {
      autocomplete.style.setProperty('top', top, 'important');
    }
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
        syncAutocompletePosition();
      }

      return;
    }

    clearNativeHandoff();
    unlockPageScroll(nativeResultsAreActive());
    syncOverlayViewport();
    modal?.style.removeProperty('--sm-list-max');
  }

  function syncEmptyState(): void {
    const input = getInput();
    const popular = modal?.querySelector<HTMLElement>('.sm-popular');
    const searchControl = modal?.querySelector<HTMLButtonElement>('.sm-kbd');
    if (!input || !popular) return;

    const isEmpty = input.value.trim().length === 0;
    modal?.classList.toggle('is-empty', isEmpty);
    popular.hidden = !isEmpty;
    if (searchControl) {
      searchControl.textContent = isEmpty ? 'Esc' : RETURN_KEY_SYMBOL;
      searchControl.setAttribute('aria-label', isEmpty ? 'Close search' : 'Submit search');
    }

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

  function handleTabKey(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !modal?.classList.contains('active')) return;

    const input = getInput();
    if (!input || input.value.trim().length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    input.focus({ preventScroll: true });
  }

  function nativeResultsAreActive(): boolean {
    const container = document.querySelector<HTMLElement>('.st-ui-injected-overlay-container');
    if (!container) return false;

    return Boolean(
      document.body.classList.contains('st-ui-overlay-active') ||
        container.closest('div.st-ui-overlay:not(.dismiss)')
    );
  }

  function nativeResultsAreVisible(): boolean {
    const container = document.querySelector<HTMLElement>('.st-ui-injected-overlay-container');
    if (!container || !nativeResultsAreActive()) return false;

    const styles = window.getComputedStyle(container);
    const bounds = container.getBoundingClientRect();
    return (
      styles.display !== 'none' &&
      styles.visibility !== 'hidden' &&
      Number.parseFloat(styles.opacity || '0') >= 0.99 &&
      bounds.width > 0 &&
      bounds.height > 0
    );
  }

  function syncNativeScrollState(): void {
    if (nativeResultsAreActive()) {
      reserveScrollbarGutter();
      return;
    }

    if (!modal?.classList.contains('active')) restoreScrollbarGutter();
  }

  function clearNativeHandoff(): void {
    nativeHandoffObserver?.disconnect();
    nativeHandoffObserver = null;
    if (nativeHandoffFrame) {
      window.cancelAnimationFrame(nativeHandoffFrame);
      nativeHandoffFrame = 0;
    }
  }

  function deactivateLauncher(): void {
    clearNativeHandoff();
    modal?.classList.remove('active');
    unlockPageScroll(nativeResultsAreActive());
  }

  function waitForNativeResults(): void {
    clearNativeHandoff();

    if (nativeResultsAreVisible()) {
      deactivateLauncher();
      return;
    }

    const scheduleHandoffCheck = (): void => {
      if (nativeResultsAreVisible()) {
        deactivateLauncher();
        return;
      }

      if (nativeResultsAreActive() && !nativeHandoffFrame) {
        nativeHandoffFrame = window.requestAnimationFrame(checkHandoff);
      }
    };

    const checkHandoff = (): void => {
      nativeHandoffFrame = 0;
      scheduleHandoffCheck();
    };

    scheduleHandoffCheck();
    nativeHandoffObserver = new MutationObserver(scheduleHandoffCheck);
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

  function wireSearchControl(): void {
    const button = modal?.querySelector<HTMLButtonElement>('.sm-kbd');
    if (!button || button.dataset.smWired === 'true') return;
    button.dataset.smWired = 'true';
    button.addEventListener('mousedown', (event) => {
      if (getInput()?.value.trim()) event.preventDefault();
    });
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const input = getInput();
      if (input?.value.trim()) {
        input.focus({ preventScroll: true });
        input.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true,
          })
        );
        return;
      }
      closeSearch();
    });
  }

  ensurePopular();
  ensureKeyboardFooters();
  decoratePopular();
  wireInput();
  wireSearchControl();
  syncEmptyState();
  enableNativeOverlayKeyboardNavigation();

  const stateObserver = new MutationObserver(syncModalState);
  stateObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });

  const nativeScrollObserver = new MutationObserver(() => {
    syncNativeScrollState();
    ensureKeyboardFooters();
    syncAutocompletePosition();
  });
  nativeScrollObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  });

  document.addEventListener('keydown', handleArrowKey, true);
  document.addEventListener('keydown', handleTabKey, true);
  document.addEventListener('keydown', handleEnter, true);
  document.addEventListener('click', handleNativeClose, true);
  window.addEventListener('resize', syncAutocompletePosition);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleListHeight);
    window.visualViewport.addEventListener('resize', scheduleOverlayViewport);
    window.visualViewport.addEventListener('resize', syncAutocompletePosition);
    window.visualViewport.addEventListener('scroll', scheduleOverlayViewport);
    window.visualViewport.addEventListener('scroll', syncAutocompletePosition);
  }

  window.addEventListener('pagehide', () => unlockPageScroll());
}
