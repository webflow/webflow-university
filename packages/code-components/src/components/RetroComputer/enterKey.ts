import type * as THREE from 'three';

import { insideBox, splitTriangles } from './meshParts';

export const ENTER_KEY_NODE = 'EnterKey';

/** Enter keycap footprint in the Keyboard mesh's local (glTF, Y-up) space. */
const ENTER_FOOTPRINT = { minX: 5.76, maxX: 6.7275, minZ: -1.3275, maxZ: -0.9225 };

/**
 * Moves the Enter keycap triangles out of the keyboard geometry into their own child mesh,
 * so it can be raycast and animated on its own. Returns null if no keycap triangles are found.
 */
export function splitEnterKey(keyboard: THREE.Mesh): THREE.Mesh | null {
  const footprint = insideBox(keyboard, {
    min: [ENTER_FOOTPRINT.minX, -Infinity, ENTER_FOOTPRINT.minZ],
    max: [ENTER_FOOTPRINT.maxX, Infinity, ENTER_FOOTPRINT.maxZ],
  });
  return splitTriangles(keyboard, ENTER_KEY_NODE, footprint);
}
