import ProSphere from './ProSphere';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';

const ProSphereWebflow = declareComponent(ProSphere, {
  name: 'ProSphere',
  description: 'Interactive 3D sphere with neon glow effects and cursor spotlight',
  group: '3D Graphics',
  options: {
    applyTagSelectors: true,
  },
  props: {
    scale: props.Number({
      name: 'Scale',
      defaultValue: 3,
      group: 'Size & Scale',
      tooltip: 'Overall size of the sphere',
    }),
    horizontalStretch: props.Number({
      name: 'Horizontal Stretch',
      defaultValue: 1.2,
      group: 'Size & Scale',
      tooltip: 'Stretch factor along the horizontal axis for football shape',
    }),
    meridianCount: props.Number({
      name: 'Meridian Count',
      defaultValue: 16,
      group: 'Size & Scale',
      tooltip: 'Number of vertical lines (meridians) forming the sphere',
    }),
    verticalOffset: props.Number({
      name: 'Vertical Offset',
      defaultValue: -2,
      group: 'Position',
      tooltip: 'Vertical position offset of the sphere',
    }),
    rotationSpeed: props.Number({
      name: 'Rotation Speed',
      defaultValue: 0.2,
      group: 'Animation',
      tooltip: 'Speed of sphere rotation',
    }),
    glowIntensity: props.Number({
      name: 'Glow Intensity',
      defaultValue: 4.0,
      group: 'Glow Effects',
      tooltip: 'Intensity of the outer glow layer',
    }),
    coreIntensity: props.Number({
      name: 'Core Intensity',
      defaultValue: 8.0,
      group: 'Glow Effects',
      tooltip: 'Intensity of the core bright line',
    }),
    focusHeight: props.Number({
      name: 'Focus Height',
      defaultValue: 4.0,
      group: 'Glow Effects',
      tooltip: 'Height where the glow focus is strongest (in world space)',
    }),
    fogNear: props.Number({
      name: 'Fog Near',
      defaultValue: 5.0,
      group: 'Fog',
      tooltip: 'Distance where fog starts to appear',
    }),
    fogFar: props.Number({
      name: 'Fog Far',
      defaultValue: 19.5,
      group: 'Fog',
      tooltip: 'Distance where fog is fully applied',
    }),
    fogDensity: props.Number({
      name: 'Fog Density',
      defaultValue: 3.0,
      group: 'Fog',
      tooltip: 'Density/falloff of the fog effect',
    }),
    spotlightRadius: props.Number({
      name: 'Spotlight Radius',
      defaultValue: 2.0,
      group: 'Spotlight',
      tooltip: 'Radius of the cursor spotlight effect',
    }),
    spotlightIntensity: props.Number({
      name: 'Spotlight Intensity',
      defaultValue: 3.0,
      group: 'Spotlight',
      tooltip: 'Intensity of the cursor spotlight boost',
    }),
    iridescenceStrength: props.Number({
      name: 'Iridescence Strength',
      defaultValue: 0.5,
      group: 'Spotlight',
      tooltip: 'Strength of the iridescent color effect near cursor',
    }),
    spotlightDepth: props.Number({
      name: 'Spotlight Depth',
      defaultValue: 0.0,
      group: 'Spotlight',
      tooltip: 'Depth offset for spotlight intersection plane',
    }),
    spotlightEasing: props.Number({
      name: 'Spotlight Easing',
      defaultValue: 0.15,
      group: 'Spotlight',
      tooltip:
        'Easing factor for spotlight movement (0-1). Lower values = smoother/slower, higher values = faster/more responsive',
    }),
    spotlightSpeed: props.Number({
      name: 'Spotlight Speed',
      defaultValue: 1.0,
      group: 'Spotlight',
      tooltip: 'Speed multiplier for spotlight animation. Higher values = faster movement',
    }),
    blending: props.Text({
      name: 'Blending Mode',
      defaultValue: 'Additive',
      group: 'Material',
      tooltip:
        'ShaderMaterial blending mode: "No Blending", "Normal", "Additive", "Subtractive", or "Multiply"',
    }),
    bloomIntensity: props.Number({
      name: 'Bloom Intensity',
      defaultValue: 3.5,
      group: 'Post Processing',
      tooltip: 'Intensity of the bloom effect',
    }),
    bloomThreshold: props.Number({
      name: 'Bloom Threshold',
      defaultValue: 0.0,
      group: 'Post Processing',
      tooltip: 'Luminance threshold for bloom effect',
    }),
    bloomSmoothing: props.Number({
      name: 'Bloom Smoothing',
      defaultValue: 0.3,
      group: 'Post Processing',
      tooltip: 'Smoothing factor for bloom effect',
    }),
    bloomRadius: props.Number({
      name: 'Bloom Radius',
      defaultValue: 0.8,
      group: 'Post Processing',
      tooltip: 'Radius of the bloom effect',
    }),
    vignetteOffset: props.Number({
      name: 'Vignette Offset',
      defaultValue: 0.75,
      group: 'Post Processing',
      tooltip: 'Offset for vignette effect (how far from edges)',
    }),
    vignetteDarkness: props.Number({
      name: 'Vignette Darkness',
      defaultValue: 0.75,
      group: 'Post Processing',
      tooltip: 'Darkness intensity of the vignette effect',
    }),
    staticSpotlightX: props.Number({
      name: 'Static Spotlight X',
      defaultValue: -1.5,
      group: 'Spotlight',
      tooltip: 'X position for static spotlight on touch devices',
    }),
    staticSpotlightY: props.Number({
      name: 'Static Spotlight Y',
      defaultValue: -2.5,
      group: 'Spotlight',
      tooltip: 'Y position for static spotlight on touch devices',
    }),
    staticSpotlightZ: props.Number({
      name: 'Static Spotlight Z',
      defaultValue: -0.5,
      group: 'Spotlight',
      tooltip: 'Z position for static spotlight on touch devices',
    }),
    disableInDesigner: props.Boolean({
      name: 'Disable in Designer',
      defaultValue: true,
      group: 'Performance',
      tooltip:
        'When enabled, renders a lightweight placeholder in Webflow designer mode to improve performance. The full 3D scene will still render on the published site.',
    }),
    simulateTouchDevice: props.Boolean({
      name: 'Simulate Touch Device',
      defaultValue: false,
      group: 'Performance',
      tooltip:
        'When enabled, simulates touch device behavior regardless of the actual device type. Useful for testing and previewing how the component appears on touch devices.',
    }),
  },
});

export default ProSphereWebflow;
