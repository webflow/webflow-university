import { useControls } from 'leva';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';

import {
  DEFAULT_CAMERA,
  type RetroComputerCamera,
  type Vector3Tuple,
} from '../components/RetroComputer/camera';
import { FIREWORK_COLORS } from '../components/RetroComputer/celebration';
import { DEFAULT_HOVER_BRIGHTNESS } from '../components/RetroComputer/partHover';
import {
  ASPECT_RATIOS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_BACKGROUND,
  DEFAULT_CRT,
  DEFAULT_DESK_COLOR,
  DEFAULT_LIGHTING,
  DEFAULT_MAX_PIXEL_RATIO,
} from '../components/RetroComputer/settings';
import {
  DEFAULT_BADGE_TEXT,
  DEFAULT_NOTE_POSITION,
  DEFAULT_NOTE_TEXT,
  NOTE_POSITIONS,
} from '../components/RetroComputer/stickers';

const RetroComputer = lazy(() => import('../components/RetroComputer/RetroComputer'));

const PAGE_BACKGROUNDS = {
  Dark: '#0b0b0c',
  Light: '#f5f5f5',
  'Webflow Blue': '#146ef5',
} satisfies Record<string, string>;

type PageBackgroundName = keyof typeof PAGE_BACKGROUNDS;

const buttonStyle: React.CSSProperties = {
  height: '34px',
  border: 0,
  borderRadius: '999px',
  background: '#146EF5',
  color: '#fff',
  padding: '0 14px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
};

function RetroComputerPage() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [enterPresses, setEnterPresses] = useState(0);
  const [copied, setCopied] = useState<'camera' | 'look' | null>(null);

  const modelControls = useControls('Model', {
    showCords: true,
    showDesk: true,
    deskColor: DEFAULT_DESK_COLOR,
    hoverBrightness: { value: DEFAULT_HOVER_BRIGHTNESS, min: 1, max: 2, step: 0.01 },
  });

  const stickerControls = useControls('Stickers', {
    showNote: true,
    noteText: DEFAULT_NOTE_TEXT,
    notePosition: { value: DEFAULT_NOTE_POSITION, options: NOTE_POSITIONS },
    showBadge: true,
    badgeText: DEFAULT_BADGE_TEXT,
  });

  const lighting = useControls('Lighting', {
    keyLightColor: DEFAULT_LIGHTING.keyLightColor,
    keyLightIntensity: { value: DEFAULT_LIGHTING.keyLightIntensity, min: 0, max: 20, step: 0.1 },
    keyLightPosition: { value: DEFAULT_LIGHTING.keyLightPosition, step: 0.5 },
    keyLightTarget: { value: DEFAULT_LIGHTING.keyLightTarget, step: 0.5 },
    fillIntensity: { value: DEFAULT_LIGHTING.fillIntensity, min: 0, max: 3, step: 0.01 },
    rimLightColor: DEFAULT_LIGHTING.rimLightColor,
    rimLightIntensity: { value: DEFAULT_LIGHTING.rimLightIntensity, min: 0, max: 5, step: 0.01 },
    bloomIntensity: { value: DEFAULT_LIGHTING.bloomIntensity, min: 0, max: 3, step: 0.01 },
    bloomThreshold: { value: DEFAULT_LIGHTING.bloomThreshold, min: 0, max: 10, step: 0.1 },
  });

  const { pageBackground, ...background } = useControls('Background', {
    backgroundColor: DEFAULT_BACKGROUND.backgroundColor,
    backgroundGlowColor: DEFAULT_BACKGROUND.backgroundGlowColor,
    backgroundGlowStrength: {
      value: DEFAULT_BACKGROUND.backgroundGlowStrength,
      min: 0,
      max: 1,
      step: 0.01,
    },
    pageBackground: {
      value: 'Dark' as PageBackgroundName,
      options: Object.keys(PAGE_BACKGROUNDS) as PageBackgroundName[],
    },
  });

  const screenControls = useControls('Screen', {
    screenBackground: '#0a0e16',
    screenText: '#4b8bff',
    fireworkColors: FIREWORK_COLORS.join(', '),
    screenGlow: { value: DEFAULT_CRT.screenGlow, min: 0, max: 2, step: 0.01 },
    scanlines: { value: DEFAULT_CRT.scanlines, min: 0, max: 1, step: 0.01 },
    vignette: { value: DEFAULT_CRT.vignette, min: 0, max: 1, step: 0.01 },
    curvature: { value: DEFAULT_CRT.curvature, min: 0, max: 1, step: 0.01 },
    chromaticAberration: {
      value: DEFAULT_CRT.chromaticAberration,
      min: 0,
      max: 1,
      step: 0.01,
      label: 'color fringing',
    },
  });

  const { maxPixelRatio } = useControls('Performance', {
    maxPixelRatio: { value: DEFAULT_MAX_PIXEL_RATIO, min: 1, max: 2, step: 0.1 },
  });

  const [camera, setCamera] = useControls('Camera', () => ({
    orbitToAdjust: { value: true, label: 'orbit to adjust' },
    position: { value: DEFAULT_CAMERA.position, step: 0.1 },
    target: { value: DEFAULT_CAMERA.target, step: 0.1 },
    fov: { value: DEFAULT_CAMERA.fov, min: 10, max: 70, step: 1 },
    aspectRatio: { value: DEFAULT_ASPECT_RATIO, options: ASPECT_RATIOS },
  }));

  const handleEnterPress = useCallback(() => setEnterPresses((count) => count + 1), []);

  const handleCameraChange = useCallback(
    ({ position, target }: RetroComputerCamera) => setCamera({ position, target }),
    [setCamera]
  );

  const copySettings = useCallback(async (kind: 'camera' | 'look', settings: object) => {
    await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }, []);

  const lookSettings = {
    ...lighting,
    ...background,
    ...screenControls,
    hoverBrightness: modelControls.hoverBrightness,
    maxPixelRatio,
  };

  const handleSavePng = useCallback(() => {
    const canvas = sceneRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'retro-computer.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: PAGE_BACKGROUNDS[pageBackground],
      }}
    >
      <div ref={sceneRef} style={{ width: 'min(100%, 960px)' }}>
        <Suspense fallback={null}>
          <RetroComputer
            {...modelControls}
            {...stickerControls}
            {...screenControls}
            {...lighting}
            {...background}
            maxPixelRatio={maxPixelRatio}
            cameraPosition={camera.position as Vector3Tuple}
            cameraTarget={camera.target as Vector3Tuple}
            cameraFov={camera.fov}
            aspectRatio={camera.aspectRatio}
            editCamera={camera.orbitToAdjust}
            onCameraChange={handleCameraChange}
            onEnterPress={handleEnterPress}
            preserveDrawingBuffer
          />
        </Suspense>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '20px',
          bottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#9a9a9a',
          fontSize: '13px',
        }}
      >
        <button
          type="button"
          onClick={() =>
            copySettings('camera', {
              position: camera.position,
              target: camera.target,
              fov: camera.fov,
            })
          }
          style={buttonStyle}
        >
          {copied === 'camera' ? 'Copied!' : 'Copy camera settings'}
        </button>
        <button
          type="button"
          onClick={() => copySettings('look', lookSettings)}
          style={buttonStyle}
        >
          {copied === 'look' ? 'Copied!' : 'Copy look settings'}
        </button>
        <button type="button" onClick={handleSavePng} style={buttonStyle}>
          Save PNG
        </button>
        <span data-testid="enter-presses">Enter pressed: {enterPresses}</span>
      </div>
    </div>
  );
}

export default RetroComputerPage;
