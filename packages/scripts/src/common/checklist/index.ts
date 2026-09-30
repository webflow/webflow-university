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
import { setFeedback, showCopyConfirmation, stackCopyIcons } from './feedback.js';
import { initHeadingLinks } from './heading-links.js';
import { type ChecklistItem, getCheckedIds, getChecklistItems, TITLE_SELECTOR } from './items.js';
import { initChecklistNav } from './nav.js';
import { type ChecklistSection, getChecklistSections, renderSectionProgress } from './sections.js';
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

export function initChecklist(): void {
  // Driven by the rich text headings rather than by the tasks, so they run
  // even on a page where task discovery comes up empty. Nav runs first so the
  // heading links reuse the ids it assigns.
  initChecklistNav();
  initHeadingLinks();

  const items = getChecklistItems();
  if (!items.length) {
    return;
  }

  const sections = getChecklistSections(items);

  labelCheckboxes(items);

  // Stack the icons on init so both never flash side-by-side before the first
  // copy click.
  document.querySelectorAll<HTMLElement>(COPY_URL_SELECTOR).forEach(stackCopyIcons);

  const storageKey = getStorageKey();

  restoreState(items, storageKey);

  items.forEach((item) => {
    item.checkbox.addEventListener('change', () => {
      trackAnalyzeEvent('checklist_checkbox_toggle');
      persist(items, storageKey);
      renderProgress(items, sections);
    });
  });

  bindClick(COPY_URL_SELECTOR, (button) => {
    trackAnalyzeEvent('checklist_click_copy_link');
    void copyShareUrl(items, button);
  });

  bindClick(CLEAR_SELECTOR, (button) => {
    trackAnalyzeEvent('checklist_click_clear');
    clearProgress(items, sections, storageKey);
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

  renderProgress(items, sections);
}

/**
 * The checkbox's wrapping label has no text; the task title sits beside it.
 * Every task renders from one component, so a static id (and `for`) would be
 * duplicated on every item; the unique id is assigned here instead.
 */
function labelCheckboxes(items: ChecklistItem[]): void {
  items.forEach((item) => {
    const { checkbox } = item;
    const title = item.element.querySelector<HTMLElement>(TITLE_SELECTOR);
    if (!title || checkbox.hasAttribute('aria-label') || checkbox.hasAttribute('aria-labelledby')) {
      return;
    }

    if (!title.id) {
      title.id = `checklist-task-${item.id}-title`;
    }
    checkbox.setAttribute('aria-labelledby', title.id);
  });
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

function renderProgress(items: ChecklistItem[], sections: ChecklistSection[]): void {
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
    percentEl.textContent = `${checked}\u00A0/\u00A0${items.length}`;
  });

  renderSectionProgress(sections);
}

function clearProgress(
  items: ChecklistItem[],
  sections: ChecklistSection[],
  storageKey: string
): void {
  items.forEach((item) => {
    item.checkbox.checked = false;
  });

  persist(items, storageKey);
  renderProgress(items, sections);
}

async function copyShareUrl(items: ChecklistItem[], button: HTMLElement): Promise<void> {
  const shareUrl = buildShareUrl(getCheckedIds(items));
  syncUrl(getCheckedIds(items));

  try {
    await navigator.clipboard.writeText(shareUrl);
    setFeedback(button, 'Link copied');
    showCopyConfirmation(button, { copiedLabel: 'Copied!' });
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
 * Fire a Webflow Analyze custom goal. No-ops when the Browser API isn't on
 * the page (local/tests, or Analyze not enabled).
 */
function trackAnalyzeEvent(eventName: string): void {
  const { wf } = window;
  if (!wf?.ready || !wf.sendEvent) {
    return;
  }

  wf.ready(() => {
    wf.sendEvent(eventName);
  });
}
