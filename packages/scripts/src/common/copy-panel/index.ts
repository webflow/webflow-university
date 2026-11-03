/**
 * Rich text copy panels: a `[rtc-copy-panel]` wrapper holding a rich text
 * element and a copy button. Clicking the button copies the rich text as
 * Markdown, so headings, lists, bold, italics, and links survive a paste into
 * an AI chat or a Markdown editor.
 *
 * The copy reads the DOM rather than the rendered text, so a collapsed panel
 * still copies its full contents.
 */

import { FEEDBACK_MS } from '../checklist/feedback.js';
import { richTextToMarkdown } from '../download-checklist-md/index.js';

const PANEL_SELECTOR = '[rtc-copy-panel]';
const BUTTON_SELECTOR = '[rtc-copy-button], .is-action-button';
const RICH_TEXT_SELECTOR = '.w-richtext';
const COPIED_LABEL = 'Copied!';
const FAILED_LABEL = 'Press Ctrl+C to copy';

const labelResets = new WeakMap<HTMLElement, number>();

export function initCopyPanels(): void {
  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    const button = panel.querySelector<HTMLElement>(BUTTON_SELECTOR);
    const richText = panel.querySelector<HTMLElement>(RICH_TEXT_SELECTOR);
    if (!button || !richText) {
      return;
    }

    const label = button.querySelector<HTMLElement>('span');
    label?.setAttribute('aria-live', 'polite');

    button.addEventListener('click', (event) => {
      event.preventDefault();
      void copyRichText(richText, label);
    });
  });
}

async function copyRichText(richText: HTMLElement, label: HTMLElement | null): Promise<void> {
  try {
    await navigator.clipboard.writeText(richTextToMarkdown(richText));
    showLabel(label, COPIED_LABEL);
  } catch {
    // Selecting the text lets the shortcut in the fallback label work.
    selectContents(richText);
    showLabel(label, FAILED_LABEL);
  }
}

function showLabel(label: HTMLElement | null, message: string): void {
  if (!label) {
    return;
  }

  label.dataset.rtcCopyText ??= label.textContent ?? '';
  label.textContent = message;

  window.clearTimeout(labelResets.get(label));
  labelResets.set(
    label,
    window.setTimeout(() => {
      label.textContent = label.dataset.rtcCopyText ?? '';
      delete label.dataset.rtcCopyText;
    }, FEEDBACK_MS)
  );
}

function selectContents(element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}
