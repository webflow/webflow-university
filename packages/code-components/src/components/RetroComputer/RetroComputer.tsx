import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { useWebflowContext } from '@webflow/react';
import { ToneMappingMode } from 'postprocessing';
import {
  type ComponentRef,
  type CSSProperties,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { DEFAULT_CAMERA, type RetroComputerCamera, type Vector3Tuple } from './camera';
import { parseColorList } from './celebration';
import {
  createCompactDisc,
  createDiscEnvironment,
  createDiscTexture,
  type DiscMotion,
  discDroop,
  discExtension,
  discSpin,
  discZ,
} from './compactDisc';
import { applyCrtSettings, createCrtScreenMaterial } from './crtScreenMaterial';
import { createStillEnterKeyMaterial, splitEnterKey } from './enterKey';
import {
  createHoverHighlight,
  DEFAULT_HOVER_BRIGHTNESS,
  type HoverFade,
  hoverLevel,
  RESTING_HOVER,
  retargetHover,
} from './partHover';
import { splitTriangles } from './meshParts';
import {
  createEmissiveTest,
  loadPixPalAttributes,
  PIXPAL_FPS,
  preparePixPalMaterial,
  sceneUsesAnimatedSwatches,
} from './pixPalMaterial';
import {
  getPowerState,
  isPowerAnimating,
  isPoweredOn,
  lightLevel,
  nextPowerAction,
  type PowerAction,
} from './powerSequence';
import { getScreenState, isPublishRunning, type ScreenState } from './publishSequence';
import modelBase64 from './retroComputerModel';
import { isPlainSceneKey } from './sceneKeys';
import { createCurvedScreenGeometry, MAX_SCREEN_BULGE } from './screenGeometry';
import { CURSOR_BLINK_MS, ScreenRenderer } from './screenRenderer';
import {
  DRIVE_BAYS,
  EJECT_PRESS_DEPTH,
  POWER_PRESS_DEPTH,
  splitTowerButtons,
  type TowerButtons,
} from './towerParts';
import {
  createInsideBadge,
  createStickyNote,
  DEFAULT_BADGE_TEXT,
  DEFAULT_NOTE_CONTENT,
  DEFAULT_NOTE_POSITION,
  DEFAULT_NOTE_TEXT,
  placeNote,
  type Sticker,
  type StickyNote,
} from './stickers';
import { useSnakeGame } from './useSnakeGame';
import {
  aspectRatioCss,
  backgroundCss,
  type CrtSettings,
  DEFAULT_ACCESSIBLE_NAME,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_BACKGROUND,
  DEFAULT_CRT,
  DEFAULT_DESK_COLOR,
  DEFAULT_LIGHTING,
  DEFAULT_MAX_PIXEL_RATIO,
  type BackgroundSettings,
  type LightingSettings,
  resolveSettings,
} from './settings';

export interface RetroComputerProps
  extends Partial<LightingSettings>, Partial<BackgroundSettings>, Partial<CrtSettings> {
  showCords?: boolean;
  showDesk?: boolean;
  /** CSS colour for the desk surface. Replaces the exported wood swatch. */
  deskColor?: string;
  screenBackground?: string;
  screenText?: string;
  cameraPosition?: Vector3Tuple;
  cameraTarget?: Vector3Tuple;
  cameraFov?: number;
  /** Width to height, like "3:2". The component spans its container's width. */
  aspectRatio?: string;
  /** Lets you orbit the camera to dial in a view; reports it through `onCameraChange`. */
  editCamera?: boolean;
  onCameraChange?: (camera: RetroComputerCamera) => void;
  onEnterPress?: () => void;
  preserveDrawingBuffer?: boolean;
  /** Caps the device pixel ratio (1–2). Lower is cheaper on high-density screens. */
  maxPixelRatio?: number;
  /** Comma separated CSS colors for the publish fireworks. */
  fireworkColors?: string;
  /** How much the keyboard and tower buttons brighten on hover. 1 turns it off. */
  hoverBrightness?: number;
  /** The sticky note. */
  showNote?: boolean;
  /** What the note shows: one of `NOTE_CONTENTS`. */
  noteContent?: string;
  /** Handwriting on the note when `noteContent` is 'Text'. */
  noteText?: string;
  /** Where the note is stuck: one of `NOTE_POSITIONS`. */
  notePosition?: string;
  /** The foil "inside" badge on the tower's front. */
  showBadge?: boolean;
  /** Brand name printed above "inside" on the badge. */
  badgeText?: string;
  /** What screen readers call the scene. The keyboard instructions are read after it. */
  accessibleName?: string;
}

const CORD_NODES = ['Cord_Keyboard', 'Cord_Mouse'];
const DESK_NODE = 'Desk';
const KEYBOARD_NODE = 'Keyboard';
const MONITOR_NODE = 'Monitor';
const SCREEN_NODE = 'Screen';
const TOWER_NODE = 'Tower';

const ENTER_PRESS_DEPTH = 0.12;
const PRESS_DURATION_MS = 220;
const SCREEN_FRAME_MS = 50;

/** Only live pages get keyboard controls, so the Designer and Editor keep their own shortcuts. */
const KEYBOARD_MODES = new Set(['publish', 'preview', 'component-preview']);

const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

interface ModelLights {
  /** Shared by every glowing triangle on the tower and monitor, so one uniform dims them all. */
  material: THREE.MeshStandardMaterial;
  intensity: number;
}

/** A clickable part that brightens on hover; `parts` are the meshes that count as hovering it. */
interface HoverTarget {
  parts: THREE.Object3D[];
  highlight: (level: number, brightness: number) => void;
}

interface LoadedModel extends TowerButtons {
  scene: THREE.Group;
  /** Clicking anywhere on it presses the Enter key. */
  keyboard: THREE.Mesh | null;
  enterKey: THREE.Mesh | null;
  /** The keycap's animated swatch while powered, and a still blue for when the lights are out. */
  enterKeyMaterials: { lit: THREE.Material; still: THREE.Material } | null;
  /** The keyboard (with its Enter key), power button and eject buttons. */
  hoverTargets: HoverTarget[];
  /** Own copies of desk materials so tinting them leaves the rest of the scene alone. */
  deskMaterials: THREE.MeshStandardMaterial[];
  /** One per entry in `DRIVE_BAYS`, parented to the tower. */
  discs: THREE.Mesh[];
  /** The badge is parented to the tower; the note moves between `noteParents`. */
  stickers: {
    note: StickyNote;
    badge: Sticker;
    noteParents: { monitor: THREE.Object3D | null; tower: THREE.Object3D | null };
  } | null;
  lights: ModelLights | null;
  animatedSwatches: boolean;
  frame: { value: number };
}

/** Moves the glowing parts of `meshes` (LEDs, logo) onto their own material so they can switch off. */
function splitLights(
  meshes: (THREE.Object3D | undefined)[],
  attributes: THREE.Texture,
  frame: { value: number }
): ModelLights | null {
  let material: THREE.MeshStandardMaterial | null = null;
  for (const mesh of meshes) {
    if (!(mesh instanceof THREE.Mesh) || !(mesh.material instanceof THREE.MeshStandardMaterial)) {
      continue;
    }
    const lit = createEmissiveTest(mesh);
    if (!lit) continue;
    if (!material) {
      material = mesh.material.clone();
      preparePixPalMaterial(material, attributes, frame);
    }
    splitTriangles(mesh, `${mesh.name}Lights`, lit, material);
  }
  return material && { material, intensity: material.emissiveIntensity };
}

/** Gives `mesh` its own copy of the shared PixPal material, so tinting it leaves the rest alone. */
function ownMaterial(
  mesh: THREE.Mesh | null,
  attributes: THREE.Texture,
  frame: { value: number },
  albedo: 'map' | 'color' = 'map'
): THREE.MeshStandardMaterial | null {
  if (!mesh || !(mesh.material instanceof THREE.MeshStandardMaterial)) return null;
  const material = mesh.material.clone();
  preparePixPalMaterial(material, attributes, frame, albedo);
  mesh.material = material;
  return material;
}

/** Owns every MeshStandardMaterial under `root` (the root itself if it is a mesh). */
function ownMaterialsUnder(
  root: THREE.Object3D | undefined,
  attributes: THREE.Texture,
  frame: { value: number },
  albedo: 'map' | 'color' = 'map'
): THREE.MeshStandardMaterial[] {
  if (!root) return [];
  const owned: THREE.MeshStandardMaterial[] = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = ownMaterial(object, attributes, frame, albedo);
    if (material) owned.push(material);
  });
  return owned;
}

