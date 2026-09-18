/**
 * Checklist sidebar controls
 *
 * Owns everything interactive on a checklist page: section navigation,
 * progress, the shareable link, CSV and Markdown export, and clearing progress.
 */

import {
  downloadMarkdown,
  getDownloadFilename,
  serializeChecklistToMarkdown,
} from '../download-checklist-md/index.js';
import { downloadCsv, serializeChecklistToCsv } from './csv.js';
import { type ChecklistItem, getCheckedIds, getChecklistItems } from './items.js';
import { initChecklistNav } from './nav.js';
import {
  buildShareUrl,
  getStorageKey,
  hasUrlState,
  readFromStorage,
  readFromUrl,
  syncUrl,
  writeToStorage,
} from './state.js';

const PROGRESS_BAR_SELECTOR = '[data-checklist-progress="bar"]';
const PROGRESS_PERCENT_SELECTOR = '[data-checklist-progress="percent"]';
const COPY_URL_SELECTOR = '[data-checklist-copy-url]';
const CLEAR_SELECTOR = '[data-checklist-clear]';
const CSV_SELECTOR = '[data-checklist-download="csv"]';
const MARKDOWN_SELECTOR = '[data-checklist-download="md"], [data-copy-checklist-md]';
const FEEDBACK_MS = 2000;
const COPIED_ATTR = 'data-checklist-copied';
const COPY_STYLE_ID = 'wfu-checklist-copy-confirm';
const COPY_TRANSITION = 'transform 220ms ease, filter 220ms ease, opacity 220ms ease';

const COPY_CONFIRM_CSS = `
[data-checklist-copy-url] {
  position: relative;
}
[data-checklist-icon] {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${COPY_TRANSITION};
  will-change: transform, filter, opacity;
}
[data-checklist-icon="check"] {
  position: absolute;
  inset: 0;
  margin: auto;
  transform: scale(0.9);
  filter: blur(4px);
  opacity: 0;
  pointer-events: none;
}
[${COPIED_ATTR}] [data-checklist-icon] {
  transition: ${COPY_TRANSITION};
}
[${COPIED_ATTR}] [data-checklist-icon="link"] {
  transform: scale(0.9);
  filter: blur(4px);
  opacity: 0;
}
[${COPIED_ATTR}] [data-checklist-icon="check"] {
  transform: scale(1);
  filter: blur(0);
  opacity: 1;
}
[data-checklist-copy-url]:not([${COPIED_ATTR}]) [data-checklist-icon] {
  transition: none;
}
`;

export function initChecklist(): void {
  // Driven by the rich text headings rather than by the tasks, so it runs even
  // on a page where task discovery comes up empty.
  initChecklistNav();

  const items = getChecklistItems();
  if (!items.length) {
    return;
  }

  // Resting styles hide the checkmark; inject on init so both icons never
  // flash side-by-side before the first copy click.
  if (document.querySelector(`${COPY_URL_SELECTOR} [data-checklist-icon="check"]`)) {
    ensureCopyConfirmStyles();
  }

  const storageKey = getStorageKey();

  restoreState(items, storageKey);

  items.forEach((item) => {
    item.checkbox.addEventListener('change', () => {
      persist(items, storageKey);
      renderProgress(items);
    });
  });

  bindClick(COPY_URL_SELECTOR, (button) => {
    void copyShareUrl(items, button);
  });

  bindClick(CLEAR_SELECTOR, (button) => {
    clearProgress(items, storageKey);
    setFeedback(button, 'Checklist cleared');
  });

  bindClick(CSV_SELECTOR, (button) => {
    const csv = serializeChecklistToCsv(items);
    if (!csv) {
      return;
    }
    downloadCsv(csv, getDownloadFilename('csv'));
    setFeedback(button, 'CSV downloaded');
  });

  bindClick(MARKDOWN_SELECTOR, (button) => {
    const markdown = serializeChecklistToMarkdown();
    if (!markdown) {
      return;
    }
    downloadMarkdown(markdown, getDownloadFilename('md'));
    setFeedback(button, 'Markdown downloaded');
  });

  renderProgress(items);
}

