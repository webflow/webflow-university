/**
 * At-a-glance cards on /pro/onboarding.
 *
 * Each card links to a stage accordion. Following that hash opens the matching
 * details element and closes the other stage accordions, including when the
 * page is opened with the hash already in the URL. The URL update and the
 * scroll both wait until the accordion height transition has finished.
 * Updating the hash earlier makes Chrome scroll to the stage while a section
 * above it is still collapsing, so the final position is short of the target.
 *
 * The copy button beside each card copies that URL and crossfades to a
 * checkmark with the checklist copy confirmation. It is a sibling of the card
 * link rather than a child: a button inside a link is invalid HTML, and screen
 * readers fold the button's label into the link's name.
 */

import { setFeedback, showCopyConfirmation, stackCopyIcons } from '../common/checklist/feedback.js';
import { getSectionUrl } from '../common/checklist/heading-links.js';

const CARD_SELECTOR = 'a.cc_glance_card[href]';
const COPY_SELECTOR = '.cc_glance_copy-button';
const LINK_LABEL = 'Copy link to this section';

/**
 * Extra time after the CSS height duration. setTimeout can fire a frame early,
 * and the last frame of the transition is what settles the anchor position.
 */
const SCROLL_BUFFER_MS = 32;

/** Same gray as the Designer link icon on the glance card. */
const CHECK_ICON =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M3.5 8.2 6.4 11.2 12.5 4.8" stroke="#898989" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let hashController: AbortController | null = null;
let scrollTimer = 0;

export function initOnboardingGlance(): void {
  hashController?.abort();
  hashController = null;
  cancelScheduledScroll();

  const cards = Array.from(document.querySelectorAll<HTMLAnchorElement>(CARD_SELECTOR));
  const sections = collectSections(cards);
  if (!sections.size) {
    return;
  }

  hashController = new AbortController();
  const { signal } = hashController;

  cards.forEach((card) => {
    const id = idFromHref(card.getAttribute('href') ?? '');
    if (!id || !sections.has(id)) {
      return;
    }

    card.addEventListener(
      'click',
      (event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        // Webflow's delegated `a[href*="#"]` handler on document ignores
        // defaultPrevented and smooth-scrolls to a position measured before
        // the accordions finish resizing, overriding the scroll below.
        event.preventDefault();
        event.stopPropagation();
        revealSection(sections, id, { updateUrl: true });
      },
      { signal }
    );

    const button = card.parentElement?.querySelector<HTMLElement>(`:scope > ${COPY_SELECTOR}`);
    if (!button) {
      return;
    }

    prepareCopyButton(button);
    button.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        void copySectionLink(button, id);
      },
      { signal }
    );
  });

  const syncFromHash = (): void => {
    const id = idFromHash(window.location.hash);
    if (sections.has(id)) {
      revealSection(sections, id, { updateUrl: false });
    }
  };

  syncFromHash();
  window.addEventListener('hashchange', syncFromHash, { signal });
}

function collectSections(cards: HTMLAnchorElement[]): Map<string, HTMLDetailsElement> {
  const sections = new Map<string, HTMLDetailsElement>();

  cards.forEach((card) => {
    const id = idFromHref(card.getAttribute('href') ?? '');
    if (!id || sections.has(id)) {
      return;
    }

    const details = document.getElementById(id);
    if (details instanceof HTMLDetailsElement) {
      sections.set(id, details);
    }
  });

  return sections;
}

/**
 * Opens the requested stage, closes the others, then scrolls once the height
 * transition on `::details-content` has finished. Browsers without that
 * transition scroll on the same turn.
 */
function revealSection(
  sections: Map<string, HTMLDetailsElement>,
  id: string,
  { updateUrl }: { updateUrl: boolean }
): void {
  const target = sections.get(id);
  if (!target) {
    return;
  }

  const changed = openOnly(sections, id);
  scheduleScroll(target, changed, () => {
    if (updateUrl && idFromHash(window.location.hash) !== id) {
      history.pushState(null, '', `#${encodeURIComponent(id)}`);
    }
  });
}

