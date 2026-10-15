import RetroComputer from './RetroComputer';
import { FIREWORK_COLORS } from './celebration';
import {
  DEFAULT_BACKGROUND,
  DEFAULT_CRT,
  DEFAULT_LIGHTING,
  DEFAULT_MAX_PIXEL_RATIO,
} from './settings';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';

const RetroComputerWebflow = declareComponent(RetroComputer, {
  name: 'RetroComputer',
  description:
    'Low-poly 90s computer on a desk. Click the Enter key to watch it publish, with a little ASCII celebration.',
  group: '3D Graphics',
  options: {
    applyTagSelectors: true,
    ssr: false,
  },
  props: {
    showCords: props.Boolean({
      name: 'Show Cords',
      defaultValue: true,
      group: 'Model',
      tooltip: 'Show the keyboard and mouse cords running to the back of the tower',
    }),
    showDesk: props.Boolean({
      name: 'Show Desk',
      defaultValue: true,
      group: 'Model',
      tooltip: 'Show the desk the computer sits on',
    }),
    keyLightColor: props.Text({
      name: 'Key Light Color',
      defaultValue: DEFAULT_LIGHTING.keyLightColor,
      group: 'Lighting',
      tooltip: 'Color of the main light raking in from the left. Any CSS color.',
    }),
    keyLightIntensity: props.Number({
      name: 'Key Light Intensity',
      defaultValue: DEFAULT_LIGHTING.keyLightIntensity,
      min: 0,
      max: 20,
      decimals: 1,
      group: 'Lighting',
      tooltip: 'Brightness of the key light and the pool of light on the desk',
    }),
    fillIntensity: props.Number({
      name: 'Fill Intensity',
      defaultValue: DEFAULT_LIGHTING.fillIntensity,
      min: 0,
      max: 3,
      decimals: 2,
      group: 'Lighting',
      tooltip: 'Soft ambient light that lifts the shadows. Lower for more contrast.',
    }),
    rimLightColor: props.Text({
      name: 'Rim Light Color',
      defaultValue: DEFAULT_LIGHTING.rimLightColor,
      group: 'Lighting',
      tooltip: 'Color of the light from behind that separates the edges from the background',
    }),
    rimLightIntensity: props.Number({
      name: 'Rim Light Intensity',
      defaultValue: DEFAULT_LIGHTING.rimLightIntensity,
      min: 0,
      max: 5,
      decimals: 2,
      group: 'Lighting',
    }),
    environmentIntensity: props.Number({
      name: 'Reflections',
      defaultValue: DEFAULT_LIGHTING.environmentIntensity,
      min: 0,
      max: 2,
      decimals: 2,
      group: 'Lighting',
      tooltip: 'Studio environment reflections. Mostly visible on the chrome badge.',
    }),
    bloomIntensity: props.Number({
      name: 'Bloom Intensity',
      defaultValue: DEFAULT_LIGHTING.bloomIntensity,
      min: 0,
      max: 3,
      decimals: 2,
      group: 'Lighting',
      tooltip: 'Strength of the glow around the badge, LEDs and bright screen content',
    }),
    bloomThreshold: props.Number({
      name: 'Bloom Threshold',
      defaultValue: DEFAULT_LIGHTING.bloomThreshold,
      min: 0,
      max: 10,
      decimals: 1,
      group: 'Lighting',
      tooltip: 'How bright something must be to bloom. Lower values make more of the scene glow.',
    }),
    backgroundColor: props.Text({
      name: 'Background',
      defaultValue: DEFAULT_BACKGROUND.backgroundColor,
      group: 'Background',
      tooltip: 'Any CSS color. Use "transparent" to show the page background behind the scene.',
    }),
    backgroundGlowColor: props.Text({
      name: 'Glow Color',
      defaultValue: DEFAULT_BACKGROUND.backgroundGlowColor,
      group: 'Background',
      tooltip: 'Color of the soft glow behind the computer. Any CSS color.',
    }),
    backgroundGlowStrength: props.Number({
      name: 'Glow Strength',
      defaultValue: DEFAULT_BACKGROUND.backgroundGlowStrength,
      min: 0,
      max: 1,
      decimals: 2,
      group: 'Background',
      tooltip: 'Opacity of the background glow. 0 turns it off.',
    }),
    screenBackground: props.Text({
      name: 'Screen Background',
      defaultValue: '#0a0e16',
      group: 'Screen',
      tooltip: 'Any CSS color for the monitor screen background',
    }),
    screenText: props.Text({
      name: 'Screen Text',
      defaultValue: '#4b8bff',
      group: 'Screen',
      tooltip: 'Any CSS color for the terminal text',
    }),
    fireworkColors: props.Text({
      name: 'Firework Colors',
      defaultValue: FIREWORK_COLORS.join(', '),
      group: 'Screen',
      tooltip:
        'Comma separated CSS colors for the publish fireworks, used in order and repeated if there are fewer than four.',
    }),
    screenGlow: props.Number({
      name: 'Screen Glow',
      defaultValue: DEFAULT_CRT.screenGlow,
      min: 0,
      max: 2,
      decimals: 2,
      group: 'Screen',
      tooltip: 'Phosphor glow around the screen text',
    }),
    scanlines: props.Number({
      name: 'Scanlines',
      defaultValue: DEFAULT_CRT.scanlines,
      min: 0,
      max: 1,
      decimals: 2,
      group: 'Screen',
      tooltip: 'Strength of the CRT scanlines. They fade out automatically on small screens.',
    }),
    vignette: props.Number({
      name: 'Vignette',
      defaultValue: DEFAULT_CRT.vignette,
      min: 0,
      max: 1,
      decimals: 2,
      group: 'Screen',
      tooltip: 'Darkening toward the edges of the screen',
    }),
    curvature: props.Number({
      name: 'Curvature',
      defaultValue: DEFAULT_CRT.curvature,
      min: 0,
      max: 1,
      decimals: 2,
      group: 'Screen',
      tooltip: 'Bulges the glass and bends the picture like a CRT tube. 0 is a flat screen.',
    }),
    chromaticAberration: props.Number({
      name: 'Color Fringing',
      defaultValue: DEFAULT_CRT.chromaticAberration,
      min: 0,
      max: 1,
      decimals: 2,
      group: 'Screen',
      tooltip: 'Red and blue fringes toward the edges of the screen',
    }),
    maxPixelRatio: props.Number({
      name: 'Max Pixel Ratio',
      defaultValue: DEFAULT_MAX_PIXEL_RATIO,
      min: 1,
      max: 2,
      decimals: 1,
      group: 'Performance',
      tooltip:
        'Caps rendering resolution on high-density (retina) screens. 1.5 is noticeably cheaper with little visible difference.',
    }),
    showControls: props.Boolean({
      name: 'Show Tuning Panel',
      defaultValue: false,
      group: 'Developer',
      tooltip:
        'Shows a DialKit panel over the scene to dial in lighting, screen and camera live. Changes are not saved: use "Copy settings" and paste the values into these props. Turn off before publishing.',
    }),
    enterLink: props.Link({
      name: 'After Publish Link',
      group: 'Interaction',
      tooltip:
        'Optional page to open once the publish animation finishes. Links are not followed in the Designer.',
    }),
  },
});

export default RetroComputerWebflow;