function addDiscs(tower: THREE.Mesh, environment: THREE.Texture | null) {
  const face = createDiscTexture();
  return DRIVE_BAYS.map(({ slot }) => {
    const disc = createCompactDisc();
    const material = disc.material as THREE.MeshStandardMaterial;
    material.envMap = environment;
    material.map = face;
    disc.position.set(slot[0], slot[1], discZ(slot[2], 0));
    tower.add(disc);
    return disc;
  });
}

function addStickers(
  tower: THREE.Mesh,
  monitor: THREE.Object3D | null,
  environment: THREE.Texture | null
) {
  const note = createStickyNote();
  const badge = createInsideBadge(environment);
  tower.add(badge.object);
  return { note, badge, noteParents: { monitor, tower } };
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
    let stillEnterKey: THREE.MeshStandardMaterial | null = null;

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
        const keyboardNode = gltf.scene.getObjectByName(KEYBOARD_NODE);
        const keyboard = keyboardNode instanceof THREE.Mesh ? keyboardNode : null;
        const keyboardMaterial = ownMaterial(keyboard, attributes, frame);
        const enterKey = keyboard ? splitEnterKey(keyboard) : null;
        if (enterKey) stillEnterKey = createStillEnterKeyMaterial();
        const enterKeyMaterials =
          enterKey && stillEnterKey
            ? { lit: enterKey.material as THREE.Material, still: stillEnterKey }
            : null;
        // Before the discs go in: their UVs don't point into the PixPal palette.
        const animatedSwatches = sceneUsesAnimatedSwatches(gltf.scene, attributes);
        const tower = gltf.scene.getObjectByName(TOWER_NODE);
        const buttons: TowerButtons =
          tower instanceof THREE.Mesh
            ? splitTowerButtons(tower)
            : { powerButton: null, ejectButtons: [] };
        const hoverTargets: HoverTarget[] = [];
        if (keyboard && keyboardMaterial) {
          hoverTargets.push({
            parts: enterKey ? [keyboard, enterKey] : [keyboard],
            highlight: createHoverHighlight(
              stillEnterKey ? [keyboardMaterial, stillEnterKey] : [keyboardMaterial]
            ),
          });
        }
        for (const button of [buttons.powerButton, ...buttons.ejectButtons]) {
          const material = ownMaterial(button, attributes, frame);
          if (button && material) {
            hoverTargets.push({ parts: [button], highlight: createHoverHighlight([material]) });
          }
        }
        const environment = tower instanceof THREE.Mesh ? createDiscEnvironment() : null;
        const discs = tower instanceof THREE.Mesh ? addDiscs(tower, environment) : [];
        const monitor = gltf.scene.getObjectByName(MONITOR_NODE) ?? null;
        const stickers =
          tower instanceof THREE.Mesh ? addStickers(tower, monitor, environment) : null;
        const lights = splitLights([tower, monitor ?? undefined], attributes, frame);
        const deskMaterials = ownMaterialsUnder(
          gltf.scene.getObjectByName(DESK_NODE),
          attributes,
          frame,
          'color'
        );
        setModel({
          scene: gltf.scene,
          keyboard,
          enterKey,
          enterKeyMaterials,
          hoverTargets,
          deskMaterials,
          ...buttons,
          discs,
          stickers,
          lights,
          animatedSwatches,
          frame,
        });
      })
      .catch((error) => console.error('RetroComputer: failed to load model', error));

    return () => {
      cancelled = true;
      if (loaded) disposeScene(loaded);
      attributesTexture?.dispose();
      stillEnterKey?.dispose();
    };
  }, []);

  return model;
}

