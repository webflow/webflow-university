import { DialRoot, useDialKit } from 'dialkit';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import dialKitStylesBase64 from './dialKitStyles';
import type { TunerValues } from './settings';

function decodeStyles(base64: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Floating DialKit panel for dialling in the look in place. Rendered inline (not portaled) with
 * its own stylesheet so it works inside the Webflow component's shadow root.
 */
export default function RetroComputerTuner({
  initial,
  onChange,
  onCopy,
}: {
  initial: TunerValues;
  onChange: (values: TunerValues) => void;
  onCopy: () => void;
}): React.JSX.Element | null {
  const id = useId();
  const [start] = useState(initial);
  const styles = useMemo(() => decodeStyles(dialKitStylesBase64), []);
  const onCopyRef = useRef(onCopy);
  onCopyRef.current = onCopy;

  const values = useDialKit(
    'Retro Computer',
    {
      Lighting: {
        keyLightColor: { type: 'color', default: start.keyLightColor },
        keyLightIntensity: [start.keyLightIntensity, 0, 20, 0.1],
        fillIntensity: [start.fillIntensity, 0, 3, 0.01],
        rimLightColor: { type: 'color', default: start.rimLightColor },
        rimLightIntensity: [start.rimLightIntensity, 0, 5, 0.01],
        environmentIntensity: [start.environmentIntensity, 0, 2, 0.01],
        bloomIntensity: [start.bloomIntensity, 0, 3, 0.01],
        bloomThreshold: [start.bloomThreshold, 0, 10, 0.1],
      },
      Background: {
        backgroundColor: { type: 'color', default: start.backgroundColor },
        backgroundGlowColor: { type: 'color', default: start.backgroundGlowColor },
        backgroundGlowStrength: [start.backgroundGlowStrength, 0, 1, 0.01],
      },
      Screen: {
        screenBackground: { type: 'color', default: start.screenBackground },
        screenText: { type: 'color', default: start.screenText },
        fireworkColors: { type: 'text', default: start.fireworkColors },
        screenGlow: [start.screenGlow, 0, 2, 0.01],
        scanlines: [start.scanlines, 0, 1, 0.01],
        vignette: [start.vignette, 0, 1, 0.01],
        curvature: [start.curvature, 0, 1, 0.01],
        chromaticAberration: [start.chromaticAberration, 0, 1, 0.01],
      },
      Camera: {
        orbitCamera: start.orbitCamera,
        cameraFov: [start.cameraFov, 10, 70, 1],
      },
      copySettings: { type: 'action', label: 'Copy settings' },
    },
    { id: `retro-computer-${id}`, onAction: () => onCopyRef.current() }
  );

  const { Lighting, Background, Screen, Camera } = values;
  const flat: TunerValues = { ...Lighting, ...Background, ...Screen, ...Camera };
  const serialized = JSON.stringify(flat);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(JSON.parse(serialized) as TunerValues);
  }, [serialized]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        bottom: 12,
        width: 280,
        overflow: 'auto',
        zIndex: 1,
      }}
    >
      <style>{styles}</style>
      <DialRoot mode="inline" theme="dark" productionEnabled />
    </div>
  );
}
