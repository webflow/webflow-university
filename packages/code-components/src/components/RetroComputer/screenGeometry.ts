import * as THREE from 'three';

/** The screen sits 0.34 behind the bezel face, so the bulge has to stay below that. */
export const MAX_SCREEN_BULGE = 0.3;

const CORNER_UVS = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
] as const;

/**
 * Rebuilds a flat screen quad as a grid whose interior bulges out along the quad's normal, with
 * the edges pinned so it still meets the bezel. UVs are interpolated from the quad's corners.
 */
export function createCurvedScreenGeometry(
  flat: THREE.BufferGeometry,
  bulge: number,
  segmentsX = 16,
  segmentsY = 12
): THREE.BufferGeometry {
  const position = flat.getAttribute('position');
  const uv = flat.getAttribute('uv');

  const corners = CORNER_UVS.map(([cu, cv]) => {
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < uv.count; i++) {
      const distance = (uv.getX(i) - cu) ** 2 + (uv.getY(i) - cv) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    return {
      position: new THREE.Vector3().fromBufferAttribute(position, best),
      uv: new THREE.Vector2(uv.getX(best), uv.getY(best)),
    };
  });
  const [p00, p10, p01, p11] = corners.map((corner) => corner.position);
  const [t00, t10, t01, t11] = corners.map((corner) => corner.uv);

  const normal = new THREE.Vector3()
    .subVectors(p10, p00)
    .cross(new THREE.Vector3().subVectors(p01, p00))
    .normalize();
  // With glTF's top-down v the uv-ordered corners wind backwards, so flip both normal and winding.
  const flatNormal = flat.getAttribute('normal');
  const flipped =
    flatNormal !== undefined &&
    normal.dot(new THREE.Vector3().fromBufferAttribute(flatNormal, 0)) < 0;
  if (flipped) normal.negate();

  const columns = segmentsX + 1;
  const rows = segmentsY + 1;
  const positions = new Float32Array(columns * rows * 3);
  const uvs = new Float32Array(columns * rows * 2);
  const point = new THREE.Vector3();
  const bottom = new THREE.Vector3();
  const top = new THREE.Vector3();
  const texBottom = new THREE.Vector2();
  const texTop = new THREE.Vector2();
  const tex = new THREE.Vector2();

  for (let row = 0; row < rows; row++) {
    const t = row / segmentsY;
    for (let column = 0; column < columns; column++) {
      const s = column / segmentsX;
      bottom.lerpVectors(p00, p10, s);
      top.lerpVectors(p01, p11, s);
      point.lerpVectors(bottom, top, t);
      const x = s * 2 - 1;
      const y = t * 2 - 1;
      point.addScaledVector(normal, bulge * (1 - x * x) * (1 - y * y));

      texBottom.lerpVectors(t00, t10, s);
      texTop.lerpVectors(t01, t11, s);
      tex.lerpVectors(texBottom, texTop, t);

      const index = row * columns + column;
      point.toArray(positions, index * 3);
      tex.toArray(uvs, index * 2);
    }
  }

  const indices: number[] = [];
  for (let row = 0; row < segmentsY; row++) {
    for (let column = 0; column < segmentsX; column++) {
      const a = row * columns + column;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      if (flipped) {
        indices.push(a, d, b, a, c, d);
      } else {
        indices.push(a, b, d, a, d, c);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
