import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { DRIVE_BAYS, EJECT_BUTTON_NODE, POWER_BUTTON_NODE, splitTowerButtons } from './towerParts';

/** A quad facing +Z at depth `z`, spanning x0..x1 and y0..y1. */
function quad(x0: number, x1: number, y0: number, y1: number, z: number) {
  return [x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z];
}

function createTower() {
  const [top, bottom] = DRIVE_BAYS.map((bay) => bay.ejectButton);
  const positions = [
    // Power button face, proud of its housing.
    ...quad(2.47, 2.93, 1.45, 2.35, 4.348),
    // Eject buttons.
    ...quad(top.min[0], top.max[0], top.min[1], top.max[1], 4.101),
    ...quad(bottom.min[0], bottom.max[0], bottom.min[1], bottom.max[1], 4.101),
    // Back panel quad inside the power button's x/y window, which must stay on the tower.
    ...quad(2.5, 2.9, 1.5, 2.3, -3.9),
    // The tower front.
    ...quad(-1, 3.66, 0, 10.9, 4.259),
  ];
  const indices = Array.from({ length: positions.length / 12 }, (_, q) => {
    const base = q * 4;
    return [base, base + 1, base + 2, base, base + 2, base + 3];
  }).flat();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
}

const indexOf = (mesh: THREE.Mesh | null) => Array.from(mesh?.geometry.index?.array ?? []);

describe('splitTowerButtons', () => {
  it('splits the power button and one eject button per drive bay', () => {
    const tower = createTower();
    const { powerButton, ejectButtons } = splitTowerButtons(tower);

    expect(powerButton?.name).toBe(POWER_BUTTON_NODE);
    expect(indexOf(powerButton)).toEqual([0, 1, 2, 0, 2, 3]);
    expect(ejectButtons.map((button) => button?.name)).toEqual([
      `${EJECT_BUTTON_NODE}0`,
      `${EJECT_BUTTON_NODE}1`,
    ]);
    expect(indexOf(ejectButtons[0])).toEqual([4, 5, 6, 4, 6, 7]);
    expect(indexOf(ejectButtons[1])).toEqual([8, 9, 10, 8, 10, 11]);
    expect(tower.children).toHaveLength(3);
  });

  it('leaves the back panel and front face on the tower', () => {
    const tower = createTower();
    splitTowerButtons(tower);
    expect(indexOf(tower)).toEqual([12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19]);
  });

  it('returns nulls for a tower without buttons', () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(quad(0, 1, 0, 1, 0), 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    const { powerButton, ejectButtons } = splitTowerButtons(new THREE.Mesh(geometry));
    expect(powerButton).toBeNull();
    expect(ejectButtons).toEqual([null, null]);
  });
});
