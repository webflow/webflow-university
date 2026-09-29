/**
 * Checklist section navigation
 *
 * The checklist body is a CMS rich text field, so its phase headings arrive
 * without ids and there is nothing for a sidebar link to point at. Both halves
 * of the anchor are therefore built here: the id goes onto the heading, and the
 * link is cloned from a template authored in the Designer so that every pixel
 * of link styling stays editable there.
 *
 * Nested checklists may use `h3` under an `h2` phase (via the Checklist Heading
 * component's Heading Level prop). Those become a nested `ol` under their `h2`;
 * `h2`-only checklists keep a flat list.
 *
 * Headings carry their own numbering ("4.1. Static pages"), so the number is
 * split into its own column. Every title then starts at the same edge, and a
 * title that wraps lines up under its first word rather than its number.
 */

import { cleanText } from './items.js';

export const RICH_TEXT_SELECTOR = '#rich-content';
export const HEADING_SELECTOR = 'h2, h3';
export const NAV_SELECTOR = '[data-checklist-nav]';
export const NAV_ITEM_SELECTOR = '[data-checklist-nav-item]';
export const NAV_SECTION_SELECTOR = '[data-checklist-nav-section]';
export const NAV_CHILD_CLASS = 'cc_checklist_nav-link--child';
export const NAV_LIST_ATTR = 'data-checklist-nav-list';
export const NAV_MARKER_ATTR = 'data-checklist-nav-marker';
export const NAV_LABEL_ATTR = 'data-checklist-nav-label';
export const NAV_COUNT_ATTR = 'data-checklist-nav-count';

/** A leading outline number: "1.", "4.1.", "4.1", "10)". */
const HEADING_NUMBER_PATTERN = /^(\d+(?:\.\d+)*[.)]?)\s+(\S.*)$/;

const FALLBACK_SLUG = 'section';
const SCROLLBAR_STYLE_ID = 'wfu-checklist-nav-scrollbar';
const SCROLLBAR_ATTR = 'data-scrollbar';

/**
 * Styling `::-webkit-scrollbar` makes Chrome, Safari, and Edge draw a real
 * scrollbar that stays visible, instead of macOS's auto-hiding overlay. Chrome
 * 121+ ignores those pseudo-elements once `scrollbar-width` or
 * `scrollbar-color` is set, so the standard properties are limited to browsers
 * without them (Firefox). `scrollbar-gutter` reserves the space up front, so
 * the links never shift when the list starts to overflow.
 *
 * The nav sits inside `.cc_card-inner-group`, whose right padding is
 * `--size--fixed--fs_2`. The nav is pulled out over that padding so the
 * scrollbar sits at the card's edge, and padded back so the links stay put.
 * The thumb's transparent border keeps it off the card border.
 */
const SCROLLBAR_WIDTH = '10px';
const GROUP_PADDING = 'var(--size--fixed--fs_2, 1rem)';
/** Held on hover and drag too, so site-wide scrollbar hover colors never apply here. */
const THUMB_COLOR = 'var(--theme--t_border-primary, rgba(255, 255, 255, 0.24))';

const SCROLLBAR_CSS = `
${NAV_SELECTOR} {
  scrollbar-gutter: stable;
  margin-right: calc(-1 * ${GROUP_PADDING});
  padding-right: max(0px, calc(${GROUP_PADDING} - ${SCROLLBAR_WIDTH}));
}
${NAV_SELECTOR}::-webkit-scrollbar {
  width: ${SCROLLBAR_WIDTH};
}
${NAV_SELECTOR}::-webkit-scrollbar-track {
  background: transparent;
}
${NAV_SELECTOR}::-webkit-scrollbar-thumb,
${NAV_SELECTOR}::-webkit-scrollbar-thumb:hover,
${NAV_SELECTOR}::-webkit-scrollbar-thumb:active {
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
  background-color: ${THUMB_COLOR};
}
@supports not selector(::-webkit-scrollbar) {
  ${NAV_SELECTOR} {
    scrollbar-width: thin;
    scrollbar-color: ${THUMB_COLOR} transparent;
  }
}
`;

const LIST = `[${NAV_LIST_ATTR}]`;
const LINK = `${LIST} > li > a`;

/**
 * One grid spans the whole list: [h2 number] [h3 number] [title] [count].
 * Rows and nested lists share its columns through subgrid, so all `h2` titles
 * start at one edge, `h3` numbers sit under the `h2` titles, and `h3` titles
 * share an edge of their own. Headings without numbers collapse the number
 * columns to nothing.
 *
 * Nesting now does the indenting, so the Designer's child-link left padding is
 * cancelled here; the doubled class outranks
 * `.cc_course_link.cc_checklist_nav-link.cc_checklist_nav-link--child`.
 *
 * Each link is the only child of its `li`, so the Designer's
 * `.cc_course_link.cc_checklist_nav-link:last-child` bottom margin (meant for
 * the end of the old flat list) would land on every row. It is cancelled on
 * the links, which the doubled item attribute outranks, and moved to the end of the
 * top-level list.
 */
