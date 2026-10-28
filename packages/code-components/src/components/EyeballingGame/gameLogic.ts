import type { Round } from './rounds';

export const DEFAULT_TOLERANCE_PERCENT = 4;
export const DEFAULT_PENALTY_SECONDS = 5;
export const COUNTDOWN_SECONDS = 3;
export const SUCCESS_ADVANCE_MS = 1000;

type RoundRange = Pick<Round, 'min' | 'max' | 'circular'>;

/** How far off a guess is, as a percentage of the round's full range */
export function errorPercent(round: RoundRange, target: number, guess: number): number {
  if (round.circular) {
    const span = round.max - round.min;
    const diff = Math.abs(target - guess) % span;
    return (Math.min(diff, span - diff) / span) * 100;
  }
  return (Math.abs(target - guess) / (round.max - round.min)) * 100;
}

export function isMatch(
  round: RoundRange,
  target: number,
  guess: number,
  tolerancePercent: number
): boolean {
  // Absorb float drift from fractional slider steps (e.g. 3.3 - 3 = 0.2999…)
  return errorPercent(round, target, guess) <= tolerancePercent + 1e-9;
}

/**
 * Random whole-number target within the round's range that the untouched slider
 * doesn't already match — otherwise a player could win a round without moving it.
 */
export function pickTarget(
  round: Round,
  tolerancePercent: number,
  random: () => number = Math.random
): number {
  const [low, high] = round.targetRange ?? [round.min, round.max];
  for (let attempt = 0; attempt < 50; attempt++) {
    const value = Math.floor(random() * (high - low + 1)) + low;
    if (!isMatch(round, value, round.startValue, tolerancePercent)) return value;
  }
  const candidates = [low, high, Math.round((low + high) / 2)];
  return candidates.reduce((best, candidate) =>
    errorPercent(round, candidate, round.startValue) > errorPercent(round, best, round.startValue)
      ? candidate
      : best
  );
}

/** Stopwatch format: `MM:SS.cc` */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${minutes.toString().padStart(2, '0')}:${remainder}`;
}

/** Sentence format, e.g. `23.45 seconds` or `1 minute and 2.50 seconds` */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const secondsLabel = `${remainder.toFixed(2)} ${remainder.toFixed(2) === '1.00' ? 'second' : 'seconds'}`;
  if (minutes === 0) return secondsLabel;
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and ${secondsLabel}`;
}

export function formatValue(round: Pick<Round, 'step'>, value: number): string {
  return round.step < 1 ? value.toFixed(1) : Math.round(value).toString();
}
