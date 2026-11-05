/**
 * Rich text copy panels: a `[rtc-copy-panel]` wrapper holding a rich text
 * element and a copy button. Clicking the button copies the rich text as
 * Markdown, so headings, lists, bold, italics, and links survive a paste into
 * an AI chat or a Markdown editor, then crossfades its icon to a checkmark.
 *
 * The copy reads the DOM rather than the rendered text, so a collapsed panel
 * still copies its full contents.
 */

import {
  CHECK_ICON,
  FEEDBACK_MS,
  getCopyLabelText,
  showCopyConfirmation,
  stackCopyIcons,
  stackCopyLabel,
} from '../checklist/feedback.js';
import { richTextToMarkdown } from '../download-checklist-md/index.js';
import { initPreviewPanels } from './expand.js';

export { injectPreviewPanelStyles } from './expand.js';

const PANEL_SELECTOR = '[rtc-copy-panel]';
const BUTTON_SELECTOR = '[rtc-copy-button], .is-action-button';
const RICH_TEXT_SELECTOR = '.w-richtext';
const ICON_SELECTOR = '.w-embed:not([data-checklist-icon="check"])';
const COPIED_LABEL = 'Copied!';
const FAILED_LABEL = 'Copy failed';

const labelResets = new WeakMap<HTMLElement, number>();

export function initCopyPanels(): void {
  initPreviewPanels();

  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    const button = panel.querySelector<HTMLElement>(BUTTON_SELECTOR);
    const richText = panel.querySelector<HTMLElement>(RICH_TEXT_SELECTOR);
    if (!button || !richText) {
      return;
    }

    button.querySelector<HTMLElement>('span')?.setAttribute('aria-live', 'polite');
    prepareCopyButton(button);
    const label = getCopyLabelText(button);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      void copyRichText(richText, button, label);
    });
  });
}

/**
 * Pairs the Designer's copy icon with the shared checkmark, and its label with
 * the copied text, for the copy confirmation.
 */
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
  stackCopyLabel(button, COPIED_LABEL);
}

async function copyRichText(
  richText: HTMLElement,
  button: HTMLElement,
  label: HTMLElement | null
): Promise<void> {
  if (await writeClipboard(richTextToMarkdown(richText))) {
    // The resting label fades back in after the confirmation, so clear a pending failure label first.
    restoreLabel(label);
    showCopyConfirmation(button, { copiedLabel: COPIED_LABEL });
  } else {
    showLabel(label, FAILED_LABEL);
  }
}

/**
 * Frames embedded without the `clipboard-write` permission, such as Webflow's
 * preview mode, reject the async Clipboard API. The fallback runs a copy
 * command and fills the clipboard from its copy event, so nothing on the page
 * gets selected or focused.
 */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyWithCommand(text);
  }
}

function copyWithCommand(text: string): boolean {
  let copied = false;
  const onCopy = (event: ClipboardEvent): void => {
    if (!event.clipboardData) {
      return;
    }
    event.clipboardData.setData('text/plain', text);
    event.preventDefault();
    copied = true;
  };

  document.addEventListener('copy', onCopy);
  try {
    document.execCommand('copy');
  } catch {
    // Treated as a failed copy below.
  } finally {
    document.removeEventListener('copy', onCopy);
  }

  return copied;
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
