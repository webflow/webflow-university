import * as THREE from 'three';

import type { CrtSettings } from './settings';

const SCANLINE_COUNT = 160;
const MAX_BARREL = 0.1;
const MAX_ABERRATION = 0.006;

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D map;
uniform float glow;
uniform float scanlines;
uniform float scanlineCount;
uniform float vignette;
uniform float barrel;
uniform float aberration;
varying vec2 vUv;

void main() {
  vec2 centred = vUv * 2.0 - 1.0;
  centred *= 1.0 + barrel * dot(centred, centred);
  vec2 uv = centred * 0.5 + 0.5;

  vec2 edge = smoothstep(vec2(0.0), vec2(0.008), uv) * smoothstep(vec2(0.0), vec2(0.008), 1.0 - uv);
  float inside = edge.x * edge.y;

  vec3 color = texture2D(map, uv).rgb;
  if (aberration > 0.0) {
    vec2 offset = centred * aberration;
    color.r = texture2D(map, uv + offset).r;
    color.b = texture2D(map, uv - offset).b;
  }

  // The canvas texture is mipmapped, so coarse levels are a free blur for the phosphor glow.
  vec3 halo = textureLod(map, uv, 3.5).rgb * 0.6 + textureLod(map, uv, 5.0).rgb * 0.4;
  color = color * (1.0 + glow * 0.6) + halo * glow * 2.0;

  // Fade the scanlines out once they get close to a pixel apart, before they alias.
  float lines = uv.y * scanlineCount;
  float lineFade = 1.0 - smoothstep(0.25, 0.5, fwidth(lines));
  float scanline = 0.5 + 0.5 * cos(lines * 6.2831853);
  color *= mix(1.0, scanline, scanlines * 0.7 * lineFade);

  float falloff = 1.0 - smoothstep(0.45, 1.65, length(centred * vec2(0.9, 1.0)));
  color *= mix(1.0, falloff, vignette);

  gl_FragColor = vec4(color * inside, 1.0);
  #include <colorspace_fragment>
}
`;

export function createCrtScreenMaterial(map: THREE.Texture) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    toneMapped: false,
    uniforms: {
      map: { value: map },
      glow: { value: 0 },
      scanlines: { value: 0 },
      scanlineCount: { value: SCANLINE_COUNT },
      vignette: { value: 0 },
      barrel: { value: 0 },
      aberration: { value: 0 },
    },
  });
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function applyCrtSettings(material: THREE.ShaderMaterial, settings: CrtSettings) {
  const { uniforms } = material;
  uniforms.glow.value = Math.max(settings.screenGlow, 0);
  uniforms.scanlines.value = clamp01(settings.scanlines);
  uniforms.vignette.value = clamp01(settings.vignette);
  uniforms.barrel.value = clamp01(settings.curvature) * MAX_BARREL;
  uniforms.aberration.value = clamp01(settings.chromaticAberration) * MAX_ABERRATION;
}
