/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkCookieEnabled, getCurrentDomain, StorageManager } from './storage';

const cookiesMock = {
  get: vi.fn<(name: string) => string | undefined>(),
  set: vi.fn(),
  remove: vi.fn(),
};

function setHostname(hostname: string): void {
  vi.stubGlobal('location', { hostname });
}

describe('storage utilities', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'Cookies', {
      configurable: true,
      value: cookiesMock,
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.cookie = 'testcookie=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/';
    cookiesMock.get.mockReset();
    cookiesMock.set.mockReset();
    cookiesMock.remove.mockReset();
    vi.unstubAllGlobals();
  });

  it('uses the Webflow staging host as its cookie domain', () => {
    setHostname('wfu3.webflow.io');

    expect(getCurrentDomain()).toBe('wfu3.webflow.io');
  });

  it('uses the shared Webflow domain for other hostnames', () => {
    setHostname('university.webflow.com');

    expect(getCurrentDomain()).toBe('.webflow.com');
  });

  it('detects when cookies can be written', () => {
    expect(checkCookieEnabled()).toBe(true);
  });

  it('reads cookie values before localStorage values', () => {
    cookiesMock.get.mockReturnValue('dark');
    localStorage.setItem('theme', 'light');

    const storage = new StorageManager('wfu-theme', 'theme');

    expect(storage.getValue()).toBe('dark');
  });

  it('migrates localStorage values to cookies when cookies are enabled', () => {
    localStorage.setItem('theme', 'light');

    new StorageManager('wfu-theme', 'theme');

    expect(cookiesMock.set).toHaveBeenCalledWith('wfu-theme', 'light', {
      domain: '.webflow.com',
      expires: 365,
    });
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('falls back to localStorage when cookie writes fail', () => {
    cookiesMock.set.mockImplementation(() => {
      throw new Error('blocked');
    });
    const storage = new StorageManager('wfu-theme', 'theme');

    storage.setValue('dark');

    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
