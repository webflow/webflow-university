/**
 * Shared feedback for checklist controls: the link-to-checkmark crossfade used
 * by every copy-link control, and accessible-name feedback for icon controls.
 */

export const FEEDBACK_MS = 2000;
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
 * Crossfades the link icon out (scale + blur) with a checkmark, then snaps
 * back to the link icon after FEEDBACK_MS with no exit transition.
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
  control.setAttribute(COPIED_ATTR, '');
  control.setAttribute(COPY_HOLD_ATTR, '');

  const label = copiedLabel ? findTextLabel(control) : null;
  if (label && copiedLabel) {
    label.dataset.checklistCopyText ??= label.textContent ?? '';
    label.textContent = copiedLabel;
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
    if (label?.dataset.checklistCopyText !== undefined) {
      label.textContent = label.dataset.checklistCopyText;
      delete label.dataset.checklistCopyText;
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
