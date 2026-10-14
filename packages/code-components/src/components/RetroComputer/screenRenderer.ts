import * as THREE from 'three';

import { celebrationFrame, FIREWORK_COLORS } from './celebration';
import { PUBLISH_STEPS, type ScreenState, type StepStatus } from './publishSequence';

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

export const IDLE_TEXT = 'Press ENTER to publish';
export const PUBLISHING_TITLE = 'Publishing in progress...';
export const PUBLISHED_TEXT = 'Published a few seconds ago';

export class ScreenRenderer {
  readonly texture: THREE.CanvasTexture;
  private readonly context: CanvasRenderingContext2D;
  private readonly background: string;
  private readonly foreground: string;

  constructor(background: string, foreground: string) {
    this.background = background;
    this.foreground = foreground;
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
    this.drawCrtOverlay();
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
      const color = cell.color === 0 ? this.foreground : FIREWORK_COLORS[cell.color - 1];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.fillText(
        cell.char,
        left + (cell.col + 0.5) * cellWidth,
        top + (cell.row + 0.5) * GRID_LINE_HEIGHT
      );
    }
  }

  private drawCrtOverlay() {
    const ctx = this.context;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let y = 0; y < HEIGHT; y += 6) ctx.fillRect(0, y, WIDTH, 2);
    const vignette = ctx.createRadialGradient(
      WIDTH / 2,
      HEIGHT / 2,
      HEIGHT * 0.35,
      WIDTH / 2,
      HEIGHT / 2,
      HEIGHT * 0.85
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }
}
