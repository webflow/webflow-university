import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  createHoverHighlight,
  hoverLevel,
  KEYBOARD_HOVER_BRIGHTNESS,
  KEYBOARD_HOVER_MS,
  RESTING_HOVER,
  retargetHover,
} from './keyboardHover';

describe('hoverLevel', () => {
  it('eases from 0 to 1 over the hover duration', () => {
    const fade = { from: 0, to: 1, startedAt: 1000 };

    expect(hoverLevel(fade, 1000)).toEqual({ level: 0, done: false });
    const halfway = hoverLevel(fade, 1000 + KEYBOARD_HOVER_MS / 2).level;
    expect(halfway).toBeGreaterThan(0.5);
    expect(halfway).toBeLessThan(1);
    expect(hoverLevel(fade, 1000 + KEYBOARD_HOVER_MS)).toEqual({ level: 1, done: true });
  });

  it('jumps straight to the target with reduced motion', () => {
    expect(hoverLevel({ from: 0, to: 1, startedAt: 1000 }, 1000, true)).toEqual({
      level: 1,
      done: true,
    });
  });
});

describe('retargetHover', () => {
  it('keeps the current fade when the target is unchanged', () => {
    const fade = { from: 0, to: 1, startedAt: 1000 };
    expect(retargetHover(fade, 1, 1050)).toBe(fade);
  });

  it('reverses from the current level instead of jumping', () => {
    const fade = retargetHover(RESTING_HOVER, 1, 1000);
    const mid = hoverLevel(fade, 1050).level;
    const back = retargetHover(fade, 0, 1050);

    expect(back).toEqual({ from: mid, to: 0, startedAt: 1050 });
    expect(hoverLevel(back, 1050).level).toBe(mid);
  });
});

describe('createHoverHighlight', () => {
  it('scales each base colour and restores it at rest', () => {
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.4, 0.2) });
    const highlight = createHoverHighlight([material]);

    highlight(1);
    expect(material.color.r).toBeCloseTo(0.5 * KEYBOARD_HOVER_BRIGHTNESS);
    expect(material.color.b).toBeCloseTo(0.2 * KEYBOARD_HOVER_BRIGHTNESS);
    highlight(0);
    expect(material.color.r).toBeCloseTo(0.5);
    expect(material.color.b).toBeCloseTo(0.2);
  });
});
