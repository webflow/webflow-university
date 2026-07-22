import { useState } from 'react';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';
import StampSVG, { DEFAULT_STAMP_PADDING, type StampSVGProps } from './StampSVG';
import { formatStampDate } from './StampSVG.options';
import './StampSVG.css';

/** Public fallback used when Image URL is empty in Designer */
const DEFAULT_IMAGE_URL =
  'https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6a514df3e397573a9787c75f_WFU%20Thumb%20Placeholder.jpg';

/** Keegan's Fave #1 — dark theme; colors follow site `--theme--t_*` tokens */
const KEEGAN_FAVE_STYLE = {
  showLogo: true,
  logoSize: 88,
  width: '100%',
  aspectRatio: '16 / 9',
  rotation: -2,
  paperColor: 'var(--theme--t_bg-tertiary, #171717)',
  outlineColor: 'var(--theme--t_bg-secondary, #222)',
  outlineWidth: 6,
  // Always light — title/date sit on the course image, not the paper
  textColor: 'var(--theme--t_btn-2-text, white)',
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
  paperTextureOpacity: 0.18,
  paperTextureScale: 0.9,
  paperTextureDarkInk: false,
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
  surfaceBlur: 18,
  surfaceScale: 3.6,
  specularStrength: 0.1,
  specularExponent: 68,
  highlightOpacity: 0.08,
  lightColor: 'var(--theme--t_icon-primary, white)',
  lightZ: 1375,
  pointerLight: true,
  interactiveTilt: true,
  tiltAmount: 6,
  breathe: true,
  showShadow: true,
  shadowColor: 'var(--theme--t_bg-primary, #080808)',
  shadowOpacity: 0.55,
  shadowBlur: 22,
  shadowX: 6,
  shadowY: 14,
} satisfies Partial<StampSVGProps>;

type StampSVGWebflowProps = {
  imageUrl?: string;
  logoUrl?: string;
  title?: string;
  horizontalPadding?: number;
  verticalPadding?: number;
  interactionIntensity?: number;
  rotation?: number;
};

function StampSVGForWebflow({
  imageUrl,
  logoUrl,
  title,
  horizontalPadding = DEFAULT_STAMP_PADDING,
  verticalPadding = DEFAULT_STAMP_PADDING,
  interactionIntensity = KEEGAN_FAVE_STYLE.tiltAmount,
  rotation = KEEGAN_FAVE_STYLE.rotation,
}: StampSVGWebflowProps) {
  // The component is client-only, so initialize "today" directly without an effect (#418).
  const [dateLabel] = useState(() => formatStampDate());

  const trimmedImage = imageUrl?.trim();
  const trimmedLogo = logoUrl?.trim();
  const courseTitle = title?.trim() || 'Course title';

  return (
    <StampSVG
      {...KEEGAN_FAVE_STYLE}
      dateLabel={dateLabel}
      image={{
        src: trimmedImage || DEFAULT_IMAGE_URL,
        alt: courseTitle,
      }}
      logoUrl={trimmedLogo || undefined}
      title={courseTitle}
      horizontalPadding={horizontalPadding}
      verticalPadding={verticalPadding}
      tiltAmount={interactionIntensity}
      rotation={rotation}
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
    // Client-only: completion page sets data-props from the URL after load. SSR HTML is
    // baked with Designer defaults at publish time, so hydrating against live props (#418).
    ssr: false,
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
    horizontalPadding: props.Number({
      name: 'Horizontal Padding',
      defaultValue: DEFAULT_STAMP_PADDING,
      min: 0,
      max: 500,
      decimals: 0,
      group: 'Layout',
      tooltip: 'Space between the left/right stamp edges and component bounds',
    }),
    verticalPadding: props.Number({
      name: 'Vertical Padding',
      defaultValue: DEFAULT_STAMP_PADDING,
      min: 0,
      max: 500,
      decimals: 0,
      group: 'Layout',
      tooltip: 'Space between the top/bottom stamp edges and component bounds',
    }),
    rotation: props.Number({
      name: 'Rotation Amount',
      defaultValue: KEEGAN_FAVE_STYLE.rotation,
      min: -15,
      max: 15,
      decimals: 1,
      group: 'Layout',
      tooltip: 'Static stamp rotation in degrees',
    }),
    interactionIntensity: props.Number({
      name: 'Interaction Intensity',
      defaultValue: KEEGAN_FAVE_STYLE.tiltAmount,
      min: 0,
      max: 18,
      decimals: 1,
      group: 'Interaction',
      tooltip: 'Maximum pointer-driven tilt in degrees',
    }),
  },
});

export default StampSVGWebflow;
