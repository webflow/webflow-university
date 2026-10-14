import { describe, expect, it } from 'vitest';

import { usesAnimatedSwatch } from './pixPalMaterial';

// 2 x 2 RGBA texture: only the bottom-right texel has its animation mask (blue) set.
const PIXELS = [0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 255];

describe('usesAnimatedSwatch', () => {
  it('is false when no UV lands on an animated texel', () => {
    expect(usesAnimatedSwatch([0.25, 0.25, 0.75, 0.25, 0.25, 0.75], PIXELS, 2, 2)).toBe(false);
  });

  it('is true when any UV lands on an animated texel', () => {
    expect(usesAnimatedSwatch([0.25, 0.25, 0.75, 0.75], PIXELS, 2, 2)).toBe(true);
  });

  it('clamps UVs on the texture edge', () => {
    expect(usesAnimatedSwatch([1, 1], PIXELS, 2, 2)).toBe(true);
  });
});
