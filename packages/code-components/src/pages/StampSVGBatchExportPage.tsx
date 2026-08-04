import { useEffect, useMemo, useRef, useState } from 'react';
import StampSVG, { type StampSVGHandle } from '../components/Stamps/StampSVG';
import {
  STAMP_ASPECT_RATIO_OPTIONS,
  STAMP_FONT_OPTIONS,
} from '../components/Stamps/StampSVG.options';
import { COURSE_STAMPS } from '../components/Stamps/courses';
import './StampSVGPage.css';

/** Keegan's Fave #1 — shared look (theme-specific tokens layered on top) */
const KEEGAN_FAVE_1_BASE = {
  stampFrame: true,
  frameDistort: true,
  frameInkDisplacement: 7.7,
  frameInkBlur: 0.35,
  frameInkTurbulence: 0.012,
  frameInkBreaks: 0.02,
  paperTexture: true,
  paperTextureScale: 0.9,
  imageDistort: true,
  imageDistortAmount: 2,
  imageDistortTurbulence: 0.028,
  imageDistortOctaves: 2,
  imageDistortBlur: 0.1,
  imageErode: true,
  imageErodeOverText: true,
  imageErodeAmount: 0.01,
  imageErodeScale: 1.6,
  imageErodeOpacity: 0.44,
  imageErodeSoftness: 0.1,
  imageErodeContrast: 0.55,
  imageErodeVariation: 0.4,
  imageErodeVariationScale: 0.3,
  interactiveTilt: false,
  tiltAmount: 6,
  fontFamily: STAMP_FONT_OPTIONS['WF Mono'],
  fontWeight: 400,
  letterSpacing: -0.5,
  titleFontSize: 40,
  titleMaxWidth: 44,
  dateFontSize: 27,
  showLogo: true,
  logoSize: 88,
  textOpacity: 1,
  textGlitch: true,
  textGlitchAmount: 1.5,
  textGlitchBleed: 0.25,
  textGlitchSlice: 0.12,
  textGlitchErode: 0.12,
  textGlitchErodeOpacity: 0.55,
  aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['16:9'],
  rotation: -2,
  paperBorder: 28,
  perforationCount: 28,
  perforationRadius: 14,
  edgeRoughness: 6,
  grainFrequency: 0.018,
  grainOctaves: 2,
  seed: 11,
  surfaceBlur: 18,
  surfaceScale: 3.6,
  specularStrength: 0.1,
  specularExponent: 68,
  highlightOpacity: 0.08,
  lightZ: 1375,
  pointerLight: false,
  showShadow: true,
  shadowBlur: 22,
  shadowX: 6,
  shadowY: 14,
} as const;

const THEME_TOKENS = {
  light: {
    paperTextureOpacity: 0.28,
    outlineWidth: 3,
    shadowOpacity: 0.32,
    paperTextureDarkInk: true,
  },
  dark: {
    paperTextureOpacity: 0.18,
    outlineWidth: 6,
    shadowOpacity: 0.55,
    paperTextureDarkInk: false,
  },
} as const;

type BatchExportResult = {
  filename: string;
  title: string;
  dataUrl: string;
};

declare global {
  interface Window {
    __stampBatchExportReady?: boolean;
    __runStampBatchExport?: () => Promise<BatchExportResult[]>;
  }
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function StampSVGBatchExportPage() {
  const stampRef = useRef<StampSVGHandle>(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState('Preparing batch export…');
  const theme = useMemo(() => {
    const param = new URLSearchParams(window.location.search).get('theme');
    return param === 'dark' ? 'dark' : 'light';
  }, []);
  const themeTokens = THEME_TOKENS[theme];
  const course = COURSE_STAMPS[index] ?? COURSE_STAMPS[0];

  useEffect(() => {
    let cancelled = false;

    window.__runStampBatchExport = async () => {
      const results: BatchExportResult[] = [];
      await document.fonts.ready;

      for (let i = 0; i < COURSE_STAMPS.length; i += 1) {
        if (cancelled) break;
        const next = COURSE_STAMPS[i];
        setIndex(i);
        setStatus(`Rendering ${theme} ${i + 1}/${COURSE_STAMPS.length}: ${next.title}`);
        await wait(0);
        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
          });
        });
        await document.fonts.ready;
        await wait(350);

        const stamp = stampRef.current;
        if (!stamp) {
          throw new Error('Stamp ref missing during batch export');
        }

        const dataUrl = await stamp.exportPngDataUrl(2);
        const filename = `keegan-fave-1-${theme}-${String(i + 1).padStart(2, '0')}-${slugify(next.title)}.png`;
        results.push({ filename, title: next.title, dataUrl });
        setStatus(`Exported ${i + 1}/${COURSE_STAMPS.length}: ${filename}`);
      }

      setStatus(`Done — ${results.length} ${theme} stamps`);
      return results;
    };

    window.__stampBatchExportReady = true;
    setStatus(`Ready (${theme}) — waiting for export runner`);

    return () => {
      cancelled = true;
      window.__stampBatchExportReady = false;
      delete window.__runStampBatchExport;
    };
  }, [theme]);

  return (
    <main className="stamp-svg-page" data-page-theme={theme}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ width: 'min(960px, 90vw)' }}>
          <StampSVG
            ref={stampRef}
            image={{ src: course.image, alt: course.title }}
            title={course.title}
            paperColor="var(--theme--t_bg-tertiary)"
            outlineColor="var(--theme--t_bg-secondary)"
            textColor="var(--theme--t_btn-2-text, white)"
            shadowColor="var(--theme--t_bg-primary)"
            lightColor="var(--theme--t_icon-primary)"
            {...KEEGAN_FAVE_1_BASE}
            paperTextureOpacity={themeTokens.paperTextureOpacity}
            outlineWidth={themeTokens.outlineWidth}
            shadowOpacity={themeTokens.shadowOpacity}
            paperTextureDarkInk={themeTokens.paperTextureDarkInk}
            seed={KEEGAN_FAVE_1_BASE.seed + index}
          />
        </div>
      </div>
      <p className="stamp-svg-page__hint">{status}</p>
    </main>
  );
}

export default StampSVGBatchExportPage;
