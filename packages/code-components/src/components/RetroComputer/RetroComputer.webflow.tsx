import RetroComputer, { type RetroComputerProps } from './RetroComputer';
import { DEFAULT_CAMERA } from './camera';
import { FIREWORK_COLORS } from './celebration';
import { DEFAULT_HOVER_BRIGHTNESS } from './partHover';
import {
  ASPECT_RATIOS,
  DEFAULT_ACCESSIBLE_NAME,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_BACKGROUND,
  DEFAULT_CRT,
  DEFAULT_DESK_COLOR,
  DEFAULT_LIGHTING,
  DEFAULT_MAX_PIXEL_RATIO,
} from './settings';
import {
  DEFAULT_BADGE_TEXT,
  DEFAULT_NOTE_POSITION,
  DEFAULT_NOTE_TEXT,
  NOTE_POSITIONS,
} from './stickers';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';

interface RetroComputerWebflowProps extends Omit<
  RetroComputerProps,
  'cameraPosition' | 'cameraTarget' | 'keyLightPosition' | 'keyLightTarget'
> {
  cameraPositionX?: number;
  cameraPositionY?: number;
  cameraPositionZ?: number;
  cameraTargetX?: number;
  cameraTargetY?: number;
  cameraTargetZ?: number;
  keyLightPositionX?: number;
  keyLightPositionY?: number;
  keyLightPositionZ?: number;
  keyLightTargetX?: number;
  keyLightTargetY?: number;
  keyLightTargetZ?: number;
}

/** Webflow has no vector prop, so the camera and key light arrive as separate X/Y/Z numbers. */
function RetroComputerForWebflow({
  cameraPositionX = DEFAULT_CAMERA.position[0],
  cameraPositionY = DEFAULT_CAMERA.position[1],
  cameraPositionZ = DEFAULT_CAMERA.position[2],
  cameraTargetX = DEFAULT_CAMERA.target[0],
  cameraTargetY = DEFAULT_CAMERA.target[1],
  cameraTargetZ = DEFAULT_CAMERA.target[2],
  keyLightPositionX = DEFAULT_LIGHTING.keyLightPosition[0],
  keyLightPositionY = DEFAULT_LIGHTING.keyLightPosition[1],
  keyLightPositionZ = DEFAULT_LIGHTING.keyLightPosition[2],
  keyLightTargetX = DEFAULT_LIGHTING.keyLightTarget[0],
  keyLightTargetY = DEFAULT_LIGHTING.keyLightTarget[1],
  keyLightTargetZ = DEFAULT_LIGHTING.keyLightTarget[2],
  ...rest
}: RetroComputerWebflowProps) {
  return (
    <RetroComputer
      {...rest}
      cameraPosition={[cameraPositionX, cameraPositionY, cameraPositionZ]}
      cameraTarget={[cameraTargetX, cameraTargetY, cameraTargetZ]}
      keyLightPosition={[keyLightPositionX, keyLightPositionY, keyLightPositionZ]}
      keyLightTarget={[keyLightTargetX, keyLightTargetY, keyLightTargetZ]}
    />
  );
}

const sceneNumber = (group: string, tooltip: string) => (name: string, defaultValue: number) =>
  props.Number({ name, defaultValue, min: -100, max: 100, decimals: 2, group, tooltip });

const cameraNumber = sceneNumber(
  'Camera',
  'Camera position and the point it looks at, in scene units. Use "Copy camera settings" on the dev page to find values.'
);

const keyLightNumber = sceneNumber(
  'Lighting',
  'Key light position and the point it aims at, in scene units. Use "Copy look settings" on the dev page to find values.'
);

