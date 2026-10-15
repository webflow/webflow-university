import { PlaneGeometry, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { createCurvedScreenGeometry } from './screenGeometry';

const SCREEN_Z = 3.712;

function flatScreen() {
  const geometry = new PlaneGeometry(6.668, 5.132);
  geometry.translate(0, 5.048, SCREEN_Z);
  return geometry;
}

function vertices(geometry: ReturnType<typeof createCurvedScreenGeometry>) {
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  return Array.from({ length: position.count }, (_, i) => ({
    x: position.getX(i),
    y: position.getY(i),
    z: position.getZ(i),
    u: uv.getX(i),
    v: uv.getY(i),
  }));
}

describe('createCurvedScreenGeometry', () => {
  it('builds an indexed grid with the requested number of segments', () => {
    const curved = createCurvedScreenGeometry(flatScreen(), 0.2, 16, 12);
    expect(curved.getAttribute('position').count).toBe(17 * 13);
    expect(curved.getIndex()?.count).toBe(16 * 12 * 6);
  });

  it('keeps the edges pinned to the original quad', () => {
    const edges = vertices(createCurvedScreenGeometry(flatScreen(), 0.2, 16, 12)).filter(
      ({ u, v }) => u < 1e-6 || u > 1 - 1e-6 || v < 1e-6 || v > 1 - 1e-6
    );
    expect(edges).toHaveLength(2 * 17 + 2 * 11);
    for (const { z } of edges) expect(z).toBeCloseTo(SCREEN_Z, 6);
  });

  it('pushes the centre out along the screen normal by the bulge', () => {
    const centre = vertices(createCurvedScreenGeometry(flatScreen(), 0.2, 16, 12)).find(
      ({ u, v }) => Math.abs(u - 0.5) < 1e-6 && Math.abs(v - 0.5) < 1e-6
    );
    expect(centre?.x).toBeCloseTo(0, 6);
    expect(centre?.y).toBeCloseTo(5.048, 6);
    expect(centre?.z).toBeCloseTo(SCREEN_Z + 0.2, 6);
  });

  it('spans the full UV range of the original quad', () => {
    const all = vertices(createCurvedScreenGeometry(flatScreen(), 0.2, 16, 12));
    expect(Math.min(...all.map(({ u }) => u))).toBeCloseTo(0, 6);
    expect(Math.max(...all.map(({ u }) => u))).toBeCloseTo(1, 6);
    expect(Math.min(...all.map(({ v }) => v))).toBeCloseTo(0, 6);
    expect(Math.max(...all.map(({ v }) => v))).toBeCloseTo(1, 6);
  });

  it('faces the same way as the original quad when v runs top to bottom (glTF)', () => {
    const flat = flatScreen();
    const uv = flat.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    const curved = createCurvedScreenGeometry(flat, 0.2, 16, 12);
    const position = curved.getAttribute('position');
    const index = curved.getIndex()!;
    const [a, b, c] = [0, 1, 2].map((i) =>
      new Vector3().fromBufferAttribute(position, index.getX(i))
    );
    const faceNormal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a));
    expect(faceNormal.z).toBeGreaterThan(0);
    const centre = vertices(curved).find(
      ({ u, v }) => Math.abs(u - 0.5) < 1e-6 && Math.abs(v - 0.5) < 1e-6
    );
    expect(centre?.z).toBeCloseTo(SCREEN_Z + 0.2, 6);
  });

  it('stays flat with no bulge', () => {
    for (const { z } of vertices(createCurvedScreenGeometry(flatScreen(), 0, 16, 12))) {
      expect(z).toBeCloseTo(SCREEN_Z, 6);
    }
  });
});
