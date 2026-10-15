import type { Vector3Tuple } from './camera';

export interface LightingSettings {
  keyLightColor: string;
  keyLightIntensity: number;
  /** Where the key spotlight sits and the point it aims at, in scene units. */
  keyLightPosition: Vector3Tuple;
  keyLightTarget: Vector3Tuple;
  fillIntensity: number;
  rimLightColor: string;
  rimLightIntensity: number;
  bloomIntensity: number;
  bloomThreshold: number;
}

export interface BackgroundSettings {
  backgroundColor: string;
  backgroundGlowColor: string;
  backgroundGlowStrength: number;
}

export interface CrtSettings {
  screenGlow: number;
  scanlines: number;
  vignette: number;
  curvature: number;
  chromaticAberration: number;
}

export const DEFAULT_LIGHTING: LightingSettings = {
  keyLightColor: '#ffb27a',
  keyLightIntensity: 7,
  keyLightPosition: [-26, 12, -3],
  keyLightTarget: [2, 1, 3],
  fillIntensity: 0.45,
  rimLightColor: '#9db4ff',
  rimLightIntensity: 0.6,
  bloomIntensity: 0.8,
  bloomThreshold: 3,
};

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  backgroundColor: '#0b0b0c',
  backgroundGlowColor: '#ff9a5a',
  backgroundGlowStrength: 0.12,
};

export const DEFAULT_CRT: CrtSettings = {
  screenGlow: 0.4,
  scanlines: 0.35,
  vignette: 0.5,
  curvature: 0.5,
  chromaticAberration: 0.25,
};

export const DEFAULT_MAX_PIXEL_RATIO = 2;

/** Fills in defaults for every key the caller left undefined (Webflow can omit unset props). */
export function resolveSettings<T extends object>(defaults: T, values: Partial<T>): T {
  const resolved = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = values[key];
    if (value !== undefined && value !== null) resolved[key] = value as T[keyof T];
  }
  return resolved;
}

/** CSS background for the wrapper: a soft glow behind the computer, drawn by the browser instead of WebGL. */
export function backgroundCss({
  backgroundColor,
  backgroundGlowColor,
  backgroundGlowStrength,
}: BackgroundSettings) {
  const strength = Math.min(Math.max(backgroundGlowStrength, 0), 1);
  if (strength === 0) return backgroundColor;
  const glow = `color-mix(in srgb, ${backgroundGlowColor} ${Math.round(strength * 100)}%, transparent)`;
  return `radial-gradient(ellipse 60% 55% at 38% 48%, ${glow} 0%, transparent 70%), ${backgroundColor}`;
}
