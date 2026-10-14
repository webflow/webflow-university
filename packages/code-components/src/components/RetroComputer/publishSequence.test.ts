import { describe, expect, it } from 'vitest';

import {
  CELEBRATION_MS,
  getScreenState,
  isPublishRunning,
  PUBLISH_STEPS,
  PUBLISHING_MS,
} from './publishSequence';

describe('getScreenState', () => {
  it('is idle before Enter is pressed', () => {
    expect(getScreenState(null, 5000)).toEqual({ phase: 'idle' });
  });

  it('starts with the first step active and the rest pending', () => {
    expect(getScreenState(1000, 1000)).toEqual({
      phase: 'publishing',
      steps: ['active', 'pending', 'pending', 'pending'],
    });
  });

  it('checks off each step in order', () => {
    const [first, second] = PUBLISH_STEPS;
    expect(getScreenState(0, first.durationMs)).toEqual({
      phase: 'publishing',
      steps: ['done', 'active', 'pending', 'pending'],
    });
    expect(getScreenState(0, first.durationMs + second.durationMs + 1)).toEqual({
      phase: 'publishing',
      steps: ['done', 'done', 'active', 'pending'],
    });
    expect(getScreenState(0, PUBLISHING_MS - 1)).toEqual({
      phase: 'publishing',
      steps: ['done', 'done', 'done', 'active'],
    });
  });

  it('celebrates after the last step, then shows the published message', () => {
    expect(getScreenState(0, PUBLISHING_MS + 250)).toEqual({
      phase: 'celebrating',
      elapsedMs: 250,
    });
    expect(getScreenState(0, PUBLISHING_MS + CELEBRATION_MS)).toEqual({ phase: 'published' });
  });

  it('can skip the celebration for reduced motion', () => {
    expect(getScreenState(0, PUBLISHING_MS + 250, true)).toEqual({ phase: 'published' });
  });
});

describe('isPublishRunning', () => {
  it('is true only while publishing or celebrating', () => {
    expect(isPublishRunning({ phase: 'idle' })).toBe(false);
    expect(isPublishRunning(getScreenState(0, 10))).toBe(true);
    expect(isPublishRunning(getScreenState(0, PUBLISHING_MS + 10))).toBe(true);
    expect(isPublishRunning({ phase: 'published' })).toBe(false);
  });
});