function openOnly(sections: Map<string, HTMLDetailsElement>, id: string): HTMLDetailsElement[] {
  const changed: HTMLDetailsElement[] = [];

  sections.forEach((details, sectionId) => {
    const shouldOpen = sectionId === id;
    if (details.open === shouldOpen) {
      return;
    }
    details.open = shouldOpen;
    changed.push(details);
  });

  return changed;
}

function scheduleScroll(
  target: HTMLElement,
  changed: HTMLDetailsElement[],
  beforeScroll: () => void
): void {
  cancelScheduledScroll();

  const wait = changed.reduce((max, details) => Math.max(max, heightTransitionMs(details)), 0);
  const run = (): void => {
    scrollTimer = 0;
    beforeScroll();
    scrollToSection(target);
  };

  if (wait <= 0) {
    run();
    return;
  }

  scrollTimer = window.setTimeout(run, wait + SCROLL_BUFFER_MS);
}

function cancelScheduledScroll(): void {
  window.clearTimeout(scrollTimer);
  scrollTimer = 0;
}

function scrollToSection(target: HTMLElement): void {
  if (!target.isConnected) {
    return;
  }
  target.scrollIntoView({
    block: 'start',
    behavior: prefersReducedMotion() ? 'instant' : 'smooth',
  });
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Duration of the Chrome `::details-content` height transition. Other browsers
 * report 0s, which means the open state has already changed the layout.
 */
function heightTransitionMs(details: HTMLElement): number {
  let style: CSSStyleDeclaration;
  try {
    style = getComputedStyle(details, '::details-content');
  } catch {
    return 0;
  }

  const properties = style.transitionProperty.split(',').map((property) => property.trim());
  const durations = style.transitionDuration.split(',').map((duration) => duration.trim());
  const delays = style.transitionDelay.split(',').map((delay) => delay.trim());
  let max = 0;

  properties.forEach((property, index) => {
    if (property !== 'height' && property !== 'all') {
      return;
    }
    const duration = parseCssTime(durations[index] ?? durations[durations.length - 1] ?? '0s');
    const delay = parseCssTime(delays[index] ?? delays[delays.length - 1] ?? '0s');
    max = Math.max(max, duration + delay);
  });

  return max;
}

function parseCssTime(value: string): number {
  if (value.endsWith('ms')) {
    return Number.parseFloat(value) || 0;
  }
  if (value.endsWith('s')) {
    return (Number.parseFloat(value) || 0) * 1000;
  }
  return 0;
}

function idFromHref(href: string): string {
  const hashIndex = href.lastIndexOf('#');
  if (hashIndex < 0) {
    return '';
  }
  return decodeHash(href.slice(hashIndex + 1));
}

function idFromHash(hash: string): string {
  return decodeHash(hash.replace(/^#/, ''));
}

function decodeHash(value: string): string {
  if (!value) {
    return '';
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function prepareCopyButton(button: HTMLElement): void {
  const linkIcon = button.querySelector<HTMLElement>('.icon-1:not([data-checklist-icon="check"])');
  if (!linkIcon) {
    return;
  }

  linkIcon.setAttribute('data-checklist-icon', 'link');

  if (!button.querySelector('[data-checklist-icon="check"]')) {
    const check = document.createElement('div');
    check.className = linkIcon.className;
    check.setAttribute('data-checklist-icon', 'check');
    check.innerHTML = CHECK_ICON;
    linkIcon.after(check);
  }

  if (button instanceof HTMLButtonElement) {
    button.type = 'button';
  }
  if (!button.hasAttribute('aria-label')) {
    button.setAttribute('aria-label', LINK_LABEL);
  }
  if (!button.hasAttribute('title')) {
    button.setAttribute('title', LINK_LABEL);
  }

  stackCopyIcons(button);
}

async function copySectionLink(button: HTMLElement, id: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(getSectionUrl(id));
    setFeedback(button, 'Link copied');
    showCopyConfirmation(button);
  } catch {
    setFeedback(button, 'Press Ctrl+C to copy');
  }
}
