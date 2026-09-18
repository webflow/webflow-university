/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initChecklist } from './index';

function task(title: string, checked = false): string {
  return `
    <details class="cc_accordion-item">
      <summary class="cc_accordion_summary">
        <label class="cc_accordion_checkbox-label">
          <input type="checkbox" class="cc_accordion_checkbox" ${checked ? 'checked' : ''} />
          <h3 class="cc_accordion_title">${title}</h3>
        </label>
      </summary>
      <div>
        <div class="cc_accordion_badge" badge-label="Critical"><div>Critical</div></div>
        <div class="accordion_rich-text w-richtext"><p>${title} details</p></div>
      </div>
    </details>
  `;
}

function setupPage(taskCount = 4): void {
  const tasks = Array.from({ length: taskCount }, (_, i) => task(`Task ${i + 1}`)).join('');

  document.body.innerHTML = `
    <h1>SEO checklist</h1>
    <div class="cc_course_info_sidebar" data-checklist-sidebar>
      <div class="cc_course-progress-wrap">
        <div class="cc_course-progress-bar" data-checklist-progress="bar"></div>
      </div>
      <div class="cc_course-progress-percent" data-checklist-progress="percent">0%</div>
      <button data-checklist-copy-url aria-label="Copy link to this checklist">
        <span data-checklist-icon="link"></span>
        <span data-checklist-icon="check"></span>
      </button>
      <button data-checklist-download="csv" aria-label="Download as CSV"></button>
      <button data-checklist-download="md" aria-label="Download as Markdown"></button>
      <button data-checklist-clear aria-label="Clear checklist"></button>
    </div>
    <div class="w-richtext">
      <h2>Design and build with SEO in mind</h2>
      ${tasks}
    </div>
  `;
}

function checkboxes(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('.cc_accordion_checkbox'));
}

function progressBar(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-checklist-progress="bar"]')!;
}

function percentText(): string {
  return document.querySelector<HTMLElement>('[data-checklist-progress="percent"]')!.textContent!;
}

function click(selector: string): void {
  document.querySelector<HTMLElement>(selector)!.click();
}

beforeEach(() => {
  window.history.replaceState({}, '', '/resources/seo-checklist');
  window.localStorage.clear();
  vi.useFakeTimers();

  Object.defineProperty(window.URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:x'),
    writable: true,
  });
  Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  window.localStorage.clear();
});

describe('initChecklist', () => {
  it('does nothing when the page has no checklist', () => {
    document.body.innerHTML = '<div data-checklist-progress="percent">0%</div>';

    initChecklist();

    expect(document.querySelector('[data-checklist-progress="percent"]')!.textContent).toBe('0%');
  });

  it('renders progress as a percentage of all tasks', () => {
    setupPage(4);
    initChecklist();

    expect(percentText()).toBe('0%');

    checkboxes()[0].click();

    expect(percentText()).toBe('25%');
    expect(progressBar().style.width).toBe('25%');
  });

  it('exposes progress to assistive technology', () => {
    setupPage(4);
    initChecklist();

    checkboxes()[0].click();

    expect(progressBar().getAttribute('role')).toBe('progressbar');
    expect(progressBar().getAttribute('aria-valuenow')).toBe('25');
    expect(progressBar().getAttribute('aria-valuetext')).toBe('1 of 4 tasks complete');
  });

  it('mirrors checked tasks into the URL', () => {
    setupPage(4);
    initChecklist();

    checkboxes()[1].click();
    checkboxes()[3].click();

    expect(window.location.search).toBe('?checked=2%2C4');
  });

  it('persists progress across reloads', () => {
    setupPage(4);
    initChecklist();
    checkboxes()[2].click();

    // Simulate a fresh page load on the same path, without URL state.
    window.history.replaceState({}, '', '/resources/seo-checklist');
    setupPage(4);
    initChecklist();

    expect(checkboxes()[2].checked).toBe(true);
    expect(percentText()).toBe('25%');
  });

  it('lets a shared URL win over locally saved progress', () => {
    window.localStorage.setItem('wfu-checklist:/resources/seo-checklist', '1');
    window.history.replaceState({}, '', '/resources/seo-checklist?checked=3,4');
    setupPage(4);

    initChecklist();

    expect(checkboxes().map((c) => c.checked)).toEqual([false, false, true, true]);
    expect(percentText()).toBe('50%');
  });

  it('copies a shareable link carrying the checked tasks', async () => {
    setupPage(4);
    initChecklist();
    checkboxes()[0].click();

    click('[data-checklist-copy-url]');
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());

    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toContain('checked=1');
  });

  it('crossfades to a checkmark on copy, then snaps back to the link icon', async () => {
    setupPage(2);
    initChecklist();

    click('[data-checklist-copy-url]');
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());

    const button = document.querySelector<HTMLElement>('[data-checklist-copy-url]')!;
    expect(button.hasAttribute('data-checklist-copied')).toBe(true);
    expect(document.getElementById('wfu-checklist-copy-confirm')).not.toBeNull();

    vi.advanceTimersByTime(2000);

    expect(button.hasAttribute('data-checklist-copied')).toBe(false);
  });

  it('clears every task and drops the URL param', () => {
    setupPage(4);
    initChecklist();
    checkboxes()[0].click();
    checkboxes()[1].click();

    click('[data-checklist-clear]');

    expect(checkboxes().every((c) => !c.checked)).toBe(true);
    expect(percentText()).toBe('0%');
    expect(window.location.search).toBe('');
    expect(window.localStorage.getItem('wfu-checklist:/resources/seo-checklist')).toBeNull();
  });

  it('downloads a CSV named after the page', () => {
    setupPage(2);
    initChecklist();

    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    const createElement = vi.spyOn(document, 'createElement');
    createElement.mockImplementationOnce(() => anchor);

    click('[data-checklist-download="csv"]');

    expect(clickSpy).toHaveBeenCalled();
    expect(anchor.download).toBe('seo-checklist.csv');
  });

  it('downloads Markdown named after the page', () => {
    setupPage(2);
    initChecklist();

    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    const createElement = vi.spyOn(document, 'createElement');
    createElement.mockImplementationOnce(() => anchor);

    click('[data-checklist-download="md"]');

    expect(clickSpy).toHaveBeenCalled();
    expect(anchor.download).toBe('seo-checklist.md');
  });

  it('also drives the legacy header Markdown button', () => {
    setupPage(2);
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<a data-copy-checklist-md href="#">Download Markdown</a>'
    );
    initChecklist();

    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockImplementationOnce(() => anchor);

    click('[data-copy-checklist-md]');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('reports the outcome on the icon-only control, then restores its label', () => {
    setupPage(2);
    initChecklist();

    click('[data-checklist-clear]');
    const button = document.querySelector<HTMLElement>('[data-checklist-clear]')!;

    expect(button.getAttribute('aria-label')).toBe('Checklist cleared');

    vi.advanceTimersByTime(2000);

    expect(button.getAttribute('aria-label')).toBe('Clear checklist');
  });
});
