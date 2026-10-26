import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  createInsideBadge,
  createStickyNote,
  INSIDE_BADGE_NODE,
  layoutText,
  noteLift,
  STICKY_NOTE_NODE,
} from './stickers';

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
  it('sits on the left side of the tower facing out', () => {
    const note = createStickyNote();
    expect(note.object.name).toBe(STICKY_NOTE_NODE);
    expect(note.object.position.x).toBeLessThan(-1);
    const [front] = note.object.children as THREE.Mesh[];
    expect(normalOf(front).x).toBeLessThan(-0.9);
  });

  it('only curls away from the case', () => {
    const [front] = createStickyNote().object.children as THREE.Mesh[];
    front.geometry.computeBoundingBox();
    expect(front.geometry.boundingBox?.max.x).toBeCloseTo(0);
    expect(front.geometry.boundingBox?.min.x).toBeLessThan(-0.2);
  });

  it('accepts text without a 2D canvas', () => {
    expect(() => createStickyNote().setText('Remember to publish')).not.toThrow();
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
