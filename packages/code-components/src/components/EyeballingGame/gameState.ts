import { COUNTDOWN_SECONDS, isMatch } from './gameLogic';
import { ROUNDS } from './rounds';

export type Phase = 'intro' | 'countdown' | 'playing' | 'finished';
export type Feedback = 'none' | 'success' | 'error';

export interface GameState {
  phase: Phase;
  countdown: number;
  roundIndex: number;
  /** One target value per round, picked when the game starts */
  targets: number[];
  guess: number;
  feedback: Feedback;
  penaltyRemaining: number;
  /** `performance.now()` when round 1 began */
  startedAt: number | null;
  finishedSeconds: number | null;
}

export type GameAction =
  | { type: 'start'; targets: number[] }
  | { type: 'countdownTick'; now: number }
  | { type: 'setGuess'; value: number }
  | { type: 'submit'; tolerancePercent: number; penaltySeconds: number }
  | { type: 'penaltyTick' }
  | { type: 'advance'; now: number };

export function createInitialState(): GameState {
  return {
    phase: 'intro',
    countdown: COUNTDOWN_SECONDS,
    roundIndex: 0,
    targets: [],
    guess: ROUNDS[0].startValue,
    feedback: 'none',
    penaltyRemaining: 0,
    startedAt: null,
    finishedSeconds: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return { ...createInitialState(), phase: 'countdown', targets: action.targets };

    case 'countdownTick':
      if (state.phase !== 'countdown') return state;
      if (state.countdown > 1) return { ...state, countdown: state.countdown - 1 };
      return { ...state, phase: 'playing', startedAt: action.now };

    case 'setGuess':
      if (state.phase !== 'playing' || state.feedback !== 'none') return state;
      return { ...state, guess: action.value };

    case 'submit': {
      if (state.phase !== 'playing' || state.feedback !== 'none') return state;
      const round = ROUNDS[state.roundIndex];
      if (isMatch(round, state.targets[state.roundIndex], state.guess, action.tolerancePercent)) {
        return { ...state, feedback: 'success' };
      }
      return {
        ...state,
        feedback: 'error',
        penaltyRemaining: Math.max(1, Math.round(action.penaltySeconds)),
      };
    }

    case 'penaltyTick':
      if (state.feedback !== 'error') return state;
      if (state.penaltyRemaining > 1) {
        return { ...state, penaltyRemaining: state.penaltyRemaining - 1 };
      }
      return { ...state, feedback: 'none', penaltyRemaining: 0 };

    case 'advance': {
      if (state.feedback !== 'success') return state;
      const nextIndex = state.roundIndex + 1;
      if (nextIndex >= ROUNDS.length) {
        return {
          ...state,
          phase: 'finished',
          feedback: 'none',
          finishedSeconds: (action.now - (state.startedAt ?? action.now)) / 1000,
        };
      }
      return {
        ...state,
        roundIndex: nextIndex,
        guess: ROUNDS[nextIndex].startValue,
        feedback: 'none',
      };
    }
  }
}
