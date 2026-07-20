import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { flushSync } from 'react-dom';
import webflowLogoWhite from '../../assets/webflow-logo-white.png';
import {
  exportStampSvgPng,
  parseFontFamilyList,
  rasterizeStampSvgPng,
  serializeStampSvg,
  STAMP_SVG_FALLBACK_IMAGE_URL,
} from './exportStampSvgPng';
import { STAMP_FONT_OPTIONS } from './StampSVG.options';

interface ImageProp {
  src: string;
  alt?: string;
}

const WEBFLOW_LOGO_ASPECT = 639 / 1024;

export interface StampSVGProps {
  image?: ImageProp;
  title?: string;
  dateLabel?: string;
  /** Show the logo mark above the date */
  showLogo?: boolean;
  /** Custom logo image URL — falls back to the built-in Webflow mark when empty */
  logoUrl?: string;
  /** Logo width in SVG units */
  logoSize?: number;
  width?: string;
  aspectRatio?: string;
  rotation?: number;
  paperColor?: string;
  outlineColor?: string;
  /** Overlaid on artwork — always defaults to white for contrast */
  textColor?: string;
  /** Opacity of title + date overlay (0–1) */
  textOpacity?: number;
  /** CSS font-family stack for title + date */
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  titleFontSize?: number;
  /** Max title block width as a percent of the artwork width (wraps to multiple lines) */
  titleMaxWidth?: number;
  dateFontSize?: number;
  /** Distressed / glitch print treatment on typography */
  textGlitch?: boolean;
  /** Horizontal fragment / slice displacement */
  textGlitchAmount?: number;
  /** Soft ink bleed on glyph edges */
  textGlitchBleed?: number;
  /** Horizontal slice frequency — higher = finer bands */
  textGlitchSlice?: number;
  /** Coverage of paper-break flecks overlaid on the letterforms */
  textGlitchErode?: number;
  /** Opacity of the text paper-break overlay (does not fade the base type) */
  textGlitchErodeOpacity?: number;
  paperBorder?: number;
  perforationCount?: number;
  perforationRadius?: number;
  outlineWidth?: number;
  edgeRoughness?: number;
  grainFrequency?: number;
  grainOctaves?: number;
  seed?: number;
  /** Riso / offset print grain over paper + image (applied on top of lighting) */
  paperTexture?: boolean;
  paperTextureOpacity?: number;
  /** Print grain scale — higher = finer dots, lower = coarser print feel */
  paperTextureScale?: number;
  /** Dark ink grain for light/white paper (multiply). Off = light grain for dark paper (overlay). */
  paperTextureDarkInk?: boolean;
  /** Distort the inner artwork with turbulence displacement */
  imageDistort?: boolean;
  imageDistortAmount?: number;
  imageDistortTurbulence?: number;
  imageDistortOctaves?: number;
  imageDistortBlur?: number;
  /** Paper break overlay — flecks of paper showing through print */
  imageErode?: boolean;
  /** Also lay breaks over title, date, and logo */
  imageErodeOverText?: boolean;
  /** Coverage of paper break-through (0–1) */
  imageErodeAmount?: number;
  /** Break scale — higher = finer flecks, lower = larger worn patches */
  imageErodeScale?: number;
  /** Opacity of the paper flecks (0–1) */
  imageErodeOpacity?: number;
  /** Softness of fleck edges */
  imageErodeSoftness?: number;
  /** Contrast of the break mask — higher = harder, more graphic holes */
  imageErodeContrast?: number;
  /** How uneven fleck density is across the stamp (0 = uniform, 1 = strong pools) */
  imageErodeVariation?: number;
  /** Size of density pools — lower = larger regions of heavy vs light wear */
  imageErodeVariationScale?: number;
  /** Thin line borders for a stamp-y frame */
  stampFrame?: boolean;
  /** Apply ink wobble / bleed distortion to the frame strokes */
  frameDistort?: boolean;
  /** Frame ink-print: path displacement amount */
  frameInkDisplacement?: number;
  /** Frame ink-print: fiber bleed blur */
  frameInkBlur?: number;
  /** Frame ink-print: turbulence frequency for wobble */
  frameInkTurbulence?: number;
  /** Uneven ink breaks / speckles in the frame strokes (0 = solid lines) */
  frameInkBreaks?: number;
  surfaceBlur?: number;
  surfaceScale?: number;
  specularStrength?: number;
  specularExponent?: number;
  highlightOpacity?: number;
  lightColor?: string;
  lightX?: number;
  lightY?: number;
  lightZ?: number;
  pointerLight?: boolean;
  /** Pointer-driven 3D tilt for tangibility */
  interactiveTilt?: boolean;
  tiltAmount?: number;
  showShadow?: boolean;
  shadowColor?: string;
  /** Scales the layered table-shadow stack */
  shadowOpacity?: number;
  shadowBlur?: number;
  shadowX?: number;
  shadowY?: number;
}

const DEFAULT_IMAGE: ImageProp = {
  src: 'https://placehold.co/1600x900/c8c4b8/5a5a5a?text=StampSVG',
  alt: 'Stamp artwork',
};

const STAMP_PADDING = 80;
const STAMP_CONTENT_LONG = 1000;

let wrapMeasureCanvas: HTMLCanvasElement | null = null;

function measureTextWidth(
  text: string,
  font: string,
  fontWeight: number,
  fontSize: number,
  letterSpacing: number
) {
  if (typeof document === 'undefined') {
    return text.length * fontSize * 0.55 + Math.max(0, text.length - 1) * letterSpacing;
  }
  if (!wrapMeasureCanvas) {
    wrapMeasureCanvas = document.createElement('canvas');
  }
  const ctx = wrapMeasureCanvas.getContext('2d');
  if (!ctx) {
    return text.length * fontSize * 0.55 + Math.max(0, text.length - 1) * letterSpacing;
  }
  ctx.font = `${fontWeight} ${fontSize}px ${font}`;
  return ctx.measureText(text).width + Math.max(0, text.length - 1) * letterSpacing;
}

