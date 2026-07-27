import { useEffect, useMemo, useState } from 'react';
import {
  applyThemeTokensToSvg,
  DEFAULT_FIGMA_SVG,
  THEME_SVG_TOKENS,
} from '../ThemeIcon/themeSvgTokens';
import './ThemeIconPreview.css';

export interface ThemeIconPreviewProps {
  /** Initial SVG markup (Figma "Copy as SVG"). Editable on the published page. */
  svgCode?: string;
  /** Show the token mapping reference table. */
  showTokenMap?: boolean;
  /**
   * Initial value for "use currentColor". Also controllable on the published page.
   * Maps icon ink to currentColor so it inherits parent text color.
   */
  useCurrentColor?: boolean;
}

/**
 * Designer/dev utility: paste SVG, preview with theme tokens, edit + copy the result.
 * Input is live-editable on the published page (prop is only the initial value).
 */
function ThemeIconPreview({
  svgCode = DEFAULT_FIGMA_SVG,
  showTokenMap = true,
  useCurrentColor: useCurrentColorProp = false,
}: ThemeIconPreviewProps) {
  const [inputSvg, setInputSvg] = useState(svgCode);
  const [useCurrentColor, setUseCurrentColor] = useState(useCurrentColorProp);
  const themedSvg = useMemo(
    () => applyThemeTokensToSvg(inputSvg, { useCurrentColor }),
    [inputSvg, useCurrentColor],
  );
  const [outputSvg, setOutputSvg] = useState(themedSvg);
  const [copied, setCopied] = useState(false);

  // Designer prop / default changes
  useEffect(() => {
    setInputSvg(svgCode);
  }, [svgCode]);

  useEffect(() => {
    setUseCurrentColor(useCurrentColorProp);
  }, [useCurrentColorProp]);

  // Re-theme when input or currentColor toggle changes; keep output editable afterward
  useEffect(() => {
    setOutputSvg(themedSvg);
  }, [themedSvg]);

  const handleCopy = async () => {
    if (!outputSvg) return;
    try {
      await navigator.clipboard.writeText(outputSvg);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  // Preview matches the editable themed output (what Copy will grab).
  // Theme CSS vars inherit from the page (light / dark / high-contrast).
  const previewSvg = outputSvg;

  return (
    <div className="theme-icon-preview">
      <div className="theme-icon-preview__header">
        <div>
          <p className="theme-icon-preview__eyebrow">Figma → Theme tokens</p>
          <h3 className="theme-icon-preview__title">Theme Icon Preview</h3>
        </div>
        <button
          type="button"
          className="theme-icon-preview__copy"
          onClick={handleCopy}
          disabled={!outputSvg}
        >
          {copied ? 'Copied' : 'Copy SVG'}
        </button>
      </div>

      <div
        className={[
          'theme-icon-preview__stage',
          useCurrentColor ? 'theme-icon-preview__stage--current-color' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {previewSvg ? (
          <span
            className="theme-icon-preview__icon"
            aria-hidden
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        ) : (
          <p className="theme-icon-preview__empty">Paste SVG markup below to preview.</p>
        )}
      </div>

      <label className="theme-icon-preview__check">
        <input
          type="checkbox"
          checked={useCurrentColor}
          onChange={(event) => setUseCurrentColor(event.target.checked)}
        />
        <span>
          Use <code>currentColor</code> for icon ink
          <span className="theme-icon-preview__check-hint">
            {' '}
            (inherits parent text color — bg/border tokens stay)
          </span>
        </span>
      </label>

      <label className="theme-icon-preview__code-label" htmlFor="theme-icon-preview-input">
        Figma SVG input
      </label>
      <textarea
        id="theme-icon-preview-input"
        className="theme-icon-preview__code"
        value={inputSvg}
        onChange={(event) => setInputSvg(event.target.value)}
        rows={10}
        spellCheck={false}
        placeholder="Paste SVG from Figma (Copy as SVG)…"
      />

      <label className="theme-icon-preview__code-label" htmlFor="theme-icon-preview-output">
        Themed SVG source
      </label>
      <textarea
        id="theme-icon-preview-output"
        className="theme-icon-preview__code"
        value={outputSvg}
        onChange={(event) => setOutputSvg(event.target.value)}
        rows={12}
        spellCheck={false}
        placeholder="Themed SVG appears here — edit freely before copying."
      />

      {showTokenMap ? (
        <div className="theme-icon-preview__map">
          <p className="theme-icon-preview__map-title">Color → token map</p>
          <ul className="theme-icon-preview__map-list">
            {THEME_SVG_TOKENS.map((token) => (
              <li key={token.cssVar}>
                <span
                  className="theme-icon-preview__swatch"
                  style={{ background: token.fallback }}
                  aria-hidden
                />
                <code>{token.colors[0]}</code>
                <span aria-hidden>→</span>
                <code>
                  {useCurrentColor && token.cssVar === '--theme--t_icon-primary'
                    ? 'currentColor'
                    : `var(${token.cssVar}, ${token.fallback})`}
                </code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default ThemeIconPreview;
