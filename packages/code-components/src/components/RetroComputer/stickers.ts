import * as THREE from 'three';

import type { Vector3Tuple } from './camera';

export const DEFAULT_NOTE_TEXT = 'S for snake';
export const DEFAULT_BADGE_TEXT = 'webflow';

export const STICKY_NOTE_NODE = 'StickyNote';
export const INSIDE_BADGE_NODE = 'InsideBadge';

// Placements in the Tower mesh's local glTF space (Y up, the front faces +Z, the left side -X).
const NOTE_CENTRE: Vector3Tuple = [-1.01, 7.7, 2];
const BADGE_CENTRE: Vector3Tuple = [2.81, 0.5, 4.265];

const NOTE_SIZE = 2.1;
const NOTE_ROWS = 14;
/** The top of the note stays stuck down; below this fraction it peels away from the case. */
const NOTE_CURL_START = 0.4;
/** How far the bottom edge lifts off the case. */
const NOTE_CURL = 0.38;
const NOTE_TILT = 0.1;
const NOTE_COLOR = '#ffd93d';
const NOTE_INK = '#1f1f24';
const NOTE_TEXTURE_SIZE = 256;
/** System handwriting faces, so nothing is bundled: Bradley Hand on macOS, Segoe Print on Windows. */
const HANDWRITING = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

const BADGE_WIDTH = 0.9;
const BADGE_HEIGHT = 0.95;
const BADGE_CORNER = 0.07;
const BADGE_PX_PER_UNIT = 320;
const BADGE_FOIL = ['#f6f7f9', '#b4b9c1', '#eceef2', '#c9cdd3'];
const BADGE_SWIRL = '#0a5fb4';
const BADGE_INK = '#0b2a6f';
const BADGE_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/** A decal on the tower whose text can be repainted. */
export interface Sticker {
  object: THREE.Object3D;
  setText: (text: string) => void;
}

export interface TextLayout {
  size: number;
  lines: string[];
}

interface TextBox {
  maxWidth: number;
  maxLines: number;
  maxSize: number;
  minSize: number;
}

/** How far the note sits off the case at `fromTop` (0 is the top edge, 1 the bottom). */
export function noteLift(fromTop: number) {
  if (fromTop <= NOTE_CURL_START) return 0;
  return NOTE_CURL * ((fromTop - NOTE_CURL_START) / (1 - NOTE_CURL_START)) ** 2;
}

function wrapWords(words: string[], maxWidth: number, width: (line: string) => number) {
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last !== undefined && width(`${last} ${word}`) <= maxWidth) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

/**
 * The largest font size (stepping down 2px at a time) whose word-wrapped lines fit the box.
 * Text that still doesn't fit at `minSize` keeps its first `maxLines` lines.
 */
export function layoutText(
  text: string,
  { maxWidth, maxLines, maxSize, minSize }: TextBox,
  measure: (line: string, size: number) => number
): TextLayout {
  const words = text.trim().split(/\s+/).filter(Boolean);
  for (let size = maxSize; size > minSize; size -= 2) {
    const lines = wrapWords(words, maxWidth, (line) => measure(line, size));
    if (lines.length <= maxLines && lines.every((line) => measure(line, size) <= maxWidth)) {
      return { size, lines };
    }
  }
  const lines = wrapWords(words, maxWidth, (line) => measure(line, minSize));
  return { size: minSize, lines: lines.slice(0, maxLines) };
}

function fillLines(ctx: CanvasRenderingContext2D, { size, lines }: TextLayout, lineHeight: number) {
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, (index - (lines.length - 1) / 2) * size * lineHeight);
  });
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext('2d');
}

/** Paints with `paint` whenever the text changes; without a 2D canvas the sticker stays blank. */
function createPaintedSticker(
  object: THREE.Object3D,
  material: THREE.MeshStandardMaterial,
  ctx: CanvasRenderingContext2D | null,
  paint: (ctx: CanvasRenderingContext2D, text: string) => void
): Sticker {
  const texture = ctx ? new THREE.CanvasTexture(ctx.canvas) : null;
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    material.map = texture;
    material.color.set('#ffffff');
  }
  let painted: string | null = null;
  return {
    object,
    setText: (text) => {
      if (!ctx || !texture || text === painted) return;
      painted = text;
      paint(ctx, text);
      texture.needsUpdate = true;
    },
  };
}

const handwriting = (size: number) => `bold ${size}px ${HANDWRITING}`;

function paintNote(ctx: CanvasRenderingContext2D, text: string) {
  const size = ctx.canvas.width;
  ctx.fillStyle = NOTE_COLOR;
  ctx.fillRect(0, 0, size, size);
  const layout = layoutText(
    text,
    { maxWidth: size * 0.8, maxLines: 4, maxSize: size * 0.2, minSize: size * 0.07 },
    (line, px) => {
      ctx.font = handwriting(px);
      return ctx.measureText(line).width;
    }
  );
  ctx.save();
  ctx.translate(size / 2, size * 0.42);
  ctx.rotate(-0.06);
  ctx.fillStyle = NOTE_INK;
  ctx.font = handwriting(layout.size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fillLines(ctx, layout, 1.05);
  ctx.restore();
}

/** A square of paper, flat along its top and curling off the case towards the bottom. */
function createNoteGeometry() {
  const geometry = new THREE.PlaneGeometry(NOTE_SIZE, NOTE_SIZE, 1, NOTE_ROWS);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    position.setZ(i, noteLift((NOTE_SIZE / 2 - position.getY(i)) / NOTE_SIZE));
  }
  geometry.computeVertexNormals();
  geometry.rotateZ(NOTE_TILT);
  // Face out of the tower's left side, reading from back to front.
  geometry.rotateY(-Math.PI / 2);
  return geometry;
}

