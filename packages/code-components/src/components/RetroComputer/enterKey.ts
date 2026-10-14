import * as THREE from 'three';

export const ENTER_KEY_NODE = 'EnterKey';

/** Enter keycap footprint in the Keyboard mesh's local (glTF, Y-up) space. */
const ENTER_FOOTPRINT = { minX: 5.76, maxX: 6.7275, minZ: -1.3275, maxZ: -0.9225 };
const EPSILON = 1e-3;

/**
 * Moves the Enter keycap triangles out of the keyboard geometry into their own child mesh,
 * so it can be raycast and animated on its own. Returns null if no keycap triangles are found.
 */
export function splitEnterKey(keyboard: THREE.Mesh): THREE.Mesh | null {
  const geometry = keyboard.geometry;
  const index = geometry.index;
  if (!index) return null;

  const position = geometry.getAttribute('position');
  const inFootprint = (vertex: number) => {
    const x = position.getX(vertex);
    const z = position.getZ(vertex);
    return (
      x > ENTER_FOOTPRINT.minX - EPSILON &&
      x < ENTER_FOOTPRINT.maxX + EPSILON &&
      z > ENTER_FOOTPRINT.minZ - EPSILON &&
      z < ENTER_FOOTPRINT.maxZ + EPSILON
    );
  };

  const keyboardIndices: number[] = [];
  const keyIndices: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    (triangle.every(inFootprint) ? keyIndices : keyboardIndices).push(...triangle);
  }
  if (keyIndices.length === 0) return null;

  const keyGeometry = geometry.clone();
  keyGeometry.setIndex(keyIndices);
  keyGeometry.computeBoundingBox();
  keyGeometry.computeBoundingSphere();

  geometry.setIndex(keyboardIndices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const enterKey = new THREE.Mesh(keyGeometry, keyboard.material);
  enterKey.name = ENTER_KEY_NODE;
  keyboard.add(enterKey);
  return enterKey;
}
