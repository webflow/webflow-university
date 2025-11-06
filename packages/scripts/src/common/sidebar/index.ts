/**
 * Sidebar functionality for Webflow University
 * Handles sidebar toggle, mobile menu, and active link highlighting
 */

import { StorageManager } from '../../utils/storage.js';

/**
 * Initializes the sidebar functionality
 */
export function initSidebar(): void {
  const sidebar = document.querySelector<HTMLElement>('.sidebar');
  const mobileMenuBtn = document.getElementById('mobile-menu');
  const mobileMenu = document.querySelector<HTMLElement>('.sidebar_mobile-wrap');
  const bgCloseDiv = document.getElementById('mobileBgClose');

  if (!sidebar || !mobileMenuBtn || !mobileMenu || !bgCloseDiv) {
    console.warn('Sidebar elements not found');
    return;
  }

  // At this point, TypeScript knows sidebar is not null
  const sidebarElement = sidebar;
  const mobileMenuElement = mobileMenu;
  const mobileMenuBtnElement = mobileMenuBtn;
  const bgCloseDivElement = bgCloseDiv;

  sidebarElement.classList.add('no-transition');

  // Initialize storage manager
  const storage = new StorageManager('wfu-sidebarState', 'sidebarState');

  // Check the sidebar state & apply a class of "opened"
  // Set storage if sidebarState is null
  const sidebarState = storage.getValue();

  if (sidebarState === 'opened') {
    sidebarElement.classList.add('opened');
  } else if (sidebarState === null) {
    sidebarElement.classList.add('opened');
    storage.setValue('opened');
  }

  document.documentElement.style.visibility = '';

  setTimeout(() => {
    sidebarElement.classList.remove('no-transition');
  }, 350);

  setTimeout(() => {
    const sidebarItems = document.querySelectorAll<HTMLElement>(
      '.sidebar .sidebar_link-text, .sidebar .sidebar_title, .sidebar .wf_wordmark'
    );

    const sidebarFooter = document.querySelector<HTMLElement>('.sidebar_footer');

    sidebarItems.forEach((item) => {
      item.style.transition =
        'opacity 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), visibility 0.01s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), max-height 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), margin 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';
    });

    if (sidebarFooter) {
      sidebarFooter.style.transition =
        'width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), height 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';
    }
  }, 10);

  // Function to toggle sidebar state
  function toggleSidebar(): void {
    // Temporarily disable transitions for overflow hidden
    sidebarElement.style.transition = 'none';

    // Set overflow to hidden before minimizing
    sidebarElement.style.overflow = 'hidden';

    // Force a reflow to make sure the above styles are applied before proceeding
    // This ensures that your transitions are applied smoothly.
    void sidebarElement.offsetWidth;

    // Re-enable transitions
    sidebarElement.style.transition = 'width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';

    // Toggle the sidebar
    sidebarElement.classList.toggle('opened');

    // Save the sidebarState
    if (sidebarElement.classList.contains('opened')) {
      storage.setValue('opened');
    } else {
      storage.setValue('minimized');
    }

    // Remove the overflow hidden after a delay to allow the animation to complete
    setTimeout(() => {
      sidebarElement.style.overflow = '';
      sidebarElement.style.transition = '';
    }, 600);
  }

  // Click event to toggle state
  const sidebarCloseBtn = document.getElementById('sidebar-close');
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', () => {
      toggleSidebar();
    });
  }

  // Keyboard shortcut (command + /) to toggle state
  document.addEventListener('keydown', (e) => {
    if (e.metaKey && e.key === '/') {
      toggleSidebar();
    }
  });

  // Minimize sidebar when viewport gets below 1296px
  let resizeTimer: ReturnType<typeof setTimeout>;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const currentSidebarState = storage.getValue();
      if (window.innerWidth < 1296 && currentSidebarState === 'opened') {
        sidebarElement.style.overflow = 'hidden';
        sidebarElement.style.transition = 'width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';
        sidebarElement.classList.remove('opened');

        setTimeout(() => {
          sidebarElement.style.overflow = '';
          sidebarElement.style.transition = '';
        }, 600);
      } else if (window.innerWidth > 1296 && currentSidebarState === 'opened') {
        sidebarElement.style.overflow = 'hidden';
        sidebarElement.style.transition = 'width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';
        sidebarElement.classList.add('opened');

        setTimeout(() => {
          sidebarElement.style.overflow = '';
          sidebarElement.style.transition = '';
        }, 600);
      }
    }, 200);
  });

  if (window.innerWidth < 1296 && storage.getValue() === 'opened') {
    sidebarElement.classList.remove('opened');
  }

  // Mobile Menu
  mobileMenuBtnElement.addEventListener('click', () => {
    mobileMenuElement.classList.toggle('opened');
    bgCloseDivElement.classList.toggle('opened');
    mobileMenuBtnElement.classList.toggle('u-bgc-2');

    if (window.innerWidth < 768) {
      if (document.body.style.overflow !== 'hidden') {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  });

  bgCloseDivElement.addEventListener('click', () => {
    mobileMenuElement.classList.remove('opened');
    bgCloseDivElement.classList.remove('opened');
    mobileMenuBtnElement.classList.toggle('u-bgc-2');

    setTimeout(() => {
      if (window.Webflow?.require) {
        window.Webflow.require('ix2').init();
      }
    }, 250);

    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = 'auto';
    }
  });
}

/**
 * Highlights the active sidebar link based on current URL
 */
export function initSidebarHighlight(): void {
  // Wait for the DOM to fully load before running the script
  window.addEventListener('load', () => {
    const curUrl = window.location.pathname;
    const anchorTags = document.querySelectorAll<HTMLElement>('.sidebar_link-group');

    anchorTags.forEach((anchor) => {
      const href = anchor.getAttribute('href');

      if (!href) {
        return;
      }

      if (href === '/' && curUrl === '/') {
        anchor.classList.add('w--current');
      } else if (curUrl.startsWith('/course-lesson/') && href === '/courses') {
        anchor.classList.add('w--current');
      } else if (curUrl.startsWith('/lesson/') && href === '/docs') {
        anchor.classList.add('w--current');
      } else if (href !== '/' && curUrl.indexOf(href) !== -1) {
        anchor.classList.add('w--current');
      } else {
        anchor.classList.remove('w--current');
      }
    });
  });
}
