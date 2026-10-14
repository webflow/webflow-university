export const PUBLISH_STEPS = [
  { label: 'Preparing to publish', durationMs: 900 },
  { label: 'Optimizing HTML, CSS, and JS files', durationMs: 1300 },
  { label: 'Packaging everything up', durationMs: 1000 },
  { label: 'Deploying to CDN', durationMs: 1400 },
] as const;

export const CELEBRATION_MS = 3400;

export const PUBLISHING_MS = PUBLISH_STEPS.reduce((total, step) => total + step.durationMs, 0);

export type StepStatus = 'pending' | 'active' | 'done';

export type ScreenState =
  | { phase: 'idle' }
  | { phase: 'publishing'; steps: StepStatus[] }
  | { phase: 'celebrating'; elapsedMs: number }
  | { phase: 'published' };

/** What the monitor shows `now` ms into a publish that started at `startedAt`. */
export function getScreenState(
  startedAt: number | null,
  now: number,
  skipCelebration = false
): ScreenState {
  if (startedAt === null) return { phase: 'idle' };

  const elapsed = Math.max(0, now - startedAt);
  if (elapsed < PUBLISHING_MS) {
    let stepEnd = 0;
    const steps = PUBLISH_STEPS.map((step): StepStatus => {
      const stepStart = stepEnd;
      stepEnd += step.durationMs;
      if (elapsed >= stepEnd) return 'done';
      return elapsed >= stepStart ? 'active' : 'pending';
    });
    return { phase: 'publishing', steps };
  }

  const celebrationElapsed = elapsed - PUBLISHING_MS;
  if (!skipCelebration && celebrationElapsed < CELEBRATION_MS) {
    return { phase: 'celebrating', elapsedMs: celebrationElapsed };
  }
  return { phase: 'published' };
}

export function isPublishRunning(state: ScreenState) {
  return state.phase === 'publishing' || state.phase === 'celebrating';
}
