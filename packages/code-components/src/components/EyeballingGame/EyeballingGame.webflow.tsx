import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';
import EyeballingGame, { DEFAULT_DESCRIPTION, DEFAULT_HEADING } from './EyeballingGame';
import { DEFAULT_PENALTY_SECONDS, DEFAULT_TOLERANCE_PERCENT } from './gameLogic';
import './EyeballingGame.css';

const EyeballingGameWebflow = declareComponent(EyeballingGame, {
  name: 'EyeballingGame',
  description:
    'Eight-round design eye test — match stroke, type, radius, opacity, shadows, and padding against the clock',
  group: 'Interactive',
  props: {
    heading: props.Text({
      name: 'Heading',
      defaultValue: DEFAULT_HEADING,
      group: 'Content',
    }),
    description: props.Text({
      name: 'Description',
      defaultValue: DEFAULT_DESCRIPTION,
      group: 'Content',
      tooltip: 'Intro copy shown above the start button',
    }),
    tolerancePercent: props.Number({
      name: 'Tolerance (%)',
      defaultValue: DEFAULT_TOLERANCE_PERCENT,
      min: 1,
      max: 20,
      decimals: 1,
      group: 'Difficulty',
      tooltip: 'How close a guess must be, as a percentage of each slider’s range',
    }),
    penaltySeconds: props.Number({
      name: 'Penalty Seconds',
      defaultValue: DEFAULT_PENALTY_SECONDS,
      min: 1,
      max: 30,
      decimals: 0,
      group: 'Difficulty',
      tooltip: 'How long a wrong answer locks the player out',
    }),
  },
});

export default EyeballingGameWebflow;
