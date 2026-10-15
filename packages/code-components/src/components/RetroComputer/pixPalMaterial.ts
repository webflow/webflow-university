import * as THREE from 'three';

import attributesBase64 from './pixPalAttributes';

/** The Blender scene runs at 24 fps and PixPal's animated swatches scroll 1/36 of the texture per frame. */
export const PIXPAL_FPS = 24;
const FRAMES_PER_CYCLE = 36;

function setNearest(texture: THREE.Texture) {
  // Palette swatches are 1-2px wide, so mipmaps or linear filtering would blend neighbours.
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
}

/**
 * Blender's glTF exporter drops the attributes map's blue channel (the animation mask) and can't
 * follow the material's `1 - smoothness` node, so the original map ships alongside the model.
 */
export async function loadPixPalAttributes(): Promise<THREE.Texture> {
  const texture = await new THREE.TextureLoader().loadAsync(
    `data:image/png;base64,${attributesBase64}`
  );
  // Blender reads this map as sRGB, so the GPU decodes it the same way.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  setNearest(texture);
  return texture;
}

/** True if any UV lands on a texel whose animation mask (blue channel) is set. */
export function usesAnimatedSwatch(
  uvs: ArrayLike<number>,
  pixels: ArrayLike<number>,
  width: number,
  height: number
) {
  for (let i = 0; i < uvs.length; i += 2) {
    const x = Math.min(width - 1, Math.max(0, Math.floor(uvs[i] * width)));
    const y = Math.min(height - 1, Math.max(0, Math.floor(uvs[i + 1] * height)));
    if (pixels[(y * width + x) * 4 + 2] > 0) return true;
  }
  return false;
}

function readPixels(texture: THREE.Texture): ImageData | null {
  const image = texture.image as (CanvasImageSource & { width: number; height: number }) | null;
  if (!image) return null;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export function sceneUsesAnimatedSwatches(scene: THREE.Object3D, attributes: THREE.Texture) {
  const pixels = readPixels(attributes);
  if (!pixels) return false;

  let animated = false;
  scene.traverse((object) => {
    if (animated || !(object instanceof THREE.Mesh)) return;
    const uv = object.geometry.getAttribute('uv');
    if (uv) animated = usesAnimatedSwatch(uv.array, pixels.data, pixels.width, pixels.height);
  });
  return animated;
}

/** True if the texel at (u, v) lights up, i.e. any channel is above a near-black threshold. */
export function isLitTexel(
  u: number,
  v: number,
  pixels: ArrayLike<number>,
  width: number,
  height: number
) {
  const x = Math.min(width - 1, Math.max(0, Math.floor(u * width)));
  const y = Math.min(height - 1, Math.max(0, Math.floor(v * height)));
  const i = (y * width + x) * 4;
  return Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) > 16;
}

/** A per-vertex test for "this vertex uses a glowing swatch", or null without an emissive map. */
export function createEmissiveTest(mesh: THREE.Mesh) {
  const material = mesh.material;
  const uv = mesh.geometry.getAttribute('uv');
  if (!(material instanceof THREE.MeshStandardMaterial) || !material.emissiveMap || !uv) {
    return null;
  }
  const pixels = readPixels(material.emissiveMap);
  if (!pixels) return null;
  return (vertex: number) =>
    isLitTexel(uv.getX(vertex), uv.getY(vertex), pixels.data, pixels.width, pixels.height);
}

const FRAGMENT_UNIFORMS = /* glsl */ `
uniform sampler2D pixPalAttributes;
uniform float pixPalFrame;
`;

// Mirrors the Blender material: roughness = 1 - G, metallic = R, and colour/emission UVs scroll
// by B * frame / 36 for animated swatches.
const MAP_FRAGMENT = /* glsl */ `
vec4 pixPalAttr = texture2D( pixPalAttributes, vMapUv );
vec2 pixPalUv = vMapUv + vec2( 0.0, pixPalAttr.b * pixPalFrame / ${FRAMES_PER_CYCLE.toFixed(1)} );
diffuseColor *= texture2D( map, pixPalUv );
`;

const EMISSIVE_FRAGMENT = /* glsl */ `
#ifdef USE_EMISSIVEMAP
  totalEmissiveRadiance *= texture2D( emissiveMap, pixPalUv ).rgb;
#endif
`;

const ROUGHNESS_FRAGMENT = 'float roughnessFactor = roughness * ( 1.0 - pixPalAttr.g );';
const METALNESS_FRAGMENT = 'float metalnessFactor = metalness * pixPalAttr.r;';

/** Prepares a material exported from Blender's ImphenziaPixPal material for three.js. */
export function preparePixPalMaterial(
  material: THREE.Material,
  attributes: THREE.Texture,
  frame: { value: number }
) {
  if (!(material instanceof THREE.MeshStandardMaterial) || !material.map) return;

  setNearest(material.map);
  if (material.emissiveMap) setNearest(material.emissiveMap);

  const exported = material.roughnessMap ?? material.metalnessMap;
  exported?.dispose();
  material.roughnessMap = null;
  material.metalnessMap = null;
  material.roughness = 1;
  material.metalness = 1;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.pixPalAttributes = { value: attributes };
    shader.uniforms.pixPalFrame = frame;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_UNIFORMS}`)
      .replace('#include <map_fragment>', MAP_FRAGMENT)
      .replace('#include <emissivemap_fragment>', EMISSIVE_FRAGMENT)
      .replace('#include <roughnessmap_fragment>', ROUGHNESS_FRAGMENT)
      .replace('#include <metalnessmap_fragment>', METALNESS_FRAGMENT);
  };
  material.customProgramCacheKey = () => 'pixpal';
  material.needsUpdate = true;
}
