import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

const NEON_BLUE = '#146EF5';

// Hook to check for reduced motion preference
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

// Accent colors for spotlight gradient (from design system)
const ACCENT_COLORS = {
  red: new THREE.Color('#ff6d7e'), // red-300
  orange: new THREE.Color('#ff8933'), // orange-400
  yellow: new THREE.Color('#ffbe42'), // yellow-400
  green: new THREE.Color('#95f3a3'), // green-200
  purple: new THREE.Color('#cab1ff'), // purple-200
  pink: new THREE.Color('#ff8ce6'), // pink-300
};

// Create neon line material with shader-based glow effect, vignette, fog, and cursor spotlight
function createNeonLineMaterial(
  intensity: number,
  focusHeight: number,
  fogNear: number,
  fogFar: number,
  fogDensity: number,
  mousePos: THREE.Vector3,
  spotlightRadius: number,
  spotlightIntensity: number,
  iridescenceStrength: number
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(NEON_BLUE) },
      uIntensity: { value: intensity },
      uFocusHeight: { value: focusHeight }, // Height where focus is strongest (in world space)
      uFogNear: { value: fogNear },
      uFogFar: { value: fogFar },
      uFogDensity: { value: fogDensity },
      uMousePos: { value: mousePos },
      uSpotlightRadius: { value: spotlightRadius },
      uSpotlightIntensity: { value: spotlightIntensity },
      uIridescenceStrength: { value: iridescenceStrength },
      // Accent colors for gradient
      uAccentRed: { value: ACCENT_COLORS.red },
      uAccentOrange: { value: ACCENT_COLORS.orange },
      uAccentYellow: { value: ACCENT_COLORS.yellow },
      uAccentGreen: { value: ACCENT_COLORS.green },
      uAccentPurple: { value: ACCENT_COLORS.purple },
      uAccentPink: { value: ACCENT_COLORS.pink },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec2 vScreenPos;
      varying float vDistanceFromCamera;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vScreenPos = (clipPosition.xy / clipPosition.w) * 0.5 + 0.5;
        
        // Calculate distance from camera for fog effect
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vDistanceFromCamera = length(viewPosition.xyz);
        
        gl_Position = clipPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uFocusHeight;
      uniform float uFogNear;
      uniform float uFogFar;
      uniform float uFogDensity;
      uniform vec3 uMousePos;
      uniform float uSpotlightRadius;
      uniform float uSpotlightIntensity;
      uniform float uIridescenceStrength;
      // Accent colors for gradient
      uniform vec3 uAccentRed;
      uniform vec3 uAccentOrange;
      uniform vec3 uAccentYellow;
      uniform vec3 uAccentGreen;
      uniform vec3 uAccentPurple;
      uniform vec3 uAccentPink;
      
      varying vec3 vWorldPosition;
      varying vec2 vScreenPos;
      varying float vDistanceFromCamera;
      
      // Function to create smooth gradient through accent colors
      vec3 getAccentGradient(float t) {
        // t ranges from 0 to 1
        // Map to 6 color stops: red -> orange -> yellow -> green -> purple -> pink
        t = fract(t); // Ensure 0-1 range
        
        if (t < 0.166) {
          // Red to Orange
          float local = t / 0.166;
          return mix(uAccentRed, uAccentOrange, local);
        } else if (t < 0.333) {
          // Orange to Yellow
          float local = (t - 0.166) / 0.167;
          return mix(uAccentOrange, uAccentYellow, local);
        } else if (t < 0.5) {
          // Yellow to Green
          float local = (t - 0.333) / 0.167;
          return mix(uAccentYellow, uAccentGreen, local);
        } else if (t < 0.666) {
          // Green to Purple
          float local = (t - 0.5) / 0.166;
          return mix(uAccentGreen, uAccentPurple, local);
        } else if (t < 0.833) {
          // Purple to Pink
          float local = (t - 0.666) / 0.167;
          return mix(uAccentPurple, uAccentPink, local);
        } else {
          // Pink to Red (wrap around)
          float local = (t - 0.833) / 0.167;
          return mix(uAccentPink, uAccentRed, local);
        }
      }
      
      void main() {
        float yPos = vWorldPosition.y;
        
        // Cursor spotlight effect
        float distanceFromMouse = length(vWorldPosition - uMousePos);
        float spotlightFalloff = smoothstep(uSpotlightRadius, 0.0, distanceFromMouse);
        float spotlightBoost = spotlightFalloff * uSpotlightIntensity;
        
        // Iridescence effect - accent color gradient based on angle to cursor
        vec3 toMouse = normalize(uMousePos - vWorldPosition);
        float iridescenceAngle = dot(toMouse, vec3(0.0, 1.0, 0.0));
        
        // Map angle to gradient position (0 to 1)
        float gradientPosition = (iridescenceAngle + 1.0) * 0.5;
        vec3 iridescenceColor = getAccentGradient(gradientPosition);
        
        float iridescence = spotlightFalloff * uIridescenceStrength;
        
        // Fog effect based on distance from camera
        float fogAmount = smoothstep(uFogNear, uFogFar, vDistanceFromCamera);
        fogAmount = pow(fogAmount, uFogDensity); // Control fog density/falloff
        float fogFade = 1.0 - fogAmount; // 1.0 = no fog, 0.0 = full fog
        
        // Vignette effect - darker at bottom of screen
        // vScreenPos.y: 0 = bottom, 1 = top
        float vignette = smoothstep(0.0, 0.7, vScreenPos.y);
        
        // Vertical fade - fade out bottom parts based on world Y position
        float verticalFade = smoothstep(-2.0, 4.0, yPos);
        
        // Focus effect - brighter near focus height
        float focusDistance = abs(yPos - uFocusHeight);
        float focusBrightness = 1.0 - smoothstep(0.0, 5.0, focusDistance);
        
        // Combine effects - fog can reduce visibility to zero
        // Only ensure minimum visibility for vignette/vertical effects, not fog
        float baseVisibility = max(0.15, vignette * verticalFade);
        float visibility = baseVisibility * fogFade; // Fog can override minimum visibility
        float brightness = mix(0.4, 1.0, focusBrightness) + spotlightBoost;
        
        // Create extremely bright color for photorealistic bloom
        // Multiply by high values to create strong bloom response
        vec3 col = uColor * uIntensity * brightness * 3.0;
        
        // Keep colors in HDR range (don't tone map in shader, let bloom handle it)
        // Add color variation for dreamlike quality (only to base blue, not accent colors)
        col.r *= 1.1; // Slightly boost red
        col.b *= 1.05; // Slightly boost blue
        
        // Apply iridescence color shift near cursor AFTER base color adjustments
        // Replace blue with vibrant accent gradient colors
        vec3 accentGlow = iridescenceColor * uIntensity * (brightness + spotlightBoost) * 6.0;
        // Use stronger mix factor for more visible color change
        float colorMixStrength = spotlightFalloff * uIridescenceStrength * 2.5;
        col = mix(col, accentGlow, min(colorMixStrength, 1.0));
        
        // Ensure colors stay vibrant and bloom-friendly
        col = max(col, vec3(0.0));
        
        gl_FragColor = vec4(col, visibility);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

interface ProSphereInnerProps {
  scale?: number;
  horizontalStretch?: number;
  meridianCount?: number;
  verticalOffset?: number;
  rotationSpeed?: number;
  glowIntensity?: number;
  coreIntensity?: number;
  focusHeight?: number;
  fogNear?: number;
  fogFar?: number;
  fogDensity?: number;
  spotlightRadius?: number;
  spotlightIntensity?: number;
  iridescenceStrength?: number;
  spotlightDepth?: number;
}

function ProSphereInner({
  scale = 3,
  horizontalStretch = 1.2,
  meridianCount = 16,
  verticalOffset = -2,
  rotationSpeed = 0.2,
  glowIntensity = 4.0,
  coreIntensity = 8.0,
  focusHeight = 4.0,
  fogNear = 5.0,
  fogFar = 19.5,
  fogDensity = 3.0,
  spotlightRadius = 2.0,
  spotlightIntensity = 3.0,
  iridescenceStrength = 0.5,
  spotlightDepth = 0.0,
}: ProSphereInnerProps = {}) {
  const groupRef = useRef<THREE.Group>(null);
  const radius = 2;
  const prefersReducedMotion = useReducedMotion();

  // Track mouse position in 3D space
  const mousePos = useRef(new THREE.Vector3(0, 0, 0));
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const interactionPlane = useMemo(() => new THREE.Plane(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const intersectionPoint = useMemo(() => new THREE.Vector3(), []);
  const sphereCenter = useMemo(() => new THREE.Vector3(), []);
  const shaderMaterialsRef = useRef<THREE.ShaderMaterial[]>([]);

  // Create meridian lines with neon glow effect
  const meridianLines = useMemo(() => {
    const lines: THREE.Line[] = [];
    const segments = 64; // Number of segments per meridian line

    // Create materials with different intensities for layered glow effect
    const glowMaterial = createNeonLineMaterial(
      glowIntensity,
      focusHeight,
      fogNear,
      fogFar,
      fogDensity,
      mousePos.current,
      spotlightRadius,
      spotlightIntensity,
      iridescenceStrength
    ); // Outer glow
    const coreMaterial = createNeonLineMaterial(
      coreIntensity,
      focusHeight,
      fogNear,
      fogFar,
      fogDensity,
      mousePos.current,
      spotlightRadius,
      spotlightIntensity,
      iridescenceStrength
    ); // Core bright line

    shaderMaterialsRef.current = [glowMaterial, coreMaterial];

    for (let i = 0; i < meridianCount; i++) {
      const points: THREE.Vector3[] = [];
      const phi = (i / meridianCount) * Math.PI * 2; // Longitude angle

      // Create points along the meridian from left pole to right pole
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI; // Angle from left pole to right pole (0 to PI)

        // Spherical to Cartesian coordinates (poles on x-axis: left/right)
        // Elongate along x-axis for football shape
        const x = radius * Math.cos(theta) * horizontalStretch; // Pole axis: stretched left/right
        const y = radius * Math.sin(theta) * Math.cos(phi);
        const z = radius * Math.sin(theta) * Math.sin(phi);

        points.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Add glow layer (rendered first, appears behind)
      const glowLine = new THREE.Line(geometry, glowMaterial);
      lines.push(glowLine);

      // Add core layer (rendered second, appears on top)
      const coreLine = new THREE.Line(geometry.clone(), coreMaterial);
      lines.push(coreLine);
    }

    return lines;
  }, [
    glowIntensity,
    coreIntensity,
    focusHeight,
    meridianCount,
    horizontalStretch,
    fogNear,
    fogFar,
    fogDensity,
    spotlightRadius,
    spotlightIntensity,
    iridescenceStrength,
  ]);

  // Track mouse position and handle rotation animation
  useFrame((state) => {
    // Only rotate if reduced motion is not preferred
    if (groupRef.current && !prefersReducedMotion) {
      groupRef.current.rotation.x = state.clock.elapsedTime * rotationSpeed;
    }

    // Only update mouse position and shader uniforms if reduced motion is not preferred
    if (!prefersReducedMotion) {
      // Update mouse position in 3D space using cached raycaster
      raycaster.setFromCamera(state.mouse, state.camera);

      // Calculate sphere's center position in world space with adjustable depth offset
      const sphereCenterY = -radius * scale + verticalOffset;
      sphereCenter.set(0, sphereCenterY, spotlightDepth);

      // Create a plane at the sphere's center depth (with offset), perpendicular to camera view
      state.camera.getWorldDirection(cameraDirection);
      interactionPlane.setFromNormalAndCoplanarPoint(cameraDirection, sphereCenter);

      // Intersect mouse ray with the plane at sphere's center
      const hit = raycaster.ray.intersectPlane(interactionPlane, intersectionPoint);
      if (hit && !mousePos.current.equals(hit)) {
        mousePos.current.copy(hit);
      }

      // Update material uniforms
      shaderMaterialsRef.current.forEach((material) => {
        material.uniforms.uMousePos.value.copy(mousePos.current);
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, -radius * scale + verticalOffset, 0]} scale={scale}>
      {meridianLines.map((line, index) => (
        <primitive key={index} object={line} />
      ))}
    </group>
  );
}

// Wrapper component props
interface ProSphereProps extends ProSphereInnerProps {
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomSmoothing?: number;
  bloomRadius?: number;
  bloomMipmapBlur?: boolean;
  vignetteOffset?: number;
  vignetteDarkness?: number;
}

// Main ProSphere component with Canvas wrapper
function ProSphere({
  // Sphere props (pass through to inner component)
  scale = 3,
  horizontalStretch = 1.2,
  meridianCount = 16,
  verticalOffset = -2,
  rotationSpeed = 0.2,
  glowIntensity = 4.0,
  coreIntensity = 8.0,
  focusHeight = 4.0,
  fogNear = 5.0,
  fogFar = 19.5,
  fogDensity = 3.0,
  spotlightRadius = 2.0,
  spotlightIntensity = 3.0,
  iridescenceStrength = 0.5,
  spotlightDepth = 0.0,
  // Post-processing props
  bloomIntensity = 3.5,
  bloomThreshold = 0.0,
  bloomSmoothing = 0.3,
  bloomRadius = 0.8,
  bloomMipmapBlur = true,
  vignetteOffset = 0.75,
  vignetteDarkness = 0.75,
}: ProSphereProps = {}) {
  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0, position: 'relative' }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 5, 6], fov: 50 }}
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ scene, gl }) => {
          scene.background = new THREE.Color('#080808');
          gl.setClearColor(new THREE.Color('#080808'), 0);
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <ProSphereInner
          scale={scale}
          horizontalStretch={horizontalStretch}
          meridianCount={meridianCount}
          verticalOffset={verticalOffset}
          rotationSpeed={rotationSpeed}
          glowIntensity={glowIntensity}
          coreIntensity={coreIntensity}
          focusHeight={focusHeight}
          fogNear={fogNear}
          fogFar={fogFar}
          fogDensity={fogDensity}
          spotlightRadius={spotlightRadius}
          spotlightIntensity={spotlightIntensity}
          iridescenceStrength={iridescenceStrength}
          spotlightDepth={spotlightDepth}
        />
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={bloomThreshold}
            luminanceSmoothing={bloomSmoothing}
            height={512}
            mipmapBlur={bloomMipmapBlur}
            radius={bloomRadius}
          />

          <Vignette offset={vignetteOffset} darkness={vignetteDarkness} eskil={false} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default ProSphere;
export { ProSphereInner };
