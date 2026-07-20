const XLINK_NS = 'http://www.w3.org/1999/xlink';

const GENERIC_FONT =
  /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-monospace|ui-sans-serif|ui-serif|emoji|math|fangsong|inherit|initial|unset|Georgia|Times|Times New Roman|Arial|Helvetica|Courier|Courier New|Impact|Haettenschweiler)$/i;

const GOOGLE_FONT =
  /^(Instrument Serif|Instrument Sans|Playfair Display|DM Serif Display|Libre Baskerville|Space Grotesk|IBM Plex Mono|BioRhyme|Big Shoulders Display|Dela Gothic One|Fraunces|Syne)$/i;

async function fetchAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function resolveCssColor(color: string, context: Element): string {
  if (!color || !color.includes('var(')) return color;
  const probe = document.createElement('span');
  probe.style.color = color;
  context.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || color;
}

function resolveThemeColor(variable: string, root: HTMLElement): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${variable})`;
  root.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

function bakeCssVariables(svg: SVGSVGElement, root: HTMLElement) {
  const resolvedPaper = resolveThemeColor('--stamp-svg-paper', root);
  const resolvedText = resolveThemeColor('--stamp-svg-text', root);

  svg.querySelectorAll<SVGElement>('[style]').forEach((el) => {
    const style = el.getAttribute('style') ?? '';
    if (!style.includes('var(--stamp-svg-')) return;
    el.setAttribute(
      'style',
      style
        .replace(/var\(--stamp-svg-paper\)/g, resolvedPaper)
        .replace(/var\(--stamp-svg-text\)/g, resolvedText)
    );
  });

  svg.querySelectorAll('feFlood').forEach((el) => {
    const flood = el.getAttribute('flood-color') ?? el.getAttribute('floodColor');
    if (!flood?.includes('var(')) return;
    el.setAttribute('flood-color', resolveCssColor(flood, root));
  });
}

async function inlineImages(svg: SVGSVGElement) {
  const images = Array.from(svg.querySelectorAll('image'));
  await Promise.all(
    images.map(async (image) => {
      const href =
        image.getAttribute('href') ||
        image.getAttributeNS(XLINK_NS, 'href') ||
        image.getAttribute('xlink:href');
      if (!href || href.startsWith('data:')) return;
      const dataUrl = await fetchAsDataUrl(href);
      image.setAttribute('href', dataUrl);
      image.removeAttributeNS(XLINK_NS, 'href');
      image.removeAttribute('xlink:href');
    })
  );
}

export function parseFontFamilyList(fontFamily: string): string[] {
  return fontFamily
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter((name) => name && !GENERIC_FONT.test(name));
}

/** Collect families from a live in-document SVG (computed styles work here). */
function collectFontFamiliesFromLiveSvg(svg: SVGSVGElement): string[] {
  const families = new Set<string>();

  svg.querySelectorAll('text').forEach((text) => {
    parseFontFamilyList(getComputedStyle(text).fontFamily).forEach((name) => {
      families.add(name);
    });
    const attr = text.getAttribute('style') ?? '';
    const match = attr.match(/font-family\s*:\s*([^;]+)/i);
    if (match) {
      parseFontFamilyList(match[1]).forEach((name) => families.add(name));
    }
  });

  return [...families];
}

async function buildGoogleFontFaceCss(families: string[]): Promise<string> {
  const googleFamilies = families.filter((family) => GOOGLE_FONT.test(family));
  if (googleFamilies.length === 0) return '';

  const query = googleFamilies
    .map((family) => {
      const encoded = encodeURIComponent(family).replace(/%20/g, '+');
      // Instrument Serif is primarily a single weight; others may need a range
      if (/Instrument Serif/i.test(family)) {
        return `family=${encoded}:ital@0;1`;
      }
      if (/DM Serif Display|Dela Gothic One/i.test(family)) {
        return `family=${encoded}`;
      }
      if (/BioRhyme/i.test(family)) {
        return `family=${encoded}:wght@400;700`;
      }
      if (/Big Shoulders Display/i.test(family)) {
        return `family=${encoded}:wght@400;500;600;700;800;900`;
      }
      if (/Fraunces/i.test(family)) {
        return `family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`;
      }
      if (/Syne/i.test(family)) {
        return `family=${encoded}:wght@400;500;600;700;800`;
      }
      return `family=${encoded}:wght@300;400;500;600;700`;
    })
    .join('&');

  const cssUrl = `https://fonts.googleapis.com/css2?${query}&display=swap`;

  // Ask for woff2 explicitly — some environments get a UA-less response otherwise
  const cssResponse = await fetch(cssUrl, {
    headers: {
      Accept: 'text/css',
    },
  });
  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSS failed (${cssResponse.status})`);
  }

  let cssText = await cssResponse.text();

  // Prefer woff2 urls; also catch unquoted / quoted variants
  const urlMatches = [
    ...cssText.matchAll(/url\((['"]?)(https:\/\/fonts\.gstatic\.com\/[^)'"]+)\1\)/g),
  ];

  const uniqueUrls = [...new Set(urlMatches.map((match) => match[2]))];
  const replacements = await Promise.all(
    uniqueUrls.map(async (fontUrl) => {
      try {
        const dataUrl = await fetchAsDataUrl(fontUrl);
        return { fontUrl, dataUrl };
      } catch (error) {
        console.warn('[StampSVG export] Failed to inline font file', fontUrl, error);
        return null;
      }
    })
  );

  for (const item of replacements) {
    if (!item) continue;
    cssText = cssText.split(item.fontUrl).join(item.dataUrl);
  }

  // Drop @font-face rules that still point at remote urls (failed inlines)
  if (/https:\/\/fonts\.gstatic\.com\//.test(cssText)) {
    console.warn('[StampSVG export] Some font files could not be inlined');
  }

  return cssText;
}

async function embedUsedFonts(svg: SVGSVGElement, families: string[]) {
  await document.fonts.ready;

  // Ensure requested faces are loaded before we snapshot metadata
  await Promise.all(
    families.map(async (family) => {
      try {
        await document.fonts.load(`400 64px "${family}"`);
        await document.fonts.load(`italic 400 64px "${family}"`);
      } catch {
        // ignore load failures — embedding may still succeed via Google CSS
      }
    })
  );

  try {
    const cssText = await buildGoogleFontFaceCss(families);
    if (!cssText) return;

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.setAttribute('type', 'text/css');
    style.textContent = cssText;
    svg.insertBefore(style, svg.firstChild);
  } catch (error) {
    console.warn('[StampSVG export] Font embed failed — falling back to system fonts', error);
  }
}

function parseViewBox(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const rect = svg.getBoundingClientRect();
  return {
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
  };
}

export async function rasterizeStampSvgPng(
  svg: SVGSVGElement,
  root: HTMLElement,
  pixelRatio = 2,
  extraFontFamilies: string[] = []
): Promise<string> {
  // Read fonts from the live SVG before cloning — computed styles are unreliable on detached nodes
  const fontFamilies = [
    ...new Set([...collectFontFamiliesFromLiveSvg(svg), ...extraFontFamilies]),
  ];

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', XLINK_NS);

  bakeCssVariables(clone, root);
  await inlineImages(clone);
  await embedUsedFonts(clone, fontFamilies);

  const { width, height } = parseViewBox(svg);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to rasterize stamp SVG'));
      image.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    // Transparent background — do not fill
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function exportStampSvgPng(
  svg: SVGSVGElement,
  root: HTMLElement,
  filename: string,
  pixelRatio = 2,
  extraFontFamilies: string[] = []
): Promise<void> {
  const pngUrl = await rasterizeStampSvgPng(svg, root, pixelRatio, extraFontFamilies);
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = pngUrl;
  anchor.click();
}