const RetroComputerWebflow = declareComponent(RetroComputerForWebflow, {
  name: 'RetroComputer',
  description:
    'Low-poly 90s computer on a desk. Click the keyboard to watch it publish, with a little ASCII celebration.',
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
    deskColor: props.Text({
      name: 'Desk Color',
      defaultValue: DEFAULT_DESK_COLOR,
      group: 'Model',
      tooltip: 'Color of the desk surface. Any CSS color.',
    }),
    showNote: props.Boolean({
      name: 'Show Sticky Note',
      defaultValue: true,
      group: 'Stickers',
      tooltip: 'Show the handwritten sticky note',
    }),
    notePosition: props.Variant({
      name: 'Sticky Note Position',
      options: NOTE_POSITIONS,
      defaultValue: DEFAULT_NOTE_POSITION,
      group: 'Stickers',
      tooltip:
        'Where the note is stuck: hanging off the bottom edge of the monitor, or high up on the side of the tower',
    }),
    noteText: props.Text({
      name: 'Sticky Note Text',
      defaultValue: DEFAULT_NOTE_TEXT,
      group: 'Stickers',
      tooltip:
        'Handwritten on the sticky note. Longer text wraps and shrinks to fit, up to 4 lines.',
    }),
    showBadge: props.Boolean({
      name: 'Show Badge',
      defaultValue: true,
      group: 'Stickers',
      tooltip: 'Show the foil "inside" badge on the front of the tower',
    }),
    badgeText: props.Text({
      name: 'Badge Text',
      defaultValue: DEFAULT_BADGE_TEXT,
      group: 'Stickers',
      tooltip: 'Brand name printed above "inside" on the badge. Keep it to a word or two.',
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
    keyLightPositionX: keyLightNumber('Key Light X', DEFAULT_LIGHTING.keyLightPosition[0]),
    keyLightPositionY: keyLightNumber('Key Light Y', DEFAULT_LIGHTING.keyLightPosition[1]),
    keyLightPositionZ: keyLightNumber('Key Light Z', DEFAULT_LIGHTING.keyLightPosition[2]),
    keyLightTargetX: keyLightNumber('Key Light Target X', DEFAULT_LIGHTING.keyLightTarget[0]),
    keyLightTargetY: keyLightNumber('Key Light Target Y', DEFAULT_LIGHTING.keyLightTarget[1]),
    keyLightTargetZ: keyLightNumber('Key Light Target Z', DEFAULT_LIGHTING.keyLightTarget[2]),
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
    showWall: props.Boolean({
      name: 'Show Wall',
      defaultValue: DEFAULT_BACKGROUND.showWall,
      group: 'Background',
      tooltip:
        'Stands a wall in the background color behind the desk, so the lights fall on it. Works best with mid to light colors.',
    }),
    backgroundColor: props.Text({
      name: 'Background',
      defaultValue: DEFAULT_BACKGROUND.backgroundColor,
      group: 'Background',
      tooltip:
        'Any CSS color, also used for the wall. Use "transparent" to show the page background behind the scene.',
    }),
    backgroundGlowColor: props.Text({
      name: 'Glow Color',
      defaultValue: DEFAULT_BACKGROUND.backgroundGlowColor,
      group: 'Background',
      tooltip:
        'Color of the soft glow behind the computer. Any CSS color. With the wall on, it lights the wall.',
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
    hoverBrightness: props.Number({
      name: 'Hover Brightness',
      defaultValue: DEFAULT_HOVER_BRIGHTNESS,
      min: 1,
      max: 2,
      decimals: 2,
      group: 'Model',
      tooltip:
        'How much the keyboard, power button and CD-ROM eject buttons brighten on hover. 1 turns it off.',
    }),
    accessibleName: props.Text({
      name: 'Accessible Name',
      defaultValue: DEFAULT_ACCESSIBLE_NAME,
      group: 'Accessibility',
      tooltip:
        'What screen readers announce when the scene gets keyboard focus, followed by the keyboard instructions. Describe it for this page, like "Animation of publishing a site".',
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
    cameraPositionX: cameraNumber('Position X', DEFAULT_CAMERA.position[0]),
    cameraPositionY: cameraNumber('Position Y', DEFAULT_CAMERA.position[1]),
    cameraPositionZ: cameraNumber('Position Z', DEFAULT_CAMERA.position[2]),
    cameraTargetX: cameraNumber('Target X', DEFAULT_CAMERA.target[0]),
    cameraTargetY: cameraNumber('Target Y', DEFAULT_CAMERA.target[1]),
    cameraTargetZ: cameraNumber('Target Z', DEFAULT_CAMERA.target[2]),
    cameraFov: props.Number({
      name: 'Field of View',
      defaultValue: DEFAULT_CAMERA.fov,
      min: 10,
      max: 70,
      decimals: 0,
      group: 'Camera',
      tooltip: 'Vertical field of view in degrees. Lower zooms in with less perspective.',
    }),
    aspectRatio: props.Variant({
      name: 'Aspect Ratio',
      options: ASPECT_RATIOS,
      defaultValue: DEFAULT_ASPECT_RATIO,
      group: 'Camera',
      tooltip:
        'Width to height of the scene. It always fills the width of its container, so this sets the height. Wider ratios show more of the desk at the sides.',
    }),
  },
});

export default RetroComputerWebflow;