const RIM_LIGHT_POSITION: Vector3Tuple = [16, 10, -14];

/** Warm key from the front left that pools on the desk, a cool rim from behind, and a dim fill. */
function StudioLights({ lighting }: { lighting: LightingSettings }) {
  const keyTarget = useMemo(() => new THREE.Object3D(), []);

  return (
    <>
      <hemisphereLight intensity={lighting.fillIntensity} color="#f6f1ea" groundColor="#2a1f18" />
      <primitive object={keyTarget} position={lighting.keyLightTarget} />
      <spotLight
        position={lighting.keyLightPosition}
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

/** Flush with the desk's back edge, and big enough to fill the frame from any sensible camera. */
const WALL_Z = -6.3;
const WALL_SIZE: [number, number] = [400, 200];

/** Stands in for the CSS glow, which the wall would hide: a lamp just in front of the wall. */
const WALL_GLOW_POSITION: Vector3Tuple = [2, 7, WALL_Z + 2];
const WALL_GLOW_INTENSITY = 40;

function Wall({ background }: { background: BackgroundSettings }) {
  if (background.backgroundColor.trim().toLowerCase() === 'transparent') return null;
  const glow = Math.min(Math.max(background.backgroundGlowStrength, 0), 1);
  return (
    <>
      <mesh position={[0, WALL_SIZE[1] / 2 - 1, WALL_Z]}>
        <planeGeometry args={WALL_SIZE} />
        <meshStandardMaterial color={background.backgroundColor} roughness={0.95} />
      </mesh>
      <pointLight
        position={WALL_GLOW_POSITION}
        color={background.backgroundGlowColor}
        intensity={glow * WALL_GLOW_INTENSITY}
        distance={30}
        decay={1}
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
  deskColor,
  showNote,
  noteContent,
  noteText,
  notePosition,
  showBadge,
  badgeText,
  screen,
  reducedMotion,
  active,
  crt,
  hoverBrightness,
  focused,
  keyTarget,
  keyboardEnabled,
  onEnterPress,
  onHoverChange,
  onAnnounce,
}: {
  model: LoadedModel;
  showCords: boolean;
  showDesk: boolean;
  deskColor: string;
  showNote: boolean;
  noteContent: string;
  noteText: string;
  notePosition: string;
  showBadge: boolean;
  badgeText: string;
  screen: ScreenRenderer;
  crt: CrtSettings;
  hoverBrightness: number;
  reducedMotion: boolean;
  /** False while scrolled out of view: skip all redraws. */
  active: boolean;
  /** Whether the scene wrapper has keyboard focus. Snake pauses without it. */
  focused: boolean;
  keyTarget: RefObject<HTMLElement | null>;
  keyboardEnabled: boolean;
  onEnterPress: () => void;
  onHoverChange: (hovered: boolean) => void;
  onAnnounce: (message: string) => void;
}) {
  const {
    scene,
    keyboard,
    enterKey,
    enterKeyMaterials,
    hoverTargets,
    deskMaterials,
    powerButton,
    ejectButtons,
    discs,
    stickers,
    lights,
    frame,
    animatedSwatches,
  } = model;
  const invalidate = useThree((state) => state.invalidate);
  const swatchClockStart = useRef(performance.now());
  const swatchClockRunning = animatedSwatches && !reducedMotion;
  const presses = useRef(
    new Map<THREE.Object3D, { startedAt: number; axis: 'y' | 'z'; depth: number }>()
  );
  const publishStartedAt = useRef<number | null>(null);
  const power = useRef<PowerAction | null>(null);
  const screenState = useRef<ScreenState>({ phase: 'idle' });
  const refreshScreen = useRef<() => void>(() => {});
  const discMotions = useRef<(DiscMotion | null)[]>([]);
  const discExtensions = useRef<number[]>([]);
  /** One per entry in `hoverTargets`. */
  const hoverFades = useRef<HoverFade[]>([]);
  const pressEnterKey = useRef<() => void>(() => {});

  const poweredOn = () =>
    isPoweredOn(getPowerState(power.current, performance.now(), reducedMotion));

  const { game: snakeGame, quit: quitSnake } = useSnakeGame({
    keyTarget,
    enabled: keyboardEnabled,
    running: focused && active,
    canStart: () => poweredOn() && !isPublishRunning(screenState.current),
    onChange: () => refreshScreen.current(),
    onAnnounce,
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

  useLayoutEffect(() => {
    if (deskMaterials.length === 0) return;
    for (const material of deskMaterials) material.color.set(deskColor);
    invalidate();
  }, [deskMaterials, deskColor, invalidate]);

  useLayoutEffect(() => {
    if (!stickers) return;
    placeNote(stickers.note.object, notePosition, stickers.noteParents);
    stickers.note.object.visible = showNote;
    stickers.note.setContent(noteContent, noteText);
    stickers.badge.object.visible = showBadge;
    stickers.badge.setText(badgeText);
    invalidate();
  }, [stickers, showNote, noteContent, noteText, notePosition, showBadge, badgeText, invalidate]);

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
      const powerState = getPowerState(power.current, now, reducedMotion);
      if (power.current?.action === 'boot' && isPoweredOn(powerState)) power.current = null;
      const level = lightLevel(powerState);
      if (lights) lights.material.emissiveIntensity = lights.intensity * level;
      if (enterKey && enterKeyMaterials) {
        enterKey.material = level < 1 ? enterKeyMaterials.still : enterKeyMaterials.lit;
      }
      const previous = screenState.current;
      const state = getScreenState(publishStartedAt.current, now, reducedMotion);
      screenState.current = state;
      const running = isPublishRunning(state);
      if (state.phase === 'published' && isPublishRunning(previous)) onAnnounce('Published.');
      const animating = running || isPowerAnimating(powerState);
      if (active) {
        const game = snakeGame.current;
        if (!isPoweredOn(powerState)) screen.renderPower(powerState, now, reducedMotion);
        else if (game) screen.renderSnake(game, now, !focused, reducedMotion);
        else screen.render(state, now, reducedMotion);
        if (!swatchClockRunning) invalidate();
      }
      // Offscreen, keep ticking only while a publish sequence is still in flight.
      if (!active && !running) return;
      const delay = animating ? SCREEN_FRAME_MS : CURSOR_BLINK_MS - (now % CURSOR_BLINK_MS);
      timer = window.setTimeout(tick, delay);
    };
    refreshScreen.current = tick;
    tick();
    return () => window.clearTimeout(timer);
  }, [
    screen,
    reducedMotion,
    active,
    focused,
    lights,
    enterKey,
    enterKeyMaterials,
    snakeGame,
    swatchClockRunning,
    onAnnounce,
    invalidate,
  ]);

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

  useEffect(() => invalidate(), [hoverBrightness, invalidate]);

  useFrame(() => {
    const now = performance.now();
    let moving = false;
    for (const [part, press] of presses.current) {
      const progress = Math.min((now - press.startedAt) / PRESS_DURATION_MS, 1);
      part.position[press.axis] = -press.depth * Math.sin(progress * Math.PI);
      if (progress < 1) moving = true;
      else presses.current.delete(part);
    }
    discs.forEach((disc, index) => {
      const motion = discMotions.current[index];
      if (!motion) return;
      const { extension, done } = discExtension(motion, now, reducedMotion);
      discExtensions.current[index] = extension;
      disc.position.z = discZ(DRIVE_BAYS[index].slot[2], extension);
      disc.rotation.x = discDroop(extension);
      disc.rotation.y = discSpin(extension);
      disc.visible = !done || extension > 0;
      if (done) discMotions.current[index] = null;
      else moving = true;
    });
    hoverTargets.forEach((target, index) => {
      const fade = hoverFades.current[index] ?? RESTING_HOVER;
      const { level, done } = hoverLevel(fade, now, reducedMotion);
      target.highlight(level, hoverBrightness);
      if (!done) moving = true;
    });
    if (moving) invalidate();
  });

  const press = (part: THREE.Object3D, axis: 'y' | 'z', depth: number) => {
    presses.current.set(part, { startedAt: performance.now(), axis, depth });
    invalidate();
  };

  const pressEnter = (key: THREE.Mesh) => {
    press(key, 'y', ENTER_PRESS_DEPTH);
    onEnterPress();
    if (!poweredOn() || isPublishRunning(screenState.current)) return;
    quitSnake();
    publishStartedAt.current = performance.now();
    onAnnounce('Publishing your site.');
    refreshScreen.current();
  };

  useEffect(() => {
    pressEnterKey.current = () => {
      if (enterKey) pressEnter(enterKey);
    };
  });

  // Enter on the focused scene presses the keyboard's Enter key, exactly like clicking the keyboard.
  useEffect(() => {
    const element = keyTarget.current;
    if (!keyboardEnabled || !element || !enterKey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || !isPlainSceneKey(event, element)) return;
      event.preventDefault();
      pressEnterKey.current();
    };
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [keyboardEnabled, keyTarget, enterKey]);

  /** Shuts down when on and boots when off; the computer stays dark in between. */
  const pressPower = (button: THREE.Mesh) => {
    press(button, 'z', POWER_PRESS_DEPTH);
    const now = performance.now();
    const next = nextPowerAction(getPowerState(power.current, now, reducedMotion), now);
    if (!next) return;
    if (next.action === 'shutdown') {
      quitSnake();
      publishStartedAt.current = null;
      onAnnounce('Shutting down.');
    } else {
      onAnnounce('Starting up.');
    }
    power.current = next;
    refreshScreen.current();
  };

  /** Ejects the disc in bay `index`, or loads it back in if it's out (or on its way out). */
  const toggleDisc = (index: number) => {
    if (!poweredOn()) return;
    const extension = discExtensions.current[index] ?? 0;
    const heading = discMotions.current[index]?.to ?? (extension > 0.5 ? 1 : 0);
    discMotions.current[index] = {
      from: extension,
      to: heading === 1 ? 0 : 1,
      startedAt: performance.now(),
    };
    invalidate();
  };

  const hitPart = (event: ThreeEvent<PointerEvent | MouseEvent>) =>
    event.intersections.find((hit) => isVisible(hit.object))?.object ?? null;

  const isKeyboard = (part: THREE.Object3D) => part === enterKey || part === keyboard;

  const isClickable = (part: THREE.Object3D | null) =>
    part !== null &&
    (isKeyboard(part) ||
      part === powerButton ||
      ejectButtons.includes(part as THREE.Mesh) ||
      discs.includes(part as THREE.Mesh));

  /** Fades the target under the pointer up and every other target back down. */
  const hoverPart = (part: THREE.Object3D | null) => {
    const now = performance.now();
    let changed = false;
    hoverTargets.forEach((target, index) => {
      const fade = hoverFades.current[index] ?? RESTING_HOVER;
      const hovered = part !== null && target.parts.includes(part);
      const next = retargetHover(fade, hovered ? 1 : 0, now, reducedMotion);
      if (next === fade) return;
      hoverFades.current[index] = next;
      changed = true;
    });
    if (changed) invalidate();
  };

  return (
    <primitive
      object={scene}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const part = hitPart(event);
        onHoverChange(isClickable(part));
        hoverPart(part);
      }}
      onPointerOut={() => {
        onHoverChange(false);
        hoverPart(null);
      }}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const part = hitPart(event);
        if (!part) return;
        if (isKeyboard(part)) {
          if (enterKey) pressEnter(enterKey);
        } else if (part === powerButton) {
          pressPower(powerButton);
        } else if (ejectButtons.includes(part as THREE.Mesh)) {
          press(part, 'z', EJECT_PRESS_DEPTH);
          toggleDisc(ejectButtons.indexOf(part as THREE.Mesh));
        } else if (discs.includes(part as THREE.Mesh)) {
          toggleDisc(discs.indexOf(part as THREE.Mesh));
        }
      }}
    />
  );
}

