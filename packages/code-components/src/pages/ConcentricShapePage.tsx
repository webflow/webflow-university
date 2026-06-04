import { useControls } from 'leva';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';

const ConcentricShape = lazy(() => import('../components/ConcentricShape/ConcentricShape'));

const SNAPSHOT_ASPECT_RATIOS = [
  { label: '16:9', value: '16:9', width: 16, height: 9 },
  { label: '1:1', value: '1:1', width: 1, height: 1 },
  { label: '4:5', value: '4:5', width: 4, height: 5 },
  { label: '9:16', value: '9:16', width: 9, height: 16 },
  { label: '4:3', value: '4:3', width: 4, height: 3 },
];

function LoadingSpinner() {
  return (
    <>
      <style>
        {`
          @keyframes concentrics-shape-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080808',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(20, 110, 245, 0.2)',
            borderTopColor: '#146EF5',
            borderRadius: '50%',
            animation: 'concentrics-shape-spin 1s linear infinite',
            boxShadow: '0 0 20px rgba(20, 110, 245, 0.5)',
          }}
        />
      </div>
    </>
  );
}

function ConcentricShapePage() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [snapshotAspectRatio, setSnapshotAspectRatio] = useState('16:9');

  // Bloom controls
  const bloomControls = useControls('Bloom', {
    bloomIntensity: { value: 0.2, min: 0, max: 10, step: 0.1 },
    bloomThreshold: { value: 0.0, min: 0, max: 1, step: 0.05 },
    bloomSmoothing: { value: 0.3, min: 0, max: 1, step: 0.05 },
    bloomRadius: { value: 0.8, min: 0, max: 1, step: 0.05 },
  });

  // Vignette controls
  const vignetteControls = useControls('Vignette', {
    vignetteOffset: { value: 0.75, min: 0, max: 1, step: 0.05 },
    vignetteDarkness: { value: 0.75, min: 0, max: 1, step: 0.05 },
  });

  // Shape controls
  const shapeControls = useControls('Shape', {
    scale: { value: 1, min: 0.1, max: 5, step: 0.1 },
    vertexCount: {
      value: 5,
      min: 3,
      max: 12,
      step: 1,
      label: 'Vertex Count (3=triangle, 4=square, 5=pentagon, etc.)',
    },
    shapeCount: { value: 5, min: 3, max: 20, step: 1 },
    innerRadius: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
    outerRadius: { value: 3, min: 1, max: 10, step: 0.1 },
    rotationSpeed: { value: 0.1, min: 0, max: 2, step: 0.05 },
  });

  // Material controls
  const materialControls = useControls('Material', {
    glowIntensity: { value: 1.5, min: 0, max: 20, step: 0.5 },
    coreIntensity: { value: 2.5, min: 0, max: 20, step: 0.5 },
  });

  // Transparency controls
  const transparencyControls = useControls('Transparency', {
    radialFadeStart: { value: 0.5, min: 0, max: 5, step: 0.1 },
    radialFadeEnd: { value: 3.0, min: 0, max: 10, step: 0.1 },
  });

  // Beam controls
  // Beam speed uses a multiplier: slider 0-10 maps to speed 0-0.5
  const BEAM_SPEED_MULTIPLIER = 0.05;
  const beamSpeedSlider = useControls('Beam', {
    beamSpeed: { value: 3, min: 0, max: 10, step: 1, label: 'Beam Speed (0-10)' },
    beamIntensity: { value: 4.0, min: 0, max: 10, step: 0.5 },
    beamWidth: { value: 0.12, min: 0.05, max: 0.5, step: 0.05 },
    tailLength: { value: 0.3, min: 0.1, max: 1.0, step: 0.05 },
  });

  // Convert slider value to actual beam speed
  const beamControls = {
    ...beamSpeedSlider,
    beamSpeed: beamSpeedSlider.beamSpeed * BEAM_SPEED_MULTIPLIER,
  };

  // Color control
  const colorControls = useControls('Appearance', {
    color: { value: '#146EF5' },
  });

  const handleSnapshot = useCallback(() => {
    const sourceCanvas = sceneRef.current?.querySelector('canvas');
    const selectedRatio =
      SNAPSHOT_ASPECT_RATIOS.find((ratio) => ratio.value === snapshotAspectRatio) ??
      SNAPSHOT_ASPECT_RATIOS[0];

    if (!sourceCanvas) {
      return;
    }

    const sourceWidth = sourceCanvas.width;
    const sourceHeight = sourceCanvas.height;
    const targetRatio = selectedRatio.width / selectedRatio.height;
    const sourceRatio = sourceWidth / sourceHeight;

    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let cropX = 0;
    let cropY = 0;

    if (sourceRatio > targetRatio) {
      cropWidth = sourceHeight * targetRatio;
      cropX = (sourceWidth - cropWidth) / 2;
    } else {
      cropHeight = sourceWidth / targetRatio;
      cropY = (sourceHeight - cropHeight) / 2;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = Math.round(cropWidth);
    outputCanvas.height = Math.round(cropHeight);

    const context = outputCanvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(
      sourceCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputCanvas.width,
      outputCanvas.height
    );

    const downloadLink = document.createElement('a');
    downloadLink.download = `concentric-shape-${selectedRatio.value.replace(':', 'x')}.png`;
    downloadLink.href = outputCanvas.toDataURL('image/png');
    downloadLink.click();
  }, [snapshotAspectRatio]);

  return (
    <div
      ref={sceneRef}
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '20px',
          bottom: '20px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '999px',
          background: 'rgba(8, 8, 8, 0.72)',
          boxShadow: '0 18px 60px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <select
          aria-label="Snapshot aspect ratio"
          value={snapshotAspectRatio}
          onChange={(event) => setSnapshotAspectRatio(event.target.value)}
          style={{
            height: '34px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#fff',
            padding: '0 28px 0 12px',
            fontSize: '13px',
          }}
        >
          {SNAPSHOT_ASPECT_RATIOS.map((ratio) => (
            <option key={ratio.value} value={ratio.value}>
              {ratio.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSnapshot}
          style={{
            height: '34px',
            border: 0,
            borderRadius: '999px',
            background: '#146EF5',
            color: '#fff',
            padding: '0 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(20, 110, 245, 0.55)',
          }}
        >
          Save Snapshot
        </button>
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <ConcentricShape
          {...shapeControls}
          {...materialControls}
          {...transparencyControls}
          {...beamControls}
          {...bloomControls}
          {...vignetteControls}
          {...colorControls}
          preserveDrawingBuffer
        />
      </Suspense>
    </div>
  );
}

export default ConcentricShapePage;
