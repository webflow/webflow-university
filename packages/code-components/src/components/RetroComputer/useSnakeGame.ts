import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { isPlainSceneKey } from './sceneKeys';
import {
  createSnakeGame,
  directionForKey,
  hasWon,
  SNAKE_STEP_MS,
  type SnakeGame,
  stepSnake,
  turnSnake,
} from './snake';

interface SnakeOptions {
  /** The focusable scene wrapper. Keys are only handled while it is the focused element. */
  keyTarget: RefObject<HTMLElement | null>;
  enabled: boolean;
  /** Steps only advance while true (the scene is focused and on screen); otherwise it's paused. */
  running: boolean;
  /** Whether S may start a game right now, e.g. not while publishing or restarting. */
  canStart: () => boolean;
  onChange: () => void;
  onAnnounce: (message: string) => void;
}

/**
 * S starts Snake, the arrow keys steer and Escape closes it. Nothing is intercepted unless the
 * scene itself has focus: modified shortcuts, IME input, Tab and Escape all still reach the page,
 * and the arrow keys only stop scrolling while a game is actually being played.
 */
export function useSnakeGame({
  keyTarget,
  enabled,
  running,
  canStart,
  onChange,
  onAnnounce,
}: SnakeOptions) {
  const game = useRef<SnakeGame | null>(null);
  const [playing, setPlaying] = useState(false);
  const callbacks = useRef({ canStart, onChange, onAnnounce });

  useEffect(() => {
    callbacks.current = { canStart, onChange, onAnnounce };
  });

  const quit = useCallback(() => {
    if (!game.current) return;
    game.current = null;
    setPlaying(false);
    callbacks.current.onChange();
  }, []);

  useEffect(() => {
    const element = keyTarget.current;
    if (!enabled || !element) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isPlainSceneKey(event, element)) return;
      const current = game.current;

      if (event.key === 's' || event.key === 'S') {
        if (event.repeat || (current && !current.over) || !callbacks.current.canStart()) return;
        event.preventDefault();
        game.current = createSnakeGame();
        setPlaying(true);
        callbacks.current.onAnnounce(
          'Snake started. Use the arrow keys to steer and Escape to quit.'
        );
        callbacks.current.onChange();
        return;
      }

      if (!current) return;
      if (event.key === 'Escape') {
        // Left unprevented so a surrounding dialog or menu can still close on Escape.
        quit();
        callbacks.current.onAnnounce('Snake closed.');
        return;
      }

      const direction = directionForKey(event.key);
      if (!direction || current.over) return;
      event.preventDefault();
      game.current = turnSnake(current, direction);
    };

    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [enabled, keyTarget, quit]);

  useEffect(() => {
    if (!playing || !running) return;
    const timer = window.setInterval(() => {
      const current = game.current;
      if (!current || current.over) return;
      const next = stepSnake(current);
      game.current = next;
      if (next.over) {
        setPlaying(false);
        callbacks.current.onAnnounce(
          `${hasWon(next) ? 'You win!' : 'Game over.'} Score ${next.score}. Press S to play again.`
        );
      }
      callbacks.current.onChange();
    }, SNAKE_STEP_MS);
    return () => window.clearInterval(timer);
  }, [playing, running]);

  useEffect(() => {
    if (!enabled) quit();
  }, [enabled, quit]);

  return { game, quit };
}
