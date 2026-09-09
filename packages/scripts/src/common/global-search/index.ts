/**
 * Global search launcher for Webflow University.
 *
 * The custom layer owns opening, closing, and the empty-query Popular list only. Swiftype owns
 * autocomplete, results, keyboard behavior, and analytics as soon as a query is present.
 */

import { initSearchModal } from './search-modal.js';

export function initGlobalSearch(): void {
  initSearchModal();

  const searchWrapper = document.querySelector<HTMLElement>('.g_search-wrapper');
  const searchCloseBg = document.querySelector<HTMLElement>('.g_search-close-bg');
  const searchInput = document.getElementById('g-search') as HTMLInputElement | null;

  if (!searchWrapper || !searchCloseBg || !searchInput) {
    console.warn('Global search elements not found');
    return;
  }

  const resetInput = (): void => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  };

  const openSearch = (): void => {
    resetInput();
    searchWrapper.classList.add('active');
    document.documentElement.style.overflow = 'hidden';
    searchInput.focus();
  };

  const closeSearch = (): void => {
    window.setTimeout(() => {
      searchWrapper.classList.remove('active');
      document.documentElement.style.overflow = '';
      resetInput();
    }, 100);
  };

  document.addEventListener('keydown', (event) => {
    if (
      (event.key === 'k' || event.key === 'e') &&
      (event.ctrlKey || event.metaKey) &&
      !searchWrapper.classList.contains('active')
    ) {
      openSearch();
    } else if (event.key === 'Escape' && searchWrapper.classList.contains('active')) {
      closeSearch();
    }
  });

  searchWrapper.addEventListener('click', (event) => {
    if (event.target === searchWrapper) closeSearch();
  });

  document.querySelectorAll<HTMLElement>('.open-search').forEach((element) => {
    element.addEventListener('click', openSearch);
  });

  searchCloseBg.addEventListener('click', closeSearch);
}
