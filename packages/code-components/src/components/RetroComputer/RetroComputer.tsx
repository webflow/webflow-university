import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { useWebflowContext } from '@webflow/react';
import { ToneMappingMode } from 'postprocessing';
import {
  type ComponentRef,
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { DEFAULT_CAMERA, type RetroComputerCamera, type Vector3Tuple } from './camera';
import { parseColorList } from './celebration';
import { applyCrtSettings, createCrtScreenMaterial } from './crtScreenMaterial';
import { splitEnterKey } from './enterKey';
import { getNavigableHref, type RetroComputerLink } from './link';
import {
  loadPixPalAttributes,
  PIXPAL_FPS,
  preparePixPalMaterial,
  sceneUsesAnimatedSwatches,
} from './pixPalMaterial';
import { getScreenState, isPublishRunning, type ScreenState } from './publishSequence';
import modelBase64 from './retroComputerModel';
import { createCurvedScreenGeometry, MAX_SCREEN_BULGE } from './screenGeometry';
import { CURSOR_BLINK_MS, ScreenRenderer } from './screenRenderer';
import {
  backgroundCss,
  type CrtSettings,
  DEFAULT_BACKGROUND,
  DEFAULT_CRT,
  DEFAULT_LIGHTING,
  DEFAULT_MAX_PIXEL_RATIO,
  type BackgroundSettings,
  type LightingSettings,
  resolveSettings,
  type TunerValues,
} from './settings';

export interface RetroComputerProps
  extends Partial<LightingSettings>,
    Partial<BackgroundSettings>,
    Partial<CrtSettings> {
  showCords?: boolean;
  showDesk?: boolean;
  screenBackground?: string;
  screenText?: string;
  enterLink?: RetroComputerLink;
  cameraPosition?: Vector3Tuple;
  cameraTarget?: Vector3Tuple;
  cameraFov?: number;
  /** Lets you orbit the camera to dial in a view; reports it through `onCameraChange`. */
  editCamera?: boolean;
  onCameraChange?: (camera: RetroComputerCamera) => void;
  onEnterPress?: () => void;
  preserveDrawingBuffer?: boolean;
  /** Caps the device pixel ratio (1–2). Lower is cheaper on high-density screens. */
  maxPixelRatio?: number;
  /** Comma separated CSS colors for the publish fireworks. */
  fireworkColors?: string;
  /** Shows a DialKit panel over the scene for dialling in the look. Values aren't saved. */
  showControls?: boolean;
}

const RetroComputerTuner = lazy(() =>
  import('./RetroComputerTuner').catch((error: unknown) => {
    console.error('RetroComputer: failed to load the tuning panel', error);
    return { default: () => null };
  })
);

const CORD_NODES = ['Cord_Keyboard', 'Cord_Mouse'];
const DESK_NODE = 'Desk';
const KEYBOARD_NODE = 'Keyboard';
const SCREEN_NODE = 'Screen';

const PRESS_DEPTH = 0.12;
const PRESS_DURATION_MS = 220;
const SCREEN_FRAME_MS = 50;

interface LoadedModel {
  scene: THREE.Group;
  enterKey: THREE.Mesh | null;
  animatedSwatches: boolean;
  frame: { value: number };
}

function decodeBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function disposeScene(scene: THREE.Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
}

function isVisible(object: THREE.Object3D | null) {
  for (let current = object; current; current = current.parent) {
    if (!current.visible) return false;
  }
  return true;
}

const round = (value: number) => Math.round(value * 100) / 100;

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return onScreen;
}

function useRetroComputerScene() {
  const [model, setModel] = useState<LoadedModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loaded: THREE.Group | null = null;
    let attributesTexture: THREE.Texture | null = null;

    Promise.all([
      new GLTFLoader().parseAsync(decodeBase64(modelBase64), ''),
      loadPixPalAttributes(),
    ])
      .then(([gltf, attributes]) => {
        loaded = gltf.scene;
        attributesTexture = attributes;
        if (cancelled) {
          disposeScene(gltf.scene);
          attributes.dispose();
          return;
        }
        const frame = { value: 0 };
        const prepared = new Set<THREE.Material>();
        gltf.scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            if (prepared.has(material)) continue;
            prepared.add(material);
            preparePixPalMaterial(material, attributes, frame);
          }
        });
        const keyboard = gltf.scene.getObjectByName(KEYBOARD_NODE);
        const enterKey = keyboard instanceof THREE.Mesh ? splitEnterKey(keyboard) : null;
        const animatedSwatches = sceneUsesAnimatedSwatches(gltf.scene, attributes);
        setModel({ scene: gltf.scene, enterKey, animatedSwatches, frame });
      })
      .catch((error) => console.error('RetroComputer: failed to load model', error));

    return () => {
      cancelled = true;
      if (loaded) disposeScene(loaded);
      attributesTexture?.dispose();
    };
  }, []);

  return model;
}

