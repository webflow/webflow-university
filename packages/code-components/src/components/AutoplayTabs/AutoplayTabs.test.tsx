import { act } from 'react';
import type React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AutoplayTabs from './AutoplayTabs';

function renderComponent(component: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  const root = createRoot(container);
  document.body.appendChild(container);

  act(() => {
    root.render(component);
  });

  return { container, root };
}

function getTabButton(container: HTMLElement, label: string): HTMLButtonElement {
  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('.tab-button'));
  const button = buttons.find((candidate) => candidate.textContent?.includes(label));

  if (!button) {
    throw new Error(`Tab button "${label}" not found`);
  }

  return button;
}

describe('AutoplayTabs', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the default tabs and images', () => {
    const { container } = renderComponent(<AutoplayTabs />);

    expect(getTabButton(container, 'Tab 1')).toBeTruthy();
    expect(getTabButton(container, 'Tab 2')).toBeTruthy();
    expect(getTabButton(container, 'Tab 3')).toBeTruthy();
    expect(container.querySelectorAll('img[alt*="Tab"]').length).toBe(6);
  });

  it('switches active tab when clicked', () => {
    const { container } = renderComponent(<AutoplayTabs />);

    act(() => {
      getTabButton(container, 'Tab 2').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(getTabButton(container, 'Tab 2').classList.contains('active')).toBe(true);
    expect(getTabButton(container, 'Tab 1').classList.contains('active')).toBe(false);
  });

  it('advances tabs on an autoplay timer', () => {
    vi.useFakeTimers();
    const { container } = renderComponent(<AutoplayTabs autoplay autoplayDuration={1000} />);

    expect(getTabButton(container, 'Tab 1').classList.contains('active')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(getTabButton(container, 'Tab 2').classList.contains('active')).toBe(true);
  });

  it('cleans up the autoplay timer on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { root } = renderComponent(<AutoplayTabs autoplay autoplayDuration={1000} />);

    act(() => {
      root.unmount();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
