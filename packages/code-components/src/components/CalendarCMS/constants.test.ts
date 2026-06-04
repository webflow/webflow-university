import { afterEach, describe, expect, it, vi } from 'vitest';

import { ABSOLUTE_SESSIONS_LIST_URL, getSessionsListUrl } from './constants';

describe('getSessionsListUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the local proxy URL on localhost', () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });

    expect(getSessionsListUrl()).toBe('/api/pro/sessions/list');
  });

  it('uses the local proxy URL on 127.0.0.1', () => {
    vi.stubGlobal('window', { location: { hostname: '127.0.0.1' } });

    expect(getSessionsListUrl()).toBe('/api/pro/sessions/list');
  });

  it('uses the absolute API URL on production hostnames', () => {
    vi.stubGlobal('window', { location: { hostname: 'university.webflow.com' } });

    expect(getSessionsListUrl()).toBe(ABSOLUTE_SESSIONS_LIST_URL);
  });
});
