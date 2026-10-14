import { describe, expect, it } from 'vitest';

import { getNavigableHref } from './link';

describe('getNavigableHref', () => {
  it('ignores a missing link', () => {
    expect(getNavigableHref(undefined)).toBeNull();
  });

  it('ignores the "#" Webflow passes for an unset Link prop', () => {
    expect(getNavigableHref({ href: '#' })).toBeNull();
    expect(getNavigableHref({ href: ' # ' })).toBeNull();
  });

  it('ignores an empty href', () => {
    expect(getNavigableHref({ href: '' })).toBeNull();
    expect(getNavigableHref({ href: '   ' })).toBeNull();
  });

  it('keeps real destinations, including in-page anchors', () => {
    expect(getNavigableHref({ href: '/courses' })).toBe('/courses');
    expect(getNavigableHref({ href: 'https://webflow.com' })).toBe('https://webflow.com');
    expect(getNavigableHref({ href: '#next-steps' })).toBe('#next-steps');
  });
});
