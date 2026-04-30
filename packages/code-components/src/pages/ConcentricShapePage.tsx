import { useControls } from 'leva';
import { lazy, Suspense } from 'react';

const ConcentricShape = lazy(() => import('../components/ConcentricShape/ConcentricShape'));

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
  // Bloom controls
  const bloomControls = useControls('Bloom', {
    bloomIntensity: { value: 3.5, min: 0, max: 10, step: 0.1 },
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
    shapeCount: { value: 8, min: 3, max: 20, step: 1 },
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

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <ConcentricShape
          {...shapeControls}
          {...materialControls}
          {...transparencyControls}
          {...beamControls}
          {...bloomControls}
          {...vignetteControls}
          {...colorControls}
        />
      </Suspense>
    </div>
  );
}

export default ConcentricShapePage;
