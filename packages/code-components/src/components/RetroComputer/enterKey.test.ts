import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { ENTER_KEY_NODE, splitEnterKey } from './enterKey';

function quad(x0: number, x1: number, z0: number, z1: number, y: number) {
  return [x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1];
}

function createKeyboard() {
  const positions = [
    ...quad(5.76, 6.7275, -1.3275, -0.9225, 0.49),
    ...quad(4.5, 5.5, -1.3275, -0.9225, 0.49),
    ...quad(5.0, 7.0, -2.0, 0.0, 0.3),
  ];
  const indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
}

describe('splitEnterKey', () => {
  it('moves only the triangles inside the Enter footprint into a child mesh', () => {
    const keyboard = createKeyboard();
    const enterKey = splitEnterKey(keyboard);

    expect(enterKey?.name).toBe(ENTER_KEY_NODE);
    expect(enterKey?.parent).toBe(keyboard);
    expect(Array.from(enterKey?.geometry.index?.array ?? [])).toEqual([0, 1, 2, 0, 2, 3]);
    expect(Array.from(keyboard.geometry.index?.array ?? [])).toEqual([
      4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11,
    ]);
  });

  it('shares the keyboard material', () => {
    const keyboard = createKeyboard();
    expect(splitEnterKey(keyboard)?.material).toBe(keyboard.material);
  });

  it('leaves the keyboard untouched when no triangles match', () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(quad(0, 1, 0, 1, 0), 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    const keyboard = new THREE.Mesh(geometry);

    expect(splitEnterKey(keyboard)).toBeNull();
    expect(keyboard.children).toHaveLength(0);
    expect(geometry.index?.count).toBe(6);
  });
});
