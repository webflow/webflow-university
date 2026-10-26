import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import EyeballingGame from './EyeballingGame';
import { DEFAULT_TOLERANCE_PERCENT, pickTarget } from './gameLogic';
import { ROUNDS } from './rounds';

const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;

function render() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<EyeballingGame />));
  return container;
}

/** Steps in small slices so each timeout's re-render can schedule the next one */
function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    act(() => {
      vi.advanceTimersByTime(Math.min(100, ms - elapsed));
    });
  }
}

function click(element: Element | null | undefined) {
  if (!element) throw new Error('Element to click not found');
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function getButton(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(label)
  );
}

function moveSlider(container: HTMLElement, value: number) {
  const slider = container.querySelector<HTMLInputElement>('input[type="range"]');
  if (!slider) throw new Error('Slider not found');
  act(() => {
    setInputValue.call(slider, String(value));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function messageText(container: HTMLElement) {
  return container.querySelector('.eyeball-message')?.textContent ?? '';
}

describe('EyeballingGame', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'performance',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });
    // Deterministic targets; the test recomputes them with the same picker
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);

    // Stand-in for the Google Fonts stylesheet so the test DOM doesn't fetch it
    if (!document.getElementById('eyeballing-game-fonts')) {
      const placeholder = document.createElement('meta');
      placeholder.id = 'eyeballing-game-fonts';
      document.head.appendChild(placeholder);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows the intro without any leaderboard or sign-up form', () => {
    const container = render();

    expect(container.textContent).toContain('The Eyeballing Game');
    expect(getButton(container, 'Let’s go!')).toBeTruthy();
    expect(container.querySelector('input[type="email"], input[type="text"], form')).toBeNull();
    expect(container.textContent?.toLowerCase()).not.toContain('leaderboard');
  });

  it('plays through all eight rounds, including a penalty, to the finish screen', () => {
    const targets = ROUNDS.map((round) => pickTarget(round, DEFAULT_TOLERANCE_PERCENT));
    const container = render();

    click(getButton(container, 'Let’s go!'));
    expect(container.querySelector('.eyeball-countdown')?.textContent).toBe('3');

    advance(3000);
    expect(container.textContent).toContain(ROUNDS[0].title);

    // A wrong answer locks the round and counts the penalty down
    click(getButton(container, 'Submit'));
    expect(messageText(container)).toBe('Incorrect! Try again in 5 seconds.');
    expect(container.querySelector('.eyeball-penalty.is-active')).toBeTruthy();

    moveSlider(container, targets[0]);
    expect(container.querySelector('.eyeball-value')?.textContent).toContain('3.0');

    advance(1000);
    expect(messageText(container)).toBe('Incorrect! Try again in 4 seconds.');
    advance(4000);
    expect(messageText(container)).toBe('');
    expect(container.querySelector('.eyeball-penalty.is-active')).toBeNull();

    for (const [index, round] of ROUNDS.entries()) {
      expect(container.textContent).toContain(round.title);
      expect(container.querySelector('.eyeball-topbar')?.textContent).toContain(
        `${String(index + 1).padStart(2, '0')}/08`
      );

      moveSlider(container, targets[index]);
      click(getButton(container, 'Submit'));
      expect(messageText(container)).toBe('Congratulations! You nailed it.');

      advance(1000);
    }

    expect(container.textContent).toContain('Congratulations!');
    expect(container.textContent).toMatch(/You finished the game in \d+\.\d{2} seconds/);
    expect(getButton(container, 'Share my time')).toBeTruthy();

    click(getButton(container, 'Try again'));
    expect(container.querySelector('.eyeball-countdown')?.textContent).toBe('3');
    expect(container.querySelector('.eyeball-topbar')?.textContent).toContain('00:00.00');
  });
});
