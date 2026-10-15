import * as THREE from 'three';

import { celebrationFrame, FIREWORK_COLORS } from './celebration';
import { BOOT_LINES, type PowerState, SHUTDOWN_TEXT } from './powerSequence';
import { PUBLISH_STEPS, type ScreenState, type StepStatus } from './publishSequence';
import { hasWon, type SnakeGame } from './snake';

// Matches the 6.67 x 5.13 screen face on the monitor model.
const WIDTH = 1300;
const HEIGHT = 1000;
const PADDING_X = 110;
const PADDING_Y = 100;
const FONT_FAMILY = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
const FONT_SIZE = 42;
const LINE_HEIGHT = FONT_SIZE * 1.6;
const GRID_FONT_SIZE = 34;
const GRID_LINE_HEIGHT = GRID_FONT_SIZE * 1.15;
const GLOW = 14;

export const CURSOR_BLINK_MS = 530;
const SPINNER_TURN_MS = 900;
const CHECK_COLOR = '#5fd38d';
const OFF_COLOR = '#020304';
const BEAM_COLOR = '#eef4ff';
/** The CRT image squeezes to a line for this share of the collapse, then the line to a dot. */
const LINE_SHARE = 0.65;

const SNAKE_CELL = 45;
const SNAKE_HEADER_Y = 130;
const SNAKE_BOARD_TOP = 180;

export const IDLE_TEXT = 'Ready to publish?';
export const PUBLISHING_TITLE = 'Publishing in progress...';
export const PUBLISHED_TEXT = 'Published a few seconds ago';

export class ScreenRenderer {
  readonly texture: THREE.CanvasTexture;
  private readonly context: CanvasRenderingContext2D;
  private readonly background: string;
  private readonly foreground: string;
  private readonly fireworkColors: string[];

  constructor(background: string, foreground: string, fireworkColors = FIREWORK_COLORS) {
    this.background = background;
    this.foreground = foreground;
    this.fireworkColors = fireworkColors.length > 0 ? fireworkColors : FIREWORK_COLORS;
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('RetroComputer: 2D canvas is not available');
    this.context = context;

    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    // glTF UVs put v = 0 at the top of the image.
    this.texture.flipY = false;
    this.texture.anisotropy = 4;
  }

  render(state: ScreenState, now: number, reducedMotion: boolean) {
    const ctx = this.context;
    ctx.save();
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.foreground;
    ctx.shadowBlur = GLOW;

    const cursorOn = reducedMotion || Math.floor(now / CURSOR_BLINK_MS) % 2 === 0;
    const spinnerAngle = reducedMotion
      ? 0
      : ((now % SPINNER_TURN_MS) / SPINNER_TURN_MS) * Math.PI * 2;

    switch (state.phase) {
      case 'idle':
        this.drawPrompt(IDLE_TEXT, cursorOn, false);
        break;
      case 'publishing':
        this.drawSteps(state.steps, spinnerAngle);
        break;
      case 'celebrating':
        this.drawCelebration(state.elapsedMs);
        break;
      case 'published':
        this.drawPrompt(PUBLISHED_TEXT, cursorOn, true);
        break;
    }

    ctx.restore();
    this.texture.needsUpdate = true;
  }

  renderPower(state: PowerState, now: number, reducedMotion: boolean) {
    const ctx = this.context;
    ctx.save();
    const lit = state.phase === 'shutting-down' || state.phase === 'booting';
    ctx.fillStyle = lit ? this.background : OFF_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.foreground;
    ctx.shadowBlur = GLOW;
    const cursorOn = reducedMotion || Math.floor(now / CURSOR_BLINK_MS) % 2 === 0;

    switch (state.phase) {
      case 'shutting-down':
        this.drawPrompt(SHUTDOWN_TEXT, cursorOn, false);
        break;
      case 'collapsing':
        this.drawCollapse(state.progress);
        break;
      case 'warming-up':
        this.drawWarmUp(state.progress);
        break;
      case 'booting':
        this.drawBootLog(state.lines, cursorOn);
        break;
      default:
        break;
    }

    ctx.restore();
    this.texture.needsUpdate = true;
  }

