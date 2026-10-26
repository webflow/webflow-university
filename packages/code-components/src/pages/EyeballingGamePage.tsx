import { useControls } from 'leva';
import EyeballingGame, {
  DEFAULT_DESCRIPTION,
  DEFAULT_HEADING,
} from '../components/EyeballingGame/EyeballingGame';
import {
  DEFAULT_PENALTY_SECONDS,
  DEFAULT_TOLERANCE_PERCENT,
} from '../components/EyeballingGame/gameLogic';

const PAGE_BACKGROUNDS = {
  dark: 'radial-gradient(circle, #2d2e2e, #0a0b0c 93%)',
  light: '#f4f4f4',
};

function EyeballingGamePage() {
  const { heading, description, tolerancePercent, penaltySeconds, pageBackground, maxWidth } =
    useControls('Eyeballing Game', {
      heading: DEFAULT_HEADING,
      description: { value: DEFAULT_DESCRIPTION, rows: 4 },
      tolerancePercent: {
        value: DEFAULT_TOLERANCE_PERCENT,
        min: 1,
        max: 20,
        step: 0.5,
        label: 'Tolerance (%)',
      },
      penaltySeconds: { value: DEFAULT_PENALTY_SECONDS, min: 1, max: 30, step: 1 },
      pageBackground: { value: 'dark', options: Object.keys(PAGE_BACKGROUNDS) },
      maxWidth: { value: 960, min: 280, max: 1200, step: 10, label: 'Wrapper width (px)' },
    });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        background: PAGE_BACKGROUNDS[pageBackground as keyof typeof PAGE_BACKGROUNDS],
      }}
    >
      <div style={{ width: '100%', maxWidth: `${maxWidth}px` }}>
        <EyeballingGame
          heading={heading}
          description={description}
          tolerancePercent={tolerancePercent}
          penaltySeconds={penaltySeconds}
        />
      </div>
    </div>
  );
}

export default EyeballingGamePage;
