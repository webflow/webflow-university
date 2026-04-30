/**
 * Global search functionality for Webflow University
 * Handles the search modal, keyboard shortcuts, and Swiftype overlay integration.
 */

const AUTOCOMPLETE_SELECTOR = '.st-default-autocomplete .st-query-present';
const MOBILE_WIDTH_THRESHOLD = 768;
const MOBILE_AUTOCOMPLETE_OFFSET = 150;
const DESKTOP_AUTOCOMPLETE_OFFSET = 220;

/**
 * Initializes the global search modal functionality.
 */
export function initGlobalSearch(): void {
  const searchWrapper = document.querySelector<HTMLElement>('.g_search-wrapper');
  const searchCloseBg = document.querySelector<HTMLElement>('.g_search-close-bg');
  const searchInput = document.getElementById('g-search') as HTMLInputElement | null;

  if (!searchWrapper || !searchCloseBg || !searchInput) {
    console.warn('Global search elements not found');
    return;
  }

  const adjustMaxHeight = (): void => {
    const currentOffset =
      window.innerWidth < MOBILE_WIDTH_THRESHOLD
        ? MOBILE_AUTOCOMPLETE_OFFSET
        : DESKTOP_AUTOCOMPLETE_OFFSET;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const adjustedMaxHeight = viewportHeight - currentOffset;
    const autocompleteElement = document.querySelector<HTMLElement>(AUTOCOMPLETE_SELECTOR);

    if (autocompleteElement) {
      autocompleteElement.style.maxHeight = `${adjustedMaxHeight}px`;
    }
  };

  const toggleSearch = (): void => {
    searchWrapper.classList.toggle('active');
    document.documentElement.style.overflow = searchWrapper.classList.contains('active')
      ? 'hidden'
      : '';

    if (searchWrapper.classList.contains('active')) {
      searchInput.focus();
    }
  };

  const closeSearch = (): void => {
    setTimeout(() => {
      searchWrapper.classList.remove('active');
      document.documentElement.style.overflow = '';
      searchInput.value = '';

      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });
      searchInput.dispatchEvent(event);
    }, 100);
  };

  document.addEventListener('keydown', (event) => {
    if (
      (event.key === 'k' || event.key === 'e') &&
      (event.ctrlKey || event.metaKey) &&
      !searchWrapper.classList.contains('active')
    ) {
      toggleSearch();
    } else if (event.key === 'Escape') {
      closeSearch();
    }
  });

  searchWrapper.addEventListener('click', (event) => {
    if (event.target === searchWrapper) {
      toggleSearch();
    }
  });

  document.querySelectorAll<HTMLElement>('.open-search').forEach((element) => {
    element.addEventListener('click', () => {
      toggleSearch();
    });
  });

  searchCloseBg.addEventListener('click', closeSearch);

  const observer = new MutationObserver((_mutationsList, mutationObserver) => {
    const stCloseBtn = document.querySelector<HTMLElement>('.st-ui-close-button');
    const stUiOverlay = document.querySelector<HTMLElement>('.st-ui-overlay');
    const autocompleteElement = document.querySelector<HTMLElement>(AUTOCOMPLETE_SELECTOR);

    if (stCloseBtn && stUiOverlay) {
      stCloseBtn.addEventListener('click', closeSearch);
      stUiOverlay.addEventListener('click', closeSearch);
    }

    if (autocompleteElement) {
      adjustMaxHeight();

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', adjustMaxHeight);
      } else {
        window.addEventListener('resize', adjustMaxHeight);
      }
    }

    if (stCloseBtn && stUiOverlay && autocompleteElement) {
      mutationObserver.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
