import { describe, expect, it } from 'vitest';
import { OPACITY_SWATCH_URL } from './opacitySwatch';

describe('OPACITY_SWATCH_URL', () => {
  it('is a decodable JPEG data URI', () => {
    const [header, payload] = OPACITY_SWATCH_URL.split(',');
    expect(header).toBe('data:image/jpeg;base64');

    const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xff, 0xd8, 0xff]);
    expect([bytes.at(-2), bytes.at(-1)]).toEqual([0xff, 0xd9]);
  });
});
