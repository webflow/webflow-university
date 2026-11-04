/**
 * Collapsible body for `[rtc-copy-panel="preview"]` panels. The body starts
 * clipped to `--rtc-collapsed-height` under the footer's gradient, and the
 * `.expand-toggle` button animates it open to its full height and back.
 *
 * The toggle and gradient hide when the content already fits.
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

const PREVIEW_CSS = `
${PREVIEW_SELECTOR} ${BODY_SELECTOR} {
  max-height: var(--rtc-collapsed-height, 16rem);
  overflow: hidden;
  transition: max-height ${EASE_OUT_CUBIC};
}
${PREVIEW_SELECTOR} ${FOOTER_SELECTOR} {
  transition: box-shadow ${EASE_OUT_CUBIC};
}
${PREVIEW_SELECTOR}:is([${EXPANDED_ATTR}], [${FITS_ATTR}]) ${FOOTER_SELECTOR} {
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
  ${PREVIEW_SELECTOR} :is(${BODY_SELECTOR}, ${FOOTER_SELECTOR}, ${TOGGLE_ICON_SELECTOR}) {
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
