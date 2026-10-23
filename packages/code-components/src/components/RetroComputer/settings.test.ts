import { describe, expect, it } from 'vitest';

import { ASPECT_RATIOS, aspectRatioCss } from './settings';

describe('aspectRatioCss', () => {
  it('turns every preset into a CSS ratio', () => {
    expect(ASPECT_RATIOS.map(aspectRatioCss)).toEqual([
      '16 / 9',
      '16 / 10',
      '3 / 2',
      '4 / 3',
      '1 / 1',
      '4 / 5',
      '3 / 4',
    ]);
  });

  it('accepts slashes, spaces and decimals', () => {
    expect(aspectRatioCss('21/9')).toBe('21 / 9');
    expect(aspectRatioCss(' 2.39 : 1 ')).toBe('2.39 / 1');
  });

  it('falls back to 3:2 for anything it cannot read', () => {
    for (const value of ['', 'wide', '16', '0:1', '4:0', '-4:3']) {
      expect(aspectRatioCss(value)).toBe('3 / 2');
    }
  });
});
