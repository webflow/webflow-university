/**
 * Rich text copy panels: a `[rtc-copy-panel]` wrapper holding a rich text
 * element and a copy button. Clicking the button copies the rich text as
 * Markdown, so headings, lists, bold, italics, and links survive a paste into
 * an AI chat or a Markdown editor, then crossfades its icon to a checkmark.
 *
 * The copy reads the DOM rather than the rendered text, so a collapsed panel
 * still copies its full contents.
 */

import { FEEDBACK_MS, showCopyConfirmation, stackCopyIcons } from '../checklist/feedback.js';
import { richTextToMarkdown } from '../download-checklist-md/index.js';
import { initPreviewPanels } from './expand.js';

export { injectPreviewPanelStyles } from './expand.js';

const PANEL_SELECTOR = '[rtc-copy-panel]';
const BUTTON_SELECTOR = '[rtc-copy-button], .is-action-button';
const RICH_TEXT_SELECTOR = '.w-richtext';
const ICON_SELECTOR = '.w-embed:not([data-checklist-icon="check"])';
const COPIED_LABEL = 'Copied!';
const FAILED_LABEL = 'Press Ctrl+C to copy';

const CHECK_ICON =
  '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M5.75 12.75 9.75 16.75 18.25 7.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const labelResets = new WeakMap<HTMLElement, number>();

export function initCopyPanels(): void {
  initPreviewPanels();

  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    const button = panel.querySelector<HTMLElement>(BUTTON_SELECTOR);
    const richText = panel.querySelector<HTMLElement>(RICH_TEXT_SELECTOR);
    if (!button || !richText) {
      return;
    }

    const label = button.querySelector<HTMLElement>('span');
    label?.setAttribute('aria-live', 'polite');
    prepareCopyButton(button);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      void copyRichText(richText, button, label);
    });
  });
}

/** Pairs the Designer's copy icon with a checkmark for the copy confirmation. */
function prepareCopyButton(button: HTMLElement): void {
  if (button instanceof HTMLButtonElement) {
    button.type = 'button';
  }

  const icon = button.querySelector<HTMLElement>(ICON_SELECTOR);
  if (!icon) {
    return;
  }

  icon.setAttribute('data-checklist-icon', 'link');
  if (!button.querySelector('[data-checklist-icon="check"]')) {
    const check = document.createElement('div');
    check.className = icon.className;
    check.setAttribute('data-checklist-icon', 'check');
    check.innerHTML = CHECK_ICON;
    icon.after(check);
  }

  stackCopyIcons(button);
}

async function copyRichText(
  richText: HTMLElement,
  button: HTMLElement,
  label: HTMLElement | null
): Promise<void> {
  try {
    await navigator.clipboard.writeText(richTextToMarkdown(richText));
    // The confirmation restores whatever label it finds, so clear a pending failure label first.
    restoreLabel(label);
    showCopyConfirmation(button, { copiedLabel: COPIED_LABEL });
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
    window.setTimeout(() => restoreLabel(label), FEEDBACK_MS)
  );
}

function restoreLabel(label: HTMLElement | null): void {
  if (!label || label.dataset.rtcCopyText === undefined) {
    return;
  }

  window.clearTimeout(labelResets.get(label));
  label.textContent = label.dataset.rtcCopyText;
  delete label.dataset.rtcCopyText;
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
