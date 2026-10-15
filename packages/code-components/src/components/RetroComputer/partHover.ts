import type * as THREE from 'three';

export const HOVER_FADE_MS = 250;
/** Base colour multiplier at full hover, a subtle lift over the PixPal texture. */
export const DEFAULT_HOVER_BRIGHTNESS = 1.3;

export interface HoverFade {
  /** 0 is resting, 1 is fully hovered. */
  from: number;
  to: number;
  startedAt: number;
}

export const RESTING_HOVER: HoverFade = { from: 0, to: 0, startedAt: 0 };

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export function hoverLevel(fade: HoverFade, now: number, reducedMotion = false) {
  const t = reducedMotion ? 1 : Math.min(Math.max((now - fade.startedAt) / HOVER_FADE_MS, 0), 1);
  return { level: fade.from + (fade.to - fade.from) * easeOutCubic(t), done: t >= 1 };
}

/** Heads towards `to` from wherever the fade is now, so a quick in-and-out never jumps. */
export function retargetHover(
  fade: HoverFade,
  to: number,
  now: number,
  reducedMotion = false
): HoverFade {
  if (fade.to === to) return fade;
  return { from: hoverLevel(fade, now, reducedMotion).level, to, startedAt: now };
}

/** Brightens `materials` by scaling their base colours up to `brightness` as `level` goes 0 to 1. */
export function createHoverHighlight(materials: THREE.MeshStandardMaterial[]) {
  const base = materials.map((material) => material.color.clone());
  return (level: number, brightness: number) => {
    const scale = 1 + (Math.max(brightness, 1) - 1) * level;
    materials.forEach((material, index) => material.color.copy(base[index]).multiplyScalar(scale));
  };
}
