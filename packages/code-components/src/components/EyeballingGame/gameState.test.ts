import { describe, expect, it } from 'vitest';
import { COUNTDOWN_SECONDS } from './gameLogic';
import { createInitialState, gameReducer, type GameAction, type GameState } from './gameState';
import { ROUNDS } from './rounds';

const TARGETS = ROUNDS.map((round) => round.max);
const SUBMIT: GameAction = { type: 'submit', tolerancePercent: 4, penaltySeconds: 5 };

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

function playing(startedAt = 1000): GameState {
  const ticks = Array.from({ length: COUNTDOWN_SECONDS }, () => ({
    type: 'countdownTick' as const,
    now: startedAt,
  }));
  return run(createInitialState(), { type: 'start', targets: TARGETS }, ...ticks);
}

describe('gameReducer', () => {
  it('counts down before starting the clock on round 1', () => {
    const counting = gameReducer(createInitialState(), { type: 'start', targets: TARGETS });
    expect(counting).toMatchObject({ phase: 'countdown', countdown: 3, startedAt: null });

    const afterTwo = run(
      counting,
      { type: 'countdownTick', now: 1 },
      { type: 'countdownTick', now: 2 }
    );
    expect(afterTwo).toMatchObject({ phase: 'countdown', countdown: 1 });

    expect(gameReducer(afterTwo, { type: 'countdownTick', now: 500 })).toMatchObject({
      phase: 'playing',
      roundIndex: 0,
      guess: ROUNDS[0].startValue,
      startedAt: 500,
    });
  });

  it('ignores slider input and submits outside of play', () => {
    const intro = createInitialState();
    expect(gameReducer(intro, { type: 'setGuess', value: 9 })).toBe(intro);
    expect(gameReducer(intro, SUBMIT)).toBe(intro);
  });

  it('locks the round for the penalty after a wrong answer, then unlocks', () => {
    const wrong = gameReducer(playing(), SUBMIT);
    expect(wrong).toMatchObject({ feedback: 'error', penaltyRemaining: 5 });

    // Locked: slider and submit do nothing
    expect(gameReducer(wrong, { type: 'setGuess', value: TARGETS[0] })).toBe(wrong);
    expect(gameReducer(wrong, SUBMIT)).toBe(wrong);

    const ticks = Array.from({ length: 5 }, () => ({ type: 'penaltyTick' as const }));
    expect(run(wrong, ...ticks.slice(0, 4))).toMatchObject({
      feedback: 'error',
      penaltyRemaining: 1,
    });
    expect(run(wrong, ...ticks)).toMatchObject({ feedback: 'none', penaltyRemaining: 0 });
  });

  it('never locks for less than a second', () => {
    expect(gameReducer(playing(), { ...SUBMIT, penaltySeconds: 0 })).toMatchObject({
      penaltyRemaining: 1,
    });
  });

  it('advances to the next round with a reset slider after a correct answer', () => {
    const correct = run(playing(), { type: 'setGuess', value: TARGETS[0] }, SUBMIT);
    expect(correct.feedback).toBe('success');

    expect(gameReducer(correct, { type: 'advance', now: 2000 })).toMatchObject({
      phase: 'playing',
      roundIndex: 1,
      guess: ROUNDS[1].startValue,
      feedback: 'none',
    });
  });

  it('only advances after a correct answer', () => {
    const state = playing();
    expect(gameReducer(state, { type: 'advance', now: 2000 })).toBe(state);
  });

  it('records the finish time after the last round', () => {
    let state = playing(1000);
    for (let i = 0; i < ROUNDS.length; i++) {
      state = run(state, { type: 'setGuess', value: TARGETS[i] }, SUBMIT, {
        type: 'advance',
        now: 1000 + (i + 1) * 2500,
      });
    }
    expect(state).toMatchObject({ phase: 'finished', finishedSeconds: ROUNDS.length * 2.5 });
  });

  it('starts a fresh game from the finish screen', () => {
    const finished: GameState = { ...playing(), phase: 'finished', finishedSeconds: 12 };
    expect(gameReducer(finished, { type: 'start', targets: TARGETS })).toMatchObject({
      phase: 'countdown',
      countdown: COUNTDOWN_SECONDS,
      roundIndex: 0,
      startedAt: null,
      finishedSeconds: null,
    });
  });
});
