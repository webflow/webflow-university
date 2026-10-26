import { useEffect, useId, useReducer, useRef, useState } from 'react';
import {
  DEFAULT_PENALTY_SECONDS,
  DEFAULT_TOLERANCE_PERCENT,
  formatClock,
  formatDuration,
  formatValue,
  pickTarget,
  SUCCESS_ADVANCE_MS,
} from './gameLogic';
import { createInitialState, gameReducer, type Feedback } from './gameState';
import { OPACITY_SWATCH_URL } from './opacitySwatch';
import { ROUNDS, type Round } from './rounds';
import './EyeballingGame.css';

export const DEFAULT_HEADING = 'The Eyeballing Game';
export const DEFAULT_DESCRIPTION =
  'Put your design eye to the test! Race the clock through 8 design challenges where you’ll match stroke widths, font weights, opacities, shadows, and more.';

const FONT_STYLESHEET_ID = 'eyeballing-game-fonts';
const FONT_STYLESHEET_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Open+Sans:wght@800&family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&family=Roboto+Mono&display=swap';

/** Chrome ignores @font-face declared inside a shadow root, so the fonts load on the host document. */
function ensureFonts() {
  if (typeof document === 'undefined' || document.getElementById(FONT_STYLESHEET_ID)) return;
  const link = document.createElement('link');
  link.id = FONT_STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = FONT_STYLESHEET_HREF;
  document.head.appendChild(link);
}

export interface EyeballingGameProps {
  heading?: string;
  description?: string;
  /** How close a guess must be, as a percentage of the slider's range */
  tolerancePercent?: number;
  /** How long a wrong answer locks the player out */
  penaltySeconds?: number;
}

