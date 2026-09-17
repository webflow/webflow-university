/**
 * Checklist sidebar controls
 *
 * Owns everything interactive on a checklist page: progress, the shareable
 * link, CSV and Markdown export, and clearing progress.
 */

import {
  downloadMarkdown,
  getDownloadFilename,
  serializeChecklistToMarkdown,
} from '../download-checklist-md/index.js';
import { downloadCsv, serializeChecklistToCsv } from './csv.js';
import { type ChecklistItem, getCheckedIds, getChecklistItems } from './items.js';
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

export function initChecklist(): void {
  const items = getChecklistItems();
  if (!items.length) {
    return;
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
  } catch {
    setFeedback(button, 'Press Ctrl+C to copy');
  }
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
