import { describe, expect, it } from 'vitest';
import {
  errorPercent,
  formatClock,
  formatDuration,
  formatValue,
  isMatch,
  pickTarget,
} from './gameLogic';
import { ROUNDS, shadowOffset } from './rounds';

const linear = { min: 0, max: 100 };
const angle = { min: 0, max: 360, circular: true };

describe('errorPercent', () => {
  it('measures distance as a share of the full range', () => {
    expect(errorPercent(linear, 50, 54)).toBe(4);
    expect(errorPercent({ min: 100, max: 900 }, 500, 540)).toBe(5);
  });

  it('wraps around for circular rounds', () => {
    expect(errorPercent(angle, 355, 5)).toBeCloseTo((10 / 360) * 100);
    expect(errorPercent(angle, 0, 360)).toBe(0);
  });
});

describe('isMatch', () => {
  it('accepts guesses on the tolerance boundary', () => {
    expect(isMatch(linear, 50, 54, 4)).toBe(true);
    expect(isMatch(linear, 50, 55, 4)).toBe(false);
  });

  it('is not tripped up by fractional slider steps', () => {
    // 9 * 4% = 0.36px; 3.3 - 3 is 0.2999… in floating point
    expect(isMatch({ min: 1, max: 10 }, 3, 3.3, 4)).toBe(true);
    expect(isMatch({ min: 1, max: 10 }, 3, 3.4, 4)).toBe(false);
  });
});

describe('pickTarget', () => {
  it('returns whole numbers inside every round’s target range', () => {
    for (const round of ROUNDS) {
      const [low, high] = round.targetRange ?? [round.min, round.max];
      for (let i = 0; i < 50; i++) {
        const target = pickTarget(round, 4);
        expect(Number.isInteger(target)).toBe(true);
        expect(target).toBeGreaterThanOrEqual(low);
        expect(target).toBeLessThanOrEqual(high);
      }
    }
  });

  it('keeps opacity targets visible', () => {
    const opacity = ROUNDS.find((round) => round.id === 'opacity')!;
    expect(pickTarget(opacity, 4, () => 0)).toBe(10);
    // Top of the range would match the 100% start, so it falls back to the far end
    expect(pickTarget(opacity, 4, () => 0.999999)).toBe(90);
  });

  it('never picks a value the untouched slider already matches', () => {
    for (const round of ROUNDS) {
      for (let i = 0; i < 200; i++) {
        expect(isMatch(round, pickTarget(round, 4), round.startValue, 4)).toBe(false);
      }
    }
  });

  it('falls back to the value farthest from the start when randomness keeps landing on it', () => {
    const padding = ROUNDS.find((round) => round.id === 'padding')!;
    const alwaysStart = () => (padding.startValue - padding.min) / (padding.max - padding.min + 1);
    expect(pickTarget(padding, 4, alwaysStart)).toBe(padding.max);
  });

  it('falls back to the opposite side of a circular range, not its wrapped-around end', () => {
    const angleRound = ROUNDS.find((round) => round.id === 'shadowAngle')!;
    // 0.999… always lands on 360°, which is the same angle as the 0° start
    expect(pickTarget(angleRound, 4, () => 0.999999)).toBe(180);
  });
});

describe('formatting', () => {
  it('formats the stopwatch as MM:SS.cc', () => {
    expect(formatClock(0)).toBe('00:00.00');
    expect(formatClock(7.5)).toBe('00:07.50');
    expect(formatClock(83.456)).toBe('01:23.46');
  });

  it('formats a finish time as a sentence', () => {
    expect(formatDuration(23.456)).toBe('23.46 seconds');
    expect(formatDuration(1)).toBe('1.00 second');
    expect(formatDuration(62.5)).toBe('1 minute and 2.50 seconds');
    expect(formatDuration(150)).toBe('2 minutes and 30.00 seconds');
  });

  it('shows one decimal only for fractional sliders', () => {
    expect(formatValue({ step: 0.1 }, 3)).toBe('3.0');
    expect(formatValue({ step: 1 }, 42)).toBe('42');
  });
});

describe('shadowOffset', () => {
  it('points 0° up and rotates clockwise', () => {
    expect(shadowOffset(0, 20)).toEqual({ x: 0, y: -20 });
    expect(shadowOffset(90, 20)).toEqual({ x: 20, y: 0 });
    expect(shadowOffset(180, 20)).toEqual({ x: 0, y: 20 });
    expect(shadowOffset(270, 20)).toEqual({ x: -20, y: 0 });
  });
});
