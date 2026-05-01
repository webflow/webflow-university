import { render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCMSCollectionItems } from './useCMSCollectionItems';

function Harness({ children }: { children: React.ReactNode }) {
  const { cmsCollectionComponentSlotRef, items } = useCMSCollectionItems('cmsCollectionComponentSlot');

  return (
    <div>
      <div ref={cmsCollectionComponentSlotRef}>{children}</div>
      <output data-testid="count">{items.length}</output>
      <output data-testid="first-slug">{items[0]?.getAttribute('data-slug') ?? ''}</output>
    </div>
  );
}

function createCollection(): HTMLDivElement {
  const collection = document.createElement('div');
  collection.innerHTML = `
    <div class="w-dyn-item" role="listitem" data-slug="seo-aeo"></div>
    <div class="w-dyn-item" role="listitem"></div>
  `;
  return collection;
}

describe('useCMSCollectionItems', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts cloned CMS items from an assigned slot', async () => {
    const collection = createCollection();
    vi.spyOn(HTMLSlotElement.prototype, 'assignedElements').mockReturnValue([collection]);

    render(
      <Harness>
        <slot name="cmsCollectionComponentSlot" />
      </Harness>
    );

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(screen.getByTestId('first-slug')).toHaveTextContent('seo-aeo');
  });

  it('falls back to direct DOM items when no slot is present', async () => {
    render(
      <Harness>
        <div className="w-dyn-item" role="listitem" data-slug="direct-item" />
        <div className="w-dyn-item" role="listitem" />
      </Harness>
    );

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(screen.getByTestId('first-slug')).toHaveTextContent('direct-item');
  });
});
