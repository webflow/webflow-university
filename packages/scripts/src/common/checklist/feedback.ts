/**
 * Shared feedback for checklist controls: the link-to-checkmark crossfade used
 * by every copy-link control, and accessible-name feedback for icon controls.
 */

export const FEEDBACK_MS = 2000;
export const COPIED_ATTR = 'data-checklist-copied';

const ICON_ATTR = 'data-checklist-icon';
const STACK_ATTR = 'data-checklist-icon-stack';
const COPY_STYLE_ID = 'wfu-checklist-copy-confirm';
const COPY_TRANSITION = 'transform 220ms ease, filter 220ms ease, opacity 220ms ease';

const STACK = `[${STACK_ATTR}] > [${ICON_ATTR}]`;
const COPIED_STACK = `[${COPIED_ATTR}] ${STACK}`;

/**
 * The icons overlap inside their own stack rather than being positioned against
 * the control, so a control that also carries a text label still swaps icons in
 * place. The doubled attribute selector outranks the Designer's
 * `.cc_checklist_copy-icon.is-check`, which positions the checkmark absolutely.
 */
const COPY_CONFIRM_CSS = `
[${STACK_ATTR}] {
  display: inline-grid;
  place-items: center;
  flex: none;
}
${STACK} {
  grid-area: 1 / 1;
  will-change: transform, filter, opacity;
}
${STACK}[${ICON_ATTR}="check"] {
  position: static;
  inset: auto;
  margin: 0;
  transform: scale(0.9);
  filter: blur(4px);
  opacity: 0;
  pointer-events: none;
}
${COPIED_STACK} {
  transition: ${COPY_TRANSITION};
}
${COPIED_STACK}[${ICON_ATTR}="link"] {
  transform: scale(0.9);
  filter: blur(4px);
  opacity: 0;
}
${COPIED_STACK}[${ICON_ATTR}="check"] {
  transform: scale(1);
  filter: blur(0);
  opacity: 1;
}
`;

const copyTimers = new WeakMap<HTMLElement, number>();

/**
 * Groups a control's link and check icons into one stack. Returns false when
 * the control lacks either icon, so there is nothing to animate.
 */
export function stackCopyIcons(control: HTMLElement): boolean {
  const link = control.querySelector<HTMLElement>(`[${ICON_ATTR}="link"]`);
  const check = control.querySelector<HTMLElement>(`[${ICON_ATTR}="check"]`);
  if (!link || !check) {
    return false;
  }

  ensureCopyConfirmStyles();

  if (link.parentElement?.hasAttribute(STACK_ATTR)) {
    return true;
  }

  const stack = document.createElement('span');
  stack.setAttribute(STACK_ATTR, '');
  stack.setAttribute('aria-hidden', 'true');
  link.before(stack);
  stack.append(link, check);
  return true;
}

/**
 * Crossfades the link icon out (scale + blur) with a checkmark, then snaps
 * back to the link icon after FEEDBACK_MS with no exit transition.
 */
export function showCopyConfirmation(control: HTMLElement): void {
  if (!stackCopyIcons(control)) {
    return;
  }

  window.clearTimeout(copyTimers.get(control));
  control.setAttribute(COPIED_ATTR, '');

  copyTimers.set(
    control,
    window.setTimeout(() => {
      control.removeAttribute(COPIED_ATTR);
    }, FEEDBACK_MS)
  );
}

/**
 * These controls are icon-only, so the accessible name doubles as the place to
 * report what happened.
 */
export function setFeedback(button: HTMLElement, message: string): void {
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

function ensureCopyConfirmStyles(): void {
  if (document.getElementById(COPY_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = COPY_STYLE_ID;
  style.textContent = COPY_CONFIRM_CSS;
  document.head.appendChild(style);
}