const LIST_CSS = `
${LIST} {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  row-gap: inherit;
  margin: 0;
  padding: 0;
  list-style: none;
}
${LIST} ${LIST} {
  grid-column: 2 / -1;
  grid-template-columns: subgrid;
}
${LIST} > li {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  row-gap: inherit;
  margin: 0;
  padding: 0;
}
${LINK} {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: baseline;
}
${LIST} .${NAV_CHILD_CLASS}.${NAV_CHILD_CLASS} {
  padding-left: 0;
}
${LIST} > li > ${NAV_ITEM_SELECTOR}${NAV_ITEM_SELECTOR} {
  margin-bottom: 0;
}
${NAV_SELECTOR} > ${LIST} {
  padding-bottom: 1rem;
}
[${NAV_MARKER_ATTR}] {
  grid-column: 1;
  padding-right: 0.5em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
[${NAV_LABEL_ATTR}] {
  grid-column: 2 / -2;
  min-width: 0;
}
${LINK} > [${NAV_COUNT_ATTR}] {
  grid-column: -2 / -1;
  justify-self: end;
  padding-left: 0.5rem;
}
@supports not (grid-template-columns: subgrid) {
  ${LINK} {
    display: flex;
    align-items: baseline;
  }
  [${NAV_LABEL_ATTR}] {
    flex: 1;
  }
}
`;

export function initChecklistNav(root: ParentNode = document): void {
  const nav = root.querySelector<HTMLElement>(NAV_SELECTOR);
  const content = root.querySelector<HTMLElement>(RICH_TEXT_SELECTOR);
  if (!nav || !content) {
    return;
  }

  const template = nav.querySelector<HTMLAnchorElement>(NAV_ITEM_SELECTOR);
  if (!template) {
    return;
  }

  const headings = Array.from(content.querySelectorAll<HTMLElement>(HEADING_SELECTOR)).filter(
    (heading) => cleanText(heading.textContent)
  );

  if (!headings.length) {
    hideSections(root);
    return;
  }

  const takenIds = collectIds(root);
  const list = createList();
  let parentEntry: HTMLLIElement | null = null;

  headings.forEach((heading) => {
    const link = template.cloneNode(false) as HTMLAnchorElement;
    link.setAttribute('href', `#${assignId(heading, takenIds)}`);
    link.append(...renderLinkText(cleanText(heading.textContent)));
    applyHeadingLevel(link, heading);

    const entry = document.createElement('li');
    entry.append(link);

    if (heading.tagName.toLowerCase() === 'h3' && parentEntry) {
      let children = parentEntry.querySelector<HTMLOListElement>(`:scope > ${LIST}`);
      if (!children) {
        children = createList();
        parentEntry.append(children);
      }
      children.append(entry);
      return;
    }

    list.append(entry);
    parentEntry = heading.tagName.toLowerCase() === 'h2' ? entry : null;
  });

  nav.replaceChildren(list);
  // Opts out of the site-wide hover-only scrollbar; set the attribute in the
  // Designer to override.
  if (!nav.hasAttribute(SCROLLBAR_ATTR)) {
    nav.setAttribute(SCROLLBAR_ATTR, 'always');
  }
  ensureScrollbarStyles();
}

function ensureScrollbarStyles(): void {
  if (document.getElementById(SCROLLBAR_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = SCROLLBAR_STYLE_ID;
  style.textContent = SCROLLBAR_CSS + LIST_CSS;
  document.head.appendChild(style);
}

/** Safari drops list semantics from `list-style: none` lists without a role. */
function createList(): HTMLOListElement {
  const list = document.createElement('ol');
  list.setAttribute(NAV_LIST_ATTR, '');
  list.setAttribute('role', 'list');
  return list;
}

/**
 * Splits "4.1. Static pages" into a number and a title. The title's leading
 * space keeps the link's accessible name and text reading "4.1. Static pages".
 */
function renderLinkText(text: string): Node[] {
  const label = document.createElement('span');
  label.setAttribute(NAV_LABEL_ATTR, '');

  const match = HEADING_NUMBER_PATTERN.exec(text);
  if (!match) {
    label.textContent = text;
    return [label];
  }

  const marker = document.createElement('span');
  marker.setAttribute(NAV_MARKER_ATTR, '');
  marker.textContent = match[1];
  label.textContent = ` ${match[2]}`;
  return [marker, label];
}

export function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || FALLBACK_SLUG;
}

/**
 * Child (`h3`) links keep the Designer-owned combo class for any other styling
 * set on it; its indent is handled by the nested list instead.
 */
function applyHeadingLevel(link: HTMLAnchorElement, heading: HTMLElement): void {
  link.classList.remove(NAV_CHILD_CLASS);
  if (heading.tagName.toLowerCase() === 'h3') {
    link.classList.add(NAV_CHILD_CLASS);
  }
}

/**
 * A heading keeps an id the CMS author set by hand; otherwise it gets a slug of
 * its own text, numbered if a checklist repeats a phase name.
 */
export function assignId(heading: HTMLElement, takenIds: Set<string>): string {
  if (heading.id) {
    takenIds.add(heading.id);
    return heading.id;
  }

  const base = slugifyHeading(cleanText(heading.textContent));
  let id = base;
  let suffix = 2;

  while (takenIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  takenIds.add(id);
  heading.id = id;
  return id;
}

export function collectIds(root: ParentNode): Set<string> {
  return new Set(
    Array.from(root.querySelectorAll<HTMLElement>('[id]')).map((element) => element.id)
  );
}

/**
 * Inline display beats the `cc_card-inner-group` class, which sets
 * `display: flex` and would otherwise survive the `hidden` attribute.
 */
function hideSections(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(NAV_SECTION_SELECTOR).forEach((section) => {
    section.style.display = 'none';
  });
}
