/**
 * Section permalinks on checklist headings
 *
 * Each `h2` and `h3` in the checklist rich text gets a small link icon at its
 * end. The icon fades in while the heading is hovered, and clicking it copies
 * the URL of that section, then crossfades to a checkmark like the sidebar's
 * copy-link control.
 *
 * The control is a button rather than an anchor so a click only copies; it
 * never navigates or scrolls to the section.
 */

import { COPY_HOLD_ATTR, setFeedback, showCopyConfirmation, stackCopyIcons } from './feedback.js';
import { cleanText } from './items.js';
import { assignId, collectIds, HEADING_SELECTOR, RICH_TEXT_SELECTOR } from './nav.js';

export const HEADING_LINK_CLASS = 'cc_heading-link';

const HEADING_LINK_ATTR = 'data-checklist-heading-link';
const COPY_URL_SELECTOR = '[data-checklist-copy-url]';
const LINK_LABEL = 'Copy link to this section';
const STYLE_ID = 'wfu-checklist-heading-links';

const FALLBACK_ICONS = {
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
};

/**
 * Hover-only on pointer devices; always faintly visible on touch, where there
 * is no hover to reveal it.
 */
const HEADING_LINK_CSS = `
.${HEADING_LINK_CLASS} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  margin: 0 0 0 0.3em;
  padding: 0;
  border: 0;
  border-radius: 0.15em;
  background: none;
  font: inherit;
  vertical-align: middle;
  color: inherit;
  cursor: pointer;
  opacity: 0;
  transition: opacity 150ms ease, color 150ms ease;
}
/* The 1em button is the hit area; the icon inside is half that. */
.${HEADING_LINK_CLASS} svg {
  display: block;
  width: 0.5em;
  height: 0.5em;
}
:is(h2, h3):hover > .${HEADING_LINK_CLASS},
.${HEADING_LINK_CLASS}[${COPY_HOLD_ATTR}] {
  opacity: 0.6;
}
.${HEADING_LINK_CLASS}:hover,
.${HEADING_LINK_CLASS}:focus-visible {
  opacity: 1;
  color: var(--swatches--blue, #146ef5);
}
@media (hover: none) {
  .${HEADING_LINK_CLASS} {
    opacity: 0.6;
  }
}
`;

export function initHeadingLinks(root: ParentNode = document): void {
  const content = root.querySelector<HTMLElement>(RICH_TEXT_SELECTOR);
  if (!content) {
    return;
  }

  const headings = Array.from(content.querySelectorAll<HTMLElement>(HEADING_SELECTOR)).filter(
    (heading) => cleanText(heading.textContent) && !heading.querySelector(`[${HEADING_LINK_ATTR}]`)
  );
  if (!headings.length) {
    return;
  }

  ensureStyles();

  const takenIds = collectIds(root);
  headings.forEach((heading) => {
    heading.append(createLink(assignId(heading, takenIds), root));
  });
}

export function getSectionUrl(id: string): string {
  return `${window.location.origin}${window.location.pathname}#${id}`;
}

function createLink(id: string, root: ParentNode): HTMLButtonElement {
  const link = document.createElement('button');
  link.type = 'button';
  link.className = HEADING_LINK_CLASS;
  link.setAttribute(HEADING_LINK_ATTR, id);
  link.setAttribute('aria-label', LINK_LABEL);
  link.setAttribute('title', LINK_LABEL);
  link.append(createIcon('link', root), createIcon('check', root));
  stackCopyIcons(link);

  link.addEventListener('click', () => {
    void copySectionUrl(link, id);
  });

  return link;
}

async function copySectionUrl(link: HTMLButtonElement, id: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(getSectionUrl(id));
    setFeedback(link, 'Link copied');
    showCopyConfirmation(link);
  } catch {
    setFeedback(link, 'Press Ctrl+C to copy');
  }
}

/**
 * Reuses the SVGs from the sidebar copy-link control so the icons stay
 * Designer-owned; falls back to built-in icons on pages without that control.
 */
function createIcon(kind: 'link' | 'check', root: ParentNode): HTMLElement {
  const icon = document.createElement('span');
  icon.setAttribute('data-checklist-icon', kind);

  const source = root.querySelector(`${COPY_URL_SELECTOR} [data-checklist-icon="${kind}"] svg`);
  if (source) {
    icon.append(source.cloneNode(true));
  } else {
    icon.innerHTML = FALLBACK_ICONS[kind];
  }

  return icon;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = HEADING_LINK_CSS;
  document.head.appendChild(style);
}
