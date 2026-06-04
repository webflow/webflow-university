import { act } from 'react';
import type React from 'react';
import { createRoot } from 'react-dom/client';
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

  async function renderHarness(children: React.ReactNode): Promise<HTMLDivElement> {
    const container = document.createElement('div');
    const root = createRoot(container);
    document.body.appendChild(container);

    await act(async () => {
      root.render(<Harness>{children}</Harness>);
    });

    return container;
  }

  it('extracts cloned CMS items from an assigned slot', async () => {
    const collection = createCollection();
    vi.spyOn(HTMLSlotElement.prototype, 'assignedElements').mockReturnValue([collection]);

    const container = await renderHarness(<slot name="cmsCollectionComponentSlot" />);

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="first-slug"]')?.textContent).toBe('seo-aeo');
  });

  it('falls back to direct DOM items when no slot is present', async () => {
    const container = await renderHarness(
      <>
        <div className="w-dyn-item" role="listitem" data-slug="direct-item" />
        <div className="w-dyn-item" role="listitem" />
      </>
    );

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="first-slug"]')?.textContent).toBe('direct-item');
  });
});
