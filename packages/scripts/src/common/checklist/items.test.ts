/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';

import { getCheckedIds, getChecklistItems } from './items';

function item({
  title,
  checked = false,
  badges = ['Critical', 'Beginner'],
  details = '',
  link = '',
  withCheckbox = true,
}: {
  title: string;
  checked?: boolean;
  badges?: string[];
  details?: string;
  link?: string;
  withCheckbox?: boolean;
}): string {
  return `
    <details class="cc_accordion-item">
      <summary class="cc_accordion_summary">
        <label class="cc_accordion_checkbox-label">
          ${
            withCheckbox
              ? `<input type="checkbox" class="cc_accordion_checkbox" ${checked ? 'checked' : ''} />`
              : ''
          }
          <h3 class="cc_accordion_title">${title}</h3>
        </label>
      </summary>
      <div>
        ${badges.map((b) => `<div class="cc_accordion_badge" badge-label="${b}"><div>${b}</div></div>`).join('')}
        ${details ? `<div class="accordion_rich-text w-richtext"><p>${details}</p></div>` : ''}
        ${link ? `<a class="cc_guide-note-link" href="${link}"><div>Learn more</div></a>` : ''}
      </div>
    </details>
  `;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('getChecklistItems', () => {
  it('returns items in document order with 1-based ids', () => {
    document.body.innerHTML = `
      <div class="w-richtext">
        ${item({ title: 'Plan a clear site structure' })}
        ${item({ title: 'Ensure site is responsive', checked: true })}
        ${item({ title: 'Write meta descriptions' })}
      </div>
    `;

    const items = getChecklistItems();

    expect(items.map((i) => i.id)).toEqual(['1', '2', '3']);
    expect(items.map((i) => i.title)).toEqual([
      'Plan a clear site structure',
      'Ensure site is responsive',
      'Write meta descriptions',
    ]);
  });

  it('captures badges, details and the guide link', () => {
    document.body.innerHTML = item({
      title: 'Plan a clear site structure',
      badges: ['High', 'Intermediate'],
      details: 'Site structure refers to how pages are organized.',
      link: 'https://webflow.com/blog/website-structure',
    });

    const [first] = getChecklistItems();

    expect(first.badges).toEqual(['High', 'Intermediate']);
    expect(first.details).toBe('Site structure refers to how pages are organized.');
    expect(first.link).toBe('https://webflow.com/blog/website-structure');
  });

  it('deduplicates repeated badge labels', () => {
    document.body.innerHTML = item({ title: 'Task', badges: ['High', 'High', 'Beginner'] });

    expect(getChecklistItems()[0].badges).toEqual(['High', 'Beginner']);
  });

  it('skips items without a checkbox without shifting later ids', () => {
    document.body.innerHTML = `
      ${item({ title: 'First' })}
      ${item({ title: 'Not a task', withCheckbox: false })}
      ${item({ title: 'Third' })}
    `;

    const items = getChecklistItems();

    expect(items.map((i) => i.title)).toEqual(['First', 'Third']);
    expect(items.map((i) => i.id)).toEqual(['1', '3']);
  });

  it('returns an empty list when the page has no checklist', () => {
    document.body.innerHTML = '<p>No checklist here</p>';

    expect(getChecklistItems()).toEqual([]);
  });
});

describe('getCheckedIds', () => {
  it('returns only the ids of checked items', () => {
    document.body.innerHTML = `
      ${item({ title: 'One' })}
      ${item({ title: 'Two', checked: true })}
      ${item({ title: 'Three', checked: true })}
    `;

    expect(getCheckedIds(getChecklistItems())).toEqual(['2', '3']);
  });
});
