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
 * component's Heading Level prop). Those become indented child links; `h2`-only
 * checklists keep a flat list.
 */

import { cleanText } from './items.js';

export const RICH_TEXT_SELECTOR = '#rich-content';
export const HEADING_SELECTOR = 'h2, h3';
export const NAV_SELECTOR = '[data-checklist-nav]';
export const NAV_ITEM_SELECTOR = '[data-checklist-nav-item]';
export const NAV_SECTION_SELECTOR = '[data-checklist-nav-section]';
export const NAV_CHILD_CLASS = 'cc_checklist_nav-link--child';

const FALLBACK_SLUG = 'section';
const SCROLLBAR_STYLE_ID = 'wfu-checklist-nav-scrollbar';

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
${NAV_SELECTOR}::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
  background-color: var(--theme--t_border-primary, rgba(255, 255, 255, 0.24));
}
@supports not selector(::-webkit-scrollbar) {
  ${NAV_SELECTOR} {
    scrollbar-width: thin;
    scrollbar-color: var(--theme--t_border-primary, rgba(255, 255, 255, 0.24)) transparent;
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
  const links = headings.map((heading) => {
    const link = template.cloneNode(false) as HTMLAnchorElement;
    link.setAttribute('href', `#${assignId(heading, takenIds)}`);
    link.textContent = cleanText(heading.textContent);
    applyHeadingLevel(link, heading);
    return link;
  });

  nav.replaceChildren(...links);
  ensureScrollbarStyles();
}

function ensureScrollbarStyles(): void {
  if (document.getElementById(SCROLLBAR_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = SCROLLBAR_STYLE_ID;
  style.textContent = SCROLLBAR_CSS;
  document.head.appendChild(style);
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
 * Child (`h3`) links pick up a Designer-owned combo class so indent stays
 * editable in Webflow. `h2` links keep the flat template classes only.
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