function StudioEnvironment({ intensity }: { intensity: number }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    invalidate();
    return () => {
      scene.environment = null;
      environment.dispose();
      room.clear();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  useEffect(() => {
    scene.environmentIntensity = intensity;
    invalidate();
  }, [scene, intensity, invalidate]);

  return null;
}

const KEY_LIGHT_POSITION: Vector3Tuple = [-26, 12, -3];
const KEY_LIGHT_TARGET: Vector3Tuple = [2, 1, 3];
const RIM_LIGHT_POSITION: Vector3Tuple = [16, 10, -14];

/** Warm key from the front left that pools on the desk, a cool rim from behind, and a dim fill. */
function StudioLights({ lighting }: { lighting: LightingSettings }) {
  const keyTarget = useMemo(() => new THREE.Object3D(), []);

  return (
    <>
      <hemisphereLight intensity={lighting.fillIntensity} color="#f6f1ea" groundColor="#2a1f18" />
      <primitive object={keyTarget} position={KEY_LIGHT_TARGET} />
      <spotLight
        position={KEY_LIGHT_POSITION}
        target={keyTarget}
        color={lighting.keyLightColor}
        intensity={lighting.keyLightIntensity}
        angle={0.4}
        penumbra={1}
        decay={0}
      />
      <directionalLight
        position={RIM_LIGHT_POSITION}
        color={lighting.rimLightColor}
        intensity={lighting.rimLightIntensity}
      />
    </>
  );
}

function CameraRig({
  position,
  target,
  fov,
  editable,
  onChange,
}: RetroComputerCamera & {
  editable: boolean;
  onChange?: (camera: RetroComputerCamera) => void;
}) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((state) => state.invalidate);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const [px, py, pz] = position;
  const [tx, ty, tz] = target;

  useLayoutEffect(() => {
    camera.position.set(px, py, pz);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.lookAt(tx, ty, tz);
    if (controls.current) {
      controls.current.target.set(tx, ty, tz);
      controls.current.update();
    }
    invalidate();
  }, [camera, px, py, pz, tx, ty, tz, fov, editable, invalidate]);

  if (!editable) return null;

  return (
    <OrbitControls
      ref={controls}
      target={[tx, ty, tz]}
      enableDamping={false}
      onEnd={() => {
        const orbitTarget = controls.current?.target ?? new THREE.Vector3(tx, ty, tz);
        onChange?.({
          position: camera.position.toArray().map(round) as Vector3Tuple,
          target: orbitTarget.toArray().map(round) as Vector3Tuple,
          fov: camera.fov,
        });
      }}
    />
  );
}

