import * as THREE from 'three';

const EPSILON = 1e-3;

export interface Box3Tuple {
  min: [number, number, number];
  max: [number, number, number];
}

/** A vertex test for positions inside `box`, in the mesh's local space. */
export function insideBox(mesh: THREE.Mesh, box: Box3Tuple) {
  const position = mesh.geometry.getAttribute('position');
  return (vertex: number) =>
    [position.getX(vertex), position.getY(vertex), position.getZ(vertex)].every(
      (value, axis) => value > box.min[axis] - EPSILON && value < box.max[axis] + EPSILON
    );
}

/**
 * Moves every triangle whose three vertices pass `keep` out of `mesh` into a child mesh, so it can
 * be raycast, animated or shaded on its own. Returns null and leaves `mesh` alone if none match.
 */
export function splitTriangles(
  mesh: THREE.Mesh,
  name: string,
  keep: (vertex: number) => boolean,
  material: THREE.Material | THREE.Material[] = mesh.material
): THREE.Mesh | null {
  const geometry = mesh.geometry;
  const index = geometry.index;
  if (!index) return null;

  const remaining: number[] = [];
  const kept: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    (triangle.every(keep) ? kept : remaining).push(...triangle);
  }
  if (kept.length === 0) return null;

  const partGeometry = geometry.clone();
  partGeometry.setIndex(kept);
  partGeometry.computeBoundingBox();
  partGeometry.computeBoundingSphere();

  geometry.setIndex(remaining);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const part = new THREE.Mesh(partGeometry, material);
  part.name = name;
  mesh.add(part);
  return part;
}
