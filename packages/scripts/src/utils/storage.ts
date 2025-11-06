/**
 * Utility functions for managing storage (cookies and localStorage)
 */

/**
 * Gets the current domain for cookie storage
 * @returns The domain string to use for cookies
 */
export function getCurrentDomain(): string {
  return window.location.hostname === 'wfu3.webflow.io' ? 'wfu3.webflow.io' : '.webflow.com';
}

/**
 * Tests if cookies are enabled in the browser
 * @returns True if cookies are enabled, false otherwise
 */
export function checkCookieEnabled(): boolean {
  // Try to set a test cookie
  document.cookie = 'testcookie=1; expires=Wed, 01-Jan-2070 00:00:01 GMT; path=/';

  // Try to get the test cookie
  const isEnabled = document.cookie.indexOf('testcookie') !== -1;

  // Delete the test cookie
  document.cookie = 'testcookie=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/';

  return isEnabled;
}

/**
 * Storage manager that handles both cookies and localStorage
 * with automatic fallback and migration
 */
export class StorageManager {
  private cookieKey: string;
  private localStorageKey: string;
  private domain: string;
  private cookieEnabled: boolean;

  constructor(cookieKey: string, localStorageKey: string) {
    this.cookieKey = cookieKey;
    this.localStorageKey = localStorageKey;
    this.domain = getCurrentDomain();
    this.cookieEnabled = checkCookieEnabled();

    // Migrate from localStorage to cookies if cookies are now enabled
    this.migrateFromLocalStorage();
  }

  /**
   * Migrates data from localStorage to cookies if cookies are enabled
   */
  private migrateFromLocalStorage(): void {
    const localStorageValue = localStorage.getItem(this.localStorageKey);
    if (localStorageValue && this.cookieEnabled) {
      this.setValue(localStorageValue);
      localStorage.removeItem(this.localStorageKey);
    }
  }

  /**
   * Gets the stored value, checking cookies first, then localStorage
   * @returns The stored value or null if not found
   */
  getValue(): string | null {
    if (this.cookieEnabled) {
      const cookieValue = Cookies.get(this.cookieKey);
      if (cookieValue) {
        return cookieValue;
      }
    }
    return localStorage.getItem(this.localStorageKey);
  }

  /**
   * Sets the stored value, using cookies if enabled, otherwise localStorage
   * @param value The value to store
   */
  setValue(value: string): void {
    if (this.cookieEnabled) {
      try {
        Cookies.set(this.cookieKey, value, {
          expires: 365,
          domain: this.domain,
        });
      } catch {
        // Fallback to localStorage if cookie setting fails
        localStorage.setItem(this.localStorageKey, value);
      }
    } else {
      localStorage.setItem(this.localStorageKey, value);
    }
  }
}
