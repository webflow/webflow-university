export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Cell {
  x: number;
  y: number;
}

export interface SnakeGame {
  cols: number;
  rows: number;
  /** Head first. */
  snake: Cell[];
  direction: Direction;
  /** Turns waiting to be applied, one per step, so quick double taps aren't lost. */
  queue: Direction[];
  /** Null once the board is full. */
  food: Cell | null;
  score: number;
  over: boolean;
}

export const SNAKE_COLS = 24;
export const SNAKE_ROWS = 14;
export const SNAKE_STEP_MS = 120;
const MAX_QUEUED_TURNS = 2;

const VECTORS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function directionForKey(key: string): Direction | null {
  return KEY_DIRECTIONS[key] ?? null;
}

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

export function placeFood(
  cols: number,
  rows: number,
  snake: Cell[],
  random: () => number = Math.random
): Cell | null {
  const taken = new Set(snake.map((cell) => cell.y * cols + cell.x));
  const free = cols * rows - taken.size;
  if (free <= 0) return null;
  let remaining = Math.min(Math.floor(random() * free), free - 1);
  for (let i = 0; i < cols * rows; i++) {
    if (taken.has(i)) continue;
    if (remaining === 0) return { x: i % cols, y: Math.floor(i / cols) };
    remaining--;
  }
  return null;
}

export function createSnakeGame(
  cols = SNAKE_COLS,
  rows = SNAKE_ROWS,
  random: () => number = Math.random
): SnakeGame {
  const y = Math.floor(rows / 2);
  const x = Math.floor(cols / 4) + 2;
  const snake = [
    { x, y },
    { x: x - 1, y },
    { x: x - 2, y },
  ];
  return {
    cols,
    rows,
    snake,
    direction: 'right',
    queue: [],
    food: placeFood(cols, rows, snake, random),
    score: 0,
    over: false,
  };
}

export function turnSnake(game: SnakeGame, direction: Direction): SnakeGame {
  if (game.over || game.queue.length >= MAX_QUEUED_TURNS) return game;
  const last = game.queue[game.queue.length - 1] ?? game.direction;
  if (direction === last || direction === OPPOSITE[last]) return game;
  return { ...game, queue: [...game.queue, direction] };
}

export function stepSnake(game: SnakeGame, random: () => number = Math.random): SnakeGame {
  if (game.over) return game;
  const [turn, ...queue] = game.queue;
  const direction = turn ?? game.direction;
  const head = game.snake[0];
  const next = { x: head.x + VECTORS[direction].x, y: head.y + VECTORS[direction].y };
  const eats = game.food !== null && sameCell(next, game.food);
  // The tail moves out of the way this step unless the snake grows.
  const body = eats ? game.snake : game.snake.slice(0, -1);
  const hitsWall = next.x < 0 || next.y < 0 || next.x >= game.cols || next.y >= game.rows;
  if (hitsWall || body.some((cell) => sameCell(cell, next))) {
    return { ...game, direction, queue, over: true };
  }

  const snake = [next, ...body];
  if (!eats) return { ...game, snake, direction, queue };
  const food = placeFood(game.cols, game.rows, snake, random);
  return { ...game, snake, direction, queue, food, score: game.score + 1, over: food === null };
}

export const hasWon = (game: SnakeGame) => game.over && game.food === null;
