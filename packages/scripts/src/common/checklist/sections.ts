/**
 * Per-section checklist progress
 *
 * Each Checklist Heading renders a static "0/9 checked" status beside its
 * heading. This keeps that count live, and mirrors it (as "0 / 9") at the
 * right edge of the matching link in the "On this page" nav.
 *
 * A section is a heading plus every task after it until the next heading of
 * the same or a higher level, so an `h2` count includes the tasks in its `h3`
 * subgroups.
 *
 * The nav shows each `h2`'s count, except for an `h2` whose tasks all sit in
 * `h3` subgroups: there the counts move to those `h3` links instead.
 */

import { type ChecklistItem, cleanText, ITEM_SELECTOR } from './items.js';
import { HEADING_SELECTOR, NAV_SELECTOR, RICH_TEXT_SELECTOR } from './nav.js';

export const SECTION_STATUS_ATTR = 'data-checklist-section-status';
export const NAV_COUNT_ATTR = 'data-checklist-nav-count';

const NAV_COUNT_STYLE_ID = 'wfu-checklist-nav-count';
/** Matches the Designer's placeholder text, e.g. "0/9 checked". */
const STATUS_TEXT_PATTERN = /^\d+\s*\/\s*\d+\s+checked$/i;
/** How far up from a heading to look for its status before giving up. */
const STATUS_SEARCH_DEPTH = 3;

const NAV_COUNT_CSS = `
[data-checklist-nav-item]:has(> [${NAV_COUNT_ATTR}]) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}
[${NAV_COUNT_ATTR}] {
  flex: none;
  margin-left: auto;
  color: var(--theme--t_text-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
`;

export interface ChecklistSection {
  heading: HTMLElement;
  level: number;
  items: ChecklistItem[];
  status: HTMLElement | null;
  parent: ChecklistSection | null;
  /** Whether the "On this page" nav shows this section's count. */
  showInNav: boolean;
}

export function getChecklistSections(
  items: ChecklistItem[],
  root: ParentNode = document
): ChecklistSection[] {
  const content = root.querySelector<HTMLElement>(RICH_TEXT_SELECTOR);
  if (!content) {
    return [];
  }

  const itemsByElement = new Map(items.map((item) => [item.element, item]));
  const sections: ChecklistSection[] = [];
  const open: ChecklistSection[] = [];

  content.querySelectorAll<HTMLElement>(`${HEADING_SELECTOR}, ${ITEM_SELECTOR}`).forEach((node) => {
    const item = itemsByElement.get(node);
    if (item) {
      open.forEach((section) => section.items.push(item));
      return;
    }

    if (node.closest(ITEM_SELECTOR) || !cleanText(node.textContent)) {
      return;
    }

    const level = Number(node.tagName.slice(1));
    while (open.length && open[open.length - 1].level >= level) {
      open.pop();
    }

    const section: ChecklistSection = {
      heading: node,
      level,
      items: [],
      status: findStatus(node, content),
      parent: open[open.length - 1] ?? null,
      showInNav: false,
    };
    sections.push(section);
    open.push(section);
  });

  sections.forEach((section) => {
    section.showInNav =
      section.level === 2
        ? hasDirectItems(section, sections)
        : section.level === 3 && (!section.parent || !hasDirectItems(section.parent, sections));
  });

  return sections;
}

/** True when a section has tasks of its own, outside any subgroup. */
function hasDirectItems(section: ChecklistSection, sections: ChecklistSection[]): boolean {
  const inSubgroups = new Set(
    sections.filter((child) => child.parent === section).flatMap((child) => child.items)
  );
  return section.items.some((item) => !inSubgroups.has(item));
}

export function renderSectionProgress(
  sections: ChecklistSection[],
  root: ParentNode = document
): void {
  const nav = root.querySelector<HTMLElement>(NAV_SELECTOR);
  if (nav && sections.some((section) => section.showInNav)) {
    ensureNavCountStyles();
  }

  sections.forEach((section) => {
    const checked = section.items.filter((item) => item.checkbox.checked).length;
    const count = `${checked}/${section.items.length}`;

    if (section.status) {
      section.status.textContent = `${count} checked`;
    }

    if (nav && section.showInNav && section.heading.id) {
      const href = `#${section.heading.id}`;
      const link = Array.from(nav.querySelectorAll<HTMLElement>('a')).find(
        (anchor) => anchor.getAttribute('href') === href
      );
      if (link) {
        getNavCount(link).textContent = `${checked}\u00A0/\u00A0${section.items.length}`;
      }
    }
  });
}

/**
 * Prefers an explicit `[data-checklist-section-status]`, else the Designer's
 * "0/9 checked" text. The search walks up from the heading but stops before
 * any ancestor that also holds another heading, so one section never claims a
 * neighbour's status.
 */
function findStatus(heading: HTMLElement, content: HTMLElement): HTMLElement | null {
  let scope: HTMLElement | null = heading.parentElement;

  for (let depth = 0; scope && scope !== content && depth < STATUS_SEARCH_DEPTH; depth += 1) {
    const headings = scope.querySelectorAll(HEADING_SELECTOR);
    if (headings.length > 1) {
      return null;
    }

    const explicit = scope.querySelector<HTMLElement>(`[${SECTION_STATUS_ATTR}]`);
    if (explicit) {
      return explicit;
    }

    const byText = Array.from(scope.querySelectorAll<HTMLElement>('*')).find(
      (element) =>
        element.children.length === 0 && STATUS_TEXT_PATTERN.test(cleanText(element.textContent))
    );
    if (byText) {
      byText.setAttribute(SECTION_STATUS_ATTR, '');
      return byText;
    }

    scope = scope.parentElement;
  }

  return null;
}

function getNavCount(link: HTMLElement): HTMLElement {
  const existing = link.querySelector<HTMLElement>(`[${NAV_COUNT_ATTR}]`);
  if (existing) {
    return existing;
  }

  const count = document.createElement('span');
  count.setAttribute(NAV_COUNT_ATTR, '');
  link.append(count);
  return count;
}

function ensureNavCountStyles(): void {
  if (document.getElementById(NAV_COUNT_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = NAV_COUNT_STYLE_ID;
  style.textContent = NAV_COUNT_CSS;
  document.head.appendChild(style);
}
