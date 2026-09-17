/**
 * Checklist progress persistence
 *
 * State lives in localStorage so progress survives reloads, and mirrors into a
 * `checked` query param so a URL can carry progress to someone else. A URL that
 * already carries `checked` wins over stored state, which is what makes shared
 * links work for a visitor who has their own progress saved.
 */

const STORAGE_PREFIX = 'wfu-checklist';
export const URL_PARAM = 'checked';

/** Checklists are per-page, so state is namespaced by path. */
export function getStorageKey(pathname: string = window.location.pathname): string {
  return `${STORAGE_PREFIX}:${pathname.replace(/\/+$/, '') || '/'}`;
}

export function hasUrlState(search: string = window.location.search): boolean {
  return new URLSearchParams(search).has(URL_PARAM);
}

export function readFromUrl(search: string = window.location.search): string[] {
  return parseIds(new URLSearchParams(search).get(URL_PARAM));
}

export function readFromStorage(key: string = getStorageKey()): string[] {
  try {
    return parseIds(window.localStorage.getItem(key));
  } catch {
    // Private browsing and blocked storage both throw; progress just won't persist.
    return [];
  }
}

export function writeToStorage(ids: string[], key: string = getStorageKey()): void {
  try {
    if (ids.length) {
      window.localStorage.setItem(key, ids.join(','));
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore — the UI still reflects the in-page state.
  }
}

/**
 * Rewrites the `checked` param without adding a history entry, so the address
 * bar is always shareable without the back button filling up.
 */
export function syncUrl(ids: string[]): void {
  const url = new URL(window.location.href);

  if (ids.length) {
    url.searchParams.set(URL_PARAM, ids.join(','));
  } else {
    url.searchParams.delete(URL_PARAM);
  }

  window.history.replaceState({}, '', url);
}

export function buildShareUrl(ids: string[], href: string = window.location.href): string {
  const url = new URL(href);

  if (ids.length) {
    url.searchParams.set(URL_PARAM, ids.join(','));
  } else {
    url.searchParams.delete(URL_PARAM);
  }

  return url.href;
}

function parseIds(value: string | null): string[] {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();

  return value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => {
      if (!/^\d+$/.test(id) || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
}
