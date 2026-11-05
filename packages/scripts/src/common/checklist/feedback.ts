/**
 * Shared feedback for checklist controls: the link-to-checkmark crossfade used
 * by every copy control, the matching crossfade of a "Copied!" label, and
 * accessible-name feedback for icon controls.
 */

export const FEEDBACK_MS = 2000;
/** The checklist copy-link control's checkmark, shared so every copy control confirms with the same icon. */
export const CHECK_ICON =
  '<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const COPIED_ATTR = 'data-checklist-copied';
/** Set for the length of the confirmation; controls that fade out when idle stay visible while it is present. */
export const COPY_HOLD_ATTR = 'data-checklist-copy-hold';

/** How long to wait for a fade-out to start before treating the control as still visible. */
const FADE_DETECT_MS = 50;
/** Upper bound on waiting for a fade-out to finish. */
const FADE_TIMEOUT_MS = 1000;

const ICON_ATTR = 'data-checklist-icon';
const STACK_ATTR = 'data-checklist-icon-stack';
const COPY_LABEL_ATTR = 'data-checklist-copy-label';
const LABEL_STACK_ATTR = 'data-checklist-label-stack';
const LABEL_ATTR = 'data-checklist-label';
const COPY_STYLE_ID = 'wfu-checklist-copy-confirm';
const COPY_FADE = 'opacity 200ms ease';
const COPY_TRANSITION = `transform 200ms ease, filter 200ms ease, ${COPY_FADE}`;

