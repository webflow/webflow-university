import type * as THREE from 'three';

import type { Vector3Tuple } from './camera';
import { type Box3Tuple, insideBox, splitTriangles } from './meshParts';

export const POWER_BUTTON_NODE = 'PowerButton';
export const EJECT_BUTTON_NODE = 'EjectButton';

// Footprints in the Tower mesh's local glTF space (Y up, the front faces +Z).
const POWER_BUTTON: Box3Tuple = { min: [2.47, 1.45, 4.18], max: [2.93, 2.35, 4.36] };

export interface DriveBay {
  ejectButton: Box3Tuple;
  /** Centre of the disc slot opening on the bay's front face. */
  slot: Vector3Tuple;
}

export const DRIVE_BAYS: DriveBay[] = [
  {
    ejectButton: { min: [2.582, 9.931, 4.03], max: [2.95, 10.044, 4.11] },
    slot: [1.0365, 9.9875, 4.041],
  },
  {
    ejectButton: { min: [2.582, 8.864, 4.03], max: [2.95, 8.98, 4.11] },
    slot: [1.0365, 8.922, 4.041],
  },
];

export const POWER_PRESS_DEPTH = 0.1;
export const EJECT_PRESS_DEPTH = 0.04;

export interface TowerButtons {
  powerButton: THREE.Mesh | null;
  /** One per entry in `DRIVE_BAYS`, null if the model has no matching button. */
  ejectButtons: (THREE.Mesh | null)[];
}

export function splitTowerButtons(tower: THREE.Mesh): TowerButtons {
  return {
    powerButton: splitTriangles(tower, POWER_BUTTON_NODE, insideBox(tower, POWER_BUTTON)),
    ejectButtons: DRIVE_BAYS.map((bay, index) =>
      splitTriangles(tower, `${EJECT_BUTTON_NODE}${index}`, insideBox(tower, bay.ejectButton))
    ),
  };
}