function Model({
  model,
  showCords,
  showDesk,
  screen,
  reducedMotion,
  active,
  crt,
  onEnterPress,
  onEnterHover,
  onPublished,
}: {
  model: LoadedModel;
  showCords: boolean;
  showDesk: boolean;
  screen: ScreenRenderer;
  crt: CrtSettings;
  reducedMotion: boolean;
  /** False while scrolled out of view: skip all redraws. */
  active: boolean;
  onEnterPress: () => void;
  onEnterHover: (hovered: boolean) => void;
  onPublished: () => void;
}) {
  const { scene, enterKey, frame, animatedSwatches } = model;
  const invalidate = useThree((state) => state.invalidate);
  const swatchClockStart = useRef(performance.now());
  const swatchClockRunning = animatedSwatches && !reducedMotion;
  const pressStart = useRef<number | null>(null);
  const publishStartedAt = useRef<number | null>(null);
  const screenState = useRef<ScreenState>({ phase: 'idle' });
  const refreshScreen = useRef<() => void>(() => {});
  const onPublishedRef = useRef(onPublished);

  useEffect(() => {
    onPublishedRef.current = onPublished;
  });

  useEffect(() => {
    for (const name of CORD_NODES) {
      const cord = scene.getObjectByName(name);
      if (cord) cord.visible = showCords;
    }
    const desk = scene.getObjectByName(DESK_NODE);
    if (desk) desk.visible = showDesk;
    invalidate();
  }, [scene, showCords, showDesk, invalidate]);

  const [screenMaterial, setScreenMaterial] = useState<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const screenMesh = scene.getObjectByName(SCREEN_NODE);
    if (!(screenMesh instanceof THREE.Mesh)) return;
    const previous = screenMesh.material;
    const material = createCrtScreenMaterial(screen.texture);
    screenMesh.material = material;
    setScreenMaterial(material);
    return () => {
      screenMesh.material = previous;
      material.dispose();
    };
  }, [scene, screen]);

  const { screenGlow, scanlines, vignette, curvature, chromaticAberration } = crt;
  useEffect(() => {
    if (!screenMaterial) return;
    applyCrtSettings(screenMaterial, {
      screenGlow,
      scanlines,
      vignette,
      curvature,
      chromaticAberration,
    });
    invalidate();
  }, [screenMaterial, screenGlow, scanlines, vignette, curvature, chromaticAberration, invalidate]);

  const bulge = Math.min(Math.max(curvature, 0), 1) * MAX_SCREEN_BULGE;
  useEffect(() => {
    const screenMesh = scene.getObjectByName(SCREEN_NODE);
    if (!(screenMesh instanceof THREE.Mesh) || bulge === 0) return;
    const flat = screenMesh.geometry;
    const curved = createCurvedScreenGeometry(flat, bulge);
    screenMesh.geometry = curved;
    invalidate();
    return () => {
      screenMesh.geometry = flat;
      curved.dispose();
      invalidate();
    };
  }, [scene, bulge, invalidate]);

  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      window.clearTimeout(timer);
      const now = performance.now();
      const previous = screenState.current;
      const state = getScreenState(publishStartedAt.current, now, reducedMotion);
      screenState.current = state;
      if (state.phase === 'published' && isPublishRunning(previous)) onPublishedRef.current();
      const running = isPublishRunning(state);
      if (active) {
        screen.render(state, now, reducedMotion);
        if (!swatchClockRunning) invalidate();
      }
      // Offscreen, keep ticking only so the After Publish Link still fires on time.
      if (!active && !running) return;
      const delay = running ? SCREEN_FRAME_MS : CURSOR_BLINK_MS - (now % CURSOR_BLINK_MS);
      timer = window.setTimeout(tick, delay);
    };
    refreshScreen.current = tick;
    tick();
    return () => window.clearTimeout(timer);
  }, [screen, reducedMotion, active, swatchClockRunning, invalidate]);

  // Blender drives the animated swatches with the integer frame number, so 24 renders a second
  // reproduce them exactly. These renders also pick up screen texture changes.
  useEffect(() => {
    if (!swatchClockRunning || !active) return;
    const timer = window.setInterval(() => {
      frame.value = Math.floor(
        ((performance.now() - swatchClockStart.current) / 1000) * PIXPAL_FPS
      );
      invalidate();
    }, 1000 / PIXPAL_FPS);
    return () => window.clearInterval(timer);
  }, [swatchClockRunning, active, frame, invalidate]);

  useFrame(() => {
    if (!enterKey || pressStart.current === null) return;
    const progress = Math.min((performance.now() - pressStart.current) / PRESS_DURATION_MS, 1);
    enterKey.position.y = -PRESS_DEPTH * Math.sin(progress * Math.PI);
    if (progress < 1) {
      invalidate();
    } else {
      pressStart.current = null;
    }
  });

  const hitsEnterKey = (event: ThreeEvent<PointerEvent | MouseEvent>) =>
    enterKey !== null &&
    event.intersections.find((hit) => isVisible(hit.object))?.object === enterKey;

  return (
    <primitive
      object={scene}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onEnterHover(hitsEnterKey(event));
      }}
      onPointerOut={() => onEnterHover(false)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (!hitsEnterKey(event)) return;
        pressStart.current = performance.now();
        invalidate();
        onEnterPress();
        if (!isPublishRunning(screenState.current)) {
          publishStartedAt.current = performance.now();
          refreshScreen.current();
        }
      }}
    />
  );
}

