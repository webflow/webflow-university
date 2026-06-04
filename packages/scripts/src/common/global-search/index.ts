/**
 * Global search functionality for Webflow University
 * Handles the search modal, keyboard shortcuts, and Swiftype overlay integration.
 */

const AUTOCOMPLETE_SELECTOR = '.st-default-autocomplete .st-query-present';
const SEARCH_RESULT_CONTAINER_SELECTOR = '.st-ui-autocomplete, .st-search-results';
const SEARCH_RESULT_SELECTOR = '.st-ui-result';
const MOBILE_WIDTH_THRESHOLD = 768;
const MOBILE_AUTOCOMPLETE_OFFSET = 150;
const DESKTOP_AUTOCOMPLETE_OFFSET = 220;

type SearchIconTheme = 'light' | 'dark';
type SearchIconType = 'default' | 'certificate' | 'lp' | 'video' | 'course';

const SEARCH_RESULT_ICONS: Record<SearchIconTheme, Record<SearchIconType, string>> = {
  light: {
    default:
      'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a027c452bd908009c354_Search%20icon_Resources-on%20light.svg',
    certificate:
      'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a02006f0f8697b4a4510_Search%20icon_Certs-on%20light.svg',
    lp: 'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a017d3f67be337ab3655_5ccf5d561cfbcb77e84dcc480461c9bb_Search%20icon_LPs-on%20light.svg',
    video:
      'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a0040f0dcb95415495ce_Search%20icon_Video-on%20light.svg',
    course:
      'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/69989ffc32e80d1b6c3327ed_Search%20icon_Courses-on%20light.svg',
  },
  dark: {
    default:
      'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a02432e80d1b6c33339a_Search%20icon_Resources-on%20dark.svg',
    certificate:
      'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a01ed8cc3f9e020c2859_Search%20icon_Certs-on%20dark.svg',
    lp: 'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a00b088617f2a66508f2_9705bb42c8b7c48371f757787f813e51_Search%20icon_LPs-on%20dark.svg',
    video:
      'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a0006fdcc10789cd4f87_Search%20icon_Video-on%20dark.svg',
    course:
      'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/69989ff71c4ca1c4e42d35c0_Search%20icon_Courses-on%20dark.svg',
  },
};

const SEARCH_ICON_TYPE_ALIASES: Array<{ type: SearchIconType; match: RegExp }> = [
  { type: 'course', match: /\/courses\//i },
  { type: 'video', match: /\/videos?\//i },
  { type: 'lp', match: /\/learning-paths?\//i },
  { type: 'certificate', match: /\/certifications\//i },
];

/**
 * Initializes the global search modal functionality.
 */
export function initGlobalSearch(): void {
  initSearchResultIcons();

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

function initSearchResultIcons(): void {
  updateAllSearchResultIcons();
  observeSearchThemeChanges();
  observeSearchResultChanges();
}

function getSearchIconTheme(): SearchIconTheme {
  const theme = document.documentElement.dataset.theme;

  return theme === 'light' || theme === 'dark' ? theme : 'dark';
}

function getSearchIconTypeFromHref(href: string | null): SearchIconType {
  if (!href) {
    return 'default';
  }

  for (const entry of SEARCH_ICON_TYPE_ALIASES) {
    if (entry.match.test(href)) {
      return entry.type;
    }
  }

  return 'default';
}

function setCssUrl(element: HTMLElement, url: string): void {
  element.style.backgroundImage = `url("${url}")`;
}

function updateSearchResultIcons(container: Element | null): void {
  if (!container) {
    return;
  }

  const themeIcons = SEARCH_RESULT_ICONS[getSearchIconTheme()];

  container.querySelectorAll<HTMLElement>('.st-ui-thumbnail').forEach((thumbnail) => {
    const anchor = thumbnail.closest<HTMLAnchorElement>('a.st-ui-result');
    const iconType = getSearchIconTypeFromHref(anchor?.getAttribute('href') || null);
    const iconUrl = themeIcons[iconType] || themeIcons.default;
    const image = thumbnail.querySelector<HTMLImageElement>('img');

    setCssUrl(thumbnail, iconUrl);
    image?.setAttribute('src', iconUrl);
  });
}

function updateAllSearchResultIcons(): void {
  document
    .querySelectorAll(SEARCH_RESULT_CONTAINER_SELECTOR)
    .forEach((container) => updateSearchResultIcons(container));
}

function observeSearchThemeChanges(): void {
  const observer = new MutationObserver(() => {
    updateAllSearchResultIcons();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

function observeSearchResultChanges(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') {
        continue;
      }

      const hasRelevantNode = Array.from(mutation.addedNodes).some((node) => {
        if (!(node instanceof Element)) {
          return false;
        }

        return (
          node.matches(`${SEARCH_RESULT_CONTAINER_SELECTOR}, ${SEARCH_RESULT_SELECTOR}`) ||
          Boolean(
            node.querySelector(`${SEARCH_RESULT_CONTAINER_SELECTOR}, ${SEARCH_RESULT_SELECTOR}`)
          )
        );
      });

      if (hasRelevantNode) {
        updateAllSearchResultIcons();
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
