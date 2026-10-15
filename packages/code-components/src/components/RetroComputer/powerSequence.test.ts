import { describe, expect, it } from 'vitest';

import {
  BOOT_LINE_MS,
  BOOT_LINES,
  bootMs,
  COLLAPSE_MS,
  getPowerState,
  isPowerAnimating,
  isPoweredOn,
  lightLevel,
  nextPowerAction,
  SHUTDOWN_MESSAGE_MS,
  shutdownMs,
  WARM_UP_MS,
} from './powerSequence';

describe('getPowerState', () => {
  it('is on when the button has not been pressed', () => {
    expect(getPowerState(null, 5000)).toEqual({ phase: 'on' });
  });

  it('shuts down and then stays off', () => {
    const at = (ms: number) => getPowerState({ action: 'shutdown', startedAt: 1000 }, 1000 + ms);
    expect(at(0)).toEqual({ phase: 'shutting-down' });
    expect(at(SHUTDOWN_MESSAGE_MS + COLLAPSE_MS / 2)).toEqual({
      phase: 'collapsing',
      progress: 0.5,
    });
    expect(at(shutdownMs())).toEqual({ phase: 'off' });
    expect(at(shutdownMs() + 60 * 60 * 1000)).toEqual({ phase: 'off' });
  });

  it('warms up, boots and comes back on', () => {
    const at = (ms: number) => getPowerState({ action: 'boot', startedAt: 1000 }, 1000 + ms);
    expect(at(WARM_UP_MS / 4)).toEqual({ phase: 'warming-up', progress: 0.25 });
    expect(at(WARM_UP_MS)).toEqual({ phase: 'booting', lines: 1 });
    expect(at(WARM_UP_MS + BOOT_LINE_MS * 2)).toEqual({ phase: 'booting', lines: 3 });
    expect(at(WARM_UP_MS + BOOT_LINE_MS * BOOT_LINES.length + 100)).toEqual({
      phase: 'booting',
      lines: BOOT_LINES.length,
    });
    expect(at(bootMs())).toEqual({ phase: 'on' });
  });

  it('skips the CRT collapse and warm up for reduced motion', () => {
    expect(getPowerState({ action: 'shutdown', startedAt: 0 }, SHUTDOWN_MESSAGE_MS, true)).toEqual({
      phase: 'off',
    });
    expect(getPowerState({ action: 'boot', startedAt: 0 }, 0, true)).toEqual({
      phase: 'booting',
      lines: 1,
    });
    expect(shutdownMs(true)).toBe(shutdownMs() - COLLAPSE_MS);
    expect(bootMs(true)).toBe(bootMs() - WARM_UP_MS);
  });
});

describe('nextPowerAction', () => {
  it('shuts down when on and boots when off', () => {
    expect(nextPowerAction({ phase: 'on' }, 5)).toEqual({ action: 'shutdown', startedAt: 5 });
    expect(nextPowerAction({ phase: 'off' }, 9)).toEqual({ action: 'boot', startedAt: 9 });
  });

  it('ignores presses mid shutdown or boot', () => {
    expect(nextPowerAction({ phase: 'shutting-down' }, 0)).toBeNull();
    expect(nextPowerAction({ phase: 'collapsing', progress: 0.5 }, 0)).toBeNull();
    expect(nextPowerAction({ phase: 'warming-up', progress: 0.5 }, 0)).toBeNull();
    expect(nextPowerAction({ phase: 'booting', lines: 2 }, 0)).toBeNull();
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

describe('isPoweredOn and isPowerAnimating', () => {
  it('only animates during transitions', () => {
    expect(isPoweredOn({ phase: 'on' })).toBe(true);
    expect(isPoweredOn({ phase: 'off' })).toBe(false);
    expect(isPowerAnimating({ phase: 'on' })).toBe(false);
    expect(isPowerAnimating({ phase: 'off' })).toBe(false);
    expect(isPowerAnimating({ phase: 'booting', lines: 1 })).toBe(true);
  });
});