const decalMaterial = (parameters: THREE.MeshStandardMaterialParameters) =>
  new THREE.MeshStandardMaterial({
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    ...parameters,
  });

/** A handwritten sticky note on the tower's left side. Parent it to the Tower mesh. */
export function createStickyNote(): Sticker {
  const geometry = createNoteGeometry();
  const front = decalMaterial({ color: NOTE_COLOR, roughness: 0.85, metalness: 0 });
  const back = decalMaterial({
    color: NOTE_COLOR,
    roughness: 0.85,
    metalness: 0,
    side: THREE.BackSide,
  });
  const note = new THREE.Group();
  note.name = STICKY_NOTE_NODE;
  note.add(new THREE.Mesh(geometry, front), new THREE.Mesh(geometry, back));
  note.position.set(...NOTE_CENTRE);
  return createPaintedSticker(
    note,
    front,
    createCanvas(NOTE_TEXTURE_SIZE, NOTE_TEXTURE_SIZE),
    paintNote
  );
}

const badgeFont = (weight: string, size: number) => `${weight} ${size}px ${BADGE_FONT}`;

/** The open swirl around the lettering, drawn thicker on the left like a brush stroke. */
function paintSwirl(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  const steps = 48;
  const start = 0.6;
  const sweep = Math.PI * 2 - 0.6;
  const thin = 0.018 * BADGE_PX_PER_UNIT;
  const thick = 0.03 * BADGE_PX_PER_UNIT;
  const edge = (step: number, side: 1 | -1) => {
    const s = step / steps;
    const angle = start + sweep * s;
    const width = thin + thick * Math.sin(Math.PI * s);
    const grow = side === 1 ? width * 0.4 : -width;
    return [cx + (rx + grow) * Math.cos(angle), cy - (ry + grow) * Math.sin(angle)] as const;
  };
  ctx.beginPath();
  for (let step = 0; step <= steps; step++) ctx.lineTo(...edge(step, 1));
  for (let step = steps; step >= 0; step--) ctx.lineTo(...edge(step, -1));
  ctx.closePath();
  ctx.fillStyle = BADGE_SWIRL;
  ctx.fill();
}

function paintBadge(ctx: CanvasRenderingContext2D, brand: string) {
  const { width, height } = ctx.canvas;
  const foil = ctx.createLinearGradient(0, 0, width, height);
  BADGE_FOIL.forEach((color, index) => foil.addColorStop(index / (BADGE_FOIL.length - 1), color));
  ctx.fillStyle = foil;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2 - 0.04 * BADGE_PX_PER_UNIT;
  const rx = width * 0.41;
  paintSwirl(ctx, cx, cy, rx, height * 0.32);

  const layout = layoutText(
    brand,
    {
      maxWidth: rx * 1.45,
      maxLines: 2,
      maxSize: 0.16 * BADGE_PX_PER_UNIT,
      minSize: 0.06 * BADGE_PX_PER_UNIT,
    },
    (line, px) => {
      ctx.font = badgeFont('bold', px);
      return ctx.measureText(line).width;
    }
  );
  ctx.fillStyle = BADGE_INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(cx, cy - 0.05 * BADGE_PX_PER_UNIT - ((layout.lines.length - 1) * layout.size) / 2);
  ctx.font = badgeFont('bold', layout.size);
  fillLines(ctx, layout, 1);
  ctx.restore();
  ctx.font = badgeFont('normal', 0.11 * BADGE_PX_PER_UNIT);
  ctx.fillText('inside', cx, cy + 0.11 * BADGE_PX_PER_UNIT);
}

/** A flat rounded rectangle facing +Z, with UVs spanning it 0–1. */
function createBadgeGeometry() {
  const halfWidth = BADGE_WIDTH / 2 - BADGE_CORNER;
  const halfHeight = BADGE_HEIGHT / 2 - BADGE_CORNER;
  const shape = new THREE.Shape();
  shape.absarc(halfWidth, halfHeight, BADGE_CORNER, 0, Math.PI / 2, false);
  shape.absarc(-halfWidth, halfHeight, BADGE_CORNER, Math.PI / 2, Math.PI, false);
  shape.absarc(-halfWidth, -halfHeight, BADGE_CORNER, Math.PI, Math.PI * 1.5, false);
  shape.absarc(halfWidth, -halfHeight, BADGE_CORNER, Math.PI * 1.5, Math.PI * 2, false);
  const geometry = new THREE.ShapeGeometry(shape, 6);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) / BADGE_WIDTH + 0.5, position.getY(i) / BADGE_HEIGHT + 0.5);
  }
  return geometry;
}

/**
 * A foil "inside" badge on the tower's front, below the power button. It mirrors `environment`
 * like the CDs do; without one, bare metal would render nearly black.
 */
export function createInsideBadge(environment: THREE.Texture | null): Sticker {
  const material = decalMaterial({
    color: BADGE_FOIL[1],
    metalness: environment ? 1 : 0,
    roughness: 0.3,
    envMap: environment,
  });
  const badge = new THREE.Mesh(createBadgeGeometry(), material);
  badge.name = INSIDE_BADGE_NODE;
  badge.position.set(...BADGE_CENTRE);
  return createPaintedSticker(
    badge,
    material,
    createCanvas(
      Math.round(BADGE_WIDTH * BADGE_PX_PER_UNIT),
      Math.round(BADGE_HEIGHT * BADGE_PX_PER_UNIT)
    ),
    paintBadge
  );
}