function EyeballingGame({
  heading = DEFAULT_HEADING,
  description = DEFAULT_DESCRIPTION,
  tolerancePercent = DEFAULT_TOLERANCE_PERCENT,
  penaltySeconds = DEFAULT_PENALTY_SECONDS,
}: EyeballingGameProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const { phase, countdown, roundIndex, feedback, penaltyRemaining } = state;

  useEffect(ensureFonts, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    const id = window.setTimeout(
      () => dispatch({ type: 'countdownTick', now: performance.now() }),
      1000
    );
    return () => window.clearTimeout(id);
  }, [phase, countdown]);

  useEffect(() => {
    if (feedback !== 'success') return;
    const id = window.setTimeout(
      () => dispatch({ type: 'advance', now: performance.now() }),
      SUCCESS_ADVANCE_MS
    );
    return () => window.clearTimeout(id);
  }, [feedback, roundIndex]);

  useEffect(() => {
    if (feedback !== 'error') return;
    const id = window.setTimeout(() => dispatch({ type: 'penaltyTick' }), 1000);
    return () => window.clearTimeout(id);
  }, [feedback, penaltyRemaining]);

  const start = () =>
    dispatch({
      type: 'start',
      targets: ROUNDS.map((round) => pickTarget(round, tolerancePercent)),
    });

  const safePenalty = Math.max(1, Math.round(penaltySeconds));

  return (
    <div className="eyeball-root">
      <div className={`eyeball-card is-${feedback}`}>
        <div className={`eyeball-glow is-${feedback}`} aria-hidden="true" />

        <div className="eyeball-topbar">
          <div className="eyeball-stat">
            <span className="eyeball-stat-label">Round</span>
            <span className="eyeball-mono">
              {String(roundIndex + 1).padStart(2, '0')}
              <span className="eyeball-muted">/{String(ROUNDS.length).padStart(2, '0')}</span>
            </span>
          </div>
          <div className="eyeball-stat">
            <span className="eyeball-stat-label">Time elapsed</span>
            <span className="eyeball-mono">
              <ElapsedClock
                key={state.startedAt ?? 'idle'}
                startedAt={state.startedAt}
                finishedSeconds={state.finishedSeconds}
              />
            </span>
          </div>
        </div>

        <div className="eyeball-panel">
          {phase === 'intro' && (
            <div className="eyeball-screen">
              <p className="eyeball-eyebrow">Test your skills for pixel-perfect design</p>
              <h3 className="eyeball-heading">{heading}</h3>
              <p className="eyeball-copy">{description}</p>
              <button
                type="button"
                className="eyeball-button eyeball-button-primary"
                onClick={start}
              >
                Let’s go!
              </button>
              <p className="eyeball-fineprint">
                {ROUNDS.length} rounds · Wrong answers lock you out for {safePenalty}{' '}
                {safePenalty === 1 ? 'second' : 'seconds'}
              </p>
            </div>
          )}

          {phase === 'countdown' && (
            <div className="eyeball-countdown" key={countdown} role="status">
              {countdown}
            </div>
          )}

          {phase === 'playing' && (
            <RoundScreen
              key={roundIndex}
              round={ROUNDS[roundIndex]}
              target={state.targets[roundIndex]}
              guess={state.guess}
              feedback={feedback}
              penaltyRemaining={penaltyRemaining}
              onGuess={(value) => dispatch({ type: 'setGuess', value })}
              onSubmit={() => dispatch({ type: 'submit', tolerancePercent, penaltySeconds })}
            />
          )}

          {phase === 'finished' && (
            <div className="eyeball-screen">
              <p className="eyeball-eyebrow">Nice eye!</p>
              <h3 className="eyeball-heading">Congratulations!</h3>
              <p className="eyeball-copy">
                You finished the game in {formatDuration(state.finishedSeconds ?? 0)}. Share your
                time with your friends and challenge them to beat it!
              </p>
              <div className="eyeball-button-row">
                <button
                  type="button"
                  className="eyeball-button eyeball-button-primary"
                  onClick={start}
                >
                  Try again
                </button>
                <ShareButton
                  text={`I beat the Eyeballing Game in ${formatDuration(state.finishedSeconds ?? 0)}! Can you beat my time?`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ElapsedClockProps {
  startedAt: number | null;
  finishedSeconds: number | null;
}

function ElapsedClock({ startedAt, finishedSeconds }: ElapsedClockProps) {
  const [elapsed, setElapsed] = useState(0);
  const running = startedAt !== null && finishedSeconds === null;

  useEffect(() => {
    if (!running || startedAt === null) return;
    let frame = 0;
    const tick = () => {
      setElapsed((performance.now() - startedAt) / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, startedAt]);

  return <>{formatClock(finishedSeconds ?? elapsed)}</>;
}

interface RoundScreenProps {
  round: Round;
  target: number;
  guess: number;
  feedback: Feedback;
  penaltyRemaining: number;
  onGuess: (value: number) => void;
  onSubmit: () => void;
}

function RoundScreen({
  round,
  target,
  guess,
  feedback,
  penaltyRemaining,
  onGuess,
  onSubmit,
}: RoundScreenProps) {
  const sliderId = useId();
  const sliderRef = useRef<HTMLInputElement>(null);
  const locked = feedback !== 'none';
  const isTextRound =
    round.id === 'strokeWidth' || round.id === 'fontWidth' || round.id === 'fontWeight';

  // The previous screen's button unmounts on advance, so hand focus to the new slider
  useEffect(() => {
    sliderRef.current?.focus({ preventScroll: true });
  }, []);

  let message = '';
  if (feedback === 'success') message = 'Congratulations! You nailed it.';
  if (feedback === 'error') {
    message = `Incorrect! Try again in ${penaltyRemaining} ${penaltyRemaining === 1 ? 'second' : 'seconds'}.`;
  }

  return (
    <div className="eyeball-round">
      <h4 className="eyeball-round-title">{round.title}</h4>

      <div className={`eyeball-stage${isTextRound ? ' is-stacked' : ''}`} aria-hidden="true">
        <RoundVisual round={round} value={target} />
        <RoundVisual round={round} value={guess} />
      </div>

      <div className="eyeball-control">
        <label className="eyeball-control-label" htmlFor={sliderId}>
          {round.label}
        </label>
        {round.id === 'buttonRadius' && <RadiusIcon />}
        <input
          ref={sliderRef}
          id={sliderId}
          className="eyeball-slider"
          type="range"
          min={round.min}
          max={round.max}
          step={round.step}
          value={guess}
          aria-disabled={locked}
          aria-valuetext={`${formatValue(round, guess)} ${round.unit}`.trim()}
          onChange={(event) => onGuess(Number(event.target.value))}
        />
        <div className="eyeball-value" aria-hidden="true">
          <span>{formatValue(round, guess)}</span>
          {round.unit && <span className="eyeball-unit">{round.unit}</span>}
        </div>
      </div>

      <div className="eyeball-actions">
        <p className={`eyeball-message is-${feedback}`} role="status">
          {message}
        </p>
        <button
          type="button"
          className={`eyeball-button eyeball-button-product${feedback === 'success' ? ' is-hidden' : ''}`}
          aria-disabled={locked}
          onClick={onSubmit}
        >
          Submit
        </button>
      </div>

      <div
        className={`eyeball-penalty${feedback === 'error' ? ' is-active' : ''}`}
        aria-hidden="true"
      />
    </div>
  );
}

function RoundVisual({ round, value }: { round: Round; value: number }) {
  const style = round.styleFor(value);

  switch (round.id) {
    case 'strokeWidth':
      return (
        <div className="eyeball-stroke-text" style={style}>
          The lazy fox
        </div>
      );
    case 'fontWidth':
    case 'fontWeight':
      return (
        <div className="eyeball-variable-text" style={style}>
          The Eyeballing Game
        </div>
      );
    case 'buttonRadius':
      return (
        <div className="eyeball-chip" style={style}>
          Button
        </div>
      );
    case 'opacity':
      return (
        <div
          className="eyeball-swatch eyeball-swatch-image"
          style={{ backgroundImage: `url(${OPACITY_SWATCH_URL})`, ...style }}
        />
      );
    case 'shadowBlur':
    case 'shadowAngle':
      return <div className="eyeball-swatch eyeball-swatch-shadow" style={style} />;
    case 'padding':
      return (
        <div className="eyeball-swatch eyeball-swatch-padding" style={style}>
          <div className="eyeball-padding-fill" />
        </div>
      );
  }
}

function RadiusIcon() {
  return (
    <svg
      className="eyeball-radius-icon"
      viewBox="0 0 38 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3H5Zm0 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5Z"
        fill="#D9D9D9"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27 6a3 3 0 0 0-3 3v2h2V9a1 1 0 0 1 1-1h2V6h-2Zm6 0a3 3 0 0 1 3 3v2h-2V9a1 1 0 0 0-1-1h-2V6h2ZM27 18a3 3 0 0 1-3-3v-2h2v2a1 1 0 0 0 1 1h2v2h-2Zm6 0a3 3 0 0 0 3-3v-2h-2v2a1 1 0 0 1-1 1h-2v2h2Z"
        fill="#737373"
      />
    </svg>
  );
}

function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text, url });
      } catch {
        // Player dismissed the share sheet
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
    } catch {
      // Clipboard access denied — nothing useful to fall back to
    }
  };

  return (
    <button type="button" className="eyeball-button eyeball-button-secondary" onClick={share}>
      {copied ? 'Copied!' : 'Share my time'}
    </button>
  );
}

export default EyeballingGame;
