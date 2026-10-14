import { useControls } from 'leva';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';

import {
  DEFAULT_CAMERA,
  type RetroComputerCamera,
  type Vector3Tuple,
} from '../components/RetroComputer/camera';

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
  const [copied, setCopied] = useState(false);

  const modelControls = useControls('Model', {
    showCords: true,
    showDesk: true,
  });

  const { backgroundColor, pageBackground } = useControls('Scene', {
    backgroundColor: '#0b0b0c',
    pageBackground: {
      value: 'Dark' as PageBackgroundName,
      options: Object.keys(PAGE_BACKGROUNDS) as PageBackgroundName[],
    },
  });

  const screenControls = useControls('Screen', {
    screenBackground: '#0a0e16',
    screenText: '#4b8bff',
  });

  const [camera, setCamera] = useControls('Camera', () => ({
    orbitToAdjust: { value: true, label: 'orbit to adjust' },
    position: { value: DEFAULT_CAMERA.position, step: 0.1 },
    target: { value: DEFAULT_CAMERA.target, step: 0.1 },
    fov: { value: DEFAULT_CAMERA.fov, min: 10, max: 70, step: 1 },
  }));

  const { enterHref } = useControls('Interaction', {
    enterHref: '',
  });

  const handleEnterPress = useCallback(() => setEnterPresses((count) => count + 1), []);

  const handleCameraChange = useCallback(
    ({ position, target }: RetroComputerCamera) => setCamera({ position, target }),
    [setCamera]
  );

  const handleCopyCamera = useCallback(async () => {
    const settings = JSON.stringify(
      { position: camera.position, target: camera.target, fov: camera.fov },
      null,
      2
    );
    await navigator.clipboard.writeText(settings);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [camera.position, camera.target, camera.fov]);

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
            {...screenControls}
            backgroundColor={backgroundColor}
            enterLink={enterHref ? { href: enterHref } : undefined}
            cameraPosition={camera.position as Vector3Tuple}
            cameraTarget={camera.target as Vector3Tuple}
            cameraFov={camera.fov}
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
        <button type="button" onClick={handleCopyCamera} style={buttonStyle}>
          {copied ? 'Copied!' : 'Copy camera settings'}
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
