import * as THREE from 'three';

import { insideBox, splitTriangles } from './meshParts';

export const ENTER_KEY_NODE = 'EnterKey';

/** Enter keycap footprint in the Keyboard mesh's local (glTF, Y-up) space. */
const ENTER_FOOTPRINT = { minX: 5.76, maxX: 6.7275, minZ: -1.3275, maxZ: -0.9225 };

/** The resting blue of the animated PixPal swatch the keycap scrolls through. */
export const ENTER_KEY_BLUE = '#0769ff';

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

/** A solid keycap that shades like the swatch (PixPal blues are fully rough and non-metallic). */
export function createStillEnterKeyMaterial() {
  return new THREE.MeshStandardMaterial({ color: ENTER_KEY_BLUE, roughness: 1, metalness: 0 });
}
