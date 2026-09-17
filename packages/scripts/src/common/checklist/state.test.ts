/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  buildShareUrl,
  getStorageKey,
  hasUrlState,
  readFromStorage,
  readFromUrl,
  syncUrl,
  writeToStorage,
} from './state';

beforeEach(() => {
  window.history.replaceState({}, '', '/resources/seo-checklist');
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('getStorageKey', () => {
  it('namespaces state by path', () => {
    expect(getStorageKey('/resources/seo-checklist')).toBe(
      'wfu-checklist:/resources/seo-checklist'
    );
  });

  it('ignores a trailing slash so both URLs share progress', () => {
    expect(getStorageKey('/resources/seo-checklist/')).toBe(
      getStorageKey('/resources/seo-checklist')
    );
  });

  it('falls back to root for an empty path', () => {
    expect(getStorageKey('/')).toBe('wfu-checklist:/');
  });
});

describe('readFromUrl', () => {
  it('parses a comma separated list', () => {
    expect(readFromUrl('?checked=13,15,20')).toEqual(['13', '15', '20']);
  });

  it('parses the encoded form produced by sharing', () => {
    expect(readFromUrl('?checked=13%2C15%2C20')).toEqual(['13', '15', '20']);
  });

  it('drops non-numeric and duplicate ids', () => {
    expect(readFromUrl('?checked=13,abc,13,,20')).toEqual(['13', '20']);
  });

  it('returns an empty list when the param is absent', () => {
    expect(readFromUrl('?other=1')).toEqual([]);
  });
});

describe('hasUrlState', () => {
  it('detects the checked param, including when empty', () => {
    expect(hasUrlState('?checked=13')).toBe(true);
    expect(hasUrlState('?checked=')).toBe(true);
    expect(hasUrlState('?foo=1')).toBe(false);
  });
});

describe('storage round trip', () => {
  it('writes and reads back checked ids', () => {
    writeToStorage(['2', '7'], 'wfu-checklist:/test');

    expect(readFromStorage('wfu-checklist:/test')).toEqual(['2', '7']);
  });

  it('removes the entry when nothing is checked', () => {
    writeToStorage(['2'], 'wfu-checklist:/test');
    writeToStorage([], 'wfu-checklist:/test');

    expect(window.localStorage.getItem('wfu-checklist:/test')).toBeNull();
    expect(readFromStorage('wfu-checklist:/test')).toEqual([]);
  });
});

describe('syncUrl', () => {
  it('writes the checked param without adding history entries', () => {
    const before = window.history.length;

    syncUrl(['4', '9']);

    expect(window.location.search).toBe('?checked=4%2C9');
    expect(window.history.length).toBe(before);
  });

  it('removes the param when nothing is checked', () => {
    syncUrl(['4']);
    syncUrl([]);

    expect(window.location.search).toBe('');
  });
});

describe('buildShareUrl', () => {
  it('adds the checked param to an absolute URL', () => {
    expect(buildShareUrl(['13', '15'], 'https://webflow.com/accessibility/checklist')).toBe(
      'https://webflow.com/accessibility/checklist?checked=13%2C15'
    );
  });

  it('preserves other query params', () => {
    expect(buildShareUrl(['3'], 'https://example.com/c?locale=en')).toBe(
      'https://example.com/c?locale=en&checked=3'
    );
  });

  it('strips the param when nothing is checked', () => {
    expect(buildShareUrl([], 'https://example.com/c?checked=3')).toBe('https://example.com/c');
  });
});
