/**
 * Contrast functionality for Webflow University
 * Handles high contrast mode toggle with persistent storage
 */

import { StorageManager } from '../../utils/storage.js';

type Contrast = 'default' | 'high';

/**
 * Initializes the contrast functionality
 */
export function initContrast(): void {
  // Reference the contrast toggle buttons
  const toggleContrastButtons = document.querySelectorAll<HTMLElement>('.toggle-contrast');
  const toggleContrastCheckbox = document.getElementById(
    'toggleContrastCheckbox'
  ) as HTMLInputElement | null;

  if (toggleContrastButtons.length === 0) {
    console.warn('Contrast toggle buttons not found');
    return;
  }

  // Initialize storage manager
  const storage = new StorageManager('wfu-contrast', 'contrast');

  const setContrast = (contrast: Contrast): void => {
    document.documentElement.setAttribute('data-contrast', contrast);
    storage.setValue(contrast);

    if (!toggleContrastCheckbox) return;
    const checkboxInput = toggleContrastCheckbox.previousElementSibling as HTMLElement | null;

    if (!checkboxInput) return;

    if (contrast === 'high') {
      checkboxInput.classList.add('w--redirected-checked', 'w--redirected-focus');
    } else {
      checkboxInput.classList.remove('w--redirected-checked', 'w--redirected-focus');
    }
  };

  const toggleContrast = (): void => {
    const currentContrast = (storage.getValue() as Contrast) || 'default';
    // Change contrast to the opposite of current
    const newContrast: Contrast = currentContrast === 'default' ? 'high' : 'default';
    setContrast(newContrast);

    // Update checkbox based on new contrast value
    if (toggleContrastCheckbox) {
      toggleContrastCheckbox.checked = newContrast === 'high';
    }
  };

  // Initialize
  const savedContrast = (storage.getValue() as Contrast) || 'default';
  setContrast(savedContrast);

  if (toggleContrastCheckbox) {
    toggleContrastCheckbox.checked = savedContrast === 'high';
  }

  toggleContrastButtons.forEach((button) => {
    button.addEventListener('click', toggleContrast);
  });

  // Event listener for the checkbox
  if (toggleContrastCheckbox) {
    toggleContrastCheckbox.addEventListener('change', (e) => {
      // Stop any other event listeners from being called
      e.stopImmediatePropagation();

      const contrast: Contrast = (e.target as HTMLInputElement).checked ? 'high' : 'default';
      setContrast(contrast);
    });
  }
}
