import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';
import StampSVG from './StampSVG';

const StampSVGWebflow = declareComponent(StampSVG, {
  name: 'StampSVG',
  description:
    'Lightweight SVG postage stamp with perforated edges, print grain, layered table shadow, pointer tilt, and specular lighting',
  group: 'Media',
  options: {
    applyTagSelectors: true,
    ssr: true,
  },
  props: {
    image: props.Image({
      name: 'Image',
      group: 'Content',
      tooltip: 'Artwork shown inside the stamp',
    }),
    title: props.Text({
      name: 'Title',
      defaultValue: 'Course title',
      group: 'Content',
    }),
    dateLabel: props.Text({
      name: 'Date',
      defaultValue: '16.07.2026',
      group: 'Content',
    }),
    showLogo: props.Boolean({
      name: 'Show Logo',
      defaultValue: true,
      group: 'Typography',
      tooltip: 'Show the Webflow logo mark above the date',
    }),
    logoSize: props.Number({
      name: 'Logo Size',
      defaultValue: 70,
      group: 'Typography',
      tooltip: 'Logo width in SVG units',
    }),
    textColor: props.Text({
      name: 'Text Color',
      defaultValue: '#ffffff',
      group: 'Content',
      tooltip: 'Overlay text on artwork — white by default for contrast',
    }),
    textOpacity: props.Number({
      name: 'Text Opacity',
      defaultValue: 1,
      group: 'Typography',
    }),
    fontFamily: props.Text({
      name: 'Font Family',
      defaultValue: "'Instrument Serif', Georgia, 'Times New Roman', serif",
      group: 'Typography',
      tooltip: 'CSS font-family stack — load Instrument Serif (or other webfonts) on the site for best results',
    }),
    fontWeight: props.Number({
      name: 'Font Weight',
      defaultValue: 600,
      group: 'Typography',
    }),
    letterSpacing: props.Number({
      name: 'Letter Spacing',
      defaultValue: 0,
      group: 'Typography',
    }),
    titleFontSize: props.Number({
      name: 'Title Size',
      defaultValue: 46,
      group: 'Typography',
    }),
    titleMaxWidth: props.Number({
      name: 'Title Max Width %',
      defaultValue: 100,
      group: 'Typography',
      tooltip: 'Maximum title width as a percent of the artwork — wraps onto additional lines',
    }),
    dateFontSize: props.Number({
      name: 'Date Size',
      defaultValue: 19,
      group: 'Typography',
    }),
    textGlitch: props.Boolean({
      name: 'Text Glitch',
      defaultValue: true,
      group: 'Typography',
      tooltip: 'Horizontal slice / distressed print treatment on typography',
    }),
    textGlitchAmount: props.Number({
      name: 'Glitch Displacement',
      defaultValue: 2,
      group: 'Typography',
    }),
    textGlitchBleed: props.Number({
      name: 'Glitch Ink Bleed',
      defaultValue: 0.2,
      group: 'Typography',
    }),
    textGlitchSlice: props.Number({
      name: 'Glitch Slice Frequency',
      defaultValue: 0.14,
      group: 'Typography',
    }),
    textGlitchErode: props.Number({
      name: 'Text Break Coverage',
      defaultValue: 0.1,
      group: 'Typography',
      tooltip: 'Paper flecks overlaid on type — does not fade the base letterforms',
    }),
    textGlitchErodeOpacity: props.Number({
      name: 'Text Break Overlay Opacity',
      defaultValue: 0.6,
      group: 'Typography',
      tooltip: 'Opacity of the paper-break flecks on top of the text (base type stays solid)',
    }),
    width: props.Text({
      name: 'Width',
      defaultValue: '100%',
      group: 'Layout',
    }),
    aspectRatio: props.Text({
      name: 'Aspect Ratio',
      defaultValue: '16 / 9',
      group: 'Layout',
      tooltip: 'CSS aspect ratio, e.g. 16 / 9, 1 / 1, 4 / 5, 9 / 16',
    }),
    rotation: props.Number({
      name: 'Rotation',
      defaultValue: -3,
      group: 'Layout',
      tooltip: 'Base stamp rotation in degrees — like it was just dropped on the table',
    }),
    interactiveTilt: props.Boolean({
      name: 'Pointer Tilt',
      defaultValue: true,
      group: 'Layout',
      tooltip: 'Subtle 3D tilt that follows the pointer',
    }),
    tiltAmount: props.Number({
      name: 'Tilt Amount',
      defaultValue: 6,
      group: 'Layout',
    }),
    paperColor: props.Text({
      name: 'Paper Color',
      defaultValue: 'var(--stamp-paper, var(--theme--t_bg-tertiary))',
      group: 'Stamp',
      tooltip: 'Supports CSS variables — in light previews, paper uses the soft gray border tone',
    }),
    paperBorder: props.Number({
      name: 'Paper Border',
      defaultValue: 28,
      group: 'Stamp',
      tooltip: 'Paper border width in SVG units',
    }),
    stampFrame: props.Boolean({
      name: 'Stamp Frame',
      defaultValue: true,
      group: 'Stamp',
      tooltip: 'Thin double-line border over the artwork',
    }),
    frameDistort: props.Boolean({
      name: 'Frame Distortion',
      defaultValue: true,
      group: 'Stamp',
      tooltip: 'Ink wobble / bleed distortion on the frame strokes',
    }),
    frameInkDisplacement: props.Number({
      name: 'Frame Ink Displacement',
      defaultValue: 2.2,
      group: 'Stamp',
      tooltip: 'How much the frame path wobbles',
    }),
    frameInkBlur: props.Number({
      name: 'Frame Ink Blur',
      defaultValue: 0.45,
      group: 'Stamp',
      tooltip: 'Soft fiber bleed on the frame strokes',
    }),
    frameInkTurbulence: props.Number({
      name: 'Frame Ink Turbulence',
      defaultValue: 0.01,
      group: 'Stamp',
      tooltip: 'Noise frequency for frame path wobble',
    }),
    frameInkBreaks: props.Number({
      name: 'Frame Ink Breaks',
      defaultValue: 0.35,
      group: 'Stamp',
      tooltip: 'Uneven ink speckles in the frame — set to 0 for solid clean lines',
    }),
    paperTexture: props.Boolean({
      name: 'Print Texture',
      defaultValue: true,
      group: 'Stamp',
      tooltip: 'Riso / offset grain over paper and image (layered above the glow)',
    }),
    paperTextureOpacity: props.Number({
      name: 'Texture Strength',
      defaultValue: 0.18,
      group: 'Stamp',
    }),
    paperTextureScale: props.Number({
      name: 'Texture Scale',
      defaultValue: 0.9,
      group: 'Stamp',
      tooltip: 'Higher = finer print dots, lower = coarser grain',
    }),
    paperTextureDarkInk: props.Boolean({
      name: 'Dark Paper Texture',
      defaultValue: false,
      group: 'Stamp',
      tooltip: 'Use dark multiply grain for white/light paper — leave off for dark paper',
    }),
    imageDistort: props.Boolean({
      name: 'Image Distort',
      defaultValue: false,
      group: 'Stamp',
      tooltip: 'Turbulence displacement on the inner artwork',
    }),
    imageDistortAmount: props.Number({
      name: 'Image Displacement',
      defaultValue: 13,
      group: 'Stamp',
    }),
    imageDistortTurbulence: props.Number({
      name: 'Image Turbulence',
      defaultValue: 0.015,
      group: 'Stamp',
    }),
    imageDistortOctaves: props.Number({
      name: 'Image Noise Octaves',
      defaultValue: 2,
      group: 'Stamp',
    }),
    imageDistortBlur: props.Number({
      name: 'Image Distort Blur',
      defaultValue: 0.35,
      group: 'Stamp',
    }),
    imageErode: props.Boolean({
      name: 'Paper Breaks',
      defaultValue: true,
      group: 'Stamp',
      tooltip: 'Paper fleck overlay that looks like print worn through to the paper',
    }),
    imageErodeOverText: props.Boolean({
      name: 'Breaks Over Text',
      defaultValue: true,
      group: 'Stamp',
      tooltip: 'Lay paper breaks over title, date, and logo as well as the image',
    }),
    imageErodeAmount: props.Number({
      name: 'Break Coverage',
      defaultValue: 0.012,
      group: 'Stamp',
      tooltip: 'Useful range is typically 0–0.1; keep values low for subtle wear',
    }),
    imageErodeScale: props.Number({
      name: 'Break Scale',
      defaultValue: 1.8,
      group: 'Stamp',
      tooltip: 'Higher = finer flecks, lower = larger worn patches',
    }),
    imageErodeOpacity: props.Number({
      name: 'Erosion Overlay Opacity',
      defaultValue: 0.18,
      group: 'Stamp',
      tooltip: 'Opacity of the paper-break flecks over the image and text',
    }),
    imageErodeSoftness: props.Number({
      name: 'Break Softness',
      defaultValue: 0.4,
      group: 'Stamp',
    }),
    imageErodeContrast: props.Number({
      name: 'Break Contrast',
      defaultValue: 0.68,
      group: 'Stamp',
      tooltip: 'Higher = harder, more graphic holes',
    }),
    imageErodeVariation: props.Number({
      name: 'Break Variation',
      defaultValue: 0.6,
      group: 'Stamp',
      tooltip: 'How uneven fleck density is — higher pools wear in some regions more than others',
    }),
    imageErodeVariationScale: props.Number({
      name: 'Variation Scale',
      defaultValue: 0.32,
      group: 'Stamp',
      tooltip: 'Size of density pools — lower = larger regions of heavy vs light wear',
    }),
    perforationCount: props.Number({
      name: 'Perforation Count',
      defaultValue: 22,
      group: 'Stamp',
    }),
    perforationRadius: props.Number({
      name: 'Perforation Radius',
      defaultValue: 18,
      group: 'Stamp',
    }),
    outlineColor: props.Text({
      name: 'Outline Color',
      defaultValue: '#222222',
      group: 'Filter',
      tooltip: 'Supports CSS variables',
    }),
    outlineWidth: props.Number({
      name: 'Outline Width',
      defaultValue: 6,
      group: 'Filter',
    }),
    edgeRoughness: props.Number({
      name: 'Edge Roughness',
      defaultValue: 16,
      group: 'Filter',
      tooltip: 'Displacement applied to the sticker outline',
    }),
    grainFrequency: props.Number({
      name: 'Grain Frequency',
      defaultValue: 0.018,
      group: 'Filter',
    }),
    grainOctaves: props.Number({
      name: 'Grain Octaves',
      defaultValue: 2,
      group: 'Filter',
    }),
    seed: props.Number({
      name: 'Noise Seed',
      defaultValue: 11,
      group: 'Filter',
    }),
    surfaceBlur: props.Number({
      name: 'Light Diffusion',
      defaultValue: 18,
      group: 'Lighting',
      tooltip: 'Softens and broadens the light across the stamp surface',
    }),
    surfaceScale: props.Number({
      name: 'Ridge Scale',
      defaultValue: 4,
      group: 'Lighting',
      tooltip: 'Height of surface ridges — keep low for a subtle matte feel',
    }),
    specularStrength: props.Number({
      name: 'Specular Strength',
      defaultValue: 0.08,
      group: 'Lighting',
    }),
    specularExponent: props.Number({
      name: 'Specular Exponent',
      defaultValue: 68,
      group: 'Lighting',
    }),
    highlightOpacity: props.Number({
      name: 'Highlight Opacity',
      defaultValue: 0.05,
      group: 'Lighting',
      tooltip: 'Overall opacity of the additive light highlight',
    }),
    lightColor: props.Text({
      name: 'Light Color',
      defaultValue: '#ffffff',
      group: 'Lighting',
    }),
    lightX: props.Number({
      name: 'Light X',
      defaultValue: 250,
      group: 'Lighting',
    }),
    lightY: props.Number({
      name: 'Light Y',
      defaultValue: 160,
      group: 'Lighting',
    }),
    lightZ: props.Number({
      name: 'Light Z',
      defaultValue: 1375,
      group: 'Lighting',
    }),
    pointerLight: props.Boolean({
      name: 'Pointer Light',
      defaultValue: false,
      group: 'Lighting',
      tooltip: 'Use the shared page pointer as one global light without triggering React renders',
    }),
    showShadow: props.Boolean({
      name: 'Layered Table Shadow',
      defaultValue: true,
      group: 'Shadow',
      tooltip: 'Three stacked shadows (contact + mid + ambient) for table tangibility',
    }),
    shadowColor: props.Text({
      name: 'Shadow Color',
      defaultValue: '#080808',
      group: 'Shadow',
    }),
    shadowOpacity: props.Number({
      name: 'Shadow Strength',
      defaultValue: 0.55,
      group: 'Shadow',
    }),
    shadowBlur: props.Number({
      name: 'Shadow Blur',
      defaultValue: 26,
      group: 'Shadow',
    }),
    shadowX: props.Number({
      name: 'Shadow X',
      defaultValue: 8,
      group: 'Shadow',
    }),
    shadowY: props.Number({
      name: 'Shadow Y',
      defaultValue: 18,
      group: 'Shadow',
    }),
  },
});

export default StampSVGWebflow;
