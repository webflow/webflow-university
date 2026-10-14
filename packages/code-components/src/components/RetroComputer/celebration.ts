export interface AsciiCell {
  col: number;
  row: number;
  char: string;
  /** 0 is the screen text color, 1+ index into FIREWORK_COLORS (offset by one). */
  color: number;
}

export const FIREWORK_COLORS = ['#7ee0a1', '#ffd166', '#ff7ab6', '#ffffff'];

const ROCKET = ['  ^  ', ' /W\\ ', ' |=| ', '/|_|\\'];
const FLAMES = [" *'* ", " '*' "];
const LAUNCH_MS = 1000;

const BURSTS = [
  { atMs: 1000, x: 0.5, y: 0.3, color: 1 },
  { atMs: 1350, x: 0.22, y: 0.42, color: 2 },
  { atMs: 1650, x: 0.78, y: 0.38, color: 3 },
  { atMs: 2050, x: 0.38, y: 0.2, color: 4 },
];
const BURST_MS = 1300;
const PARTICLES = 18;

const MESSAGE = 'PUBLISHED!';
const MESSAGE_AT_MS = 1300;
const MESSAGE_CHAR_MS = 70;

/** One frame of the publish celebration on a `cols` x `rows` character grid. */
export function celebrationFrame(elapsedMs: number, cols: number, rows: number): AsciiCell[] {
  const cells = new Map<string, AsciiCell>();
  const put = (col: number, row: number, char: string, color: number) => {
    const c = Math.round(col);
    const r = Math.round(row);
    if (char === ' ' || c < 0 || r < 0 || c >= cols || r >= rows) return;
    cells.set(`${c},${r}`, { col: c, row: r, char, color });
  };
  const frame = Math.floor(elapsedMs / 80);

  if (elapsedMs < LAUNCH_MS) {
    const progress = elapsedMs / LAUNCH_MS;
    const start = rows - ROCKET.length - 1;
    const end = BURSTS[0].y * rows;
    const top = start - (start - end) * progress * progress;
    const left = cols / 2 - 2;
    ROCKET.forEach((line, i) => {
      [...line].forEach((char, j) => put(left + j, top + i, char, 0));
    });
    [...FLAMES[frame % 2]].forEach((char, j) => put(left + j, top + ROCKET.length, char, 2));
    for (let row = Math.ceil(top + ROCKET.length + 1); row < rows; row++) {
      if ((row + frame) % 3 === 0) put(cols / 2, row, '.', 0);
      else if ((row + frame) % 3 === 1) put(cols / 2, row, ':', 0);
    }
  }

  const radiusLimit = Math.min(rows * 0.28, cols * 0.14);
  BURSTS.forEach((burst, burstIndex) => {
    const age = elapsedMs - burst.atMs;
    if (age < 0 || age > BURST_MS) return;
    const progress = age / BURST_MS;
    const radius = radiusLimit * (1 - Math.pow(1 - progress, 3));
    const sag = progress * progress * 2;
    const char = progress < 0.35 ? '*' : progress < 0.65 ? '+' : progress < 0.9 ? '.' : ' ';
    const cx = burst.x * cols;
    const cy = burst.y * rows;
    if (progress < 0.12) put(cx, cy, '@', burst.color);
    for (let k = 0; k < PARTICLES; k++) {
      const angle = (k / PARTICLES) * Math.PI * 2 + burstIndex * 0.4;
      // Character cells are about twice as tall as they are wide.
      put(
        cx + Math.cos(angle) * radius * 2,
        cy + Math.sin(angle) * radius + sag,
        char,
        burst.color
      );
      if (progress < 0.7) {
        put(
          cx + Math.cos(angle) * radius * 1.2,
          cy + Math.sin(angle) * radius * 0.6 + sag,
          '.',
          burst.color
        );
      }
    }
  });

  if (elapsedMs >= MESSAGE_AT_MS) {
    const typed = Math.min(
      MESSAGE.length,
      Math.floor((elapsedMs - MESSAGE_AT_MS) / MESSAGE_CHAR_MS) + 1
    );
    const row = Math.round(rows * 0.74);
    const left = Math.round((cols - MESSAGE.length) / 2);
    [...MESSAGE.slice(0, typed)].forEach((char, i) => put(left + i, row, char, 0));
    if (typed === MESSAGE.length) {
      const sparkle = frame % 4 < 2 ? '*' : '+';
      put(left - 3, row, sparkle, 2);
      put(left + MESSAGE.length + 2, row, sparkle, 3);
    }
  }

  return [...cells.values()];
}
