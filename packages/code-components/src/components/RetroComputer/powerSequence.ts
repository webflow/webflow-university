export const SHUTDOWN_MESSAGE_MS = 1100;
export const COLLAPSE_MS = 360;
export const WARM_UP_MS = 420;
export const BOOT_LINE_MS = 380;
export const BOOT_HOLD_MS = 600;

export const SHUTDOWN_TEXT = 'Shutting down...';
export const BOOT_LINES = [
  'Webflow BIOS v4.0',
  'Memory test: 640K OK',
  'Detecting drives... CD-ROM OK',
  'Loading Designer...',
] as const;

/** The last power button press: a shutdown stays off until a boot follows it. */
export interface PowerAction {
  action: 'shutdown' | 'boot';
  startedAt: number;
}

export type PowerState =
  | { phase: 'on' }
  | { phase: 'shutting-down' }
  | { phase: 'collapsing'; progress: number }
  | { phase: 'off' }
  | { phase: 'warming-up'; progress: number }
  | { phase: 'booting'; lines: number };

/** The CRT collapse and warm-up are skipped for reduced motion; the messages stay. */
function durations(reducedMotion: boolean) {
  return {
    collapse: reducedMotion ? 0 : COLLAPSE_MS,
    warmUp: reducedMotion ? 0 : WARM_UP_MS,
    boot: BOOT_LINES.length * BOOT_LINE_MS + BOOT_HOLD_MS,
  };
}

export function shutdownMs(reducedMotion = false) {
  return SHUTDOWN_MESSAGE_MS + durations(reducedMotion).collapse;
}

export function bootMs(reducedMotion = false) {
  const { warmUp, boot } = durations(reducedMotion);
  return warmUp + boot;
}

/** Where the computer is at `now`, given the last power button press. */
export function getPowerState(
  power: PowerAction | null,
  now: number,
  reducedMotion = false
): PowerState {
  if (power === null) return { phase: 'on' };
  const { collapse, warmUp, boot } = durations(reducedMotion);
  let elapsed = Math.max(0, now - power.startedAt);

  if (power.action === 'shutdown') {
    if (elapsed < SHUTDOWN_MESSAGE_MS) return { phase: 'shutting-down' };
    elapsed -= SHUTDOWN_MESSAGE_MS;
    if (elapsed < collapse) return { phase: 'collapsing', progress: elapsed / collapse };
    return { phase: 'off' };
  }

  if (elapsed < warmUp) return { phase: 'warming-up', progress: elapsed / warmUp };
  elapsed -= warmUp;
  if (elapsed < boot) {
    const lines = Math.min(BOOT_LINES.length, Math.floor(elapsed / BOOT_LINE_MS) + 1);
    return { phase: 'booting', lines };
  }
  return { phase: 'on' };
}

/**
 * What a power button press does in `state`: shut down when on, boot when off. Presses while
 * shutting down or booting are ignored.
 */
export function nextPowerAction(state: PowerState, now: number): PowerAction | null {
  if (state.phase === 'on') return { action: 'shutdown', startedAt: now };
  if (state.phase === 'off') return { action: 'boot', startedAt: now };
  return null;
}

export const isPoweredOn = (state: PowerState) => state.phase === 'on';

/** Whether the screen is animating and needs frequent redraws. */
export const isPowerAnimating = (state: PowerState) =>
  state.phase !== 'on' && state.phase !== 'off';

/** How bright the tower's lights are: they fade with the CRT and come back at power on. */
export function lightLevel(state: PowerState) {
  if (state.phase === 'collapsing') return 1 - state.progress;
  return state.phase === 'off' ? 0 : 1;
}
