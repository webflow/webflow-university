const SWIFTYPE_SEARCH_ENDPOINT =
  'https://search-api.swiftype.com/api/v1/public/installs/8tPjZM7QFLqxMEpVo-ws/search.json';

export function initSearchModal(): void {
  const searchWindow = window as Window & { __wfuSearchModal?: boolean };
  if (searchWindow.__wfuSearchModal) return;
  searchWindow.__wfuSearchModal = true;

  const MODAL = '[data-sm-modal="true"]';
  let popularIndex = -1;
  let savedScrollY = 0;
  let isLocked = false;
  let syncFrame = 0;
  let scrollFrame = 0;
  let heightFrame = 0;
  let viewportFrame = 0;
  let selectionFrame = 0;
  let contentObserver: MutationObserver | null = null;
  let observedAutocomplete: HTMLElement | null = null;
  let hasSubmittedCurrentQuery = false;

  function getModal(): HTMLElement | null {
    return document.querySelector<HTMLElement>(MODAL);
  }

  function getInput(): HTMLInputElement | null {
    const modal = getModal();
    return modal ? modal.querySelector<HTMLInputElement>('#g-search') : null;
  }

  function getAutocomplete(): HTMLElement | null {
    const modal = getModal();
    const mounted = modal?.querySelector<HTMLElement>('.st-default-autocomplete');
    return mounted || document.querySelector<HTMLElement>('.st-default-autocomplete');
  }

  function getPopularRows(): HTMLAnchorElement[] {
    const modal = getModal();
    return modal ? Array.from(modal.querySelectorAll<HTMLAnchorElement>('.sm-popular__row')) : [];
  }

  function getResults(): HTMLAnchorElement[] {
    const modal = getModal();
    return modal ? Array.from(modal.querySelectorAll<HTMLAnchorElement>('.st-ui-result')) : [];
  }

  function getActiveResult(): HTMLAnchorElement | null {
    const modal = getModal();
    return modal
      ? modal.querySelector<HTMLAnchorElement>('.st-ui-result.st-keyboard-active-item')
      : null;
  }

  function ensurePopular() {
    const modal = getModal();
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

  function ensureFooter() {
    const modal = getModal();
    const panel = modal?.querySelector<HTMLElement>('.sm-ovl__panel');
    if (!panel || panel.querySelector('.sm-search-footer')) return;

    const footer = document.createElement('div');
    footer.className = 'sm-search-footer';
    footer.setAttribute('aria-label', 'Keyboard shortcuts');
    footer.innerHTML =
      '<span class="sm-search-footer__hint"><kbd class="sm-search-footer__key">\u2191\u2193</kbd><span>to navigate</span></span>' +
      '<span class="sm-search-footer__hint"><kbd class="sm-search-footer__key">\u21b5</kbd><span>to select</span></span>' +
      '<span class="sm-search-footer__hint"><kbd class="sm-search-footer__key">Esc</kbd><span>to close</span></span>';
    panel.appendChild(footer);
  }

  function mountAutocomplete() {
    const modal = getModal();
    const panel = modal?.querySelector<HTMLElement>('.sm-ovl__panel');
    if (!panel) return;

    const autocomplete = getAutocomplete();
    const footer = panel.querySelector('.sm-search-footer');
    if (autocomplete && autocomplete.parentElement !== panel) {
      panel.insertBefore(autocomplete, footer || null);
    }

    const input = getInput();
    if (input) {
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
    }

    if (autocomplete) {
      autocomplete.id = 'wfu-search-results';
      autocomplete.setAttribute('role', 'listbox');
    }
  }

  function ensureResultsHeading() {
    const modal = getModal();
    if (!modal) return;

    modal.querySelectorAll('.st-query-present').forEach(function (list) {
      let heading = list.querySelector('.sm-results-heading');
      if (!heading) {
        heading = document.createElement('div');
        heading.className = 'sm-results-heading';
        heading.setAttribute('aria-live', 'polite');
        heading.innerHTML = '<span>Results</span><span class="sm-results-heading__count"></span>';
        list.insertBefore(heading, list.firstChild);
      }

      const count = list.querySelectorAll('.st-ui-result').length;
      const countElement = heading.querySelector('.sm-results-heading__count');
      if (countElement && countElement.textContent !== String(count))
        countElement.textContent = String(count);
      heading.setAttribute('aria-label', 'Results, ' + count + ' returned');
    });
  }

  function contentTypeFromHref(href: string | null): string {
    let path = '';
    try {
      path = new URL(href || '', window.location.href).pathname;
    } catch {
      path = href || '';
    }

    if (/\/(?:course-)?lessons?\//i.test(path)) return 'Lesson';
    if (/\/learning-paths?\//i.test(path)) return 'Learning path';
    if (/\/courses?\//i.test(path)) return 'Course';
    if (/\/videos?\//i.test(path)) return 'Video';
    if (/\/certifications?\//i.test(path)) return 'Certification';
    if (/\/glossary\//i.test(path)) return 'Glossary';
    return 'Resource';
  }

  function makeBadge(label: string): HTMLSpanElement {
    const badge = document.createElement('span');
    badge.className = 'sm-result-type';
    badge.textContent = label;
    return badge;
  }

  function decorate(host: HTMLElement | null, titleClass: string): HTMLSpanElement | null {
    if (!host || host.querySelector('.sm-result-type')) return null;
    const title = document.createElement('span');
    title.className = titleClass;
    while (host.firstChild) title.appendChild(host.firstChild);
    return title;
  }

  function decorateAll() {
    const modal = getModal();
    if (!modal) return;

    getResults().forEach(function (result) {
      const heading = result.querySelector<HTMLElement>('.st-ui-type-heading');
      if (!heading) return;
      const title = decorate(heading, 'sm-result-title-text');
      if (!title) return;
      const label = contentTypeFromHref(result.getAttribute('href'));
      heading.appendChild(makeBadge(label));
      heading.appendChild(title);
      result.dataset.wfuContentType = 'true';
      result.dataset.contentType = label;
    });

    getPopularRows().forEach(function (row) {
      const text = row.querySelector<HTMLElement>('.sm-popular__text');
      if (!text) return;
      const title = decorate(text, 'sm-popular__title');
      if (!title) return;
      const label = contentTypeFromHref(row.getAttribute('href'));
      text.appendChild(makeBadge(label));
      text.appendChild(title);
      row.dataset.wfuContentType = 'true';
      row.dataset.contentType = label;
    });
  }

  function setPopularActive(index: number) {
    const input = getInput();
    const rows = getPopularRows();
    if (!rows.length) return;

    popularIndex = index;
    rows.forEach(function (row, rowIndex) {
      const isActive = rowIndex === popularIndex;
      row.classList.toggle('is-keyboard-active', isActive);
      row.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (input && popularIndex >= 0 && rows[popularIndex]) {
      input.setAttribute('aria-activedescendant', rows[popularIndex].id);
    }
  }

  function clearPopularActive() {
    const input = getInput();
    popularIndex = -1;
    getPopularRows().forEach(function (row) {
      row.classList.remove('is-keyboard-active');
      row.setAttribute('aria-selected', 'false');
    });
    if (
      input &&
      (input.getAttribute('aria-activedescendant') || '').indexOf('wfu-popular-result-') === 0
    ) {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function syncSelectionState() {
    const input = getInput();
    if (!input) return;

    const active = getActiveResult();
    getResults().forEach(function (result, index) {
      if (result.id !== 'wfu-search-result-' + index) result.id = 'wfu-search-result-' + index;
      if (result.getAttribute('role') !== 'option') result.setAttribute('role', 'option');
      const want = result === active ? 'true' : 'false';
      if (result.getAttribute('aria-selected') !== want) result.setAttribute('aria-selected', want);
    });

    if (active && input.value.trim().length > 0) {
      input.setAttribute('aria-activedescendant', active.id);
    } else if (
      (input.getAttribute('aria-activedescendant') || '').indexOf('wfu-search-result-') === 0
    ) {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function scrollActiveIntoView() {
    scrollFrame = 0;
    const active = getActiveResult();
    if (!active) return;

    const scroller = active.closest('.st-query-present');
    if (!scroller) return;

    const activeRect = active.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const inset = 4;

    if (activeRect.top < scrollerRect.top + inset) {
      scroller.scrollTop += activeRect.top - scrollerRect.top - inset;
    } else if (activeRect.bottom > scrollerRect.bottom - inset) {
      scroller.scrollTop += activeRect.bottom - scrollerRect.bottom + inset;
    }
  }

  // Swiftype stamps its active class onto whatever row a finger passes over, so during a drag
  // these arrive in bursts and each pass walks every row. One pass per frame is enough to keep
  // ARIA current, and keeps the rest off the critical path of the scroll.
  function scheduleSelectionSync() {
    if (selectionFrame) return;
    selectionFrame = window.requestAnimationFrame(function () {
      selectionFrame = 0;
      syncSelectionState();
    });
  }

  function scheduleActiveScroll() {
    syncSelectionState();
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(scrollActiveIntoView);
  }

  function syncSearchState() {
    const modal = getModal();
    const input = getInput();
    if (!modal || !input) return;

    const isEmpty = input.value.trim().length === 0;
    const popular = modal.querySelector<HTMLElement>('.sm-popular');
    const autocomplete = modal.querySelector('.st-default-autocomplete');
    const hasResults = !!(
      autocomplete && autocomplete.querySelector('.st-query-present .st-ui-result')
    );

    modal.classList.toggle('is-empty', isEmpty);
    if (popular) popular.hidden = !isEmpty;
    input.setAttribute('aria-controls', isEmpty ? 'wfu-popular-results' : 'wfu-search-results');
    input.setAttribute('aria-expanded', isEmpty ? 'true' : hasResults ? 'true' : 'false');

    if (!isEmpty) clearPopularActive();
  }

  function handleQueryInput() {
    hasSubmittedCurrentQuery = false;
    clearPopularActive();
    syncSearchState();
  }

  function handleArrowKey(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    const modal = getModal();
    const input = getInput();
    if (!modal || !input || event.target !== input) return;

    // Empty query: we own navigation over the Popular list.
    if (input.value.trim().length === 0) {
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
      return;
    }

    // Query present: Swiftype owns navigation, but stop it wrapping past either end.
    const items = getResults();
    if (!items.length) return;

    let activeIndex = -1;
    for (let i = 0; i < items.length; i++) {
      if (items[i].classList.contains('st-keyboard-active-item')) {
        activeIndex = i;
        break;
      }
    }

    const blockUp = event.key === 'ArrowUp' && (activeIndex === -1 || activeIndex === 0);
    const blockDown = event.key === 'ArrowDown' && activeIndex === items.length - 1;
    if (blockUp || blockDown) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }

    scheduleActiveScroll();
  }

  function handleEnter(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;

    const input = getInput();
    if (!input || event.target !== input) return;
    if (event.type !== 'keydown' || event.repeat) return;

    // Swiftype owns Enter when a query is present. Its native handlers submit search.json
    // for search analytics and track/navigate an active autocomplete result when selected.
    if (input.value.trim().length > 0) {
      hasSubmittedCurrentQuery = true;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const target = popularIndex >= 0 ? getPopularRows()[popularIndex] || null : null;
    if (!target) return;

    const link = target.matches('a[href]')
      ? target
      : target.querySelector<HTMLAnchorElement>('a[href]');
    if (link && link.href) window.location.assign(link.href);
    else target.click();
  }

  function handleResultSelection(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const result = target.closest<HTMLAnchorElement>('.st-ui-result');
    const autocomplete = result?.closest('.st-default-autocomplete');
    const modal = getModal();
    const input = getInput();
    const query = input?.value.trim() || '';

    if (!result || !autocomplete || !modal?.contains(result) || !query) return;
    if (hasSubmittedCurrentQuery) return;

    hasSubmittedCurrentQuery = true;
    const body = new URLSearchParams({ q: query, page: '1' });

    void fetch(SWIFTYPE_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
      credentials: 'include',
      keepalive: true,
    }).catch(() => {
      hasSubmittedCurrentQuery = false;
    });
  }

  function closeSearch() {
    const modal = getModal();
    if (!modal) return;

    const backdrop = modal.querySelector<HTMLElement>('.g_search-close-bg');
    if (backdrop) {
      backdrop.click();
      return;
    }

    modal.classList.remove('active');
    const input = modal.querySelector<HTMLInputElement>('#g-search');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
  }

  function wireInput() {
    const input = getInput();
    if (!input || input.dataset.smWired === 'true') return;
    input.dataset.smWired = 'true';
    input.addEventListener('input', handleQueryInput);
    input.addEventListener('search', handleQueryInput);
    // Safari reports the settled viewport only once the keyboard animation finishes, and
    // it does not always fire a final resize at the end of it.
    input.addEventListener('focus', function () {
      window.setTimeout(syncListHeight, 350);
      window.setTimeout(syncListHeight, 700);
    });
    input.addEventListener('blur', function () {
      window.setTimeout(syncListHeight, 350);
    });
  }

  function wireCloseButton() {
    const modal = getModal();
    const button = modal?.querySelector<HTMLButtonElement>('.sm-kbd');
    if (!button || button.dataset.smWired === 'true') return;
    button.dataset.smWired = 'true';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      closeSearch();
    });
  }

  // initGlobalSearch in the university scripts package locks the page its own way, with
  // overflow: hidden on the root, and it sets that after flipping .active — so this runs
  // after it and takes the lock back. Stacking root overflow on top of the fixed body below
  // is what stops iOS routing touch drags to the results list. Always clearing rather than
  // saving and restoring is deliberate: '' is the resting value the package itself returns
  // the root to on close, so restoring what was there mid-open would re-lock the page.
  function releaseRootOverflow() {
    const root = document.documentElement;
    if (root.style.overflow !== '') root.style.overflow = '';
  }

  function lockPageScroll() {
    if (isLocked) return;
    isLocked = true;
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    // position: fixed with a negative offset is the only page-scroll lock iOS Safari
    // actually honours; overflow: hidden on html alone still rubber-bands.
    body.style.position = 'fixed';
    body.style.top = -savedScrollY + 'px';
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
  }

  function unlockPageScroll() {
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

  function activeModal(): HTMLElement | null {
    const modal = getModal();
    if (!modal || !window.visualViewport || !modal.classList.contains('active')) return null;
    return modal;
  }

  // Cap the list at the space actually left below where it starts. visualViewport.height is
  // an absolute measure of the visible area and stays correct while the keyboard is up; the
  // keyboard's own height, by contrast, has to be inferred as a difference between two
  // viewports and iOS reports that unreliably. Same approach as the production script.
  function syncListHeight() {
    const modal = activeModal();
    const visualViewport = window.visualViewport;
    if (!modal || !visualViewport) return;

    const isEmpty = modal.classList.contains('is-empty');
    const list = isEmpty
      ? modal.querySelector<HTMLElement>('.sm-popular')
      : modal.querySelector<HTMLElement>('.st-default-autocomplete .st-query-present');
    if (!list || !list.getClientRects().length) return;

    // 9px leaves the panel's bottom edge as clear of the visible area as its top edge is:
    // the 8px inset, plus the 1px panel border sitting between that edge and the list.
    const available = visualViewport.height - list.getBoundingClientRect().top - 9;
    // Floor it. A list collapsed to nothing is the exact failure this shape exists to avoid.
    modal.style.setProperty('--sm-list-max', Math.max(160, Math.round(available)) + 'px');
  }

  function scheduleListHeight() {
    if (heightFrame) return;
    heightFrame = window.requestAnimationFrame(function () {
      heightFrame = 0;
      syncListHeight();
    });
  }

  // With the keyboard up iOS keeps the layout viewport at full height and lets a drag slide
  // the visible area around inside it, by up to the keyboard's height. position: fixed pins to
  // the layout viewport, so the whole overlay slides off the top of the screen with it. That
  // pan is a browser gesture: neither touch-action nor preventDefault can cancel it, so the
  // overlay has to follow the visible area instead of trying to hold the drag off.
  //
  // Only the top edge moves. Leaving the bottom pinned to the layout viewport runs the dim on
  // underneath the keyboard, and since the visible area can never reach past the bottom of the
  // layout viewport there is no offset at which the dim falls short of it. Sizing the root to
  // visualViewport.height instead left a strip of undimmed page showing above the keyboard,
  // because that height stops short of where the keyboard actually starts.
  function syncOverlayViewport() {
    viewportFrame = 0;
    const modal = getModal();
    const root = modal?.querySelector<HTMLElement>('.sm-ovl-root');
    if (!modal || !root) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport || !modal.classList.contains('active')) {
      root.style.removeProperty('top');
      return;
    }

    // Only when it actually changes: this element is the whole overlay, so a redundant write
    // still invalidates it and everything painting behind it.
    const top = Math.round(visualViewport.offsetTop) + 'px';
    if (root.style.top !== top) root.style.top = top;
  }

  function scheduleOverlayViewport() {
    if (viewportFrame) return;
    viewportFrame = window.requestAnimationFrame(syncOverlayViewport);
  }

  function syncModalState() {
    const modal = getModal();
    if (modal && modal.classList.contains('active')) {
      lockPageScroll();
      releaseRootOverflow();
      syncOverlayViewport();
      syncListHeight();
      // Also from here, not just sync(): the Popular list is built while the modal is still
      // display: none, so its first measurement is 0x0 and sync() may never run again with
      // the modal open to correct that.
      wakeScrollers();
    } else {
      unlockPageScroll();
      syncOverlayViewport();
      if (modal) modal.style.removeProperty('--sm-list-max');
    }
  }

  function observeContent() {
    const autocomplete = getAutocomplete();
    if (!autocomplete || autocomplete === observedAutocomplete) return;

    if (contentObserver) contentObserver.disconnect();
    observedAutocomplete = autocomplete;
    contentObserver = new MutationObserver(function (mutations) {
      let selectionChanged = false;
      let contentChanged = false;
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].type === 'attributes') selectionChanged = true;
        else contentChanged = true;
      }
      if (contentChanged) scheduleSync();
      // Mirror the selection into ARIA only. Scrolling it into view belongs solely to the
      // arrow-key handlers: Swiftype also stamps this class onto the row under a finger, so
      // scrolling here fights the drag and leaves the list only able to move one way.
      if (selectionChanged) scheduleSelectionSync();
    });
    contentObserver.observe(autocomplete, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  // Swiftype builds its list outside the panel and mountAutocomplete moves it in, so the
  // element becomes scrollable inside a subtree WebKit has already composited. When that
  // happens it can miss building a scrolling node for it and the list ignores touch while
  // still scrolling fine from a wheel or from script. Toggling overflow forces the rebuild.
  // The stylesheet sets overflow-y with !important, so the override has to match it.
  function wakeScrollers() {
    const modal = getModal();
    if (!modal) return;

    modal
      .querySelectorAll<HTMLElement>('.sm-popular, .st-default-autocomplete .st-query-present')
      .forEach(function (list) {
        const signature = list.scrollHeight + 'x' + list.clientHeight;
        if (list.dataset.smWoken === signature) return;
        list.dataset.smWoken = signature;
        list.style.setProperty('overflow-y', 'hidden', 'important');
        void list.offsetHeight;
        list.style.removeProperty('overflow-y');
      });
  }

  // A touchmove listener has to be non-passive to be able to cancel a pan, and WebKit will not
  // scroll until a non-passive listener has run — so this one sits directly on the critical path
  // of every frame of a drag and must not touch the DOM. Everything it needs is measured once
  // here instead. Measuring at touchstart is exactly equivalent to measuring on the first move:
  // nothing has scrolled yet by then.
  let panStartY = 0;
  let panArmed = false;
  let panRoomUp = false;
  let panRoomDown = false;

  function onPanStart(event: TouchEvent) {
    panArmed = false;
    const modal = getModal();
    if (!modal || !modal.classList.contains('active')) return;
    // A second finger landing re-runs this and leaves the gesture disarmed, so pinch-zoom is
    // never cancelled.
    if (!event.touches || event.touches.length !== 1) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    // The input is exempt so dragging still moves the caret and selects text.
    if (target.closest('#g-search')) return;

    panArmed = true;
    panStartY = event.touches[0].clientY;

    // A list earns an exemption only for the direction it still has room to travel. Both stay
    // false for everything else, so a drag on the backdrop, or on a list short enough to fit, is
    // cancelled outright rather than handed to the browser to pan the overlay with.
    const scroller = target.closest<HTMLElement>('.sm-popular, .st-query-present');
    const max = scroller ? scroller.scrollHeight - scroller.clientHeight : 0;
    panRoomDown = !!scroller && max > 0 && scroller.scrollTop > 0;
    panRoomUp = !!scroller && max > 0 && scroller.scrollTop < max;
  }

  // Companion to the touch-action rules above, covering the gaps they cannot reach: the panel
  // itself is an ancestor of the lists, so it cannot carry touch-action without disabling them.
  // Only the first move of a gesture is cancelable — by the second, WebKit has committed to
  // scrolling and preventDefault is a no-op — so a list that runs out of room mid-drag is past
  // reach here, and overscroll-behavior: none in the stylesheet covers that case instead.
  function blockViewportPan(event: TouchEvent) {
    if (!panArmed || !event.cancelable) return;

    const touch = event.touches && event.touches[0];
    const goingDown = (touch ? touch.clientY : panStartY) > panStartY;
    if (goingDown ? panRoomDown : panRoomUp) return;

    event.preventDefault();
  }

  function sync() {
    if (!getModal()) return;
    ensurePopular();
    ensureFooter();
    mountAutocomplete();
    ensureResultsHeading();
    decorateAll();
    wireInput();
    wireCloseButton();
    observeContent();
    syncSearchState();
    syncSelectionState();
    syncListHeight();
    wakeScrollers();
  }

  function scheduleSync() {
    if (syncFrame) return;
    syncFrame = window.requestAnimationFrame(function () {
      syncFrame = 0;
      sync();
    });
  }

  const modal = getModal();
  if (!modal) return;

  // Swiftype appends .st-default-autocomplete to the body, so watch for that one mount
  // shallowly. Result re-renders are watched on the autocomplete itself in observeContent.
  const mountObserver = new MutationObserver(scheduleSync);
  mountObserver.observe(document.body, { childList: true });

  const stateObserver = new MutationObserver(syncModalState);
  stateObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });

  // Only the move handler has to be cancelable; the start handler stays passive so it adds
  // nothing to the cost of a scroll.
  document.addEventListener('touchstart', onPanStart, { passive: true });
  // passive: false is required, and is also the WebKit default this relies on.
  document.addEventListener('touchmove', blockViewportPan, { passive: false });

  document.addEventListener('keydown', handleArrowKey, true);
  document.addEventListener(
    'keyup',
    function (event) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const input = getInput();
      if (input && event.target === input && input.value.trim().length > 0) scheduleActiveScroll();
    },
    true
  );
  document.addEventListener('keydown', handleEnter, true);
  document.addEventListener('click', handleResultSelection, true);

  if (window.visualViewport) {
    // The list height follows resize only: recomputing it on every pan frame resizes the panel
    // under the finger and drags the caret with it. The overlay's own position has to follow
    // scroll too, because on iOS that scroll is the pan.
    window.visualViewport.addEventListener('resize', scheduleListHeight);
    window.visualViewport.addEventListener('resize', scheduleOverlayViewport);
    window.visualViewport.addEventListener('scroll', scheduleOverlayViewport);
  }
  window.addEventListener('pagehide', unlockPageScroll);

  sync();
  syncModalState();
}
