import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useWebflowContext } from '@webflow/react';

const DEFAULT_COLOR = '#146EF5';

// Helper to create media query hook
function useMediaQuery(query: string, defaultValue: boolean) {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)', false);

// Create neon line material with shader-based glow effect and radial transparency fade
function createNeonLineMaterial(
  intensity: number,
  color: THREE.Color,
  radialFadeStart: number,
  radialFadeEnd: number,
  beamPosition: number,
  beamIntensity: number,
  beamWidth: number,
  tailLength: number = 0.3
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uIntensity: { value: intensity },
      uRadialFadeStart: { value: radialFadeStart },
      uRadialFadeEnd: { value: radialFadeEnd },
      uBeamPosition: { value: beamPosition },
      uBeamIntensity: { value: beamIntensity },
      uBeamWidth: { value: beamWidth },
      uTailLength: { value: tailLength },
    },
    vertexShader: `
      attribute float pathPosition;
      
      varying vec3 vWorldPosition;
      varying float vDistanceFromCenter;
      varying float vPathPosition;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Calculate distance from center (assuming center is at origin)
        vDistanceFromCenter = length(vWorldPosition.xy);
        
        // Use the path position attribute (smooth along polygon perimeter)
        vPathPosition = pathPosition;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uRadialFadeStart;
      uniform float uRadialFadeEnd;
      uniform float uBeamPosition;
      uniform float uBeamIntensity;
      uniform float uBeamWidth;
      uniform float uTailLength;
      
      varying vec3 vWorldPosition;
      varying float vDistanceFromCenter;
      varying float vPathPosition;
      
      void main() {
        // Radial fade - shapes become more transparent as they get further from center
        float radialFade = 1.0 - smoothstep(uRadialFadeStart, uRadialFadeEnd, vDistanceFromCenter);
        
        // Calculate distance along path, handling wrap-around
        float pathDist = vPathPosition - uBeamPosition;
        // Handle wrap-around: if distance is > 0.5, we went the wrong way around
        if (pathDist > 0.5) {
          pathDist = pathDist - 1.0;
        } else if (pathDist < -0.5) {
          pathDist = pathDist + 1.0;
        }
        
        // Beam effect: sharp leading edge at position 0, trailing tail behind
        // pathDist < 0 means we're behind the beam (in the tail)
        // pathDist > 0 means we're ahead of the beam (should be dark)
        
        float beamFalloff = 0.0;
        
        if (pathDist <= 0.0) {
          // We're behind the beam - create trailing tail
          float tailDistance = abs(pathDist);
          if (tailDistance <= uTailLength) {
            // Smooth tail fade from beam position backward
            float tailProgress = tailDistance / uTailLength;
            // Use smoothstep for smooth tail fade
            beamFalloff = 1.0 - smoothstep(0.0, 1.0, tailProgress);
            // Apply power for more control over tail shape
            beamFalloff = pow(beamFalloff, 1.2);
          }
        } else {
          // We're ahead of the beam - sharp cutoff (no glow)
          beamFalloff = 0.0;
        }
        
        // Add a small bright point at the exact beam position
        if (abs(pathDist) < uBeamWidth * 0.5) {
          float pointDistance = abs(pathDist) / (uBeamWidth * 0.5);
          float pointFalloff = 1.0 - smoothstep(0.0, 1.0, pointDistance);
          beamFalloff = max(beamFalloff, pointFalloff);
        }
        
        // Create a very intense beam boost that creates strong bloom
        float beamBoost = beamFalloff * uBeamIntensity * 8.0;
        
        // Base brightness is lower for subtler overall glow
        float baseBrightness = 0.6;
        float brightness = baseBrightness + beamBoost;
        float alpha = radialFade;
        
        // Create bright color for bloom effect
        vec3 col = uColor * uIntensity * brightness * 1.5;
        
        // Boost beam color even more for intense bloom
        col += uColor * beamFalloff * uBeamIntensity * 15.0;
        
        // Ensure colors stay vibrant and bloom-friendly
        col = max(col, vec3(0.0));
        
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

interface ConcentricShapeInnerProps {
  scale?: number;
  vertexCount?: number;
  shapeCount?: number;
  innerRadius?: number;
  outerRadius?: number;
  rotationSpeed?: number;
  glowIntensity?: number;
  coreIntensity?: number;
  radialFadeStart?: number;
  radialFadeEnd?: number;
  beamSpeed?: number;
  beamIntensity?: number;
  beamWidth?: number;
  tailLength?: number;
  color?: string;
}

function ConcentricShapeInner({
  scale = 1,
  vertexCount = 5,
  shapeCount = 8,
  innerRadius = 0.5,
  outerRadius = 3,
  rotationSpeed = 0.1,
  glowIntensity = 1.5,
  coreIntensity = 2.5,
  radialFadeStart = 0.5,
  radialFadeEnd = 3.0,
  beamSpeed = 0.15,
  beamIntensity = 4.0,
  beamWidth = 0.12,
  tailLength = 0.3,
  color = DEFAULT_COLOR,
}: ConcentricShapeInnerProps = {}) {
  const groupRef = useRef<THREE.Group>(null);
  const prefersReducedMotion = useReducedMotion();
  const shaderMaterialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const beamPositionRef = useRef(0);
  const linesRef = useRef<THREE.Line[]>([]);

  const [isReady, setIsReady] = useState(false);

  // Defer heavy geometry creation until after initial render
  useEffect(() => {
    const timeoutId = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  const shapes = useMemo(() => {
    if (!isReady) return [];

    const lines: THREE.Line[] = [];
    const segments = 64;

    // Materials for innermost shape (with beam effect)
    const innerGlowMaterial = createNeonLineMaterial(
      glowIntensity,
      colorObj,
      radialFadeStart,
      radialFadeEnd,
      beamPositionRef.current,
      beamIntensity,
      beamWidth,
      tailLength
    );
    const innerCoreMaterial = createNeonLineMaterial(
      coreIntensity,
      colorObj,
      radialFadeStart,
      radialFadeEnd,
      beamPositionRef.current,
      beamIntensity,
      beamWidth,
      tailLength
    );

    // Materials for outer shapes (without beam effect)
    const outerGlowMaterial = createNeonLineMaterial(
      glowIntensity,
      colorObj,
      radialFadeStart,
      radialFadeEnd,
      beamPositionRef.current,
      0, // No beam intensity for outer shapes
      beamWidth,
      tailLength
    );
    const outerCoreMaterial = createNeonLineMaterial(
      coreIntensity,
      colorObj,
      radialFadeStart,
      radialFadeEnd,
      beamPositionRef.current,
      0, // No beam intensity for outer shapes
      beamWidth,
      tailLength
    );

    // Store materials that need beam updates (only innermost)
    shaderMaterialsRef.current = [innerGlowMaterial, innerCoreMaterial];

    // Create concentric shapes
    for (let i = 0; i < shapeCount; i++) {
      const radius = innerRadius + ((outerRadius - innerRadius) / (shapeCount - 1)) * i;
      const isInnermost = i === 0;
      const points: THREE.Vector3[] = [];

      // Generate polygon - create proper polygon vertices
      // First, calculate the actual vertex positions in 2D space
      const vertices: { x: number; y: number }[] = [];
      for (let v = 0; v < vertexCount; v++) {
        const angle = (v / vertexCount) * Math.PI * 2 - Math.PI / 2; // Start from top
        vertices.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        });
      }

      // Calculate total perimeter length for normalization
      let totalPerimeter = 0;
      const edgeLengths: number[] = [];
      for (let edgeIdx = 0; edgeIdx < vertexCount; edgeIdx++) {
        const startVertex = vertices[edgeIdx];
        const endVertex = vertices[(edgeIdx + 1) % vertexCount];
        const edgeLength = Math.sqrt(
          Math.pow(endVertex.x - startVertex.x, 2) + Math.pow(endVertex.y - startVertex.y, 2)
        );
        edgeLengths.push(edgeLength);
        totalPerimeter += edgeLength;
      }

      // Now trace around the polygon, interpolating linearly along each edge
      // Store path position (cumulative distance along perimeter, normalized to 0-1)
      const pathPositions: number[] = [];
      let cumulativeDistance = 0;
      const pointsPerEdge = Math.max(1, Math.ceil(segments / vertexCount));

      for (let edgeIdx = 0; edgeIdx < vertexCount; edgeIdx++) {
        const startVertex = vertices[edgeIdx];
        const endVertex = vertices[(edgeIdx + 1) % vertexCount];
        const edgeLength = edgeLengths[edgeIdx];

        // Create points along this edge (linear interpolation for straight edges)
        // Include start point, skip end point (will be start of next edge)
        const isLastEdge = edgeIdx === vertexCount - 1;
        const endP = isLastEdge ? pointsPerEdge : pointsPerEdge - 1;

        for (let p = 0; p <= endP; p++) {
          const t = p / pointsPerEdge;
          const x = startVertex.x + (endVertex.x - startVertex.x) * t;
          const y = startVertex.y + (endVertex.y - startVertex.y) * t;
          const z = 0; // 2D shape in XY plane
          points.push(new THREE.Vector3(x, y, z));

          // Calculate path position (cumulative distance along perimeter)
          const distanceAlongEdge = edgeLength * t;
          const pathPosition = (cumulativeDistance + distanceAlongEdge) / totalPerimeter;
          pathPositions.push(pathPosition);
        }

        cumulativeDistance += edgeLength;
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      // Add path position as an attribute for smooth beam movement
      // Ensure we have the same number of path positions as points
      if (pathPositions.length === points.length) {
        const pathPositionArray = new Float32Array(pathPositions);
        geometry.setAttribute('pathPosition', new THREE.BufferAttribute(pathPositionArray, 1));
      } else {
        console.warn(
          `Path position count (${pathPositions.length}) doesn't match point count (${points.length})`
        );
      }
      // Use inner materials for innermost shape, outer materials for others
      if (isInnermost) {
        lines.push(new THREE.Line(geometry, innerGlowMaterial));
        // Clone geometry and ensure pathPosition attribute is copied
        const clonedGeometry = geometry.clone();
        // Verify pathPosition attribute exists on cloned geometry
        if (!clonedGeometry.getAttribute('pathPosition') && geometry.getAttribute('pathPosition')) {
          clonedGeometry.setAttribute(
            'pathPosition',
            geometry.getAttribute('pathPosition').clone()
          );
        }
        lines.push(new THREE.Line(clonedGeometry, innerCoreMaterial));
      } else {
        lines.push(new THREE.Line(geometry, outerGlowMaterial));
        // Clone geometry for outer shapes too
        const clonedGeometry = geometry.clone();
        if (!clonedGeometry.getAttribute('pathPosition') && geometry.getAttribute('pathPosition')) {
          clonedGeometry.setAttribute(
            'pathPosition',
            geometry.getAttribute('pathPosition').clone()
          );
        }
        lines.push(new THREE.Line(clonedGeometry, outerCoreMaterial));
      }
    }

    // Store lines reference for material updates
    linesRef.current = lines;

    return lines;
  }, [
    isReady,
    glowIntensity,
    coreIntensity,
    vertexCount,
    shapeCount,
    innerRadius,
    outerRadius,
    radialFadeStart,
    radialFadeEnd,
    beamIntensity,
    beamWidth,
    tailLength,
    colorObj,
  ]);

  // Update materials ref when shapes are created/updated
  useEffect(() => {
    if (linesRef.current.length > 0) {
      // Get materials from the innermost shape lines (first two lines)
      const innerLines = linesRef.current.slice(0, 2);
      const materials = innerLines
        .map((line) => line.material as THREE.ShaderMaterial)
        .filter((mat) => mat && mat.uniforms && mat.uniforms.uBeamPosition);
      shaderMaterialsRef.current = materials;
    }
  }, [isReady, vertexCount, shapeCount, innerRadius, outerRadius]);

  useFrame((state, delta) => {
    // Update beam position
    if (!prefersReducedMotion) {
      beamPositionRef.current += delta * beamSpeed;
      beamPositionRef.current = beamPositionRef.current % 1.0;

      const beamPos = beamPositionRef.current;

      // Update materials from group children (most reliable)
      if (groupRef.current) {
        const children = groupRef.current.children;
        // First two children should be the innermost shape (glow and core)
        for (let i = 0; i < Math.min(2, children.length); i++) {
          const child = children[i];
          if (child instanceof THREE.Line) {
            const material = child.material as THREE.ShaderMaterial;
            if (material && material.uniforms && material.uniforms.uBeamPosition) {
              material.uniforms.uBeamPosition.value = beamPos;
              // Force material update
              material.needsUpdate = true;
            }
          }
        }
      }

      // Also update from stored refs as backup
      shaderMaterialsRef.current.forEach((material) => {
        if (material && material.uniforms && material.uniforms.uBeamPosition) {
          material.uniforms.uBeamPosition.value = beamPos;
          material.needsUpdate = true;
        }
      });
    }

    // Rotate the entire shape
    if (!prefersReducedMotion && groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {shapes.map((line, index) => {
        // Store ref to line for material updates
        const lineRef = (node: THREE.Line | null) => {
          if (node && index < 2) {
            // Store reference to innermost shape lines
            if (!linesRef.current[index]) {
              linesRef.current[index] = node;
            }
          }
        };
        return <primitive key={index} ref={lineRef} object={line} />;
      })}
    </group>
  );
}

interface ConcentricShapeProps extends ConcentricShapeInnerProps {
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomSmoothing?: number;
  bloomRadius?: number;
  bloomMipmapBlur?: boolean;
  vignetteOffset?: number;
  vignetteDarkness?: number;
  disableInDesigner?: boolean;
}

function ConcentricShape({
  scale = 1,
  vertexCount = 5,
  shapeCount = 8,
  innerRadius = 0.5,
  outerRadius = 3,
  rotationSpeed = 0.1,
  glowIntensity = 1.5,
  coreIntensity = 2.5,
  radialFadeStart = 0.5,
  radialFadeEnd = 3.0,
  beamSpeed = 0.15,
  beamIntensity = 4.0,
  beamWidth = 0.12,
  tailLength = 0.3,
  color = DEFAULT_COLOR,
  bloomIntensity = 3.5,
  bloomThreshold = 0.0,
  bloomSmoothing = 0.3,
  bloomRadius = 0.8,
  bloomMipmapBlur = true,
  vignetteOffset = 0.75,
  vignetteDarkness = 0.75,
  disableInDesigner = true,
}: ConcentricShapeProps = {}) {
  // Detect if we're in Webflow designer mode using the official hook
  const { mode, interactive } = useWebflowContext();
  const isDesignerMode = mode === 'design' || !interactive;
  const shouldDisable = disableInDesigner && isDesignerMode;

  const [postProcessingReady, setPostProcessingReady] = useState(false);

  // Defer post-processing effects until after initial render
  useEffect(() => {
    const timeoutId = setTimeout(() => setPostProcessingReady(true), 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Render placeholder in designer mode for better performance
  if (shouldDisable) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          position: 'relative',
          backgroundColor: '#080808',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#146EF5',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            opacity: 0.6,
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>ConcentricShape</div>
          <div style={{ fontSize: '12px' }}>Rendering disabled in designer mode</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0, position: 'relative' }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
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
        <ConcentricShapeInner
          scale={scale}
          vertexCount={vertexCount}
          shapeCount={shapeCount}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          rotationSpeed={rotationSpeed}
          glowIntensity={glowIntensity}
          coreIntensity={coreIntensity}
          radialFadeStart={radialFadeStart}
          radialFadeEnd={radialFadeEnd}
          beamSpeed={beamSpeed}
          beamIntensity={beamIntensity}
          beamWidth={beamWidth}
          tailLength={tailLength}
          color={color}
        />
        {postProcessingReady && (
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
        )}
      </Canvas>
    </div>
  );
}

export default ConcentricShape;
export { ConcentricShapeInner };
