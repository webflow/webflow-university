export const SHUTDOWN_MESSAGE_MS = 1100;
export const COLLAPSE_MS = 360;
export const OFF_MS = 1300;
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

export type PowerState =
  | { phase: 'on' }
  | { phase: 'shutting-down' }
  | { phase: 'collapsing'; progress: number }
  | { phase: 'off' }
  | { phase: 'warming-up'; progress: number }
  | { phase: 'booting'; lines: number };

/** The CRT collapse and warm-up are skipped for reduced motion; the messages stay. */
function durations(reducedMotion: boolean) {
  const collapse = reducedMotion ? 0 : COLLAPSE_MS;
  const warmUp = reducedMotion ? 0 : WARM_UP_MS;
  const boot = BOOT_LINES.length * BOOT_LINE_MS + BOOT_HOLD_MS;
  return { collapse, warmUp, boot };
}

export function powerCycleMs(reducedMotion = false) {
  const { collapse, warmUp, boot } = durations(reducedMotion);
  return SHUTDOWN_MESSAGE_MS + collapse + OFF_MS + warmUp + boot;
}

/** Where a power cycle that started at `pressedAt` is at `now`. */
export function getPowerState(
  pressedAt: number | null,
  now: number,
  reducedMotion = false
): PowerState {
  if (pressedAt === null) return { phase: 'on' };
  const { collapse, warmUp, boot } = durations(reducedMotion);
  let elapsed = Math.max(0, now - pressedAt);

  if (elapsed < SHUTDOWN_MESSAGE_MS) return { phase: 'shutting-down' };
  elapsed -= SHUTDOWN_MESSAGE_MS;
  if (elapsed < collapse) return { phase: 'collapsing', progress: elapsed / collapse };
  elapsed -= collapse;
  if (elapsed < OFF_MS) return { phase: 'off' };
  elapsed -= OFF_MS;
  if (elapsed < warmUp) return { phase: 'warming-up', progress: elapsed / warmUp };
  elapsed -= warmUp;
  if (elapsed < boot) {
    const lines = Math.min(BOOT_LINES.length, Math.floor(elapsed / BOOT_LINE_MS) + 1);
    return { phase: 'booting', lines };
  }
  return { phase: 'on' };
}

export const isPowerCycling = (state: PowerState) => state.phase !== 'on';

/** How bright the tower's lights are: they fade with the CRT and come back at power on. */
export function lightLevel(state: PowerState) {
  if (state.phase === 'collapsing') return 1 - state.progress;
  return state.phase === 'off' ? 0 : 1;
}