export default function RetroComputer(props: RetroComputerProps) {
  const {
    showCords = true,
    showDesk = true,
    deskColor = DEFAULT_DESK_COLOR,
    showNote = true,
    noteContent = DEFAULT_NOTE_CONTENT,
    noteText = DEFAULT_NOTE_TEXT,
    notePosition = DEFAULT_NOTE_POSITION,
    showBadge = true,
    badgeText = DEFAULT_BADGE_TEXT,
    screenBackground = '#0a0e16',
    screenText = '#4b8bff',
    cameraPosition = DEFAULT_CAMERA.position,
    cameraTarget = DEFAULT_CAMERA.target,
    cameraFov = DEFAULT_CAMERA.fov,
    aspectRatio = DEFAULT_ASPECT_RATIO,
    editCamera = false,
    onCameraChange,
    onEnterPress,
    preserveDrawingBuffer = false,
    maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO,
    fireworkColors,
    hoverBrightness = DEFAULT_HOVER_BRIGHTNESS,
    accessibleName,
  } = props;
  const lighting = resolveSettings(DEFAULT_LIGHTING, props);
  const background = resolveSettings(DEFAULT_BACKGROUND, props);
  const crt = resolveSettings(DEFAULT_CRT, props);
  const model = useRetroComputerScene();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(wrapperRef);
  const [partHovered, setPartHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const hintId = useId();
  const { mode, interactive } = useWebflowContext();
  const keyboardEnabled = interactive && KEYBOARD_MODES.has(mode);

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const screen = useMemo(
    () => new ScreenRenderer(screenBackground, screenText, parseColorList(fireworkColors)),
    [screenBackground, screenText, fireworkColors]
  );
  useEffect(() => () => screen.dispose(), [screen]);

  return (
    <div
      ref={wrapperRef}
      // A single tab stop: no focus trap, Tab moves on as usual, and keys only apply while focused.
      tabIndex={keyboardEnabled ? 0 : undefined}
      // `application` makes screen readers pass S and the arrow keys through instead of browsing.
      role={keyboardEnabled ? 'application' : undefined}
      aria-label={keyboardEnabled ? accessibleName?.trim() || DEFAULT_ACCESSIBLE_NAME : undefined}
      aria-describedby={keyboardEnabled ? hintId : undefined}
      aria-keyshortcuts={keyboardEnabled ? 'Enter S' : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspectRatioCss(aspectRatio),
        background: backgroundCss(background),
        cursor: partHovered ? 'pointer' : editCamera ? 'grab' : 'default',
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
          onChange={onCameraChange}
        />
        <StudioLights lighting={lighting} />
        {background.showWall && <Wall background={background} />}

        {model && (
          <Model
            model={model}
            showCords={showCords}
            showDesk={showDesk}
            deskColor={deskColor}
            showNote={showNote}
            noteContent={noteContent}
            noteText={noteText}
            notePosition={notePosition}
            showBadge={showBadge}
            badgeText={badgeText}
            screen={screen}
            reducedMotion={reducedMotion}
            active={onScreen}
            crt={crt}
            hoverBrightness={hoverBrightness}
            focused={focused}
            keyTarget={wrapperRef}
            keyboardEnabled={keyboardEnabled}
            onEnterPress={() => onEnterPress?.()}
            onHoverChange={setPartHovered}
            onAnnounce={setAnnouncement}
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
      {keyboardEnabled && (
        <>
          <span id={hintId} style={VISUALLY_HIDDEN}>
            Press Enter to publish. Press S to play Snake: arrow keys steer, Escape quits.
          </span>
          <span aria-live="polite" style={VISUALLY_HIDDEN}>
            {announcement}
          </span>
        </>
      )}
    </div>
  );
}
