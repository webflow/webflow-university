import { describe, expect, it } from 'vitest';

import {
  createSnakeGame,
  directionForKey,
  hasWon,
  placeFood,
  type SnakeGame,
  stepSnake,
  turnSnake,
} from './snake';

const first = () => 0;

function game(overrides: Partial<SnakeGame>): SnakeGame {
  return { ...createSnakeGame(10, 10, first), ...overrides };
}

describe('createSnakeGame', () => {
  it('starts with a three cell snake heading right and food off the snake', () => {
    const created = createSnakeGame(24, 14, () => 0.5);
    expect(created.snake).toEqual([
      { x: 8, y: 7 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
    ]);
    expect(created.direction).toBe('right');
    expect(created.score).toBe(0);
    expect(created.over).toBe(false);
    expect(created.snake).not.toContainEqual(created.food);
  });
});

describe('placeFood', () => {
  it('only picks free cells', () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    expect(placeFood(2, 2, snake, first)).toEqual({ x: 0, y: 1 });
    expect(placeFood(2, 2, snake, () => 0.999)).toEqual({ x: 1, y: 1 });
  });

  it('returns null when the board is full', () => {
    expect(placeFood(1, 1, [{ x: 0, y: 0 }], first)).toBeNull();
  });
});

describe('stepSnake', () => {
  it('moves the head one cell and drops the tail', () => {
    const start = game({ food: { x: 0, y: 0 } });
    const next = stepSnake(start);
    expect(next.snake).toEqual([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ]);
    expect(next.over).toBe(false);
  });

  it('grows, scores and places new food when eating', () => {
    const start = game({ food: { x: 5, y: 5 } });
    const next = stepSnake(start, first);
    expect(next.snake).toHaveLength(4);
    expect(next.score).toBe(1);
    expect(next.food).not.toBeNull();
    expect(next.snake).not.toContainEqual(next.food);
  });

  it('ends the game at a wall', () => {
    const start = game({
      snake: [
        { x: 9, y: 0 },
        { x: 8, y: 0 },
      ],
      food: { x: 0, y: 9 },
    });
    expect(stepSnake(start).over).toBe(true);
  });

  it('ends the game when the head hits the body', () => {
    const start = game({
      snake: [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 1, y: 3 },
      ],
      direction: 'up',
      queue: ['right'],
      food: { x: 9, y: 9 },
    });
    // Turning right from (2,2) heads into (3,2), which is still occupied.
    expect(stepSnake(start).over).toBe(true);
  });

  it('allows moving into the cell the tail is leaving', () => {
    const start = game({
      snake: [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 2, y: 3 },
      ],
      direction: 'left',
      queue: ['down'],
      food: { x: 9, y: 9 },
    });
    const next = stepSnake(start);
    expect(next.over).toBe(false);
    expect(next.snake[0]).toEqual({ x: 2, y: 3 });
  });

  it('applies one queued turn per step', () => {
    const start = turnSnake(turnSnake(game({ food: { x: 0, y: 0 } }), 'up'), 'left');
    const once = stepSnake(start);
    expect(once.direction).toBe('up');
    expect(once.queue).toEqual(['left']);
    expect(stepSnake(once).direction).toBe('left');
  });

  it('wins when the last free cell is eaten', () => {
    const start = game({
      cols: 2,
      rows: 1,
      snake: [{ x: 0, y: 0 }],
      direction: 'right',
      food: { x: 1, y: 0 },
    });
    const next = stepSnake(start);
    expect(next.over).toBe(true);
    expect(hasWon(next)).toBe(true);
  });
});

describe('turnSnake', () => {
  it('ignores reversing into the body and repeating the current direction', () => {
    const start = game({});
    expect(turnSnake(start, 'left')).toBe(start);
    expect(turnSnake(start, 'right')).toBe(start);
  });

  it('checks reversals against the last queued turn', () => {
    const queued = turnSnake(game({}), 'up');
    expect(turnSnake(queued, 'down')).toBe(queued);
    expect(turnSnake(queued, 'left').queue).toEqual(['up', 'left']);
  });

  it('queues at most two turns', () => {
    const full = turnSnake(turnSnake(game({}), 'up'), 'left');
    expect(turnSnake(full, 'down')).toBe(full);
  });

  it('ignores turns after game over', () => {
    const over = game({ over: true });
    expect(turnSnake(over, 'up')).toBe(over);
  });
});

describe('directionForKey', () => {
  it('maps only the arrow keys', () => {
    expect(directionForKey('ArrowUp')).toBe('up');
    expect(directionForKey('ArrowLeft')).toBe('left');
    expect(directionForKey('s')).toBeNull();
    expect(directionForKey('w')).toBeNull();
  });
});
