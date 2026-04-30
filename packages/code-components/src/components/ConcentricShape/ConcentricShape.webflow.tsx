import ConcentricShape from './ConcentricShape';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';

const ConcentricShapeWebflow = declareComponent(ConcentricShape, {
  name: 'ConcentricShape',
  description: '2D concentric shapes with radial transparency fade and traveling beam effect',
  group: '3D Graphics',
  options: {
    applyTagSelectors: true,
  },
  props: {
    disableInDesigner: props.Boolean({
      name: 'Disable in Designer',
      defaultValue: false,
      group: 'Performance',
      tooltip:
        'When enabled, renders a lightweight placeholder in Webflow designer mode to improve performance. The full 3D scene will still render on the published site.',
    }),
    scale: props.Number({
      name: 'Scale',
      defaultValue: 1,
      group: 'Size & Scale',
      tooltip: 'Overall size of the shape',
    }),
    vertexCount: props.Number({
      name: 'Vertex Count',
      defaultValue: 5,
      group: 'Shape',
      tooltip: 'Number of vertices in the shape (3=triangle, 4=square, 5=pentagon, etc.)',
    }),
    shapeCount: props.Number({
      name: 'Shape Count',
      defaultValue: 8,
      group: 'Shape',
      tooltip: 'Number of concentric shapes',
    }),
    innerRadius: props.Number({
      name: 'Inner Radius',
      defaultValue: 0.5,
      group: 'Shape',
      tooltip: 'Radius of the innermost shape',
    }),
    outerRadius: props.Number({
      name: 'Outer Radius',
      defaultValue: 3,
      group: 'Shape',
      tooltip: 'Radius of the outermost shape',
    }),
    rotationSpeed: props.Number({
      name: 'Rotation Speed',
      defaultValue: 0.1,
      group: 'Animation',
      tooltip: 'Speed of shape rotation',
    }),
    glowIntensity: props.Number({
      name: 'Glow Intensity',
      defaultValue: 1.5,
      group: 'Glow Effects',
      tooltip: 'Intensity of the outer glow layer',
    }),
    coreIntensity: props.Number({
      name: 'Core Intensity',
      defaultValue: 2.5,
      group: 'Glow Effects',
      tooltip: 'Intensity of the core bright line',
    }),
    radialFadeStart: props.Number({
      name: 'Radial Fade Start',
      defaultValue: 0.5,
      group: 'Transparency',
      tooltip: 'Distance from center where transparency fade begins',
    }),
    radialFadeEnd: props.Number({
      name: 'Radial Fade End',
      defaultValue: 3.0,
      group: 'Transparency',
      tooltip: 'Distance from center where shapes become fully transparent',
    }),
    beamSpeed: props.Number({
      name: 'Beam Speed',
      defaultValue: 0.15,
      group: 'Beam',
      tooltip: 'Speed of the traveling beam along the innermost shape (0-0.5 recommended)',
    }),
    beamIntensity: props.Number({
      name: 'Beam Intensity',
      defaultValue: 4.0,
      group: 'Beam',
      tooltip: 'Intensity of the traveling beam effect',
    }),
    beamWidth: props.Number({
      name: 'Beam Width',
      defaultValue: 0.12,
      group: 'Beam',
      tooltip: 'Width of the traveling beam (0-1)',
    }),
    tailLength: props.Number({
      name: 'Tail Length',
      defaultValue: 0.3,
      group: 'Beam',
      tooltip: 'Length of the trailing tail behind the beam (0-1)',
    }),
    color: props.Text({
      name: 'Color',
      defaultValue: '#146EF5',
      group: 'Appearance',
      tooltip: 'Base color of the shapes (hex color, e.g., #146EF5)',
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
  },
});

export default ConcentricShapeWebflow;
