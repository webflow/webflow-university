/**
 * Initialize tab menu scrolling when container is narrow
 */
export function initTabMenuScrolling(): void {
  const tabMenu = document.querySelector('.cc_pro_session-tab-menu') as HTMLElement;
  const tabsContainer = document.querySelector('.cc_pro_session-tabs') as HTMLElement;

  if (!tabMenu) {
    return;
  }

  if (!tabsContainer) {
    return;
  }

  const maxWidthPx = 1200;

  // Check if container width is less than 87rem
  const checkAndSetupScrolling = () => {
    const containerWidth = tabMenu.offsetWidth;

    if (containerWidth < maxWidthPx) {
      // Find the navigation buttons
      const prevButton = document.querySelector('.cc_pro_tabs_button.prev') as HTMLElement;
      const nextButton = document.querySelector('.cc_pro_tabs_button.next') as HTMLElement;

      if (prevButton && nextButton) {
        // Check if buttons are already appended to the parent container
        if (!tabsContainer.contains(prevButton)) {
          tabsContainer.appendChild(prevButton);
        }
        if (!tabsContainer.contains(nextButton)) {
          tabsContainer.appendChild(nextButton);
        }

        // Get the width of a tab link to use as scroll amount
        const tabLink = tabMenu.querySelector('.cc_pro_session-tab') as HTMLElement;
        const scrollAmount = tabLink ? tabLink.offsetWidth : 200; // fallback to 200px

        // Ensure the tab menu is scrollable
        const { overflowX } = getComputedStyle(tabMenu);

        // Enable horizontal scrolling if not already enabled
        if (overflowX !== 'auto' && overflowX !== 'scroll') {
          tabMenu.style.overflowX = 'auto';
        }

        // Function to update button visibility based on scroll position
        const updateScrollState = () => {
          const { scrollLeft } = tabMenu;
          const { scrollWidth } = tabMenu;
          const { clientWidth } = tabMenu;
          // Use a small threshold (1px) to account for sub-pixel rounding
          const isAtLeft = scrollLeft <= 1;
          const isAtRight = scrollLeft + clientWidth >= scrollWidth - 1;

          // Update button visibility based on scroll position
          if (isAtLeft && isAtRight) {
            // No scrolling needed (content fits)
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
          } else if (isAtLeft) {
            // At left edge - hide prev button
            prevButton.style.display = 'none';
            nextButton.style.display = '';
          } else if (isAtRight) {
            // At right edge - hide next button
            prevButton.style.display = '';
            nextButton.style.display = 'none';
          } else {
            // In middle - show both buttons
            prevButton.style.display = '';
            nextButton.style.display = '';
          }
        };

        // Setup scroll event listener to update buttons
        if (!tabMenu.dataset.scrollListenerAttached) {
          tabMenu.addEventListener('scroll', updateScrollState);
          tabMenu.dataset.scrollListenerAttached = 'true';
        }

        // Initial update of scroll state
        updateScrollState();

        // Setup scroll handlers
        if (!prevButton.dataset.scrollHandlerAttached) {
          prevButton.addEventListener('click', () => {
            tabMenu.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            // Update scroll state after scroll animation
            setTimeout(() => {
              updateScrollState();
            }, 300);
          });
          prevButton.dataset.scrollHandlerAttached = 'true';
        }

        if (!nextButton.dataset.scrollHandlerAttached) {
          nextButton.addEventListener('click', () => {
            tabMenu.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            // Update scroll state after scroll animation
            setTimeout(() => {
              updateScrollState();
            }, 300);
          });
          nextButton.dataset.scrollHandlerAttached = 'true';
        }
      }
    }
  };

  // Initial check
  checkAndSetupScrolling();

  // Also check on window resize
  window.addEventListener('resize', checkAndSetupScrolling);
}