/**
 * A shared link must beat locally saved progress, otherwise opening someone
 * else's link would silently show your own checklist.
 */
function restoreState(items: ChecklistItem[], storageKey: string): void {
  const saved = hasUrlState() ? readFromUrl() : readFromStorage(storageKey);
  if (!saved.length) {
    return;
  }

  const checked = new Set(saved);
  items.forEach((item) => {
    item.checkbox.checked = checked.has(item.id);
  });

  persist(items, storageKey);
}

function persist(items: ChecklistItem[], storageKey: string): void {
  const ids = getCheckedIds(items);
  writeToStorage(ids, storageKey);
  syncUrl(ids);
}

function renderProgress(items: ChecklistItem[]): void {
  const checked = getCheckedIds(items).length;
  const percent = items.length ? Math.round((checked / items.length) * 100) : 0;

  document.querySelectorAll<HTMLElement>(PROGRESS_BAR_SELECTOR).forEach((bar) => {
    bar.style.width = `${percent}%`;
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', String(percent));
    bar.setAttribute('aria-valuetext', `${checked} of ${items.length} tasks complete`);
  });

  document.querySelectorAll<HTMLElement>(PROGRESS_PERCENT_SELECTOR).forEach((percentEl) => {
    percentEl.textContent = `${percent}%`;
  });
}

function clearProgress(items: ChecklistItem[], storageKey: string): void {
  items.forEach((item) => {
    item.checkbox.checked = false;
  });

  persist(items, storageKey);
  renderProgress(items);
}

async function copyShareUrl(items: ChecklistItem[], button: HTMLElement): Promise<void> {
  const shareUrl = buildShareUrl(getCheckedIds(items));
  syncUrl(getCheckedIds(items));

  try {
    await navigator.clipboard.writeText(shareUrl);
    setFeedback(button, 'Link copied');
    showCopyConfirmation(button);
  } catch {
    setFeedback(button, 'Press Ctrl+C to copy');
  }
}

/**
 * Crossfades the link icon out (scale + blur) with a checkmark, then snaps
 * back to the link icon after FEEDBACK_MS with no exit transition.
 */
function showCopyConfirmation(button: HTMLElement): void {
  if (
    !button.querySelector('[data-checklist-icon="link"]') ||
    !button.querySelector('[data-checklist-icon="check"]')
  ) {
    return;
  }

  ensureCopyConfirmStyles();
  button.setAttribute(COPIED_ATTR, '');

  window.setTimeout(() => {
    button.removeAttribute(COPIED_ATTR);
  }, FEEDBACK_MS);
}

function ensureCopyConfirmStyles(): void {
  if (document.getElementById(COPY_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = COPY_STYLE_ID;
  style.textContent = COPY_CONFIRM_CSS;
  document.head.appendChild(style);
}

function bindClick(selector: string, handler: (button: HTMLElement) => void): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((button) => {
    button.addEventListener('click', (event) => {
      // The Markdown control is an anchor on some pages.
      event.preventDefault();
      handler(button);
    });
  });
}

/**
 * These controls are icon-only, so the accessible name doubles as the place to
 * report what happened.
 */
function setFeedback(button: HTMLElement, message: string): void {
  const original = button.dataset.checklistLabel || button.getAttribute('aria-label') || '';
  if (original) {
    button.dataset.checklistLabel = original;
  }

  button.setAttribute('aria-label', message);
  button.setAttribute('title', message);

  window.setTimeout(() => {
    const restored = button.dataset.checklistLabel;
    if (restored) {
      button.setAttribute('aria-label', restored);
      button.setAttribute('title', restored);
    }
  }, FEEDBACK_MS);
}
