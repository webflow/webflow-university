import { describe, expect, it } from 'vitest';
import {
  applyThemeTokensToSvg,
  colorToCssVar,
  DEFAULT_FIGMA_SVG,
  extractSvgMarkup,
  normalizeColor,
} from './themeSvgTokens';

describe('themeSvgTokens', () => {
  it('normalizes colors for lookup', () => {
    expect(normalizeColor('#FFF')).toBe('#ffffff');
    expect(normalizeColor('rgb(255, 255, 255)')).toBe('rgb(255,255,255)');
    expect(normalizeColor('White')).toBe('white');
  });

  it('maps known Figma export colors to theme vars', () => {
    expect(colorToCssVar('#171717')).toBe('var(--theme--t_bg-tertiary, #171717)');
    expect(colorToCssVar('#363636')).toBe('var(--theme--t_border-primary, #363636)');
    expect(colorToCssVar('white')).toBe('var(--theme--t_icon-primary, white)');
    expect(colorToCssVar('#FFFFFF')).toBe('var(--theme--t_icon-primary, white)');
  });

  it('leaves non-theme colors and special values alone', () => {
    expect(colorToCssVar('none')).toBeNull();
    expect(colorToCssVar('currentColor')).toBeNull();
    expect(colorToCssVar('#146ef5')).toBeNull();
    expect(colorToCssVar('var(--already-set)')).toBeNull();
  });

  it('extracts svg from surrounding markup', () => {
    expect(extractSvgMarkup('<p><svg viewBox="0 0 1 1"></svg></p>')).toBe(
      '<svg viewBox="0 0 1 1"></svg>',
    );
  });

  it('extracts svg from Rich Text entity-escaped paste', () => {
    const richText = `<p>&lt;svg viewBox="0 0 1 1"&gt;&lt;path fill="#171717" d="M0 0"/&gt;&lt;/svg&gt;</p>`;
    expect(extractSvgMarkup(richText)).toBe(
      '<svg viewBox="0 0 1 1"><path fill="#171717" d="M0 0"/></svg>',
    );
  });

  it('rewrites fill and stroke on the default Figma org icon', () => {
    const result = applyThemeTokensToSvg(DEFAULT_FIGMA_SVG);
    expect(result).toContain('fill="var(--theme--t_bg-tertiary, #171717)"');
    expect(result).toContain('stroke="var(--theme--t_border-primary, #363636)"');
    expect(result).toContain('stroke="var(--theme--t_icon-primary, white)"');
    expect(result).not.toContain('fill="#171717"');
    expect(result).not.toContain('stroke="white"');
  });

  it('rewrites colors inside style attributes', () => {
    const input = `<svg><path style="fill: #171717; stroke: white" d="M0 0"/></svg>`;
    const result = applyThemeTokensToSvg(input);
    expect(result).toContain('fill: var(--theme--t_bg-tertiary, #171717)');
    expect(result).toContain('stroke: var(--theme--t_icon-primary, white)');
  });

  it('maps icon ink to currentColor when requested', () => {
    expect(colorToCssVar('white', { useCurrentColor: true })).toBe('currentColor');
    expect(colorToCssVar('#171717', { useCurrentColor: true })).toBe(
      'var(--theme--t_bg-tertiary, #171717)',
    );

    const result = applyThemeTokensToSvg(DEFAULT_FIGMA_SVG, { useCurrentColor: true });
    expect(result).toContain('stroke="currentColor"');
    expect(result).toContain('fill="var(--theme--t_bg-tertiary, #171717)"');
    expect(result).not.toContain('var(--theme--t_icon-primary');
  });
});
