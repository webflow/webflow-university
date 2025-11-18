import { useControls } from 'leva';
import { lazy, Suspense } from 'react';

const ProSphere = lazy(() => import('../components/ProSphere/ProSphere'));

function LoadingSpinner() {
  return (
    <>
      <style>
        {`
          @keyframes prosphere-spin {
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
            animation: 'prosphere-spin 1s linear infinite',
            boxShadow: '0 0 20px rgba(20, 110, 245, 0.5)',
          }}
        />
      </div>
    </>
  );
}

function ProSpherePage() {
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

  // Sphere controls
  const sphereControls = useControls('Sphere', {
    scale: { value: 3, min: 1, max: 10, step: 0.1 },
    horizontalStretch: { value: 1.2, min: 0.5, max: 3, step: 0.1 },
    meridianCount: { value: 16, min: 4, max: 64, step: 1 },
    verticalOffset: { value: -2, min: -10, max: 10, step: 0.5 },
    rotationSpeed: { value: 0.2, min: 0, max: 2, step: 0.05 },
  });

  // Material controls
  const materialControls = useControls('Material', {
    glowIntensity: { value: 4.0, min: 0, max: 20, step: 0.5 },
    coreIntensity: { value: 8.0, min: 0, max: 20, step: 0.5 },
    focusHeight: { value: 4.0, min: -5, max: 10, step: 0.5 },
  });

  // Fog controls
  const fogControls = useControls('Fog', {
    fogNear: { value: 5.0, min: 0, max: 20, step: 0.5, label: 'Fog Near' },
    fogFar: { value: 19.5, min: 5, max: 30, step: 0.5, label: 'Fog Far' },
    fogDensity: { value: 3.0, min: 0.1, max: 5, step: 0.1, label: 'Fog Density' },
  });

  // Cursor Spotlight controls
  const spotlightControls = useControls('Cursor Spotlight', {
    spotlightRadius: { value: 2.0, min: 0.5, max: 5, step: 0.1, label: 'Radius' },
    spotlightIntensity: { value: 3.0, min: 0, max: 10, step: 0.5, label: 'Intensity' },
    iridescenceStrength: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'Iridescence' },
    spotlightDepth: { value: 0.0, min: -10, max: 10, step: 0.5, label: 'Depth Offset' },
  });

  // Blending controls
  const blendingControls = useControls('Blending', {
    blending: {
      value: 'Additive',
      options: ['No Blending', 'Normal', 'Additive', 'Subtractive', 'Multiply'],
    },
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
        <ProSphere
          {...sphereControls}
          {...materialControls}
          {...fogControls}
          {...spotlightControls}
          {...bloomControls}
          {...vignetteControls}
          {...blendingControls}
        />
      </Suspense>
    </div>
  );
}

export default ProSpherePage;
