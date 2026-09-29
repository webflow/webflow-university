/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';

import { getChecklistItems } from './items';
import { initChecklistNav } from './nav';
import { getChecklistSections, renderSectionProgress } from './sections';

/** Mirrors the Checklist Heading (No Slot) component. */
function heading(title: string, level: 'h2' | 'h3' = 'h2', status = '0/9 checked'): string {
  return `
    <div class="u-mb-0-5">
      <div class="u-d-flex-space-between bottom wrap">
        <div class="u-w-max-48">
          <${level} class="u-mb-1">${title}</${level}>
          <p class="u-mb-1">Select each task below for more details.</p>
        </div>
        ${status ? `<div class="u-mb-1 no-wrap">${status}</div>` : ''}
      </div>
    </div>`;
}

function task(title: string, checked = false): string {
  return `
    <details class="cc_accordion-item">
      <summary>
        <input type="checkbox" class="cc_accordion_checkbox" ${checked ? 'checked' : ''} />
        <div class="cc_accordion_title">${title}</div>
      </summary>
    </details>`;
}

function page(body: string): string {
  return `
    <div data-checklist-nav-section>
      <nav data-checklist-nav><a data-checklist-nav-item href="#">Section name</a></nav>
    </div>
    <div class="w-richtext" id="rich-content">${body}</div>`;
}

function statusOf(title: string): string {
  const el = Array.from(document.querySelectorAll('h2, h3')).find((h) => h.textContent === title)!;
  return el.closest('.u-d-flex-space-between')!.querySelector('.no-wrap')!.textContent!;
}

function navLink(title: string): HTMLElement {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-checklist-nav] a')).find((a) =>
    a.textContent?.startsWith(title)
  )!;
}

function navCount(title: string): string | null {
  return navLink(title).querySelector('[data-checklist-nav-count]')?.textContent ?? null;
}

function setup(body: string) {
  document.body.innerHTML = page(body);
  initChecklistNav();
  const items = getChecklistItems();
  const sections = getChecklistSections(items);
  renderSectionProgress(sections);
  return { items, sections };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('section progress', () => {
  it('replaces the static placeholder with each section’s own count', () => {
    setup(
      heading('Design handoff') +
        task('A', true) +
        task('B') +
        heading('Project setup') +
        task('C') +
        task('D', true) +
        task('E', true)
    );

    expect(statusOf('Design handoff')).toBe('1/2 checked');
    expect(statusOf('Project setup')).toBe('2/3 checked');
  });

  it('counts h3 subgroup tasks toward the parent h2 and toward the h3 alone', () => {
    setup(
      heading('Development') +
        heading('Static pages', 'h3') +
        task('A', true) +
        task('B') +
        heading('Dynamic pages', 'h3') +
        task('C', true) +
        heading('Launch') +
        task('D')
    );

    expect(statusOf('Development')).toBe('2/3 checked');
    expect(statusOf('Static pages')).toBe('1/2 checked');
    expect(statusOf('Dynamic pages')).toBe('1/1 checked');
    expect(statusOf('Launch')).toBe('0/1 checked');
  });

  it('updates live as tasks are checked', () => {
    const { items, sections } = setup(heading('Launch') + task('A') + task('B'));

    items[1].checkbox.checked = true;
    renderSectionProgress(sections);

    expect(statusOf('Launch')).toBe('1/2 checked');
  });

  it('shows the count on an h2 nav link when the h2 has tasks of its own', () => {
    setup(
      heading('Design handoff') +
        task('A', true) +
        heading('Extras', 'h3') +
        task('B') +
        heading('Launch') +
        task('C')
    );

    expect(navCount('Design handoff')).toBe('1\u00A0/\u00A02');
    expect(navCount('Extras')).toBeNull();
    expect(navCount('Launch')).toBe('0\u00A0/\u00A01');
    const css = document.getElementById('wfu-checklist-nav-count')?.textContent;
    expect(document.getElementById('wfu-checklist-nav-scrollbar')?.textContent).toMatch(
      /\[data-checklist-nav-count\] \{[^}]*justify-self: end/
    );
    expect(css).toContain('color: var(--theme--t_text-primary)');
  });

  it('moves counts to the h3 links when an h2 only holds subgroups', () => {
    setup(
      heading('Development') +
        heading('Static pages', 'h3') +
        task('A', true) +
        task('B') +
        heading('Dynamic pages', 'h3') +
        task('C')
    );

    expect(navCount('Development')).toBeNull();
    expect(navCount('Static pages')).toBe('1\u00A0/\u00A02');
    expect(navCount('Dynamic pages')).toBe('0\u00A0/\u00A01');
  });

  it('does not add a second nav count on re-render', () => {
    const { sections } = setup(heading('Launch') + task('A'));

    renderSectionProgress(sections);

    expect(navLink('Launch').querySelectorAll('[data-checklist-nav-count]')).toHaveLength(1);
  });

  it('leaves headings without a status element alone', () => {
    const { sections } = setup(heading('Launch', 'h2', '') + task('A'));

    expect(sections[0].status).toBeNull();
    expect(navCount('Launch')).toBe('0\u00A0/\u00A01');
  });

  it('prefers an explicit status element', () => {
    setup(
      heading('Launch', 'h2', '<span data-checklist-section-status>anything</span>') + task('A')
    );

    expect(document.querySelector('[data-checklist-section-status]')?.textContent).toBe(
      '0/1 checked'
    );
  });
});
