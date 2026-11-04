/**
 * Collapsible body for `[rtc-copy-panel="preview"]` panels. The body starts
 * clipped to `--rtc-collapsed-height` with its last `--rtc-fade-height` faded
 * out, and the `.expand-toggle` button animates it open to its full height and
 * back.
 *
 * The toggle and fade hide when the content already fits.
 */

const PREVIEW_SELECTOR = '[rtc-copy-panel="preview"]';
const BODY_SELECTOR = '.copy-panel_body';
const FOOTER_SELECTOR = '.copy-panel_footer';
const TOGGLE_SELECTOR = '.expand-toggle';
const TOGGLE_ICON_SELECTOR = `${TOGGLE_SELECTOR} .w-embed`;
const RICH_TEXT_SELECTOR = '.w-richtext';
const EXPANDED_ATTR = 'data-rtc-expanded';
const FITS_ATTR = 'data-rtc-fits';
const STYLE_ID = 'wfu-rtc-copy-panel';
const MORE_LABEL = 'Show more';
const LESS_LABEL = 'Show less';
const EASE_OUT_CUBIC = '250ms cubic-bezier(0.33, 1, 0.68, 1)';
const FADE_SIZE_PROPERTY = '--rtc-fade-size';
const FADE_STOPS = [
  ['#000', 1],
  ['rgb(0 0 0 / 0.6)', 0.6],
  ['rgb(0 0 0 / 0.2)', 0.3],
  ['transparent', 0.1],
] as const;
const FADE_MASK = `linear-gradient(to bottom, ${FADE_STOPS.map(
  ([color, offset]) => `${color} calc(100% - var(${FADE_SIZE_PROPERTY}) * ${offset})`
).join(', ')})`;

/**
 * The fade is a mask on the body rather than an overlay, so it works on any
 * background. It eases out and reaches full transparency just above the clip
 * edge, so a line cut by the edge is never visible. The footer's Designer
 * shadow stops short of that edge and is dropped. Registering the fade size
 * lets it animate to zero as the panel opens.
 */
const PREVIEW_CSS = `
@property ${FADE_SIZE_PROPERTY} {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}
${PREVIEW_SELECTOR} ${BODY_SELECTOR} {
  ${FADE_SIZE_PROPERTY}: var(--rtc-fade-height, 6rem);
  max-height: var(--rtc-collapsed-height, 16rem);
  overflow: hidden;
  -webkit-mask-image: ${FADE_MASK};
  mask-image: ${FADE_MASK};
  transition:
    max-height ${EASE_OUT_CUBIC},
    ${FADE_SIZE_PROPERTY} ${EASE_OUT_CUBIC};
}
${PREVIEW_SELECTOR}:is([${EXPANDED_ATTR}], [${FITS_ATTR}]) ${BODY_SELECTOR} {
  ${FADE_SIZE_PROPERTY}: 0px;
}
${PREVIEW_SELECTOR} ${FOOTER_SELECTOR} {
  box-shadow: none;
}
${PREVIEW_SELECTOR} ${TOGGLE_ICON_SELECTOR} {
  transition: transform ${EASE_OUT_CUBIC};
}
${PREVIEW_SELECTOR}[${EXPANDED_ATTR}] ${TOGGLE_ICON_SELECTOR} {
  transform: rotate(180deg);
}
${PREVIEW_SELECTOR}[${FITS_ATTR}] ${FOOTER_SELECTOR} {
  justify-content: flex-end;
}
${PREVIEW_SELECTOR}[${FITS_ATTR}] ${TOGGLE_SELECTOR} {
  display: none;
}
@media (prefers-reduced-motion: reduce) {
  ${PREVIEW_SELECTOR} :is(${BODY_SELECTOR}, ${TOGGLE_ICON_SELECTOR}) {
    transition: none;
  }
}
`;

/**
 * Runs before the DOM is ready so long panels never render at full height
 * before collapsing.
 */
export function injectPreviewPanelStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PREVIEW_CSS;
  document.head.appendChild(style);
}

export function initPreviewPanels(): void {
  injectPreviewPanelStyles();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll<HTMLElement>(PREVIEW_SELECTOR).forEach((panel, index) => {
    const body = panel.querySelector<HTMLElement>(BODY_SELECTOR);
    const toggle = panel.querySelector<HTMLElement>(TOGGLE_SELECTOR);
    if (!body || !toggle) {
      return;
    }

    body.id ||= `rtc-copy-panel-body-${index + 1}`;
    if (toggle instanceof HTMLButtonElement) {
      toggle.type = 'button';
    }
    toggle.setAttribute('aria-controls', body.id);
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      setExpanded(panel, body, toggle, !panel.hasAttribute(EXPANDED_ATTR), reducedMotion.matches);
    });

    body.addEventListener('transitionend', (event) => {
      if (
        event.target === body &&
        event.propertyName === 'max-height' &&
        panel.hasAttribute(EXPANDED_ATTR)
      ) {
        body.style.maxHeight = 'none';
      }
    });

    const observer = new ResizeObserver(() => {
      if (!panel.hasAttribute(EXPANDED_ATTR)) {
        panel.toggleAttribute(FITS_ATTR, body.scrollHeight <= body.clientHeight + 1);
      }
    });
    observer.observe(body);
    const richText = body.querySelector(RICH_TEXT_SELECTOR);
    if (richText) {
      observer.observe(richText);
    }
  });
}

/**
 * `max-height` can't transition to or from `none`, so both directions run
 * between pixel heights and the expanded body is released to `none` once the
 * transition ends, letting it follow later content or width changes.
 */
function setExpanded(
  panel: HTMLElement,
  body: HTMLElement,
  toggle: HTMLElement,
  expanded: boolean,
  instant: boolean
): void {
  toggle.setAttribute('aria-expanded', String(expanded));
  const label = toggle.querySelector('span');
  if (label) {
    label.textContent = expanded ? LESS_LABEL : MORE_LABEL;
  }

  if (expanded) {
    panel.setAttribute(EXPANDED_ATTR, '');
    body.style.maxHeight = instant ? 'none' : `${body.scrollHeight}px`;
    return;
  }

  body.style.maxHeight = `${body.offsetHeight}px`;
  // Forces layout so the collapse starts from the current height.
  void body.offsetHeight;
  panel.removeAttribute(EXPANDED_ATTR);
  body.style.removeProperty('max-height');
}
