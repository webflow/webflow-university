/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';

import { initChecklistNav, NAV_CHILD_CLASS, slugifyHeading } from './nav';

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

function group(title: string, attrs = '', level: 'h2' | 'h3' = 'h2'): string {
  return `<div><${level}${attrs ? ` ${attrs}` : ''}>${title}</${level}><p>Phase intro</p></div>`;
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

  it('includes h3 links under their parent h2, in document order', () => {
    document.body.innerHTML = page(
      group('Development') +
        group('Static pages', '', 'h3') +
        group('Dynamic pages', '', 'h3') +
        group('Launch')
    );

    initChecklistNav();

    expect(navLinks().map((link) => link.textContent)).toEqual([
      'Development',
      'Static pages',
      'Dynamic pages',
      'Launch',
    ]);
    expect(navLinks().map((link) => link.getAttribute('href'))).toEqual([
      '#development',
      '#static-pages',
      '#dynamic-pages',
      '#launch',
    ]);
  });

  it('indents h3 links with the child combo class and leaves h2 links flat', () => {
    document.body.innerHTML = page(group('Development') + group('Static pages', '', 'h3'));

    initChecklistNav();

    expect(navLinks()[0].className).toBe('cc_course_link cc_checklist_nav-link');
    expect(navLinks()[0].classList.contains(NAV_CHILD_CLASS)).toBe(false);
    expect(navLinks()[1].classList.contains(NAV_CHILD_CLASS)).toBe(true);
    expect(navLinks()[1].className).toBe(`cc_course_link cc_checklist_nav-link ${NAV_CHILD_CLASS}`);
  });

  it('still works for h2-only checklists without child classes', () => {
    document.body.innerHTML = page(
      group('Design and build with SEO in mind') + group('Set up & track SEO performance')
    );

    initChecklistNav();

    expect(navLinks()).toHaveLength(2);
    navLinks().forEach((link) => {
      expect(link.classList.contains(NAV_CHILD_CLASS)).toBe(false);
    });
  });

  it('injects persistent scrollbar styles once, keeping WebKit rules free of standard overrides', () => {
    document.body.innerHTML = page(group('Technical foundations'));
    initChecklistNav();
    initChecklistNav();

    const styles = document.querySelectorAll('#wfu-checklist-nav-scrollbar');
    expect(styles).toHaveLength(1);
    const css = styles[0].textContent!;
    expect(css).toContain('scrollbar-gutter: stable');
    expect(css).toContain('::-webkit-scrollbar-thumb');
    expect(css).toContain('::-webkit-scrollbar-thumb:hover');
    const [webkit, fallback] = css.split('@supports not selector(::-webkit-scrollbar)');
    expect(webkit).not.toContain('scrollbar-width');
    expect(fallback).toContain('scrollbar-width: thin');
  });

  it('keeps the nav scrollbar always visible unless the Designer sets otherwise', () => {
    document.body.innerHTML = page(group('Technical foundations'));
    initChecklistNav();
    expect(document.querySelector('[data-checklist-nav]')?.getAttribute('data-scrollbar')).toBe(
      'always'
    );

    document.body.innerHTML = page(group('Technical foundations'));
    document.querySelector('[data-checklist-nav]')!.setAttribute('data-scrollbar', 'hover');
    initChecklistNav();
    expect(document.querySelector('[data-checklist-nav]')?.getAttribute('data-scrollbar')).toBe(
      'hover'
    );
  });

  it('renders the sections as an ordered list, nesting h3s under their h2', () => {
    document.body.innerHTML = page(
      group('Design handoff') +
        group('Development') +
        group('Static pages', '', 'h3') +
        group('Dynamic pages', '', 'h3') +
        group('Launch')
    );
    initChecklistNav();

    const top = document.querySelector('[data-checklist-nav] > ol[data-checklist-nav-list]')!;
    expect(top.getAttribute('role')).toBe('list');
    expect(Array.from(top.children).map((li) => li.querySelector('a')?.textContent)).toEqual([
      'Design handoff',
      'Development',
      'Launch',
    ]);

    const nested = top.children[1].querySelector(':scope > ol[data-checklist-nav-list]')!;
    expect(Array.from(nested.children).map((li) => li.textContent)).toEqual([
      'Static pages',
      'Dynamic pages',
    ]);
  });

  it('keeps an h3 with no h2 before it at the top level', () => {
    document.body.innerHTML = page(group('Static pages', '', 'h3') + group('Launch'));
    initChecklistNav();

    const top = document.querySelector('[data-checklist-nav] > ol')!;
    expect(top.children).toHaveLength(2);
    expect(top.querySelector('ol')).toBeNull();
  });

  it('splits a heading number into its own column, keeping the full text', () => {
    document.body.innerHTML = page(
      group('4. Development') + group('4.1. Static pages', '', 'h3') + group('Glossary')
    );
    initChecklistNav();

    const [h2, h3, plain] = navLinks();
    expect(h2.querySelector('[data-checklist-nav-marker]')?.textContent).toBe('4.');
    expect(h2.querySelector('[data-checklist-nav-label]')?.textContent?.trim()).toBe('Development');
    expect(h2.textContent).toBe('4. Development');
    expect(h3.querySelector('[data-checklist-nav-marker]')?.textContent).toBe('4.1.');
    expect(h3.textContent).toBe('4.1. Static pages');
    expect(plain.querySelector('[data-checklist-nav-marker]')).toBeNull();
    expect(plain.textContent).toBe('Glossary');
  });

  it('lays the list out on one shared grid, cancelling the child indent', () => {
    document.body.innerHTML = page(group('Development'));
    initChecklistNav();

    const css = document.getElementById('wfu-checklist-nav-scrollbar')!.textContent!;
    expect(css).toContain('grid-template-columns: auto auto 1fr auto');
    expect(css).toContain('grid-template-columns: subgrid');
    expect(css).toContain(`.${NAV_CHILD_CLASS}.${NAV_CHILD_CLASS}`);
  });

  it('assigns the matching id to each heading', () => {
    document.body.innerHTML = page(group('Technical foundations'));

    initChecklistNav();

    expect(document.querySelector('h2')?.id).toBe('technical-foundations');
  });

  it('assigns ids to h3 headings too', () => {
    document.body.innerHTML = page(group('Static pages', '', 'h3'));

    initChecklistNav();

    expect(document.querySelector('h3')?.id).toBe('static-pages');
    expect(navLinks()[0].getAttribute('href')).toBe('#static-pages');
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

  it('hides the whole section when the checklist has no h2 or h3', () => {
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

  it('leaves the section visible when the checklist only has h3 headings', () => {
    document.body.innerHTML = page(group('Static pages', '', 'h3'));

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
