/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { initTheme } from './index';

const cookiesMock = {
  get: vi.fn<(name: string) => string | undefined>(),
  set: vi.fn(),
  remove: vi.fn(),
};

function setupThemeDom(): void {
  document.body.innerHTML = `
    <button id="toLightMode">Light</button>
    <button id="toDarkMode">Dark</button>
    <button id="toLightModeMobile">Light mobile</button>
    <button id="toDarkModeMobile">Dark mobile</button>
  `;
}

describe('initTheme', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
    cookiesMock.get.mockReset();
    cookiesMock.set.mockReset();
    cookiesMock.remove.mockReset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes the saved theme and updates visible buttons', () => {
    Object.defineProperty(globalThis, 'Cookies', {
      configurable: true,
      value: cookiesMock,
    });
    cookiesMock.get.mockReturnValue('light');
    setupThemeDom();

    initTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.getElementById('toDarkMode')?.style.display).toBe('flex');
    expect(document.getElementById('toLightMode')?.style.display).toBe('none');
  });

  it('sets dark mode after a theme button click', () => {
    vi.useFakeTimers();
    Object.defineProperty(globalThis, 'Cookies', {
      configurable: true,
      value: cookiesMock,
    });
    setupThemeDom();
    initTheme();

    document.getElementById('toDarkMode')?.click();
    vi.advanceTimersByTime(380);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(cookiesMock.set).toHaveBeenLastCalledWith('wfu-theme', 'dark', {
      domain: '.webflow.com',
      expires: 365,
    });
  });
});
