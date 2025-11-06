/**
 * Theme functionality for Webflow University
 * Handles light/dark theme switching with persistent storage
 */

import { StorageManager } from '../../utils/storage.js';

type Theme = 'light' | 'dark';

/**
 * Initializes the theme functionality
 */
export function initTheme(): void {
  // Reference to the desktop theme buttons
  const toLightModeButton = document.getElementById('toLightMode');
  const toDarkModeButton = document.getElementById('toDarkMode');

  // Reference to the mobile theme buttons
  const toLightModeButtonMobile = document.getElementById('toLightModeMobile');
  const toDarkModeButtonMobile = document.getElementById('toDarkModeMobile');

  if (
    !toLightModeButton ||
    !toDarkModeButton ||
    !toLightModeButtonMobile ||
    !toDarkModeButtonMobile
  ) {
    console.warn('Theme buttons not found');
    return;
  }

  // Initialize storage manager
  const storage = new StorageManager('wfu-theme', 'theme');

  const updateButtons = (theme: Theme): void => {
    const screenWidth = window.innerWidth;

    // For desktop
    if (screenWidth > 768) {
      if (theme === 'light') {
        toDarkModeButton.style.display = 'flex';
        toDarkModeButtonMobile.style.display = 'flex';
        toLightModeButton.style.display = 'none';
        toLightModeButtonMobile.style.display = 'none';
      } else {
        toDarkModeButton.style.display = 'none';
        toDarkModeButtonMobile.style.display = 'none';
        toLightModeButton.style.display = 'flex';
        toLightModeButtonMobile.style.display = 'flex';
      }
    }
    // For mobile
    else {
      if (theme === 'light') {
        toDarkModeButtonMobile.style.display = 'flex';
        toLightModeButtonMobile.style.display = 'none';
      } else {
        toDarkModeButtonMobile.style.display = 'none';
        toLightModeButtonMobile.style.display = 'flex';
      }
      toDarkModeButton.style.display = 'none';
      toLightModeButton.style.display = 'none';
    }
  };

  const setTheme = (theme: Theme): void => {
    document.documentElement.setAttribute('data-theme', theme);
    storage.setValue(theme);
    updateButtons(theme);
  };

  // Function to handle theme click events
  const handleThemeClick = (element: HTMLElement, theme: Theme): void => {
    element.addEventListener('click', () => {
      setTimeout(() => {
        setTheme(theme);
      }, 380);
    });
  };

  const attachListeners = (): void => {
    handleThemeClick(toLightModeButton, 'light');
    handleThemeClick(toDarkModeButton, 'dark');
    handleThemeClick(toLightModeButtonMobile, 'light');
    handleThemeClick(toDarkModeButtonMobile, 'dark');
  };

  // Initialize
  const savedTheme = (storage.getValue() as Theme) || 'dark';
  setTheme(savedTheme);
  attachListeners();

  // Listen for resize changes & update buttons accordingly
  window.addEventListener('resize', () => {
    const currentTheme = (storage.getValue() as Theme) || 'dark';
    updateButtons(currentTheme);
  });
}
