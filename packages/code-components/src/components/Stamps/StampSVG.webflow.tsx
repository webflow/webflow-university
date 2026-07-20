import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';
import StampSVG, { type StampSVGProps } from './StampSVG';

/** Public fallback used when Image URL is empty in Designer */
const DEFAULT_IMAGE_URL =
  'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6a514df3e397573a9787c75f_WFU%20Thumb%20Placeholder.jpg';

/** Keegan's Fave #1 — light theme, baked into the Webflow component */
const KEEGAN_FAVE_STYLE = {
  dateLabel: '16.07.2026',
  showLogo: true,
  logoSize: 88,
  width: '100%',
  aspectRatio: '16 / 9',
  rotation: -2,
  paperColor: 'var(--stamp-paper, var(--swatches--white, #ffffff))',
  outlineColor: '#efefef',
  outlineWidth: 3,
  textColor: 'var(--swatches--white, #ffffff)',
  textOpacity: 1,
  fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
  fontWeight: 400,
  letterSpacing: -0.5,
  titleFontSize: 40,
  titleMaxWidth: 44,
  dateFontSize: 27,
  textGlitch: true,
  textGlitchAmount: 1.5,
  textGlitchBleed: 0.25,
  textGlitchSlice: 0.12,
  textGlitchErode: 0.12,
  textGlitchErodeOpacity: 0.55,
  paperBorder: 28,
  perforationCount: 28,
  perforationRadius: 14,
  edgeRoughness: 6,
  grainFrequency: 0.018,
  grainOctaves: 2,
  seed: 11,
  stampFrame: true,
  frameDistort: true,
  frameInkDisplacement: 7.7,
  frameInkBlur: 0.35,
  frameInkTurbulence: 0.012,
  frameInkBreaks: 0.02,
  paperTexture: true,
  paperTextureOpacity: 0.28,
  paperTextureScale: 0.9,
  paperTextureDarkInk: true,
  imageDistort: true,
  imageDistortAmount: 8,
  imageDistortTurbulence: 0.03,
  imageDistortOctaves: 2,
  imageDistortBlur: 0.3,
  imageErode: true,
  imageErodeOverText: true,
  imageErodeAmount: 0.01,
  imageErodeScale: 1.6,
  imageErodeOpacity: 0.44,
  imageErodeSoftness: 0.1,
  imageErodeContrast: 0.55,
  imageErodeVariation: 0.4,
  imageErodeVariationScale: 0.3,
  surfaceBlur: 18,
  surfaceScale: 3.6,
  specularStrength: 0.1,
  specularExponent: 68,
  highlightOpacity: 0.08,
  lightZ: 1375,
  pointerLight: true,
  interactiveTilt: true,
  tiltAmount: 6,
  showShadow: true,
  shadowOpacity: 0.32,
  shadowBlur: 22,
  shadowX: 6,
  shadowY: 14,
} satisfies Partial<StampSVGProps>;

type StampSVGWebflowProps = {
  imageUrl?: string;
  logoUrl?: string;
  title?: string;
};

function StampSVGForWebflow({ imageUrl, logoUrl, title }: StampSVGWebflowProps) {
  const trimmedImage = imageUrl?.trim();
  const trimmedLogo = logoUrl?.trim();
  const courseTitle = title?.trim() || 'Course title';

  return (
    <StampSVG
      {...KEEGAN_FAVE_STYLE}
      image={{
        src: trimmedImage || DEFAULT_IMAGE_URL,
        alt: courseTitle,
      }}
      logoUrl={trimmedLogo || undefined}
      title={courseTitle}
    />
  );
}

const StampSVGWebflow = declareComponent(StampSVGForWebflow, {
  name: 'StampSVG',
  description:
    "Course completion stamp in Keegan's Fave style — perforated edges, print grain, and pointer tilt",
  group: 'Media',
  options: {
    applyTagSelectors: true,
    ssr: true,
  },
  props: {
    imageUrl: props.Text({
      name: 'Image URL',
      defaultValue: DEFAULT_IMAGE_URL,
      group: 'Content',
      tooltip: 'Artwork shown inside the stamp',
    }),
    logoUrl: props.Text({
      name: 'Logo URL',
      defaultValue: '',
      group: 'Content',
      tooltip: 'Logo above the date — leave empty for the default Webflow mark',
    }),
    title: props.Text({
      name: 'Course Title',
      defaultValue: 'Course title',
      group: 'Content',
    }),
  },
});

export default StampSVGWebflow;
