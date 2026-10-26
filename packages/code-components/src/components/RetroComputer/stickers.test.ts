import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createInsideBadge,
  createStickyNote,
  DEFAULT_NOTE_CONTENT,
  DEFAULT_NOTE_POSITION,
  INSIDE_BADGE_NODE,
  layoutText,
  NOTE_CONTENTS,
  NOTE_POSITIONS,
  noteLift,
  placeNote,
  STICKY_NOTE_NODE,
} from './stickers';
import { STICKY_NOTE_DRAWING } from './stickyNoteDrawing';

/** Every character is half as wide as the font size. */
const measure = (line: string, size: number) => line.length * size * 0.5;

describe('noteLift', () => {
  it('keeps the top of the note stuck to the case', () => {
    expect(noteLift(0)).toBe(0);
    expect(noteLift(0.3)).toBe(0);
  });

  it('peels away more towards the bottom edge', () => {
    expect(noteLift(0.6)).toBeGreaterThan(0);
    expect(noteLift(1)).toBeGreaterThan(noteLift(0.6));
  });
});

describe('layoutText', () => {
  const box = { maxWidth: 100, maxLines: 3, maxSize: 40, minSize: 10 };

  it('uses the largest size that fits', () => {
    expect(layoutText('Hi', box, measure)).toEqual({ size: 40, lines: ['Hi'] });
  });

  it('prefers wrapping to shrinking while there are lines to spare', () => {
    expect(layoutText('S for snake', box, measure)).toEqual({
      size: 40,
      lines: ['S for', 'snake'],
    });
    expect(layoutText('S for snake', { ...box, maxLines: 1 }, measure)).toEqual({
      size: 18,
      lines: ['S for snake'],
    });
  });

  it('wraps onto more lines before shrinking further', () => {
    const { size, lines } = layoutText('one two three four five six', box, measure);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.join(' ')).toBe('one two three four five six');
    for (const line of lines) expect(measure(line, size)).toBeLessThanOrEqual(100);
  });

  it('ignores extra whitespace', () => {
    expect(layoutText('  a   b  ', box, measure).lines).toEqual(['a b']);
  });

  it('keeps the first lines at the smallest size when the text is too long', () => {
    const long = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ');
    const { size, lines } = layoutText(long, box, measure);
    expect(size).toBe(10);
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith('word0')).toBe(true);
  });

  it('lays out nothing for empty text', () => {
    expect(layoutText('   ', box, measure).lines).toEqual([]);
  });
});

const normalOf = (mesh: THREE.Mesh) =>
  new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.normal, 0);

describe('createStickyNote', () => {
  it('only curls away from the surface it faces', () => {
    const note = createStickyNote();
    expect(note.object.name).toBe(STICKY_NOTE_NODE);
    const [front] = note.object.children as THREE.Mesh[];
    expect(normalOf(front).z).toBeCloseTo(1);
    front.geometry.computeBoundingBox();
    expect(front.geometry.boundingBox?.min.z).toBeCloseTo(0);
    expect(front.geometry.boundingBox?.max.z).toBeGreaterThan(0.2);
  });

  it('accepts content without a 2D canvas', () => {
    expect(() => createStickyNote().setContent('Text', 'Remember to publish')).not.toThrow();
  });
});

