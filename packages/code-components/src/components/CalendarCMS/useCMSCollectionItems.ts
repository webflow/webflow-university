import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Extracts CMS collection list items from a Webflow collection slot
 * @param slotName - Name of the slot containing the CMS collection
 * @returns Ref for the slot container and array of cloned slide elements
 */
export function useCMSCollectionItems(slotName: string) {
  const cmsCollectionComponentSlotRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<HTMLDivElement[] | null>(null);

  useEffect(() => {
    if (items === null && cmsCollectionComponentSlotRef.current) {
      // Find the slot element by name
      const slot = cmsCollectionComponentSlotRef.current.querySelector(
        `[name="${slotName}"]`
      ) as HTMLSlotElement;

      if (slot) {
        const assignedElements = slot.assignedElements();
        if (assignedElements && assignedElements.length > 0) {
          // Extract all CMS list items and clone them for manipulation
          const allItems = assignedElements[0].querySelectorAll(`.w-dyn-item[role='listitem']`);
          const slides = (Array.from(allItems) as HTMLDivElement[]).map(
            (slide) => slide.cloneNode(true) as HTMLDivElement
          );
          setItems(slides);
        }
      } else {
        // Try finding items directly in the ref container
        const directItems = cmsCollectionComponentSlotRef.current.querySelectorAll(
          `.w-dyn-item[role='listitem']`
        );
        if (directItems.length > 0) {
          const slides = Array.from(directItems).map(
            (slide) => slide.cloneNode(true) as HTMLDivElement
          );
          setItems(slides);
        }
      }
    }
  }, [items, slotName]);

  // Filter out empty slides and memoize for performance
  // Note: We check for data attributes instead of children, since our items use data attributes
  const memoizedItems = useMemo(() => {
    return (
      items?.filter((item) => {
        if (!item) return false;
        // Check if item has data attributes (which is what we need)
        const hasDataAttrs = item.hasAttributes && item.hasAttributes();
        const attrs = Array.from(item.attributes || []);
        const hasDataSlug = attrs.some((attr) => attr.name === 'data-slug');
        // Keep item if it has data-slug (required field) or has any data attributes
        return hasDataSlug || (hasDataAttrs && attrs.length > 0);
      }) ?? []
    );
  }, [items]);

  return {
    cmsCollectionComponentSlotRef,
    items: memoizedItems,
  };
}