export default function RetroComputer(componentProps: RetroComputerProps) {
  const showControls = componentProps.showControls ?? false;
  const [tuned, setTuned] = useState<TunerValues | null>(null);
  const [orbitedCamera, setOrbitedCamera] = useState<RetroComputerCamera | null>(null);
  const tuning = showControls && tuned !== null;
  const props: RetroComputerProps = tuning
    ? {
        ...componentProps,
        ...tuned,
        editCamera: tuned.orbitCamera,
        cameraPosition: orbitedCamera?.position ?? componentProps.cameraPosition,
        cameraTarget: orbitedCamera?.target ?? componentProps.cameraTarget,
      }
    : componentProps;

  const {
    showCords = true,
    showDesk = true,
    screenBackground = '#0a0e16',
    screenText = '#4b8bff',
    enterLink,
    cameraPosition = DEFAULT_CAMERA.position,
    cameraTarget = DEFAULT_CAMERA.target,
    cameraFov = DEFAULT_CAMERA.fov,
    editCamera = false,
    onCameraChange,
    onEnterPress,
    preserveDrawingBuffer = false,
    maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO,
    fireworkColors,
  } = props;
  const lighting = resolveSettings(DEFAULT_LIGHTING, props);
  const background = resolveSettings(DEFAULT_BACKGROUND, props);
  const crt = resolveSettings(DEFAULT_CRT, props);
  const model = useRetroComputerScene();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(wrapperRef);
  const { mode, interactive } = useWebflowContext();
  const [enterHovered, setEnterHovered] = useState(false);

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const screen = useMemo(
    () => new ScreenRenderer(screenBackground, screenText, parseColorList(fireworkColors)),
    [screenBackground, screenText, fireworkColors]
  );
  useEffect(() => () => screen.dispose(), [screen]);

  const handleCameraChange = (camera: RetroComputerCamera) => {
    if (tuning) setOrbitedCamera(camera);
    onCameraChange?.(camera);
  };

  const tunerInitial: TunerValues = {
    ...lighting,
    ...background,
    ...crt,
    screenBackground,
    screenText,
    fireworkColors: parseColorList(fireworkColors).join(', '),
    cameraFov,
    orbitCamera: false,
  };

  const copyTunedSettings = () => {
    if (!tuned) return;
    const look: Partial<TunerValues> = { ...tuned };
    delete look.orbitCamera;
    const settings = JSON.stringify(
      { ...look, cameraPosition, cameraTarget, cameraFov: tuned.cameraFov },
      null,
      2
    );
    navigator.clipboard
      ?.writeText(settings)
      .catch(() => window.prompt('Copy these settings', settings));
  };

  const handlePublished = () => {
    const href = getNavigableHref(enterLink);
    if (!href || !interactive || mode === 'design') return;
    if (enterLink?.target === '_blank') {
      window.open(href, '_blank', 'noopener');
    } else {
      window.location.assign(href);
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4 / 3',
        background: backgroundCss(background),
        cursor: enterHovered ? 'pointer' : editCamera ? 'grab' : 'default',
      }}
    >
      <Canvas
        flat
        frameloop={onScreen ? 'demand' : 'never'}
        dpr={[1, Math.min(Math.max(maxPixelRatio, 1), 2)]}
        camera={{ position: cameraPosition, fov: cameraFov }}
        // The EffectComposer renders into its own multisampled targets with depth, so the
        // default framebuffer only receives the final full-screen pass.
        gl={{ alpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer }}
        style={{ background: 'transparent' }}
      >
        <CameraRig
          position={cameraPosition}
          target={cameraTarget}
          fov={cameraFov}
          editable={editCamera}
          onChange={handleCameraChange}
        />
        <StudioEnvironment intensity={lighting.environmentIntensity} />
        <StudioLights lighting={lighting} />

        {model && (
          <Model
            model={model}
            showCords={showCords}
            showDesk={showDesk}
            screen={screen}
            reducedMotion={reducedMotion}
            active={onScreen}
            crt={crt}
            onEnterPress={() => onEnterPress?.()}
            onEnterHover={setEnterHovered}
            onPublished={handlePublished}
          />
        )}

        <ContactShadows
          key={`${Boolean(model)}-${showCords}`}
          frames={1}
          position={[2.8, 0.01, 1.8]}
          opacity={0.45}
          scale={30}
          blur={2}
          far={12}
        />

        {/* Matches the Blender look: Bloom on emissive swatches (strength 20), then AgX. */}
        <EffectComposer multisampling={4}>
          <Bloom
            mipmapBlur
            luminanceThreshold={lighting.bloomThreshold}
            luminanceSmoothing={0.2}
            intensity={lighting.bloomIntensity}
            radius={0.55}
          />
          <ToneMapping mode={ToneMappingMode.AGX} />
        </EffectComposer>
      </Canvas>
      {showControls && (
        <Suspense fallback={null}>
          <RetroComputerTuner
            initial={tunerInitial}
            onChange={setTuned}
            onCopy={copyTunedSettings}
          />
        </Suspense>
      )}
    </div>
  );
}
