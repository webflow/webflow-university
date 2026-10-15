import { describe, expect, it } from 'vitest';

import {
  createCompactDisc,
  DISC_EJECT_MS,
  DISC_LOAD_MS,
  DISC_RADIUS,
  discDroop,
  discExtension,
  discSpin,
  discZ,
} from './compactDisc';

describe('discExtension', () => {
  const eject = { from: 0, to: 1, startedAt: 1000 };
  const load = { from: 1, to: 0, startedAt: 1000 };

  it('ejects with an overshoot and settles fully out', () => {
    expect(discExtension(eject, 1000)).toEqual({ extension: 0, done: false });
    const peak = Math.max(
      ...Array.from({ length: 20 }, (_, i) => discExtension(eject, 1000 + i * 21).extension)
    );
    expect(peak).toBeGreaterThan(1);
    expect(discExtension(eject, 1000 + DISC_EJECT_MS)).toEqual({ extension: 1, done: true });
  });

  it('loads back in without overshooting', () => {
    for (let ms = 0; ms <= DISC_LOAD_MS; ms += 20) {
      const { extension } = discExtension(load, 1000 + ms);
      expect(extension).toBeGreaterThanOrEqual(0);
      expect(extension).toBeLessThanOrEqual(1);
    }
    expect(discExtension(load, 1000 + DISC_LOAD_MS)).toEqual({ extension: 0, done: true });
  });

  it('can reverse from part way', () => {
    const reverse = { from: 0.4, to: 0, startedAt: 0 };
    expect(discExtension(reverse, 0).extension).toBeCloseTo(0.4);
  });

  it('jumps to the end for reduced motion', () => {
    expect(discExtension(eject, 1000, true)).toEqual({ extension: 1, done: true });
  });
});

describe('discZ', () => {
  it('hides the whole disc behind the slot when loaded', () => {
    expect(discZ(4, 0) + DISC_RADIUS).toBeLessThan(4);
  });

  it('leaves the disc partly in the drive when ejected', () => {
    const z = discZ(4, 1);
    expect(z).toBeGreaterThan(4);
    expect(z - DISC_RADIUS).toBeLessThan(4);
  });
});

describe('discDroop', () => {
  it('droops forward only while out, and clamps the overshoot', () => {
    expect(discDroop(0)).toBe(-0);
    expect(discDroop(1)).toBeLessThan(0);
    expect(discDroop(1.2)).toBe(discDroop(1));
  });
});

describe('discSpin', () => {
  it('turns the disc as it comes out', () => {
    expect(discSpin(0)).toBe(0);
    expect(discSpin(1)).toBeGreaterThan(0);
  });
});

describe('createCompactDisc', () => {
  it('starts hidden with a double sided metal material', () => {
    const disc = createCompactDisc();
    expect(disc.visible).toBe(false);
    expect(disc.material).toMatchObject({ metalness: 1, side: 2 });
  });
});
