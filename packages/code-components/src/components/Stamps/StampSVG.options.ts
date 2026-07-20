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