  renderSnake(game: SnakeGame, now: number, paused: boolean, reducedMotion: boolean) {
    const ctx = this.context;
    ctx.save();
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.foreground;
    ctx.shadowBlur = GLOW;

    const boardWidth = game.cols * SNAKE_CELL;
    const boardHeight = game.rows * SNAKE_CELL;
    const left = (WIDTH - boardWidth) / 2;
    const top = SNAKE_BOARD_TOP;

    this.setFont(FONT_SIZE, 700);
    ctx.fillStyle = this.foreground;
    ctx.fillText('SNAKE', left, SNAKE_HEADER_Y);
    this.setFont();
    ctx.textAlign = 'right';
    ctx.fillText(`Score ${game.score}`, left + boardWidth, SNAKE_HEADER_Y);
    ctx.textAlign = 'left';

    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = this.foreground;
    ctx.lineWidth = 3;
    ctx.strokeRect(left - 6, top - 6, boardWidth + 12, boardHeight + 12);
    ctx.globalAlpha = 1;

    if (game.food) {
      const food = this.fireworkColors[0];
      ctx.fillStyle = food;
      ctx.shadowColor = food;
      ctx.beginPath();
      ctx.arc(
        left + (game.food.x + 0.5) * SNAKE_CELL,
        top + (game.food.y + 0.5) * SNAKE_CELL,
        SNAKE_CELL * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowColor = this.foreground;
    }

    // One path for the whole body keeps it to a single (relatively expensive) shadow pass.
    const inset = 4;
    ctx.fillStyle = this.foreground;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    for (const cell of game.snake.slice(1)) {
      ctx.rect(
        left + cell.x * SNAKE_CELL + inset,
        top + cell.y * SNAKE_CELL + inset,
        SNAKE_CELL - inset * 2,
        SNAKE_CELL - inset * 2
      );
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    const head = game.snake[0];
    ctx.fillRect(
      left + head.x * SNAKE_CELL + inset / 2,
      top + head.y * SNAKE_CELL + inset / 2,
      SNAKE_CELL - inset,
      SNAKE_CELL - inset
    );

    const footerY = top + boardHeight + 50;
    this.setFont(GRID_FONT_SIZE);
    ctx.globalAlpha = 0.55;
    ctx.fillText('Arrow keys to steer, Esc to quit', left, footerY);
    ctx.globalAlpha = 1;

    if (game.over || paused) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = this.background;
      ctx.fillRect(left - 6, top - 6, boardWidth + 12, boardHeight + 12);
      ctx.restore();
      const cursorOn = reducedMotion || Math.floor(now / CURSOR_BLINK_MS) % 2 === 0;
      const centerY = top + boardHeight / 2;
      const title = game.over ? (hasWon(game) ? 'You win!' : 'Game over') : 'Paused';
      const hint = game.over ? 'Press S to play again' : 'Click the computer to resume';
      ctx.textAlign = 'center';
      this.setFont(FONT_SIZE * 1.3, 700);
      ctx.fillText(title, WIDTH / 2, centerY - LINE_HEIGHT * 0.6);
      ctx.textAlign = 'left';
      this.setFont();
      const hintWidth = ctx.measureText(hint).width;
      const charWidth = ctx.measureText('M').width;
      const hintLeft = (WIDTH - hintWidth - charWidth * 1.4) / 2;
      const hintY = centerY + LINE_HEIGHT * 0.6;
      ctx.fillText(hint, hintLeft, hintY);
      if (cursorOn) {
        ctx.fillRect(
          hintLeft + hintWidth + charWidth * 0.4,
          hintY - FONT_SIZE * 0.5,
          charWidth,
          FONT_SIZE
        );
      }
    }

    ctx.restore();
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }

  private setFont(size = FONT_SIZE, weight = 400) {
    this.context.font = `${weight} ${size}px ${FONT_FAMILY}`;
  }

  private drawPrompt(text: string, cursorOn: boolean, withCheck: boolean) {
    const ctx = this.context;
    this.setFont();
    const charWidth = ctx.measureText('M').width;
    const iconSpace = withCheck ? charWidth * 2 : 0;
    const textWidth = ctx.measureText(text).width;
    const total = iconSpace + textWidth + charWidth * 1.4;
    const left = (WIDTH - total) / 2;
    const y = HEIGHT / 2;

    if (withCheck) this.drawCheck(left + charWidth * 0.6, y, FONT_SIZE * 0.42);
    ctx.fillStyle = this.foreground;
    ctx.fillText(text, left + iconSpace, y);
    if (cursorOn) {
      ctx.fillRect(
        left + iconSpace + textWidth + charWidth * 0.4,
        y - FONT_SIZE * 0.5,
        charWidth,
        FONT_SIZE
      );
    }
  }

  private drawSteps(steps: StepStatus[], spinnerAngle: number) {
    const ctx = this.context;
    const lines = PUBLISH_STEPS.length + 2;
    const top = (HEIGHT - lines * LINE_HEIGHT) / 2 + LINE_HEIGHT / 2;

    this.setFont(FONT_SIZE, 700);
    ctx.fillStyle = this.foreground;
    ctx.globalAlpha = 1;
    ctx.fillText(PUBLISHING_TITLE, PADDING_X, top);

    this.setFont();
    const charWidth = ctx.measureText('M').width;
    const iconX = PADDING_X + charWidth * 0.6;
    const textX = PADDING_X + charWidth * 2;
    const radius = FONT_SIZE * 0.36;

    PUBLISH_STEPS.forEach((step, index) => {
      const y = top + (index + 2) * LINE_HEIGHT;
      const status = steps[index];
      if (status === 'done') {
        this.drawCheck(iconX, y, radius);
        ctx.globalAlpha = 0.75;
      } else if (status === 'active') {
        this.drawSpinner(iconX, y, radius, spinnerAngle);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = 0.4;
        this.drawPendingDots(iconX, y, radius);
      }
      ctx.fillStyle = this.foreground;
      ctx.fillText(status === 'active' ? `${step.label}...` : step.label, textX, y);
      ctx.globalAlpha = 1;
    });
  }

  private drawCheck(x: number, y: number, radius: number) {
    const ctx = this.context;
    ctx.save();
    ctx.strokeStyle = CHECK_COLOR;
    ctx.shadowColor = CHECK_COLOR;
    ctx.lineWidth = radius * 0.22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.45, y + radius * 0.02);
    ctx.lineTo(x - radius * 0.1, y + radius * 0.38);
    ctx.lineTo(x + radius * 0.5, y - radius * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  private drawSpinner(x: number, y: number, radius: number, angle: number) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = this.foreground;
    ctx.fillStyle = this.foreground;
    ctx.lineWidth = radius * 0.24;
    ctx.lineCap = 'round';
    for (const offset of [0, Math.PI]) {
      const start = offset + 0.35;
      const end = offset + Math.PI - 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, radius, start, end);
      ctx.stroke();
      const tipX = Math.cos(end) * radius;
      const tipY = Math.sin(end) * radius;
      const size = radius * 0.5;
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(end + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(size * 0.6, 0);
      ctx.lineTo(-size * 0.5, -size * 0.6);
      ctx.lineTo(-size * 0.5, size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawPendingDots(x: number, y: number, radius: number) {
    const ctx = this.context;
    ctx.fillStyle = this.foreground;
    for (const dx of [-0.6, 0, 0.6]) {
      ctx.beginPath();
      ctx.arc(x + dx * radius, y, radius * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** The classic CRT switch-off: the picture squeezes into a bright line, then a dot. */
  private drawCollapse(progress: number) {
    let width = WIDTH;
    let height: number;
    let alpha: number;
    if (progress < LINE_SHARE) {
      const t = progress / LINE_SHARE;
      height = Math.max(HEIGHT * (1 - t) ** 2, 6);
      alpha = 0.35 + 0.65 * t;
    } else {
      const t = (progress - LINE_SHARE) / (1 - LINE_SHARE);
      height = 6;
      width = Math.max(WIDTH * (1 - t) ** 2, 10);
      alpha = 1 - t * 0.6;
    }
    this.drawBeam(width, height, alpha);
  }

  private drawWarmUp(progress: number) {
    const ctx = this.context;
    const height = HEIGHT * Math.sqrt(progress);
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.background;
    ctx.fillRect(0, (HEIGHT - height) / 2, WIDTH, height);
    ctx.restore();
    this.drawBeam(WIDTH, 6, 1 - progress);
  }

  private drawBeam(width: number, height: number, alpha: number) {
    const ctx = this.context;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = BEAM_COLOR;
    ctx.shadowColor = BEAM_COLOR;
    ctx.shadowBlur = GLOW * 2;
    ctx.fillRect((WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
    ctx.restore();
  }

  private drawBootLog(lines: number, cursorOn: boolean) {
    const ctx = this.context;
    this.setFont();
    ctx.fillStyle = this.foreground;
    const charWidth = ctx.measureText('M').width;
    const top = PADDING_Y + LINE_HEIGHT / 2;
    const shown = BOOT_LINES.slice(0, lines);
    shown.forEach((line, index) => ctx.fillText(line, PADDING_X, top + index * LINE_HEIGHT));
    if (cursorOn) {
      const last = shown[shown.length - 1] ?? '';
      const y = top + (shown.length - 1) * LINE_HEIGHT;
      ctx.fillRect(
        PADDING_X + ctx.measureText(last).width + charWidth * 0.4,
        y - FONT_SIZE * 0.5,
        charWidth,
        FONT_SIZE
      );
    }
  }

  private drawCelebration(elapsedMs: number) {
    const ctx = this.context;
    this.setFont(GRID_FONT_SIZE, 700);
    ctx.textAlign = 'center';
    const cellWidth = ctx.measureText('M').width;
    const cols = Math.floor((WIDTH - PADDING_X * 2) / cellWidth);
    const rows = Math.floor((HEIGHT - PADDING_Y * 2) / GRID_LINE_HEIGHT);
    const left = (WIDTH - cols * cellWidth) / 2;
    const top = (HEIGHT - rows * GRID_LINE_HEIGHT) / 2;

    for (const cell of celebrationFrame(elapsedMs, cols, rows)) {
      const color =
        cell.color === 0
          ? this.foreground
          : this.fireworkColors[(cell.color - 1) % this.fireworkColors.length];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.fillText(
        cell.char,
        left + (cell.col + 0.5) * cellWidth,
        top + (cell.row + 0.5) * GRID_LINE_HEIGHT
      );
    }
  }
}
