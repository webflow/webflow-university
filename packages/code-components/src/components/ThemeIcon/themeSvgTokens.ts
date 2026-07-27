/**
 * Maps Figma-exported SVG hard-coded colors to Webflow University theme CSS variables.
 *
 * Figma "Copy as SVG" resolves design tokens to hex/named colors. These mappings
 * reverse that for the theme tokens commonly used on icon frames:
 *   theme/bg-tertiary   → --theme--t_bg-tertiary
 *   theme/border-primary → --theme--t_border-primary
 *   theme/icon-primary  → --theme--t_icon-primary
 */

export type ThemeSvgToken = {
  /** CSS custom property name, e.g. `--theme--t_icon-primary` */
  cssVar: string;
  /** Fallback used inside `var(--token, fallback)` */
  fallback: string;
  /** Normalized color keys that map to this token (lowercase, no spaces) */
  colors: string[];
};

export const THEME_SVG_TOKENS: ThemeSvgToken[] = [
  {
    cssVar: '--theme--t_bg-tertiary',
    fallback: '#171717',
    colors: ['#171717'],
  },
  {
    cssVar: '--theme--t_border-primary',
    fallback: '#363636',
    colors: ['#363636'],
  },
  {
    cssVar: '--theme--t_icon-primary',
    fallback: 'white',
    colors: [
      'white',
      '#fff',
      '#ffffff',
      'rgb(255,255,255)',
      'rgba(255,255,255,1)',
      'rgb(255 255 255)',
      'rgba(255 255 255 / 1)',
    ],
  },
  // Additional known theme swatches (useful when Figma resolves other tokens)
  {
    cssVar: '--theme--t_bg-primary',
    fallback: '#080808',
    colors: ['#080808'],
  },
  {
    cssVar: '--theme--t_bg-secondary',
    fallback: '#222222',
    colors: ['#222', '#222222'],
  },
  {
    cssVar: '--theme--t_text-secondary',
    fallback: '#ababab',
    colors: ['#ababab'],
  },
  {
    cssVar: '--theme--t_text-tertiary',
    fallback: '#5a5a5a',
    colors: ['#5a5a5a'],
  },
];

const COLOR_LOOKUP = new Map<string, ThemeSvgToken>();
for (const token of THEME_SVG_TOKENS) {
  for (const color of token.colors) {
    COLOR_LOOKUP.set(normalizeColor(color), token);
  }
}

