import type { CSSProperties } from 'react';

export type RoundId =
  | 'strokeWidth'
  | 'fontWidth'
  | 'fontWeight'
  | 'buttonRadius'
  | 'opacity'
  | 'shadowBlur'
  | 'shadowAngle'
  | 'padding';

export interface Round {
  id: RoundId;
  title: string;
  /** Short slider label */
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Where the slider sits when the round begins */
  startValue: number;
  /** Narrower range for random targets, when the slider's extremes would be unreadable */
  targetRange?: [min: number, max: number];
  /** Values wrap around (0 and max are the same), e.g. an angle in degrees */
  circular?: boolean;
  /** Style applied to both the reference element (target value) and the player's element */
  styleFor: (value: number) => CSSProperties;
}

const ANGLE_SHADOW_DISTANCE = 20;

/** 0° points the inset shadow's light source straight up, increasing clockwise. */
export function shadowOffset(angleDeg: number, distance: number): { x: number; y: number } {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Math.round(distance * Math.cos(radians)),
    y: Math.round(distance * Math.sin(radians)),
  };
}

export const ROUNDS: readonly Round[] = [
  {
    id: 'strokeWidth',
    title: 'Match the text stroke width',
    label: 'Stroke',
    unit: 'px',
    min: 1,
    max: 10,
    step: 0.1,
    startValue: 3,
    styleFor: (value) => ({ WebkitTextStrokeWidth: `${value}px` }),
  },
  {
    id: 'fontWidth',
    title: 'Match the variable font width',
    label: 'Width',
    unit: '',
    min: 25,
    max: 151,
    step: 1,
    startValue: 25,
    styleFor: (value) => ({ fontVariationSettings: `"wdth" ${value}` }),
  },
  {
    id: 'fontWeight',
    title: 'Match the variable font weight',
    label: 'Weight',
    unit: '',
    min: 100,
    max: 900,
    step: 1,
    startValue: 100,
    styleFor: (value) => ({ fontVariationSettings: `"wght" ${value}` }),
  },
  {
    id: 'buttonRadius',
    title: 'Match the button radius',
    label: 'Radius',
    unit: 'px',
    min: 0,
    max: 32,
    step: 1,
    startValue: 0,
    styleFor: (value) => ({ borderRadius: `${value}px` }),
  },
  {
    id: 'opacity',
    title: 'Match the opacity',
    label: 'Opacity',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    startValue: 100,
    // Below ~10% the reference image all but disappears
    targetRange: [10, 90],
    styleFor: (value) => ({ opacity: value / 100 }),
  },
  {
    id: 'shadowBlur',
    title: 'Match the inner shadow blur',
    label: 'Blur',
    unit: 'px',
    min: 0,
    max: 30,
    step: 1,
    startValue: 0,
    styleFor: (value) => ({
      boxShadow: `inset 0 20px ${value}px 2px rgba(0, 0, 0, 0.75), 0 10px 100px #4622ac, 0 13px 10px rgba(0, 0, 0, 0.3)`,
    }),
  },
  {
    id: 'shadowAngle',
    title: 'Match the inner shadow angle',
    label: 'Angle',
    unit: 'deg',
    min: 0,
    max: 360,
    step: 1,
    startValue: 0,
    circular: true,
    styleFor: (value) => {
      const { x, y } = shadowOffset(value, ANGLE_SHADOW_DISTANCE);
      return {
        boxShadow: `inset ${x}px ${y}px 10px rgba(0, 0, 0, 0.5), 0 20px 50px rgba(70, 34, 172, 0.5)`,
      };
    },
  },
  {
    id: 'padding',
    title: 'Match the inner padding',
    label: 'Padding',
    unit: 'px',
    min: 0,
    max: 50,
    step: 1,
    startValue: 20,
    styleFor: (value) => ({ padding: `${value}px` }),
  },
];
