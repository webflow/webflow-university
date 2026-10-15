import { describe, expect, it } from 'vitest';

import { celebrationFrame, FIREWORK_COLORS, parseColorList } from './celebration';
import { CELEBRATION_MS } from './publishSequence';

const COLS = 54;
const ROWS = 21;

const text = (elapsedMs: number) =>
  celebrationFrame(elapsedMs, COLS, ROWS)
    .map((cell) => cell.char)
    .join('');

describe('celebrationFrame', () => {
  it('launches the rocket first', () => {
    expect(text(300)).toContain('W');
    expect(text(300)).not.toContain('PUBLISHED');
  });

  it('bursts into fireworks once the rocket reaches the top', () => {
    const cells = celebrationFrame(1150, COLS, ROWS);
    expect(cells.some((cell) => cell.char === '*' && cell.color > 0)).toBe(true);
    expect(cells.some((cell) => cell.char === 'W')).toBe(false);
  });

  it('types out PUBLISHED! before the celebration ends', () => {
    expect(text(CELEBRATION_MS - 1)).toContain('PUBLISHED!');
  });

  it('keeps every cell on the grid with one character per cell', () => {
    for (let elapsed = 0; elapsed < CELEBRATION_MS; elapsed += 50) {
      const cells = celebrationFrame(elapsed, COLS, ROWS);
      const keys = new Set(cells.map((cell) => `${cell.col},${cell.row}`));
      expect(keys.size).toBe(cells.length);
      for (const cell of cells) {
        expect(cell.col).toBeGreaterThanOrEqual(0);
        expect(cell.col).toBeLessThan(COLS);
        expect(cell.row).toBeGreaterThanOrEqual(0);
        expect(cell.row).toBeLessThan(ROWS);
        expect(cell.char).toHaveLength(1);
      }
    }
  });
});

describe('parseColorList', () => {
  it('splits a comma separated list and trims each color', () => {
    expect(parseColorList(' #ff0000, gold ,#00f')).toEqual(['#ff0000', 'gold', '#00f']);
  });

  it('keeps commas inside color functions', () => {
    expect(parseColorList('rgb(255, 0, 0), hsl(200 50% 50% / 0.5),#fff')).toEqual([
      'rgb(255, 0, 0)',
      'hsl(200 50% 50% / 0.5)',
      '#fff',
    ]);
  });

  it('falls back to the default fireworks palette when empty', () => {
    expect(parseColorList(undefined)).toEqual(FIREWORK_COLORS);
    expect(parseColorList(' , ')).toEqual(FIREWORK_COLORS);
  });
});