/** Word-wrap (and hard-break long tokens) to fit a max width in SVG user units. */
function wrapStampTitleLines(
  text: string,
  maxWidth: number,
  font: string,
  fontWeight: number,
  fontSize: number,
  letterSpacing: number
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (!(maxWidth > 0)) return [trimmed];

  const measure = (value: string) =>
    measureTextWidth(value, font, fontWeight, fontSize, letterSpacing);

  const breakToken = (token: string): string[] => {
    if (measure(token) <= maxWidth) return [token];
    const parts: string[] = [];
    let buffer = '';
    for (const char of token) {
      const next = buffer + char;
      if (buffer && measure(next) > maxWidth) {
        parts.push(buffer);
        buffer = char;
      } else {
        buffer = next;
      }
    }
    if (buffer) parts.push(buffer);
    return parts;
  };

  const lines: string[] = [];
  let current = '';

  for (const word of trimmed.split(/\s+/)) {
    for (const token of breakToken(word)) {
      const next = current ? `${current} ${token}` : token;
      if (current && measure(next) > maxWidth) {
        lines.push(current);
        current = token;
      } else {
        current = next;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseAspectRatio(aspectRatio: string): number {
  const normalized = aspectRatio.replace(/:/g, '/');
  const parts = normalized.split('/').map((part) => Number.parseFloat(part.trim()));
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return parts[0] / parts[1];
  }
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 16 / 9;
}

function computeStampLayout(aspectRatio: string) {
  const ratio = parseAspectRatio(aspectRatio);
  const stampWidth =
    ratio >= 1 ? STAMP_CONTENT_LONG : Math.round(STAMP_CONTENT_LONG * ratio);
  const stampHeight =
    ratio >= 1 ? Math.round(STAMP_CONTENT_LONG / ratio) : STAMP_CONTENT_LONG;

  return {
    viewBoxWidth: stampWidth + STAMP_PADDING * 2,
    viewBoxHeight: stampHeight + STAMP_PADDING * 2,
    stampX: STAMP_PADDING,
    stampY: STAMP_PADDING,
    stampWidth,
    stampHeight,
  };
}

type PointerLightSubscriber = (clientX: number, clientY: number) => void;

const pointerLightSubscribers = new Set<PointerLightSubscriber>();
let pointerLightListenerActive = false;

function handleGlobalPointerMove(event: PointerEvent) {
  pointerLightSubscribers.forEach((subscriber) => subscriber(event.clientX, event.clientY));
}

function subscribeToGlobalPointerLight(subscriber: PointerLightSubscriber) {
  pointerLightSubscribers.add(subscriber);
  if (!pointerLightListenerActive) {
    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    pointerLightListenerActive = true;
  }

  return () => {
    pointerLightSubscribers.delete(subscriber);
    if (pointerLightSubscribers.size === 0 && pointerLightListenerActive) {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      pointerLightListenerActive = false;
    }
  };
}

function makePositions(count: number, length: number, start: number): number[] {
  return Array.from({ length: count }, (_, index) => start + ((index + 0.5) * length) / count);
}

export type GetSvgStringOptions = {
  /**
   * When true (default): compact CMS paste with Webflow theme tokens + public image URLs.
   * When false: self-contained markup (baked colors, inlined images/fonts) for visual match.
   */
  preserveThemeVariables?: boolean;
};

export type StampSVGHandle = {
  exportPng: (filename?: string) => Promise<void>;
  exportPngDataUrl: (pixelRatio?: number) => Promise<string>;
  getSvgString: (options?: GetSvgStringOptions) => Promise<string>;
};

const StampSVG = forwardRef<StampSVGHandle, StampSVGProps>(function StampSVG({
  image = DEFAULT_IMAGE,
  title = '',
  dateLabel = '16.07.2026',
  showLogo = true,
  logoUrl,
  logoSize = 70,
  width = '100%',
  aspectRatio = '16 / 9',
  rotation = -3,
  paperColor = 'var(--stamp-paper, var(--theme--t_bg-tertiary, var(--swatches--gray-900, #171717)))',
  outlineColor = 'var(--theme--t_bg-secondary, var(--swatches--gray-800, #222222))',
  textColor = 'var(--swatches--white, #ffffff)',
  textOpacity = 1,
  fontFamily = STAMP_FONT_OPTIONS['Instrument Serif'],
  fontWeight = 600,
  letterSpacing = 0,
  titleFontSize = 46,
  titleMaxWidth = 100,
  dateFontSize = 19,
  textGlitch = true,
  textGlitchAmount = 2,
  textGlitchBleed = 0.2,
  textGlitchSlice = 0.14,
  textGlitchErode = 0.1,
  textGlitchErodeOpacity = 0.6,
  paperBorder = 28,
  perforationCount = 22,
  perforationRadius = 18,
  outlineWidth = 6,
  edgeRoughness = 16,
  grainFrequency = 0.018,
  grainOctaves = 2,
  seed = 11,
  paperTexture = true,
  paperTextureOpacity = 0.18,
  paperTextureScale = 0.9,
  paperTextureDarkInk = false,
  imageDistort = false,
  imageDistortAmount = 13,
  imageDistortTurbulence = 0.015,
  imageDistortOctaves = 2,
  imageDistortBlur = 0.35,
  imageErode = true,
  imageErodeOverText = true,
  imageErodeAmount = 0.012,
  imageErodeScale = 1.8,
  imageErodeOpacity = 0.18,
  imageErodeSoftness = 0.4,
  imageErodeContrast = 0.68,
  imageErodeVariation = 0.6,
  imageErodeVariationScale = 0.32,
  stampFrame = true,
  frameDistort = true,
  frameInkDisplacement = 2.2,
  frameInkBlur = 0.45,
  frameInkTurbulence = 0.01,
  frameInkBreaks = 0.35,
  surfaceBlur = 18,
  surfaceScale = 4,
  specularStrength = 0.08,
  specularExponent = 68,
  highlightOpacity = 0.05,
  lightColor = '#ffffff',
  lightX = 250,
  lightY = 160,
  lightZ = 1375,
  pointerLight = false,
  interactiveTilt = true,
  tiltAmount = 6,
  showShadow = true,
  shadowColor = 'var(--swatches--black, #080808)',
  shadowOpacity = 0.55,
  shadowBlur = 26,
  shadowX = 8,
  shadowY = 18,
}, ref) {
  const id = useId().replace(/:/g, '');
  const maskId = `stamp-svg-mask-${id}`;
  const clipId = `stamp-svg-art-${id}`;
  const filterId = `stamp-svg-filter-${id}`;
  const frameInkFilterId = `stamp-svg-frame-ink-${id}`;
  const textGlitchFilterId = `stamp-svg-text-glitch-${id}`;
  const textErodeOverlayFilterId = `stamp-svg-text-erode-overlay-${id}`;
  const imageDistortFilterId = `stamp-svg-image-distort-${id}`;
  const imageErodeFilterId = `stamp-svg-image-erode-${id}`;
  const pointLightRef = useRef<SVGFEPointLightElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltLayerRef = useRef<HTMLDivElement>(null);
  const tiltFrameRef = useRef<number | null>(null);
  const [exportHideShadow, setExportHideShadow] = useState(false);
  const [fontsReadyTick, setFontsReadyTick] = useState(0);
  const effectiveShowShadow = showShadow && !exportHideShadow;


  const layout = useMemo(() => computeStampLayout(aspectRatio), [aspectRatio]);
  const {
    viewBoxWidth,
    viewBoxHeight,
    stampX,
    stampY,
    stampWidth,
    stampHeight,
  } = layout;
  const viewBoxRef = useRef({ width: viewBoxWidth, height: viewBoxHeight });
  viewBoxRef.current = { width: viewBoxWidth, height: viewBoxHeight };

  const safeCount = Math.max(4, Math.round(perforationCount));
  const verticalCount = Math.max(4, Math.round(safeCount * (stampHeight / stampWidth)));
  const horizontalHoles = useMemo(
    () => makePositions(safeCount, stampWidth, stampX),
    [safeCount, stampWidth, stampX]
  );
  const verticalHoles = useMemo(
    () => makePositions(verticalCount, stampHeight, stampY),
    [stampHeight, stampY, verticalCount]
  );

  const border = Math.max(0, Math.min(paperBorder, Math.min(stampWidth, stampHeight) / 3));
  const artX = stampX + border;
  const artY = stampY + border;
  const artWidth = stampWidth - border * 2;
  const artHeight = stampHeight - border * 2;
  const imageSrc = image?.src || DEFAULT_IMAGE.src;
  const imageAlt = image?.alt || title || DEFAULT_IMAGE.alt || 'Stamp artwork';

  const frameInset = 14;
  const frameOuterX = artX + frameInset;
  const frameOuterY = artY + frameInset;
  const frameOuterW = Math.max(0, artWidth - frameInset * 2);
  const frameOuterH = Math.max(0, artHeight - frameInset * 2);
  const frameInnerInset = 10;
  const frameInnerX = frameOuterX + frameInnerInset;
  const frameInnerY = frameOuterY + frameInnerInset;
  const frameInnerW = Math.max(0, frameOuterW - frameInnerInset * 2);
  const frameInnerH = Math.max(0, frameOuterH - frameInnerInset * 2);

  const opacity = Math.max(0, Math.min(1, shadowOpacity));
  const contactOpacity = opacity * 0.42;
  const midOpacity = opacity * 0.28;
  const ambientOpacity = opacity * 0.22;
  const contactBlur = Math.max(1, shadowBlur * 0.22);
  const midBlur = Math.max(2, shadowBlur * 0.55);
  const ambientBlur = Math.max(4, shadowBlur * 1.15);
  const textureOpacity = Math.max(0, Math.min(0.55, paperTextureOpacity));
  const textureFrequency = Math.max(0.15, Math.min(2.5, paperTextureScale));
  const textureTone = paperTextureDarkInk ? 0.28 : 0.78;
  const textureBlendMode = paperTextureDarkInk ? 'multiply' : 'overlay';
  const inkDisplacement = Math.max(0, frameInkDisplacement);
  const inkBlur = Math.max(0, frameInkBlur);
  const inkTurbulence = Math.max(0, Math.min(0.3, frameInkTurbulence));
  const inkBreaks = Math.max(0, Math.min(1, frameInkBreaks));
  // Ease-in (smoothstep-ish): low values stay subtle, mid/high still reach full break
  const inkBreaksEased = inkBreaks * inkBreaks * (3 - 2 * inkBreaks);
  const inkSpeckleFrequency = Math.min(
    2.2,
    Math.max(0.12, inkTurbulence * 14 + 0.18 + inkBreaksEased * 0.75)
  );
  // Higher intercept = fewer holes; opens up gradually as breaks increase
  const inkSpeckleSlope = 0.3 + inkBreaksEased * 1.4;
  const inkSpeckleIntercept = 0.48 - inkBreaksEased * 0.78;
  const applyFrameInkFilter =
    frameDistort &&
    (inkDisplacement > 0.001 || inkBlur > 0.001 || inkBreaks > 0.001);
  const glitchAmount = Math.max(0, textGlitchAmount);
  const glitchBleed = Math.max(0, textGlitchBleed);
  const glitchSlice = Math.max(0.05, Math.min(2, textGlitchSlice));
  const glitchErode = Math.max(0, Math.min(0.8, textGlitchErode));
  const glitchErodeOpacity = Math.max(0, Math.min(1, textGlitchErodeOpacity));
  const applyTextErodeOverlay = glitchErode > 0.001 && glitchErodeOpacity > 0.001;
  const resolvedFontFamily = fontFamily || STAMP_FONT_OPTIONS['WF Mono'];
  const resolvedLetterSpacing = Number.isFinite(letterSpacing) ? letterSpacing : 1.5;
  const resolvedTitleMaxWidth = Math.max(
    10,
    Math.min(100, Number.isFinite(titleMaxWidth) ? titleMaxWidth : 100)
  );
  const titlePadX = 42;
  const titleLineHeight = titleFontSize * 1.12;
  const titleMaxWidthPx = (artWidth * resolvedTitleMaxWidth) / 100;

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.load || !title) return;
    let cancelled = false;
    void document.fonts
      .load(`${Math.round(fontWeight)} ${titleFontSize}px ${resolvedFontFamily}`)
      .then(() => {
        if (!cancelled) setFontsReadyTick((tick) => tick + 1);
      })
      .catch(() => {
        /* ignore load failures — wrapping falls back to estimates */
      });
    return () => {
      cancelled = true;
    };
  }, [fontWeight, resolvedFontFamily, title, titleFontSize]);

  const titleLines = useMemo(() => {
    // Re-measure after webfonts load (tick is a cache-buster, not a value input).
    void fontsReadyTick;
    return title
      ? wrapStampTitleLines(
          title,
          titleMaxWidthPx,
          resolvedFontFamily,
          Math.max(100, Math.min(900, Math.round(fontWeight))),
          titleFontSize,
          resolvedLetterSpacing
        )
      : [];
  }, [
    fontsReadyTick,
    fontWeight,
    resolvedFontFamily,
    resolvedLetterSpacing,
    title,
    titleFontSize,
    titleMaxWidthPx,
  ]);

  useImperativeHandle(ref, () => ({
    exportPng: async (filename = 'stamp.png') => {
      const svg = svgRef.current;
      const root = rootRef.current;
      if (!svg || !root) {
        throw new Error('Stamp SVG is not ready to export');
      }

      flushSync(() => {
        setExportHideShadow(true);
      });

      try {
        await exportStampSvgPng(
          svg,
          root,
          filename,
          2,
          parseFontFamilyList(resolvedFontFamily)
        );
      } finally {
        flushSync(() => {
          setExportHideShadow(false);
        });
      }
    },
    exportPngDataUrl: async (pixelRatio = 2) => {
      const svg = svgRef.current;
      const root = rootRef.current;
      if (!svg || !root) {
        throw new Error('Stamp SVG is not ready to export');
      }

      flushSync(() => {
        setExportHideShadow(true);
      });

      try {
        return await rasterizeStampSvgPng(
          svg,
          root,
          pixelRatio,
          parseFontFamilyList(resolvedFontFamily)
        );
      } finally {
        flushSync(() => {
          setExportHideShadow(false);
        });
      }
    },
    getSvgString: async (options: GetSvgStringOptions = {}) => {
      const { preserveThemeVariables = true } = options;
      const svg = svgRef.current;
      const root = rootRef.current;
      if (!svg || !root) {
        throw new Error('Stamp SVG is not ready to export');
      }

      // Theme-vars mode: compact CMS paste (site tokens + public image URLs).
      // Hardcoded mode: self-contained markup that matches the live preview
      // when pasted into a bare browser page (baked colors, inlined assets).
      // Keep drop shadows in both — they are part of the stamp filter.
      return await serializeStampSvg(
        svg,
        root,
        parseFontFamilyList(resolvedFontFamily),
        {
          inlineImages: !preserveThemeVariables,
          embedFonts: !preserveThemeVariables,
          preserveThemeVariables,
          fallbackImageUrl: STAMP_SVG_FALLBACK_IMAGE_URL,
        }
      );
    },
  }));
  const resolvedFontWeight = Math.max(100, Math.min(900, Math.round(fontWeight)));
  const resolvedTextOpacity = Math.max(0, Math.min(1, textOpacity));
  const dateAnchorX = artX + artWidth - 34;
  const dateY = artY + artHeight - 34;
  const logoWidth = Math.max(24, logoSize);
  const logoHeight = logoWidth * WEBFLOW_LOGO_ASPECT;
  const logoGap = Math.max(8, dateFontSize * 0.22);
  const logoY = dateLabel
    ? dateY - dateFontSize * 0.85 - logoGap - logoHeight
    : dateY - logoHeight;
  const resolvedLogoSrc = logoUrl?.trim() || webflowLogoWhite;
  const imgDistortAmount = Math.max(0, imageDistortAmount);
  const imgDistortTurbulence = Math.max(0.001, Math.min(0.4, imageDistortTurbulence));
  const imgDistortOctaves = Math.max(1, Math.min(5, Math.round(imageDistortOctaves)));
  const imgDistortBlur = Math.max(0, imageDistortBlur);
  const applyImageDistort = imageDistort && imgDistortAmount > 0;
  const imgErodeAmount = Math.max(0, Math.min(0.5, imageErodeAmount));
  const imgErodeScale = Math.max(0.15, Math.min(2.5, imageErodeScale));
  const imgErodeOpacity = Math.max(0, Math.min(1, imageErodeOpacity));
  const imgErodeSoftness = Math.max(0, Math.min(4, imageErodeSoftness));
  const imgErodeContrast = Math.max(0.05, Math.min(1, imageErodeContrast));
  const imgErodeVariation = Math.max(0, Math.min(1, imageErodeVariation));
  const imgErodeVariationScale = Math.max(
    0.05,
    Math.min(1.5, imageErodeVariationScale)
  );
  const applyImageErode =
    imageErode && imgErodeAmount > 0.001 && imgErodeOpacity > 0.001;

  useEffect(() => {
    if (!pointerLight) return;

    return subscribeToGlobalPointerLight((clientX, clientY) => {
      const svg = svgRef.current;
      const pointLight = pointLightRef.current;
      if (!svg || !pointLight) return;

      const bounds = svg.getBoundingClientRect();
      const { width: vbWidth, height: vbHeight } = viewBoxRef.current;
      const x = ((clientX - bounds.left) / Math.max(bounds.width, 1)) * vbWidth;
      const y = ((clientY - bounds.top) / Math.max(bounds.height, 1)) * vbHeight;
      pointLight.setAttribute('x', String(Math.round(x)));
      pointLight.setAttribute('y', String(Math.round(y)));
    });
  }, [pointerLight]);

  useEffect(() => {
    return () => {
      if (tiltFrameRef.current !== null) {
        cancelAnimationFrame(tiltFrameRef.current);
      }
    };
  }, []);

  const setTilt = (rotateX: number, rotateY: number) => {
    const tiltLayer = tiltLayerRef.current;
    if (!tiltLayer) return;
    tiltLayer.style.setProperty('--stamp-tilt-x', `${rotateX}deg`);
    tiltLayer.style.setProperty('--stamp-tilt-y', `${rotateY}deg`);
  };

  const handleTiltMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactiveTilt || tiltAmount <= 0) return;
    // Use the stable hit target (not the tilting layer) so edge hover doesn't oscillate
    const hitTarget = rootRef.current;
    if (!hitTarget) return;

    const bounds = hitTarget.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - bounds.left) / Math.max(bounds.width, 1)));
    const py = Math.min(1, Math.max(0, (event.clientY - bounds.top) / Math.max(bounds.height, 1)));
    const rotateY = (px - 0.5) * tiltAmount * 2;
    const rotateX = (0.5 - py) * tiltAmount * 2;

    if (tiltFrameRef.current !== null) {
      cancelAnimationFrame(tiltFrameRef.current);
    }
    tiltFrameRef.current = requestAnimationFrame(() => setTilt(rotateX, rotateY));
  };

  const handleTiltLeave = () => {
    if (!interactiveTilt) return;
    if (tiltFrameRef.current !== null) {
      cancelAnimationFrame(tiltFrameRef.current);
    }
    tiltFrameRef.current = requestAnimationFrame(() => setTilt(0, 0));
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={handleTiltMove}
      onPointerLeave={handleTiltLeave}
      style={
        {
          width,
          aspectRatio,
          position: 'relative',
          overflow: 'visible',
          perspective: '900px',
          transformStyle: 'preserve-3d',
          '--stamp-svg-paper': paperColor,
          '--stamp-svg-text': textColor,
          // Static rotation only — tilt lives on an inner layer so the hit box stays put
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        } as CSSProperties
      }
    >
      <div
        ref={tiltLayerRef}
        style={
          {
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
            '--stamp-tilt-x': '0deg',
            '--stamp-tilt-y': '0deg',
            transform: 'rotateX(var(--stamp-tilt-x)) rotateY(var(--stamp-tilt-y))',
            willChange: interactiveTilt ? 'transform' : undefined,
          } as CSSProperties
        }
      >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width="100%"
        height="100%"
        overflow="visible"
        role="img"
        aria-label={imageAlt}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect
              x={stampX}
              y={stampY}
              width={stampWidth}
              height={stampHeight}
              fill="#ffffff"
            />
            {/* Corner punches — edge holes are inset, so corners leave a sharp
                remnant that displacement/outline can turn into floating bits */}
            <circle cx={stampX} cy={stampY} r={perforationRadius} fill="#000000" />
            <circle
              cx={stampX + stampWidth}
              cy={stampY}
              r={perforationRadius}
              fill="#000000"
            />
            <circle
              cx={stampX}
              cy={stampY + stampHeight}
              r={perforationRadius}
              fill="#000000"
            />
            <circle
              cx={stampX + stampWidth}
              cy={stampY + stampHeight}
              r={perforationRadius}
              fill="#000000"
            />
            {horizontalHoles.map((x, index) => (
              <g key={`horizontal-${index}`}>
                <circle cx={x} cy={stampY} r={perforationRadius} fill="#000000" />
                <circle
                  cx={x}
                  cy={stampY + stampHeight}
                  r={perforationRadius}
                  fill="#000000"
                />
              </g>
            ))}
            {verticalHoles.map((y, index) => (
              <g key={`vertical-${index}`}>
                <circle cx={stampX} cy={y} r={perforationRadius} fill="#000000" />
                <circle
                  cx={stampX + stampWidth}
                  cy={y}
                  r={perforationRadius}
                  fill="#000000"
                />
              </g>
            ))}
          </mask>

          <clipPath id={clipId}>
            <rect x={artX} y={artY} width={artWidth} height={artHeight} />
          </clipPath>

          {/* Turbulence displacement on the inner artwork only */}
          <filter
            id={imageDistortFilterId}
            x="-12%"
            y="-12%"
            width="124%"
            height="124%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${imgDistortTurbulence} ${imgDistortTurbulence * 1.15}`}
              numOctaves={imgDistortOctaves}
              seed={Math.round(seed) + 59}
              result="imageNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="imageNoise"
              scale={imgDistortAmount}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedImage"
            />
            {imgDistortBlur > 0.01 ? (
              <feGaussianBlur in="displacedImage" stdDeviation={imgDistortBlur} />
            ) : (
              <feOffset in="displacedImage" dx="0" dy="0" />
            )}
          </filter>

          {/* Paper-break flecks — masks a paper fill into worn patches / speckles */}
          <filter
            id={imageErodeFilterId}
            x="-4%"
            y="-4%"
            width="108%"
            height="108%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${imgErodeScale * 0.32} ${imgErodeScale * 0.4}`}
              numOctaves="3"
              seed={Math.round(seed) + 157}
              result="coarseWear"
            />
            <feTurbulence
              type="turbulence"
              baseFrequency={`${imgErodeScale * 1.05} ${imgErodeScale * 1.3}`}
              numOctaves="2"
              seed={Math.round(seed) + 173}
              result="fineFlecks"
            />
            <feBlend
              in="coarseWear"
              in2="fineFlecks"
              mode="multiply"
              result="wearNoise"
            />
            <feColorMatrix
              in="wearNoise"
              type="matrix"
              values={[
                '0 0 0 0 0',
                '0 0 0 0 0',
                '0 0 0 0 0',
                `0 0 0 ${0.7 + imgErodeContrast * 1.6 + imgErodeAmount * 0.9} ${
                  -0.35 - imgErodeContrast * 0.35 + imgErodeAmount * 0.2
                }`,
              ].join(' ')}
              result="wearMask"
            />
            {/* Low-frequency density clouds — flecks pool in some regions more than others */}
            {imgErodeVariation > 0.001 ? (
              <>
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency={`${imgErodeVariationScale * 0.045} ${imgErodeVariationScale * 0.06}`}
                  numOctaves="2"
                  seed={Math.round(seed) + 191}
                  result="densityCloud"
                />
                <feColorMatrix
                  in="densityCloud"
                  type="matrix"
                  values={[
                    '0 0 0 0 0',
                    '0 0 0 0 0',
                    '0 0 0 0 0',
                    // Alpha density map — higher contrast as variation increases
                    `${0.4 + imgErodeVariation * 1.1} ${0.4 + imgErodeVariation * 1.1} ${
                      0.4 + imgErodeVariation * 1.1
                    } 0 ${0.5 - imgErodeVariation * 0.4}`,
                  ].join(' ')}
                  result="densityField"
                />
                {/* mix(uniformWear, wear * density, variation) */}
                <feComposite
                  in="wearMask"
                  in2="densityField"
                  operator="arithmetic"
                  k1={imgErodeVariation}
                  k2={1 - imgErodeVariation}
                  k3="0"
                  k4="0"
                  result="variedWearMask"
                />
              </>
            ) : (
              <feOffset in="wearMask" dx="0" dy="0" result="variedWearMask" />
            )}
            {imgErodeSoftness > 0.01 ? (
              <feGaussianBlur
                in="variedWearMask"
                stdDeviation={imgErodeSoftness}
                result="softWearMask"
              />
            ) : (
              <feOffset in="variedWearMask" dx="0" dy="0" result="softWearMask" />
            )}
            <feComposite
              in="SourceGraphic"
              in2="softWearMask"
              operator="in"
            />
          </filter>

          {/* Distressed / horizontal-slice glitch for stamp typography */}
          <filter
            id={textGlitchFilterId}
            x="-20%"
            y="-35%"
            width="140%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            {/* Horizontal banding noise — shifts letter slices sideways */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`0.01 ${glitchSlice}`}
              numOctaves="2"
              seed={Math.round(seed) + 91}
              result="sliceNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="sliceNoise"
              scale={glitchAmount}
              xChannelSelector="R"
              yChannelSelector="B"
              result="slicedText"
            />
            {/* Softer secondary wobble for weathered edges */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.08 0.35"
              numOctaves="2"
              seed={Math.round(seed) + 113}
              result="edgeNoise"
            />
            <feDisplacementMap
              in="slicedText"
              in2="edgeNoise"
              scale={glitchAmount * 0.35}
              xChannelSelector="G"
              yChannelSelector="R"
              result="distressedText"
            />
            <feGaussianBlur
              in="distressedText"
              stdDeviation={glitchBleed}
              result="bledText"
            />
            <feBlend in="distressedText" in2="bledText" mode="normal" />
          </filter>

          {/* Paper flecks overlaid on type — does not punch holes in the base ink */}
          <filter
            id={textErodeOverlayFilterId}
            x="-20%"
            y="-35%"
            width="140%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodColor={paperColor} result="paperFill" />
            <feComposite
              in="paperFill"
              in2="SourceGraphic"
              operator="in"
              result="paperInk"
            />
            <feTurbulence
              type="turbulence"
              baseFrequency="0.55 0.9"
              numOctaves="2"
              seed={Math.round(seed) + 131}
              result="erodeNoise"
            />
            <feColorMatrix
              in="erodeNoise"
              type="matrix"
              values={[
                '0 0 0 0 0',
                '0 0 0 0 0',
                '0 0 0 0 0',
                `0 0 0 ${1.2 + glitchErode * 1.4} ${-0.15 - glitchErode * 0.35}`,
              ].join(' ')}
              result="erodeMask"
            />
            <feGaussianBlur
              in="erodeMask"
              stdDeviation={0.35 + glitchErode * 0.5}
              result="softErodeMask"
            />
            <feComposite in="paperInk" in2="softErodeMask" operator="in" />
          </filter>

          {/* Ink-bleed / offset print distortion for the stamp frame lines */}
          <filter
            id={frameInkFilterId}
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            {inkTurbulence > 0.0005 && inkDisplacement > 0.001 ? (
              <>
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency={`${Math.max(0.002, inkTurbulence)} ${Math.max(0.002, inkTurbulence) * 1.2}`}
                  numOctaves="3"
                  seed={Math.round(seed) + 41}
                  result="frameWobbleNoise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="frameWobbleNoise"
                  scale={inkDisplacement}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="wobbledFrame"
                />
              </>
            ) : (
              <feOffset in="SourceGraphic" dx="0" dy="0" result="wobbledFrame" />
            )}
            {/* Soft fiber bleed into the paper */}
            {inkBlur > 0.001 ? (
              <>
                <feGaussianBlur
                  in="wobbledFrame"
                  stdDeviation={inkBlur}
                  result="bledFrame"
                />
                <feBlend
                  in="wobbledFrame"
                  in2="bledFrame"
                  mode="normal"
                  result="inkBody"
                />
              </>
            ) : (
              <feOffset in="wobbledFrame" dx="0" dy="0" result="inkBody" />
            )}
            {/* Speckle — ease + mix with solid ink so low values stay subtle */}
            {inkBreaks > 0.001 ? (
              <>
                <feTurbulence
                  type="turbulence"
                  baseFrequency={`${inkSpeckleFrequency} ${inkSpeckleFrequency * 1.2}`}
                  numOctaves="2"
                  seed={Math.round(seed) + 73}
                  result="inkSpeckle"
                />
                <feColorMatrix
                  in="inkSpeckle"
                  type="matrix"
                  values={[
                    '0 0 0 0 0',
                    '0 0 0 0 0',
                    '0 0 0 0 0',
                    `0 0 0 ${inkSpeckleSlope} ${inkSpeckleIntercept}`,
                  ].join(' ')}
                  result="inkSpeckleAlpha"
                />
                <feComposite
                  in="inkBody"
                  in2="inkSpeckleAlpha"
                  operator="in"
                  result="brokenInk"
                />
                {/* (1 - t) * solid + t * broken */}
                <feComposite
                  in="inkBody"
                  in2="brokenInk"
                  operator="arithmetic"
                  k1="0"
                  k2={1 - inkBreaksEased}
                  k3={inkBreaksEased}
                  k4="0"
                />
              </>
            ) : (
              <feOffset in="inkBody" dx="0" dy="0" />
            )}
          </filter>

          <filter
            id={filterId}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            {/* Soft perforated outline */}
            <feMorphology
              in="SourceAlpha"
              operator="dilate"
              radius={Math.max(0, outlineWidth)}
              result="dilated"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency={Math.max(0.001, grainFrequency)}
              numOctaves={Math.max(1, Math.min(4, Math.round(grainOctaves)))}
              seed={Math.round(seed)}
              result="edgeNoise"
            />
            <feDisplacementMap
              in="dilated"
              in2="edgeNoise"
              scale={Math.max(0, edgeRoughness)}
              xChannelSelector="R"
              yChannelSelector="B"
              result="roughOutline"
            />
            <feFlood floodColor={outlineColor} result="outlineColor" />
            <feComposite
              in="outlineColor"
              in2="roughOutline"
              operator="in"
              result="outline"
            />

            {/* Surface ridges + glow */}
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation={Math.max(0, surfaceBlur)}
              result="surface"
            />
            <feSpecularLighting
              in="surface"
              surfaceScale={Math.max(0, surfaceScale)}
              specularConstant={Math.max(0, specularStrength)}
              specularExponent={Math.max(1, specularExponent)}
              lightingColor={lightColor}
              result="lighting"
            >
              <fePointLight
                ref={pointLightRef}
                x={lightX}
                y={lightY}
                z={Math.max(1, lightZ)}
              />
            </feSpecularLighting>
            <feComposite
              in="lighting"
              in2="SourceAlpha"
              operator="in"
              result="surfaceLighting"
            />
            <feComponentTransfer in="surfaceLighting" result="subtleLighting">
              <feFuncA
                type="linear"
                slope={Math.max(0, Math.min(1, highlightOpacity))}
              />
            </feComponentTransfer>

            {/* Paper + image + glow, then print grain on top so it's visible */}
            <feMerge result="litStamp">
              <feMergeNode in="outline" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="subtleLighting" />
            </feMerge>

            {paperTexture ? (
              <>
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency={`${textureFrequency} ${textureFrequency * 1.12}`}
                  numOctaves="3"
                  seed={Math.round(seed) + 17}
                  result="printGrain"
                />
                <feColorMatrix
                  in="printGrain"
                  type="matrix"
                  values={`0 0 0 0 ${textureTone}
                          0 0 0 0 ${textureTone}
                          0 0 0 0 ${textureTone * 0.97}
                          0 0 0 0.85 0`}
                  result="printGrainTone"
                />
                <feComposite
                  in="printGrainTone"
                  in2="SourceGraphic"
                  operator="in"
                  result="printGrainMasked"
                />
                <feComponentTransfer in="printGrainMasked" result="printGrainFaded">
                  <feFuncA type="linear" slope={textureOpacity} />
                </feComponentTransfer>
                <feBlend
                  in="litStamp"
                  in2="printGrainFaded"
                  mode={textureBlendMode}
                  result="sticker"
                />
              </>
            ) : (
              <feOffset in="litStamp" dx="0" dy="0" result="sticker" />
            )}

            {/* Layered table shadows — contact + mid + ambient */}
            {effectiveShowShadow ? (
              <>
                <feGaussianBlur
                  in="SourceAlpha"
                  stdDeviation={ambientBlur}
                  result="ambientBlur"
                />
                <feOffset
                  in="ambientBlur"
                  dx={shadowX * 1.35}
                  dy={shadowY * 1.45}
                  result="ambientOffset"
                />
                <feFlood
                  floodColor={shadowColor}
                  floodOpacity={ambientOpacity}
                  result="ambientFlood"
                />
                <feComposite
                  in="ambientFlood"
                  in2="ambientOffset"
                  operator="in"
                  result="ambientShadow"
                />

                <feGaussianBlur in="SourceAlpha" stdDeviation={midBlur} result="midBlur" />
                <feOffset
                  in="midBlur"
                  dx={shadowX * 0.85}
                  dy={shadowY * 0.95}
                  result="midOffset"
                />
                <feFlood
                  floodColor={shadowColor}
                  floodOpacity={midOpacity}
                  result="midFlood"
                />
                <feComposite
                  in="midFlood"
                  in2="midOffset"
                  operator="in"
                  result="midShadow"
                />

                <feGaussianBlur
                  in="SourceAlpha"
                  stdDeviation={contactBlur}
                  result="contactBlur"
                />
                <feOffset
                  in="contactBlur"
                  dx={shadowX * 0.35}
                  dy={shadowY * 0.4}
                  result="contactOffset"
                />
                <feFlood
                  floodColor={shadowColor}
                  floodOpacity={contactOpacity}
                  result="contactFlood"
                />
                <feComposite
                  in="contactFlood"
                  in2="contactOffset"
                  operator="in"
                  result="contactShadow"
                />

                <feMerge>
                  <feMergeNode in="ambientShadow" />
                  <feMergeNode in="midShadow" />
                  <feMergeNode in="contactShadow" />
                  <feMergeNode in="sticker" />
                </feMerge>
              </>
            ) : (
              <feMerge>
                <feMergeNode in="sticker" />
              </feMerge>
            )}
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          <g mask={`url(#${maskId})`}>
            <rect
              x={stampX}
              y={stampY}
              width={stampWidth}
              height={stampHeight}
              style={{ fill: 'var(--stamp-svg-paper)' }}
            />
            <image
              data-stamp-art=""
              href={imageSrc}
              x={artX}
              y={artY}
              width={artWidth}
              height={artHeight}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
              filter={applyImageDistort ? `url(#${imageDistortFilterId})` : undefined}
            />

            {applyImageErode && !imageErodeOverText ? (
              <g clipPath={`url(#${clipId})`} opacity={imgErodeOpacity}>
                <rect
                  x={artX}
                  y={artY}
                  width={artWidth}
                  height={artHeight}
                  filter={`url(#${imageErodeFilterId})`}
                  style={{ fill: 'var(--stamp-svg-paper)' }}
                />
              </g>
            ) : null}

            {/* Paper lip where art meets border */}
            <rect
              x={artX}
              y={artY}
              width={artWidth}
              height={artHeight}
              fill="none"
              strokeWidth="6"
              opacity="0.55"
              style={{ stroke: 'var(--stamp-svg-paper)' }}
            />

            {stampFrame ? (
              <g
                filter={applyFrameInkFilter ? `url(#${frameInkFilterId})` : undefined}
                opacity="0.92"
              >
                <rect
                  x={frameOuterX}
                  y={frameOuterY}
                  width={frameOuterW}
                  height={frameOuterH}
                  fill="none"
                  strokeWidth="4.5"
                  style={{ stroke: 'var(--stamp-svg-paper)' }}
                />
                <rect
                  x={frameInnerX}
                  y={frameInnerY}
                  width={frameInnerW}
                  height={frameInnerH}
                  fill="none"
                  strokeWidth="1.75"
                  opacity="0.55"
                  style={{ stroke: 'var(--stamp-svg-paper)' }}
                />
              </g>
            ) : null}

            {(title || dateLabel || showLogo) && (
              <>
                <g
                  opacity={resolvedTextOpacity}
                  filter={textGlitch ? `url(#${textGlitchFilterId})` : undefined}
                >
                  {titleLines.length > 0 ? (
                    <text
                      x={artX + titlePadX}
                      y={artY + 42}
                      fontSize={titleFontSize}
                      fontWeight={resolvedFontWeight}
                      letterSpacing={resolvedLetterSpacing}
                      dominantBaseline="hanging"
                      textAnchor="start"
                      style={{
                        fill: 'var(--stamp-svg-text)',
                        fontFamily: resolvedFontFamily,
                      }}
                    >
                      {titleLines.map((line, index) => (
                        <tspan
                          key={`title-line-${index}`}
                          x={artX + titlePadX}
                          dy={index === 0 ? 0 : titleLineHeight}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  ) : null}
                  {showLogo || dateLabel ? (
                    <g>
                      {showLogo ? (
                        <image
                          href={resolvedLogoSrc}
                          x={dateAnchorX - logoWidth}
                          y={logoY}
                          width={logoWidth}
                          height={logoHeight}
                          preserveAspectRatio="xMaxYMax meet"
                        />
                      ) : null}
                      {dateLabel ? (
                        <text
                          x={dateAnchorX}
                          y={dateY}
                          fontSize={dateFontSize}
                          fontWeight={resolvedFontWeight}
                          letterSpacing={resolvedLetterSpacing * 0.7}
                          textAnchor="end"
                          style={{
                            fill: 'var(--stamp-svg-text)',
                            fontFamily: resolvedFontFamily,
                          }}
                        >
                          {dateLabel}
                        </text>
                      ) : null}
                    </g>
                  ) : null}
                </g>

                {applyTextErodeOverlay ? (
                  <g
                    opacity={glitchErodeOpacity}
                    filter={`url(#${textErodeOverlayFilterId})`}
                  >
                    <g filter={textGlitch ? `url(#${textGlitchFilterId})` : undefined}>
                      {titleLines.length > 0 ? (
                        <text
                          x={artX + titlePadX}
                          y={artY + 42}
                          fontSize={titleFontSize}
                          fontWeight={resolvedFontWeight}
                          letterSpacing={resolvedLetterSpacing}
                          dominantBaseline="hanging"
                          textAnchor="start"
                          style={{
                            fill: 'var(--stamp-svg-text)',
                            fontFamily: resolvedFontFamily,
                          }}
                        >
                          {titleLines.map((line, index) => (
                            <tspan
                              key={`title-erode-line-${index}`}
                              x={artX + titlePadX}
                              dy={index === 0 ? 0 : titleLineHeight}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      ) : null}
                      {showLogo || dateLabel ? (
                        <g>
                          {showLogo ? (
                            <image
                              href={resolvedLogoSrc}
                              x={dateAnchorX - logoWidth}
                              y={logoY}
                              width={logoWidth}
                              height={logoHeight}
                              preserveAspectRatio="xMaxYMax meet"
                            />
                          ) : null}
                          {dateLabel ? (
                            <text
                              x={dateAnchorX}
                              y={dateY}
                              fontSize={dateFontSize}
                              fontWeight={resolvedFontWeight}
                              letterSpacing={resolvedLetterSpacing * 0.7}
                              textAnchor="end"
                              style={{
                                fill: 'var(--stamp-svg-text)',
                                fontFamily: resolvedFontFamily,
                              }}
                            >
                              {dateLabel}
                            </text>
                          ) : null}
                        </g>
                      ) : null}
                    </g>
                  </g>
                ) : null}
              </>
            )}

            {applyImageErode && imageErodeOverText ? (
              <g clipPath={`url(#${clipId})`} opacity={imgErodeOpacity}>
                <rect
                  x={artX}
                  y={artY}
                  width={artWidth}
                  height={artHeight}
                  filter={`url(#${imageErodeFilterId})`}
                  style={{ fill: 'var(--stamp-svg-paper)' }}
                />
              </g>
            ) : null}
          </g>
        </g>
      </svg>
      </div>
    </div>
  );
});

export default StampSVG;
