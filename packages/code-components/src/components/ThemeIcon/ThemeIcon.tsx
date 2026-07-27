import type { CSSProperties } from 'react';
import { applyThemeTokensToSvg, DEFAULT_FIGMA_SVG } from './themeSvgTokens';
import './ThemeIcon.css';

export interface ThemeIconProps {
  /** Raw SVG markup copied from Figma ("Copy as SVG"). */
  svgCode?: string;
  /** Accessible label. Omit or leave empty for decorative icons. */
  label?: string;
  /** Optional CSS width (e.g. "48px", "2rem"). Height follows viewBox unless set. */
  width?: string;
  /** Optional CSS height. */
  height?: string;
  /**
   * Use `currentColor` for icon ink (white / icon-primary) so the SVG inherits
   * the parent element's text color.
   */
  useCurrentColor?: boolean;
  className?: string;
}

/**
 * Renders a Figma-exported SVG with hard-coded colors replaced by WFU theme tokens.
 */
function ThemeIcon({
  svgCode = DEFAULT_FIGMA_SVG,
  label = '',
  width,
  height,
  useCurrentColor = false,
  className,
}: ThemeIconProps) {
  const themedSvg = applyThemeTokensToSvg(svgCode, { useCurrentColor });

  if (!themedSvg) {
    return null;
  }

  const style: CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <span
      className={['theme-icon', useCurrentColor ? 'theme-icon--current-color' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={Object.keys(style).length ? style : undefined}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: themedSvg }}
    />
  );
}

export default ThemeIcon;