describe('sticky note content', () => {
  const inkCells = STICKY_NOTE_DRAWING.join('')
    .split('')
    .filter((c) => c === '#').length;

  /** Records what the note paints, since happy-dom has no 2D canvas. */
  const withFakeCanvas = () => {
    const calls = { fillRect: 0, fillText: [] as string[] };
    const ctx = {
      canvas: { width: 256, height: 256 },
      fillRect: () => calls.fillRect++,
      fillText: (text: string) => calls.fillText.push(text),
      measureText: (text: string) => ({ width: text.length * 10 }),
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (() => ctx) as unknown as HTMLCanvasElement['getContext']
    );
    return calls;
  };

  afterEach(() => vi.restoreAllMocks());

  it('defaults to the drawing', () => {
    expect(NOTE_CONTENTS).toEqual(['Drawing', 'Text']);
    expect(DEFAULT_NOTE_CONTENT).toBe('Drawing');
  });

  it('has a square drawing of ink and blank pixels', () => {
    expect(STICKY_NOTE_DRAWING).toHaveLength(48);
    for (const row of STICKY_NOTE_DRAWING) expect(row).toMatch(/^[#.]{48}$/);
  });

  it('paints the paper and then one square per ink pixel, ignoring the text', () => {
    const calls = withFakeCanvas();
    createStickyNote().setContent('Drawing', 'S for snake');
    expect(calls.fillRect).toBe(1 + inkCells);
    expect(calls.fillText).toEqual([]);
  });

  it('handwrites the text for Text', () => {
    const calls = withFakeCanvas();
    createStickyNote().setContent('Text', 'S for snake');
    expect(calls.fillText.join(' ')).toBe('S for snake');
  });

  it('falls back to the drawing for an unknown value', () => {
    const calls = withFakeCanvas();
    createStickyNote().setContent('Photo', 'S for snake');
    expect(calls.fillRect).toBe(1 + inkCells);
  });

  it('only repaints when the content changes', () => {
    const calls = withFakeCanvas();
    const note = createStickyNote();
    note.setContent('Drawing', 'a');
    note.setContent('Drawing', 'b');
    expect(calls.fillRect).toBe(1 + inkCells);
    note.setContent('Text', 'b');
    note.setContent('Text', 'b');
    expect(calls.fillText).toEqual(['b']);
  });
});

describe('placeNote', () => {
  const setup = () => {
    const parents = { monitor: new THREE.Object3D(), tower: new THREE.Object3D() };
    const note = createStickyNote().object;
    return { parents, note };
  };
  const facing = (note: THREE.Object3D) =>
    new THREE.Vector3(0, 0, 1).applyQuaternion(note.quaternion);

  it('has an option for every placement and defaults to the monitor', () => {
    expect(NOTE_POSITIONS).toEqual(['Monitor', 'Tower Side']);
    expect(DEFAULT_NOTE_POSITION).toBe('Monitor');
  });

  it('sticks to the front of the monitor, smaller than on the tower', () => {
    const { parents, note } = setup();
    placeNote(note, 'Monitor', parents);
    expect(note.parent).toBe(parents.monitor);
    expect(facing(note).z).toBeCloseTo(1);
    expect(note.scale.x).toBeLessThan(1);
  });

  it('moves to the left side of the tower', () => {
    const { parents, note } = setup();
    placeNote(note, 'Monitor', parents);
    placeNote(note, 'Tower Side', parents);
    expect(note.parent).toBe(parents.tower);
    expect(parents.monitor.children).not.toContain(note);
    expect(facing(note).x).toBeCloseTo(-1);
    expect(note.position.x).toBeLessThan(-1);
  });

  it('falls back to the default for an unknown position', () => {
    const { parents, note } = setup();
    placeNote(note, 'Keyboard', parents);
    expect(note.parent).toBe(parents.monitor);
  });

  it('comes off when that part of the model is missing', () => {
    const { parents, note } = setup();
    placeNote(note, 'Tower Side', parents);
    placeNote(note, 'Monitor', { ...parents, monitor: null });
    expect(note.parent).toBeNull();
  });
});

describe('createInsideBadge', () => {
  it('sits on the front of the tower facing out, below the power button', () => {
    const badge = createInsideBadge(null);
    const mesh = badge.object as THREE.Mesh;
    expect(mesh.name).toBe(INSIDE_BADGE_NODE);
    expect(normalOf(mesh).z).toBeCloseTo(1);
    mesh.geometry.computeBoundingBox();
    const top = (mesh.geometry.boundingBox?.max.y ?? 0) + mesh.position.y;
    expect(top).toBeLessThan(1.45);
  });

  it('maps the texture across the whole badge', () => {
    const uv = (createInsideBadge(null).object as THREE.Mesh).geometry.attributes.uv;
    const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i));
    const vs = Array.from({ length: uv.count }, (_, i) => uv.getY(i));
    expect(Math.min(...us)).toBeCloseTo(0);
    expect(Math.max(...us)).toBeCloseTo(1);
    expect(Math.min(...vs)).toBeCloseTo(0);
    expect(Math.max(...vs)).toBeCloseTo(1);
  });

  it('is metal only when it has something to reflect', () => {
    const environment = new THREE.Texture();
    const shiny = (createInsideBadge(environment).object as THREE.Mesh)
      .material as THREE.MeshStandardMaterial;
    const plain = (createInsideBadge(null).object as THREE.Mesh)
      .material as THREE.MeshStandardMaterial;
    expect(shiny).toMatchObject({ metalness: 1, envMap: environment });
    expect(plain.metalness).toBe(0);
  });
});
