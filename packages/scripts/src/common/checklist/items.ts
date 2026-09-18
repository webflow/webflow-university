/**
 * Checklist item discovery
 *
 * Checklist bodies are authored as rich-text components, so every task on the
 * page renders from the same component definition and none of them can carry a
 * unique id. Position in the document is therefore the only identifier
 * available, which also keeps share URLs in the same shape as the
 * accessibility checklist (`?checked=13,15,20`).
 */

export const ITEM_SELECTOR = 'details.cc_accordion-item';
export const CHECKBOX_SELECTOR = '.cc_accordion_checkbox';
export const TITLE_SELECTOR = '.cc_accordion_title';
export const BADGE_SELECTOR = '.cc_accordion_badge[badge-label]';
export const DETAILS_SELECTOR = '.accordion_rich-text';
export const LINK_SELECTOR = 'a.cc_guide-note-link';

export interface ChecklistItem {
  /** 1-based position, used as the identifier in storage and share URLs. */
  id: string;
  index: number;
  element: HTMLElement;
  checkbox: HTMLInputElement;
  title: string;
  badges: string[];
  details: string;
  link: string;
}

/**
 * Collects every checklist task on the page, in document order.
 *
 * Items without a checkbox are skipped rather than shifting the positions of
 * the items after them, so ids stay stable for a given page.
 */
export function getChecklistItems(root: ParentNode = document): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).forEach((element, index) => {
    const checkbox = element.querySelector<HTMLInputElement>(CHECKBOX_SELECTOR);
    if (!checkbox) {
      return;
    }

    items.push({
      id: String(index + 1),
      index,
      element,
      checkbox,
      title: cleanText(element.querySelector(TITLE_SELECTOR)?.textContent),
      badges: getBadgeLabels(element),
      details: cleanText(element.querySelector(DETAILS_SELECTOR)?.textContent),
      link: element.querySelector<HTMLAnchorElement>(LINK_SELECTOR)?.href || '',
    });
  });

  return items;
}

export function getCheckedIds(items: ChecklistItem[]): string[] {
  return items.filter((item) => item.checkbox.checked).map((item) => item.id);
}

function getBadgeLabels(element: HTMLElement): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  element.querySelectorAll<HTMLElement>(BADGE_SELECTOR).forEach((badge) => {
    const label = cleanText(badge.getAttribute('badge-label'));
    if (!label || seen.has(label)) {
      return;
    }
    seen.add(label);
    labels.push(label);
  });

  return labels;
}

export function cleanText(value: string | null | undefined): string {
  return String(value || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
