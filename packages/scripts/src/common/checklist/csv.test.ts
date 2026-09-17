/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';

import { serializeChecklistToCsv } from './csv';
import { getChecklistItems } from './items';

function renderChecklist(html: string): void {
  document.body.innerHTML = `<div class="w-richtext">${html}</div>`;
}

function item({
  title,
  checked = false,
  badges = ['Critical', 'Beginner'],
  details = '',
  link = '',
}: {
  title: string;
  checked?: boolean;
  badges?: string[];
  details?: string;
  link?: string;
}): string {
  return `
    <details class="cc_accordion-item">
      <summary class="cc_accordion_summary">
        <label class="cc_accordion_checkbox-label">
          <input type="checkbox" class="cc_accordion_checkbox" ${checked ? 'checked' : ''} />
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

describe('serializeChecklistToCsv', () => {
  it('writes a header row and one row per task', () => {
    renderChecklist(`
      ${item({ title: 'Plan a clear site structure', badges: ['High', 'Intermediate'] })}
      ${item({ title: 'Ensure site is responsive', checked: true })}
    `);

    const rows = serializeChecklistToCsv(getChecklistItems()).trim().split('\r\n');

    expect(rows[0]).toBe('#,Task,Impact,Difficulty,Status,Details,Link');
    expect(rows[1]).toBe('1,Plan a clear site structure,High,Intermediate,Not complete,,');
    expect(rows[2]).toBe('2,Ensure site is responsive,Critical,Beginner,Complete,,');
  });

  it('quotes values containing commas and escapes quotes', () => {
    renderChecklist(
      item({
        title: 'Audit titles, headings and copy',
        details: 'Use a "primary" keyword',
        badges: [],
      })
    );

    const [, row] = serializeChecklistToCsv(getChecklistItems()).trim().split('\r\n');

    expect(row).toBe(
      '1,"Audit titles, headings and copy",,,Not complete,"Use a ""primary"" keyword",'
    );
  });

  it('includes the guide link when present', () => {
    renderChecklist(
      item({ title: 'Task', badges: [], link: 'https://webflow.com/blog/website-structure' })
    );

    expect(serializeChecklistToCsv(getChecklistItems())).toContain(
      'https://webflow.com/blog/website-structure'
    );
  });

  it('uses CRLF line endings', () => {
    renderChecklist(item({ title: 'Task', badges: [] }));

    expect(serializeChecklistToCsv(getChecklistItems())).toBe(
      '#,Task,Impact,Difficulty,Status,Details,Link\r\n1,Task,,,Not complete,,\r\n'
    );
  });

  it('returns an empty string when there are no tasks', () => {
    expect(serializeChecklistToCsv([])).toBe('');
  });
});
