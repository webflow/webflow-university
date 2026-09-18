/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';

import { initChecklistNav, slugifyHeading } from './nav';

function page(headings: string, { withTemplate = true, withNav = true } = {}): string {
  const template = withTemplate
    ? '<a class="cc_course_link cc_checklist_nav-link" data-checklist-nav-item href="#">Section name</a>'
    : '';
  const nav = withNav
    ? `<nav class="cc_checklist_nav" data-checklist-nav aria-label="Checklist sections">${template}</nav>`
    : '';

  return `
    <div class="w-richtext" id="rich-content">${headings}</div>
    <aside>
      <div class="cc_card-section-header" data-checklist-nav-section>
        <h4 class="h5">On this page</h4>
      </div>
      <div class="cc_card-inner-group" data-checklist-nav-section>${nav}</div>
    </aside>
  `;
}

function group(title: string, attrs = ''): string {
  return `<div><h2${attrs ? ` ${attrs}` : ''}>${title}</h2><p>Phase intro</p></div>`;
}

function navLinks(): HTMLAnchorElement[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-checklist-nav] a'));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('slugifyHeading', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugifyHeading('Technical Foundations')).toBe('technical-foundations');
  });

  it('collapses punctuation and runs of whitespace', () => {
    expect(slugifyHeading('Content & keywords:  the basics!')).toBe('content-keywords-the-basics');
  });

  it('strips accents rather than dropping the letters', () => {
    expect(slugifyHeading('Référencement')).toBe('referencement');
  });

  it('falls back to a generic slug when nothing survives', () => {
    expect(slugifyHeading('—!?—')).toBe('section');
  });
});

describe('initChecklistNav', () => {
  it('renders one link per h2, in document order', () => {
    document.body.innerHTML = page(
      group('Technical foundations') + group('Content & keywords') + group('Off-page signals')
    );

    initChecklistNav();

    expect(navLinks().map((link) => link.textContent)).toEqual([
      'Technical foundations',
      'Content & keywords',
      'Off-page signals',
    ]);
    expect(navLinks().map((link) => link.getAttribute('href'))).toEqual([
      '#technical-foundations',
      '#content-keywords',
      '#off-page-signals',
    ]);
  });

  it('assigns the matching id to each heading', () => {
    document.body.innerHTML = page(group('Technical foundations'));

    initChecklistNav();

    expect(document.querySelector('h2')?.id).toBe('technical-foundations');
  });

  it('keeps the styling classes from the authored template link', () => {
    document.body.innerHTML = page(group('Technical foundations'));

    initChecklistNav();

    expect(navLinks()[0].className).toBe('cc_course_link cc_checklist_nav-link');
  });

  it('preserves an id the CMS author already set on a heading', () => {
    document.body.innerHTML = page(group('Technical foundations', 'id="phase-one"'));

    initChecklistNav();

    expect(navLinks()[0].getAttribute('href')).toBe('#phase-one');
    expect(document.querySelector('h2')?.id).toBe('phase-one');
  });

  it('gives repeated heading text unique ids', () => {
    document.body.innerHTML = page(group('Extras') + group('Extras') + group('Extras'));

    initChecklistNav();

    expect(navLinks().map((link) => link.getAttribute('href'))).toEqual([
      '#extras',
      '#extras-2',
      '#extras-3',
    ]);
  });

  it('does not collide with ids already on the page', () => {
    document.body.innerHTML = page(group('Rich content'));

    initChecklistNav();

    expect(navLinks()[0].getAttribute('href')).toBe('#rich-content-2');
  });

  it('ignores headings outside the rich text block', () => {
    document.body.innerHTML =
      '<h2>Page title</h2>' + page(group('Technical foundations')) + '<h2>Footer</h2>';

    initChecklistNav();

    expect(navLinks()).toHaveLength(1);
  });

  it('skips headings with no text', () => {
    document.body.innerHTML = page(group('Technical foundations') + '<div><h2>   </h2></div>');

    initChecklistNav();

    expect(navLinks()).toHaveLength(1);
  });

  it('hides the whole section when the checklist has no h2', () => {
    document.body.innerHTML = page('<p>A checklist with no phases</p>');

    initChecklistNav();

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-checklist-nav-section]')
    );
    expect(sections).toHaveLength(2);
    sections.forEach((section) => expect(section.style.display).toBe('none'));
  });

  it('leaves the section visible when there are headings', () => {
    document.body.innerHTML = page(group('Technical foundations'));

    initChecklistNav();

    document
      .querySelectorAll<HTMLElement>('[data-checklist-nav-section]')
      .forEach((section) => expect(section.style.display).toBe(''));
  });

  it('is a no-op when the sidebar has no nav container', () => {
    document.body.innerHTML = page(group('Technical foundations'), { withNav: false });

    expect(() => initChecklistNav()).not.toThrow();
    expect(document.querySelector('h2')?.id).toBe('');
  });

  it('is a no-op when the nav has no template link to clone', () => {
    document.body.innerHTML = page(group('Technical foundations'), { withTemplate: false });

    expect(() => initChecklistNav()).not.toThrow();
    expect(navLinks()).toHaveLength(0);
  });

  it('is a no-op when the page has no rich text block', () => {
    document.body.innerHTML =
      '<nav data-checklist-nav><a data-checklist-nav-item href="#">Section</a></nav>';

    expect(() => initChecklistNav()).not.toThrow();
    expect(navLinks()).toHaveLength(1);
  });

  it('rebuilds cleanly when run twice', () => {
    document.body.innerHTML = page(group('Technical foundations') + group('Off-page signals'));

    initChecklistNav();
    initChecklistNav();

    expect(navLinks().map((link) => link.getAttribute('href'))).toEqual([
      '#technical-foundations',
      '#off-page-signals',
    ]);
  });
});