const STACK = `[${STACK_ATTR}] > [${ICON_ATTR}]`;
const COPIED_STACK = `[${COPIED_ATTR}] ${STACK}`;
const LABEL_STACK = `[${LABEL_STACK_ATTR}] > [${LABEL_ATTR}]`;
const COPIED_LABEL_STACK = `[${COPIED_ATTR}] ${LABEL_STACK}`;

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
[${LABEL_STACK_ATTR}] {
  display: inline-grid;
}
${LABEL_STACK} {
  grid-area: 1 / 1;
  justify-self: start;
}
${LABEL_STACK}[${LABEL_ATTR}="copied"] {
  transform: scale(0.9);
  filter: blur(4px);
  opacity: 0;
}
${COPIED_LABEL_STACK} {
  transition: ${COPY_TRANSITION};
}
${COPIED_LABEL_STACK}[${LABEL_ATTR}="idle"] {
  transform: scale(0.9);
  filter: blur(4px);
  opacity: 0;
}
${COPIED_LABEL_STACK}[${LABEL_ATTR}="copied"] {
  transform: scale(1);
  filter: blur(0);
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  ${STACK}[${ICON_ATTR}],
  ${COPIED_STACK}[${ICON_ATTR}],
  ${LABEL_STACK}[${LABEL_ATTR}],
  ${COPIED_LABEL_STACK}[${LABEL_ATTR}] {
    transform: none;
    filter: none;
  }
  ${COPIED_STACK},
  ${COPIED_LABEL_STACK} {
    transition: ${COPY_FADE};
  }
}
`;

const copyResets = new WeakMap<HTMLElement, () => void>();

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
 * Crossfades the link icon out (scale + blur, or opacity alone under reduced
 * motion) with a checkmark, and the label
 * with `copiedLabel` when one is given, then snaps both back after FEEDBACK_MS
 * with no exit transition.
 *
 * If releasing the hold makes the control fade out (it is no longer hovered),
 * the checkmark stays until that fade finishes, so the link icon never flashes
 * on its way out.
 */
export function showCopyConfirmation(
  control: HTMLElement,
  { copiedLabel }: { copiedLabel?: string } = {}
): void {
  if (!stackCopyIcons(control)) {
    return;
  }

  copyResets.get(control)?.();
  const labelStack = copiedLabel ? stackCopyLabel(control, copiedLabel) : null;
  control.setAttribute(COPIED_ATTR, '');
  control.setAttribute(COPY_HOLD_ATTR, '');
  if (labelStack) {
    setLabelCopied(labelStack, true);
  }

  const timers: number[] = [];
  let fading = false;

  const onRun = (event: TransitionEvent): void => {
    if (event.target === control && event.propertyName === 'opacity') {
      fading = true;
    }
  };
  const onEnd = (event: TransitionEvent): void => {
    if (event.target === control && event.propertyName === 'opacity') {
      finish();
    }
  };

  const cleanup = (): void => {
    timers.forEach((timer) => window.clearTimeout(timer));
    control.removeEventListener('transitionrun', onRun);
    control.removeEventListener('transitionend', onEnd);
    control.removeEventListener('transitioncancel', onEnd);
    copyResets.delete(control);
  };
  const finish = (): void => {
    cleanup();
    control.removeAttribute(COPIED_ATTR);
    if (labelStack) {
      setLabelCopied(labelStack, false);
    }
  };

  copyResets.set(control, cleanup);

  timers.push(
    window.setTimeout(() => {
      control.addEventListener('transitionrun', onRun);
      control.addEventListener('transitionend', onEnd);
      control.addEventListener('transitioncancel', onEnd);
      control.removeAttribute(COPY_HOLD_ATTR);

      timers.push(
        window.setTimeout(() => {
          if (!fading) {
            finish();
          }
        }, FADE_DETECT_MS),
        window.setTimeout(finish, FADE_TIMEOUT_MS)
      );
    }, FEEDBACK_MS)
  );
}

/**
 * Overlaps the control's label text with its copied text so the two crossfade
 * like the icons. Stacking on init rather than on the first click keeps the
 * control from changing width, since the stack is always as wide as the
 * longer text. Returns null when the control has no text label.
 */
export function stackCopyLabel(control: HTMLElement, copiedLabel: string): HTMLElement | null {
  const existing = control.querySelector<HTMLElement>(`[${LABEL_STACK_ATTR}]`);
  if (existing) {
    const copied = existing.querySelector(`[${LABEL_ATTR}="copied"]`);
    if (copied) {
      copied.textContent = copiedLabel;
    }
    return existing;
  }

  const label = findTextLabel(control);
  if (!label) {
    return null;
  }

  ensureCopyConfirmStyles();

  const idle = document.createElement('span');
  idle.setAttribute(LABEL_ATTR, 'idle');
  idle.textContent = label.textContent;
  const copied = document.createElement('span');
  copied.setAttribute(LABEL_ATTR, 'copied');
  copied.setAttribute('aria-hidden', 'true');
  copied.textContent = copiedLabel;

  const stack = document.createElement('span');
  stack.setAttribute(LABEL_STACK_ATTR, '');
  stack.append(idle, copied);
  label.replaceChildren(stack);
  return stack;
}

/**
 * The element holding the control's resting label text, for callers that
 * change that text directly.
 */
export function getCopyLabelText(control: HTMLElement): HTMLElement | null {
  return (
    control.querySelector<HTMLElement>(`[${LABEL_STACK_ATTR}] > [${LABEL_ATTR}="idle"]`) ??
    findTextLabel(control)
  );
}

/** Only the visible text stays in the control's accessible name. */
function setLabelCopied(stack: HTMLElement, copied: boolean): void {
  stack.querySelectorAll<HTMLElement>(`[${LABEL_ATTR}]`).forEach((text) => {
    const visible = (text.getAttribute(LABEL_ATTR) === 'copied') === copied;
    if (visible) {
      text.removeAttribute('aria-hidden');
    } else {
      text.setAttribute('aria-hidden', 'true');
    }
  });
}

/**
 * The control's visible text: an explicit `[data-checklist-copy-label]`, or
 * else the first text-only element outside the icon stack (the Designer's
 * "Copy link" label).
 */
function findTextLabel(control: HTMLElement): HTMLElement | null {
  const explicit = control.querySelector<HTMLElement>(`[${COPY_LABEL_ATTR}]`);
  if (explicit) {
    return explicit;
  }

  return (
    Array.from(control.querySelectorAll<HTMLElement>('*')).find(
      (element) =>
        !element.closest(`[${STACK_ATTR}]`) &&
        element.children.length === 0 &&
        Boolean(element.textContent?.trim())
    ) ?? null
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
