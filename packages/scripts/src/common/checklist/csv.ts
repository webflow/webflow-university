/**
 * Checklist CSV export
 */

import type { ChecklistItem } from './items.js';

const HEADERS = ['#', 'Task', 'Impact', 'Difficulty', 'Status', 'Details', 'Link'];

export function serializeChecklistToCsv(items: ChecklistItem[]): string {
  if (!items.length) {
    return '';
  }

  const rows = items.map((item) =>
    [
      item.id,
      item.title,
      item.badges[0] || '',
      item.badges[1] || '',
      item.checkbox.checked ? 'Complete' : 'Not complete',
      item.details,
      item.link,
    ]
      .map(escapeCell)
      .join(',')
  );

  return [HEADERS.join(','), ...rows].join('\r\n') + '\r\n';
}

export function downloadCsv(csv: string, filename: string): void {
  // Excel needs a BOM to read UTF-8, and checklist copy contains smart quotes.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCell(value: string): string {
  const text = String(value ?? '');

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}
