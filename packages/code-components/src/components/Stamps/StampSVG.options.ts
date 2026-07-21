/**
 * Stamp date label in the user's locale (e.g. en-US → 07/20/2026, de-DE → 20.07.2026).
 * Uses `navigator.language` when available; falls back to runtime default locale.
 */
export function formatStampDate(date: Date = new Date()): string {
  const locale =
    typeof navigator !== 'undefined' && navigator.language
      ? navigator.language
      : undefined;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

const GOOGLE_STAMP_FONTS =
  /^(Instrument Serif|Instrument Sans|Playfair Display|DM Serif Display|Libre Baskerville|Space Grotesk|IBM Plex Mono|BioRhyme|Big Shoulders Display|Dela Gothic One|Fraunces|Syne)$/i;

function googleFontsCssQuery(family: string): string {
  const encoded = encodeURIComponent(family).replace(/%20/g, '+');
  if (/Instrument Serif/i.test(family)) return `family=${encoded}:ital@0;1`;
  if (/DM Serif Display|Dela Gothic One/i.test(family)) return `family=${encoded}`;
  if (/BioRhyme/i.test(family)) return `family=${encoded}:wght@400;700`;
  if (/Big Shoulders Display/i.test(family)) {
    return `family=${encoded}:wght@400;500;600;700;800;900`;
  }
  if (/Fraunces/i.test(family)) {
    return `family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`;
  }
  if (/Syne/i.test(family)) return `family=${encoded}:wght@400;500;600;700;800`;
  return `family=${encoded}:wght@300;400;500;600;700`;
}

/**
 * Ensure Google Fonts used by StampSVG are loaded in the document
 * (needed in Webflow Code Components where playground CSS is absent).
 */
export function ensureStampGoogleFonts(fontFamilyStack: string): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();

  const families = fontFamilyStack
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter((name) => name && GOOGLE_STAMP_FONTS.test(name));

  if (families.length === 0) return Promise.resolve();

  const href = `https://fonts.googleapis.com/css2?${families
    .map(googleFontsCssQuery)
    .join('&')}&display=swap`;

  const existing = document.querySelectorAll<HTMLLinkElement>(
    'link[data-stamp-svg-font="true"]'
  );
  for (const link of existing) {
    if (link.href === href || link.getAttribute('href') === href) {
      return document.fonts?.ready.then(() => undefined) ?? Promise.resolve();
    }
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-stamp-svg-font', 'true');
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
    // Cap wait so we never block forever if onload is skipped
    window.setTimeout(() => resolve(), 2500);
  });
}

export const STAMP_ASPECT_RATIO_OPTIONS = {
  '16:9': '16 / 9',
  '16:10': '16 / 10',
  '3:2': '3 / 2',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '3:4': '3 / 4',
  '2:3': '2 / 3',
  '9:16': '9 / 16',
} as const;

export const STAMP_FONT_OPTIONS = {
  'Instrument Serif': "'Instrument Serif', Georgia, 'Times New Roman', serif",
  'Instrument Sans': "'Instrument Sans', system-ui, sans-serif",
  'WF Sans': "var(--typography--font_headings, 'WF Visual Sans', system-ui, sans-serif)",
  'WF Text': "var(--typography--font_text, 'WF Visual Sans Text', system-ui, sans-serif)",
  'WF Mono': "var(--typography--font_mono, 'WF Visual Sans Text', ui-monospace, monospace)",
  'Playfair Display': "'Playfair Display', Georgia, serif",
  'DM Serif Display': "'DM Serif Display', Georgia, serif",
  'Libre Baskerville': "'Libre Baskerville', Georgia, serif",
  'Space Grotesk': "'Space Grotesk', system-ui, sans-serif",
  'IBM Plex Mono': "'IBM Plex Mono', ui-monospace, monospace",
  /** Chunky organic slab */
  BioRhyme: "'BioRhyme', 'Rockwell', 'Courier New', serif",
  /** Ultra-condensed tall industrial display */
  'Big Shoulders Display':
    "'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif",
  /** Heavy Japanese-influenced gothic display */
  'Dela Gothic One': "'Dela Gothic One', Impact, 'Arial Black', sans-serif",
  /** Soft “wonky” optical serif */
  Fraunces: "'Fraunces', Georgia, 'Times New Roman', serif",
  /** Geometric display with sharp personality */
  Syne: "'Syne', system-ui, sans-serif",
  Georgia: "Georgia, 'Times New Roman', Times, serif",
  Slab: "'Arial Black', 'Helvetica Neue', Impact, Haettenschweiler, sans-serif",
  Typewriter: "'Courier New', Courier, ui-monospace, monospace",
} as const;
