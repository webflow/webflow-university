/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSectionUrl, HEADING_LINK_CLASS, initHeadingLinks } from './heading-links';

function page(body: string, { withCopyButton = false } = {}): string {
  const copyButton = withCopyButton
    ? `<button data-checklist-copy-url>
        <div data-checklist-icon="link"><svg data-source="designer-link"></svg></div>
        <div data-checklist-icon="check"><svg data-source="designer-check"></svg></div>
      </button>`
    : '';
  return `${copyButton}<div class="w-richtext" id="rich-content">${body}</div>`;
}

function headingLinks(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(`.${HEADING_LINK_CLASS}`));
}

/** happy-dom's TransitionEvent drops `propertyName`, so set it by hand. */
function opacityEvent(type: string): Event {
  return Object.assign(new Event(type), { propertyName: 'opacity' });
}

beforeEach(() => {
  window.history.replaceState({}, '', '/resources/launch-checklist?checked=1');
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
});

describe('initHeadingLinks', () => {
  it('appends a link to every h2 and h3 in the rich text', () => {
    document.body.innerHTML = page(
      '<h2 id="development">Development</h2><h3 id="static-pages">Static pages</h3>'
    );

    initHeadingLinks();

    const links = headingLinks();
    expect(links).toHaveLength(2);
    expect(links[0].parentElement?.tagName).toBe('H2');
    expect(links[0].getAttribute('data-checklist-heading-link')).toBe('development');
    expect(links[1].parentElement?.tagName).toBe('H3');
    expect(links[1].getAttribute('data-checklist-heading-link')).toBe('static-pages');
  });

  it('assigns an id to headings that have none', () => {
    document.body.innerHTML = page('<h2>Project setup</h2>');

    initHeadingLinks();

    expect(document.querySelector('h2')?.id).toBe('project-setup');
    expect(headingLinks()[0].getAttribute('data-checklist-heading-link')).toBe('project-setup');
  });

  it('ignores headings outside the rich text and headings with no text', () => {
    document.body.innerHTML = '<h2>Sidebar</h2>' + page('<h2>  </h2><h2>Launch</h2>');

    initHeadingLinks();

    expect(headingLinks()).toHaveLength(1);
    expect(headingLinks()[0].getAttribute('data-checklist-heading-link')).toBe('launch');
  });

  it('adds no text to the heading, so nav and exports read it unchanged', () => {
    document.body.innerHTML = page('<h2>Launch</h2>');

    initHeadingLinks();

    expect(document.querySelector('h2')?.textContent).toBe('Launch');
  });

  it('does not add a second link when run twice', () => {
    document.body.innerHTML = page('<h2>Launch</h2>');

    initHeadingLinks();
    initHeadingLinks();

    expect(headingLinks()).toHaveLength(1);
  });

  it('stacks the link and check icons on creation', () => {
    document.body.innerHTML = page('<h2>Launch</h2>');

    initHeadingLinks();

    const stack = headingLinks()[0].querySelector('[data-checklist-icon-stack]');
    expect(stack?.querySelector('[data-checklist-icon="link"]')).not.toBeNull();
    expect(stack?.querySelector('[data-checklist-icon="check"]')).not.toBeNull();
    expect(document.getElementById('wfu-checklist-copy-confirm')).not.toBeNull();
  });

  it('reuses the Designer icons from the sidebar copy-link control', () => {
    document.body.innerHTML = page('<h2>Launch</h2>', { withCopyButton: true });

    initHeadingLinks();

    const link = headingLinks()[0];
    expect(
      link.querySelector('[data-checklist-icon="link"] svg')?.getAttribute('data-source')
    ).toBe('designer-link');
    expect(
      link.querySelector('[data-checklist-icon="check"] svg')?.getAttribute('data-source')
    ).toBe('designer-check');
  });

  it('copies the section URL without the checklist progress query', async () => {
    document.body.innerHTML = page('<h2 id="launch">Launch</h2>');
    initHeadingLinks();

    headingLinks()[0].click();
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());

    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toBe(
      `${window.location.origin}/resources/launch-checklist#launch`
    );
    expect(getSectionUrl('launch')).toBe(
      `${window.location.origin}/resources/launch-checklist#launch`
    );
  });

  it('morphs to a checkmark on copy, then reverts to the link icon', async () => {
    document.body.innerHTML = page('<h2 id="launch">Launch</h2>');
    initHeadingLinks();
    const link = headingLinks()[0];

    link.click();
    await vi.waitFor(() => expect(link.hasAttribute('data-checklist-copied')).toBe(true));
    expect(link.getAttribute('aria-label')).toBe('Link copied');

    vi.advanceTimersByTime(2050);

    expect(link.hasAttribute('data-checklist-copied')).toBe(false);
    expect(link.getAttribute('aria-label')).toBe('Copy link to this section');
  });

  it('keeps the checkmark until an idle link has faded out', async () => {
    document.body.innerHTML = page('<h2 id="launch">Launch</h2>');
    initHeadingLinks();
    const link = headingLinks()[0];

    link.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(link.hasAttribute('data-checklist-copy-hold')).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(link.hasAttribute('data-checklist-copy-hold')).toBe(false);

    link.dispatchEvent(opacityEvent('transitionrun'));
    vi.advanceTimersByTime(500);
    expect(link.hasAttribute('data-checklist-copied')).toBe(true);

    link.dispatchEvent(opacityEvent('transitionend'));
    expect(link.hasAttribute('data-checklist-copied')).toBe(false);
  });

  it('reverts if the fade-out never reports finishing', async () => {
    document.body.innerHTML = page('<h2 id="launch">Launch</h2>');
    initHeadingLinks();
    const link = headingLinks()[0];

    link.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(link.hasAttribute('data-checklist-copied')).toBe(true);
    vi.advanceTimersByTime(2000);
    link.dispatchEvent(opacityEvent('transitionrun'));

    vi.advanceTimersByTime(1000);

    expect(link.hasAttribute('data-checklist-copied')).toBe(false);
  });

  it('restarts the confirmation timer on a repeat click', async () => {
    document.body.innerHTML = page('<h2 id="launch">Launch</h2>');
    initHeadingLinks();
    const link = headingLinks()[0];

    link.click();
    await vi.waitFor(() => expect(link.hasAttribute('data-checklist-copied')).toBe(true));
    vi.advanceTimersByTime(1500);

    link.click();
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
    vi.advanceTimersByTime(1000);

    expect(link.hasAttribute('data-checklist-copied')).toBe(true);
  });

  it('is a button that only copies, without navigating to the section', async () => {
    document.body.innerHTML = page('<h2 id="launch">Launch</h2>');
    initHeadingLinks();
    const link = headingLinks()[0];

    expect(link.tagName).toBe('BUTTON');
    expect(link.type).toBe('button');
    expect(link.hasAttribute('href')).toBe(false);

    link.click();
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());

    expect(window.location.hash).toBe('');
  });

  it('keeps the link icon when the clipboard is unavailable', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    document.body.innerHTML = page('<h2 id="launch">Launch</h2>');
    initHeadingLinks();
    const link = headingLinks()[0];

    link.click();
    await vi.waitFor(() => expect(link.getAttribute('aria-label')).toBe('Press Ctrl+C to copy'));

    expect(link.hasAttribute('data-checklist-copied')).toBe(false);
  });
});
