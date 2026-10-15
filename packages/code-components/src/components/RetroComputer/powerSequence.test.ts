import { describe, expect, it } from 'vitest';

import {
  BOOT_LINE_MS,
  BOOT_LINES,
  COLLAPSE_MS,
  getPowerState,
  isPowerCycling,
  lightLevel,
  OFF_MS,
  powerCycleMs,
  SHUTDOWN_MESSAGE_MS,
  WARM_UP_MS,
} from './powerSequence';

const offStart = SHUTDOWN_MESSAGE_MS + COLLAPSE_MS;
const bootStart = offStart + OFF_MS + WARM_UP_MS;

describe('getPowerState', () => {
  it('is on when the button has not been pressed', () => {
    expect(getPowerState(null, 5000)).toEqual({ phase: 'on' });
  });

  it('walks through shutdown, off, warm up and boot', () => {
    const at = (ms: number) => getPowerState(1000, 1000 + ms);
    expect(at(0)).toEqual({ phase: 'shutting-down' });
    expect(at(SHUTDOWN_MESSAGE_MS + COLLAPSE_MS / 2)).toEqual({
      phase: 'collapsing',
      progress: 0.5,
    });
    expect(at(offStart)).toEqual({ phase: 'off' });
    expect(at(offStart + OFF_MS + WARM_UP_MS / 4)).toEqual({
      phase: 'warming-up',
      progress: 0.25,
    });
    expect(at(bootStart)).toEqual({ phase: 'booting', lines: 1 });
    expect(at(bootStart + BOOT_LINE_MS * 2)).toEqual({ phase: 'booting', lines: 3 });
    expect(at(bootStart + BOOT_LINE_MS * BOOT_LINES.length + 100)).toEqual({
      phase: 'booting',
      lines: BOOT_LINES.length,
    });
    expect(at(powerCycleMs())).toEqual({ phase: 'on' });
  });

  it('skips the CRT collapse and warm up for reduced motion', () => {
    const at = (ms: number) => getPowerState(0, ms, true);
    expect(at(SHUTDOWN_MESSAGE_MS)).toEqual({ phase: 'off' });
    expect(at(SHUTDOWN_MESSAGE_MS + OFF_MS)).toEqual({ phase: 'booting', lines: 1 });
    expect(powerCycleMs(true)).toBe(powerCycleMs() - COLLAPSE_MS - WARM_UP_MS);
    expect(at(powerCycleMs(true))).toEqual({ phase: 'on' });
  });
});

describe('lightLevel', () => {
  it('fades the lights with the collapse and restores them at power on', () => {
    expect(lightLevel({ phase: 'shutting-down' })).toBe(1);
    expect(lightLevel({ phase: 'collapsing', progress: 0.25 })).toBe(0.75);
    expect(lightLevel({ phase: 'off' })).toBe(0);
    expect(lightLevel({ phase: 'warming-up', progress: 0 })).toBe(1);
    expect(lightLevel({ phase: 'on' })).toBe(1);
  });
});

describe('isPowerCycling', () => {
  it('is true for every phase except on', () => {
    expect(isPowerCycling({ phase: 'on' })).toBe(false);
    expect(isPowerCycling({ phase: 'off' })).toBe(true);
    expect(isPowerCycling({ phase: 'booting', lines: 1 })).toBe(true);
  });
});