export function normalizeColor(value: string): string {
  let v = value.trim().toLowerCase().replace(/\s+/g, '');

  // Expand 3-digit hex (#abc → #aabbcc)
  const shortHex = /^#([0-9a-f]{3})$/i.exec(v);
  if (shortHex) {
    const [, h] = shortHex;
    v = `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }

  // Normalize rgba(255, 255, 255) / rgb(255 255 255)
  v = v.replace(/rgba?\(([^)]+)\)/, (match, inner: string) => {
    const parts = inner
      .replace(/\//g, ' ')
      .split(/[\s,]+/)
      .filter(Boolean);
    if (parts.length < 3) return match;
    const [r, g, b, a] = parts;
    if (a === undefined || a === '1' || a === '1.0') {
      return `rgb(${r},${g},${b})`;
    }
    return `rgba(${r},${g},${b},${a})`;
  });

  return v;
}

export type ApplyThemeTokensOptions = {
  /**
   * Map icon-primary colors (white / #fff / …) to `currentColor` so the icon
   * inherits the parent element's CSS `color` (e.g. link / text color).
   */
  useCurrentColor?: boolean;
};

const ICON_PRIMARY_CSS_VAR = '--theme--t_icon-primary';

export function colorToCssVar(
  value: string,
  options: ApplyThemeTokensOptions = {},
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (
    lower === 'none' ||
    lower === 'currentcolor' ||
    lower === 'transparent' ||
    lower.startsWith('url(') ||
    lower.startsWith('var(')
  ) {
    return null;
  }

  const token = COLOR_LOOKUP.get(normalizeColor(trimmed));
  if (!token) return null;

  if (options.useCurrentColor && token.cssVar === ICON_PRIMARY_CSS_VAR) {
    return 'currentColor';
  }

  return `var(${token.cssVar}, ${token.fallback})`;
}

/** Decode common HTML entities (Rich Text often escapes pasted SVG as text). */
export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/gi, '&');
}

/**
 * Pull the first <svg>…</svg> block out of pasted junk / Rich Text wrappers.
 * Handles `<p>…</p>`, `<br>`, and entity-escaped markup from Webflow Rich Text props.
 */
export function extractSvgMarkup(input: string): string {
  if (!input) return '';

  const candidates = [input, decodeHtmlEntities(input)];

  for (const candidate of candidates) {
    const normalized = candidate
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p\b[^>]*>/gi, '\n')
      .replace(/<p\b[^>]*>/gi, '');
    const match = normalized.match(/<svg\b[\s\S]*?<\/svg>/i);
    if (match) return match[0].trim();
  }

  return decodeHtmlEntities(input).trim();
}

/**
 * Replace hard-coded fill/stroke colors (attributes + inline style) with theme CSS vars
 * (or `currentColor` for icon ink when `useCurrentColor` is set).
 */
export function applyThemeTokensToSvg(
  svgInput: string,
  options: ApplyThemeTokensOptions = {},
): string {
  const svg = extractSvgMarkup(svgInput);
  if (!svg) return '';

  let result = svg;

  // fill="…" / stroke="…" (and single-quoted)
  result = result.replace(
    /\b(fill|stroke)\s*=\s*(["'])(.*?)\2/gi,
    (full, attr: string, quote: string, value: string) => {
      const replacement = colorToCssVar(value, options);
      if (!replacement) return full;
      return `${attr}=${quote}${replacement}${quote}`;
    },
  );

  // style="fill: …; stroke: …"
  result = result.replace(/\bstyle\s*=\s*(["'])(.*?)\1/gi, (full, quote: string, styleValue: string) => {
    const next = styleValue.replace(
      /\b(fill|stroke)\s*:\s*([^;]+)/gi,
      (decl, prop: string, value: string) => {
        const replacement = colorToCssVar(value, options);
        if (!replacement) return decl;
        return `${prop}: ${replacement}`;
      },
    );
    if (next === styleValue) return full;
    return `style=${quote}${next}${quote}`;
  });

  // If input was already themed, swap icon-primary vars → currentColor
  if (options.useCurrentColor) {
    result = result.replace(
      /var\(\s*--theme--t_icon-primary\s*(?:,[^)]*)?\)/gi,
      'currentColor',
    );
  }

  return result;
}

export const DEFAULT_FIGMA_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 0.5H44C45.933 0.5 47.5 2.067 47.5 4V44C47.5 45.933 45.933 47.5 44 47.5H4C2.067 47.5 0.5 45.933 0.5 44V4C0.5 2.067 2.067 0.5 4 0.5Z" fill="#171717"/>
<path d="M4 0.5H44C45.933 0.5 47.5 2.067 47.5 4V44C47.5 45.933 45.933 47.5 44 47.5H4C2.067 47.5 0.5 45.933 0.5 44V4C0.5 2.067 2.067 0.5 4 0.5Z" stroke="#363636"/>
<path d="M24 38L24 36.9999C24.0001 35.3431 25.3432 34 27 34H34.9999C36.6568 34 38 35.3432 37.9999 37.0001L37.9999 38" stroke="white" stroke-width="1.5" stroke-linecap="square"/>
<circle cx="31" cy="28" r="3" stroke="white" stroke-width="1.5"/>
<path d="M10 38L10 36.9999C10.0001 35.3431 11.3432 34 13 34H20.9999C22.6568 34 24 35.3432 23.9999 37.0001L23.9999 38" stroke="white" stroke-width="1.5" stroke-linecap="square"/>
<circle cx="17" cy="28" r="3" stroke="white" stroke-width="1.5"/>
<path d="M17 23L17 21.9999C17.0001 20.3431 18.3432 19 20 19H27.9999C29.6568 19 31 20.3432 30.9999 22.0001L30.9999 23" stroke="white" stroke-width="1.5"/>
<circle cx="24" cy="13" r="3" stroke="white" stroke-width="1.5"/>
</svg>`;
