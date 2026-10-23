/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initOnboardingGlance } from './onboarding';

function page(): string {
  return `
    <div class="u-relative">
      <a href="#get-started" class="cc_glance_card"><span>Get started</span></a>
      <button class="cc_glance_copy-button"><div class="icon-1"><svg></svg></div></button>
    </div>
    <div class="u-relative">
      <a href="#prepare-to-launch" class="cc_glance_card"><span>Prepare to launch</span></a>
      <button class="cc_glance_copy-button"><div class="icon-1"><svg></svg></div></button>
    </div>
    <details id="get-started" class="cc_accordion-item" open></details>
    <details id="prepare-to-launch" class="cc_accordion-item"></details>
    <details id="unrelated" class="cc_accordion-item" open></details>
  `;
}

function details(id: string): HTMLDetailsElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLDetailsElement)) {
    throw new Error(`missing details #${id}`);
  }
  return element;
}

function copyButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('.cc_glance_copy-button'));
}

function mockDetailsContentTransition(duration: string): void {
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    if (pseudo === '::details-content') {
      return {
        transitionProperty: 'height, content-visibility',
        transitionDuration: `${duration}, ${duration}`,
        transitionDelay: '0s, 0s',
      } as CSSStyleDeclaration;
    }
    return original(element, pseudo);
  });
}

beforeEach(() => {
  window.history.replaceState({}, '', '/pro/onboarding');
  vi.useFakeTimers();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  initOnboardingGlance();
});

describe('initOnboardingGlance', () => {
  it('does nothing on pages without glance cards', () => {
    document.body.innerHTML = '<details id="get-started" class="cc_accordion-item"></details>';

    initOnboardingGlance();

    expect(details('get-started').open).toBe(false);
  });

  it('opens the accordion in the URL hash and closes the other stages', () => {
    window.history.replaceState({}, '', '/pro/onboarding#prepare-to-launch');
    document.body.innerHTML = page();

    initOnboardingGlance();

    expect(details('prepare-to-launch').open).toBe(true);
    expect(details('get-started').open).toBe(false);
    expect(details('unrelated').open).toBe(true);
  });

  it('opens the linked accordion when a glance card is clicked', () => {
    document.body.innerHTML = page();
    initOnboardingGlance();
    details('prepare-to-launch').open = true;

    document.querySelector<HTMLAnchorElement>('a[href="#get-started"]')?.click();

    expect(details('get-started').open).toBe(true);
    expect(details('prepare-to-launch').open).toBe(false);
    expect(details('unrelated').open).toBe(true);
    expect(window.location.hash).toBe('#get-started');
  });

  it('reopens the current stage when its card is clicked again', () => {
    window.history.replaceState({}, '', '/pro/onboarding#get-started');
    document.body.innerHTML = page();
    initOnboardingGlance();
    details('get-started').open = false;

    document.querySelector<HTMLAnchorElement>('a[href="#get-started"]')?.click();

    expect(details('get-started').open).toBe(true);
    expect(details('prepare-to-launch').open).toBe(false);
  });

  it('does not change accordions on a modified click', () => {
    document.body.innerHTML = page();
    initOnboardingGlance();

    document
      .querySelector('a[href="#prepare-to-launch"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }));

    expect(details('get-started').open).toBe(true);
    expect(details('prepare-to-launch').open).toBe(false);
  });

  it('opens the matching accordion when the hash changes', () => {
    document.body.innerHTML = page();
    initOnboardingGlance();

    window.location.hash = '#prepare-to-launch';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(details('prepare-to-launch').open).toBe(true);
    expect(details('get-started').open).toBe(false);
  });

  it('leaves accordions alone when the hash does not match a stage', () => {
    document.body.innerHTML = page();
    initOnboardingGlance();
    details('prepare-to-launch').open = true;

    window.location.hash = '#somewhere-else';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(details('prepare-to-launch').open).toBe(true);
    expect(details('get-started').open).toBe(true);
  });

  it('copies the stage URL and crossfades the link icon to a check', async () => {
    document.body.innerHTML = page();
    initOnboardingGlance();
    const button = copyButtons()[1];

    button.click();
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/pro/onboarding#prepare-to-launch`
    );
    expect(button.hasAttribute('data-checklist-copied')).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Link copied');
    expect(window.location.hash).toBe('');
    expect(details('prepare-to-launch').open).toBe(false);
    expect(details('get-started').open).toBe(true);

    vi.advanceTimersByTime(2050);

    expect(button.hasAttribute('data-checklist-copied')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Copy link to this section');
  });

  it('keeps the link icon when the clipboard is unavailable', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    document.body.innerHTML = page();
    initOnboardingGlance();
    const button = copyButtons()[0];

    button.click();
    await vi.waitFor(() => expect(button.getAttribute('aria-label')).toBe('Press Ctrl+C to copy'));

    expect(button.hasAttribute('data-checklist-copied')).toBe(false);
  });

  it('scrolls to the stage after the accordion height transition', () => {
    document.body.innerHTML = page();
    initOnboardingGlance();
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    mockDetailsContentTransition('0.15s');

    const card = document.querySelector<HTMLAnchorElement>('a[href="#prepare-to-launch"]');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    card?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.location.hash).toBe('');
    expect(details('prepare-to-launch').open).toBe(true);
    expect(scroll).not.toHaveBeenCalled();

    vi.advanceTimersByTime(149);
    expect(window.location.hash).toBe('');
    expect(scroll).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(window.location.hash).toBe('#prepare-to-launch');
    expect(scroll).toHaveBeenCalledOnce();
    expect(scroll.mock.instances[0]).toBe(details('prepare-to-launch'));
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
  });

  it('keeps the card click away from Webflow page-level anchor scrolling', () => {
    document.body.innerHTML = page();
    initOnboardingGlance();
    const documentClick = vi.fn();
    document.addEventListener('click', documentClick);

    document.querySelector<HTMLAnchorElement>('a[href="#prepare-to-launch"]')?.click();
    document.removeEventListener('click', documentClick);

    expect(documentClick).not.toHaveBeenCalled();
    expect(details('prepare-to-launch').open).toBe(true);
  });

  it('drops a stale scroll when another stage is chosen during the transition', () => {
    document.body.innerHTML = page();
    initOnboardingGlance();
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    mockDetailsContentTransition('0.15s');

    document.querySelector<HTMLAnchorElement>('a[href="#prepare-to-launch"]')?.click();
    vi.advanceTimersByTime(100);
    document.querySelector<HTMLAnchorElement>('a[href="#get-started"]')?.click();
    vi.advanceTimersByTime(100);

    expect(window.location.hash).toBe('');
    expect(scroll).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(window.location.hash).toBe('#get-started');
    expect(scroll).toHaveBeenCalledOnce();
    expect(scroll.mock.instances[0]).toBe(details('get-started'));
  });

  it('labels the copy button beside each card without adding it to the link name', () => {
    document.body.innerHTML = page();
    initOnboardingGlance();

    copyButtons().forEach((button) => {
      expect(button.getAttribute('aria-label')).toBe('Copy link to this section');
      expect(button.type).toBe('button');
      expect(button.closest('a')).toBeNull();
    });
  });

  it('does not bind the copy button twice', async () => {
    document.body.innerHTML = page();
    initOnboardingGlance();
    initOnboardingGlance();

    copyButtons()[0].click();
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));
  });
});
