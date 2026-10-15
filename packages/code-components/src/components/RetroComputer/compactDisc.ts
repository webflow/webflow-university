import * as THREE from 'three';

export const DISC_RADIUS = 1.15;
const DISC_HOLE_RADIUS = 0.19;
/** How far past the slot the disc's centre ends up once ejected. */
const DISC_STICK_OUT = DISC_RADIUS * 0.55;
/** Slight forward droop, which also tips the shiny underside towards the camera. */
const DISC_DROOP = -0.06;
export const DISC_EJECT_MS = 420;
export const DISC_LOAD_MS = 320;

export interface DiscMotion {
  /** 0 is fully inside the drive, 1 is ejected. */
  from: number;
  to: number;
  startedAt: number;
}

const easeOutBack = (t: number) => {
  const overshoot = 1.9;
  return 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2;
};
const easeInCubic = (t: number) => t ** 3;

/** How far out the disc is (0 inside, 1 ejected, briefly above 1 while it overshoots). */
export function discExtension(motion: DiscMotion, now: number, reducedMotion = false) {
  const ejecting = motion.to > motion.from;
  const duration = ejecting ? DISC_EJECT_MS : DISC_LOAD_MS;
  const t = reducedMotion ? 1 : Math.min(Math.max((now - motion.startedAt) / duration, 0), 1);
  const eased = ejecting ? easeOutBack(t) : easeInCubic(t);
  return { extension: motion.from + (motion.to - motion.from) * eased, done: t >= 1 };
}

/** Where the disc's centre sits along the drive's Z axis for a given extension. */
export function discZ(slotZ: number, extension: number) {
  const inside = slotZ - DISC_RADIUS - 0.05;
  return inside + (slotZ + DISC_STICK_OUT - inside) * extension;
}

export function discDroop(extension: number) {
  return DISC_DROOP * Math.min(Math.max(extension, 0), 1);
}

/** Half a turn of spin while ejecting, so the rainbow streaks sweep across the disc. */
const DISC_SPIN = Math.PI * 0.5;

export function discSpin(extension: number) {
  return DISC_SPIN * extension;
}

/** A silver disc lying flat in XZ. One mesh, one draw call, only drawn when out. */
export function createCompactDisc(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(DISC_HOLE_RADIUS, DISC_RADIUS, 64, 1);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 1,
    roughness: 0.18,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(geometry, material);
  disc.name = 'CompactDisc';
  disc.visible = false;
  return disc;
}

const SILVER = '#c3c7ce';
const RAINBOW = ['#ff5cc4', '#5cc6ff', '#86ff66', '#ffd84a', '#ff8a52'];

/**
 * The disc's face: silver with two opposite rainbow streaks (the diffraction from its grooves)
 * and a clear hub. RingGeometry's planar UVs centre it on the hole.
 */
export function createDiscTexture(): THREE.Texture | null {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const centre = size / 2;
  ctx.fillStyle = SILVER;
  ctx.fillRect(0, 0, size, size);
  if ('createConicGradient' in ctx) {
    const sweep = ctx.createConicGradient(-0.4, centre, centre);
    for (const offset of [0, 0.5]) {
      sweep.addColorStop(offset, SILVER);
      RAINBOW.forEach((color, i) => sweep.addColorStop(offset + 0.04 + i * 0.04, color));
      sweep.addColorStop(offset + 0.26, SILVER);
    }
    sweep.addColorStop(1, SILVER);
    ctx.fillStyle = sweep;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.fillStyle = '#9ea3ab';
  ctx.beginPath();
  ctx.arc(centre, centre, centre * 0.32, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * A tiny painted studio (soft grey room with bright softboxes above and below) for the disc to
 * reflect. The scene has no environment map, and a bare metal disc would only catch the odd
 * highlight; the camera mostly sees the underside, so the lower half matters as much as the top.
 * It is prefiltered once, the first time a disc is drawn.
 *
 * Painted on a 256×128 grid but rendered at 512×256: three.js's PMREM blur levels come out
 * black for narrower equirect maps, which left the (slightly rough) disc black from most angles.
 */
export function createDiscEnvironment(): THREE.Texture | null {
  const width = 256;
  const height = 128;
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  const room = ctx.createLinearGradient(0, 0, 0, height);
  room.addColorStop(0, '#b9bcc4');
  room.addColorStop(0.5, '#e9ddd0');
  room.addColorStop(1, '#8d8a86');
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  for (const [x, y, width, height] of [
    [20, 14, 60, 26],
    [150, 22, 80, 18],
    [60, 82, 90, 22],
    [190, 90, 50, 26],
  ]) {
    ctx.fillRect(x, y, width, height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
