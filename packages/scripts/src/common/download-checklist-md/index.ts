const BUTTON_SELECTOR = '[data-copy-checklist-md]';
const LIST_SELECTOR = '.cc_list-wrap';
const ITEM_SELECTOR = 'details.cc_accordion-item';
const DOWNLOADED_LABEL = 'Downloaded';
const DOWNLOADED_MS = 2000;

export function initDownloadChecklistMarkdown(): void {
  const buttons = document.querySelectorAll<HTMLElement>(BUTTON_SELECTOR);
  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      onDownloadClick(button);
    });
  });
}

function onDownloadClick(button: HTMLElement): void {
  const markdown = serializeChecklistToMarkdown();
  if (!markdown) {
    console.warn('[download-checklist-md] No checklist content found');
    return;
  }

  downloadMarkdown(markdown, getDownloadFilename());
  setDownloadedState(button);
}

export function serializeChecklistToMarkdown(root: ParentNode = document): string {
  const lists = Array.from(root.querySelectorAll<HTMLElement>(LIST_SELECTOR)).filter((list) =>
    Boolean(list.querySelector(ITEM_SELECTOR))
  );

  const h1 = cleanText(root.querySelector('h1')?.textContent) || getDocumentTitle();
  const source = getSourceUrl();

  if (!lists.length) {
    const orphanItems = Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR))
      .map(serializeItem)
      .filter(Boolean);

    if (!orphanItems.length) {
      return '';
    }

    return (
      cleanText([`# ${h1}`, `Source: ${source}`, orphanItems.join('\n\n')].join('\n\n')) + '\n'
    );
  }

  const chunks: string[] = [`# ${h1}`, `Source: ${source}`];
  const intro = getPageIntro(root, lists[0]);
  if (intro) {
    chunks.push(intro);
  }

  lists.forEach((list) => {
    const heading = getPrecedingHeading(list);
    const phaseTitle = cleanText(heading?.textContent);
    if (phaseTitle) {
      chunks.push(`## ${phaseTitle}`);
    }

    const phaseIntro = getPhaseIntro(list, heading);
    if (phaseIntro) {
      chunks.push(phaseIntro);
    }

    const items = Array.from(list.querySelectorAll<HTMLElement>(ITEM_SELECTOR))
      .map(serializeItem)
      .filter(Boolean);

    if (items.length) {
      chunks.push(items.join('\n\n'));
    }
  });

  return cleanText(chunks.join('\n\n')) + '\n';
}

export function getDownloadFilename(): string {
  const pathSegment = window.location.pathname.split('/').filter(Boolean).pop();
  if (pathSegment) {
    return `${sanitizeFilename(pathSegment)}.md`;
  }

  const title = cleanText(document.querySelector('h1')?.textContent) || 'checklist';
  return `${sanitizeFilename(title)}.md`;
}

export function downloadMarkdown(markdown: string, filename: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
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

function serializeItem(item: HTMLElement): string {
  const title = cleanText(item.querySelector('.cc_accordion_title')?.textContent);
  if (!title) {
    return '';
  }

  const checkbox = item.querySelector<HTMLInputElement>('.cc_accordion_checkbox');
  const checked = Boolean(checkbox?.checked);
  const lines: string[] = [`- [${checked ? 'x' : ' '}] **${title}**`];

  const badges = getBadges(item);
  if (badges.length === 1) {
    lines.push(`  *${badges[0]}*`);
  } else if (badges.length >= 2) {
    lines.push(`  *Impact: ${badges[0]} · Difficulty: ${badges[1]}*`);
  }

  const rich = item.querySelector<HTMLElement>('.accordion_rich-text');
  const body = richTextToMarkdown(rich);
  if (body) {
    lines.push('');
    body.split('\n').forEach((line) => {
      lines.push(line ? `  ${line}` : '');
    });
  }

  const link = item.querySelector<HTMLAnchorElement>('a.cc_guide-note-link');
  if (link) {
    const linkLabel = cleanText(link.textContent) || 'Learn more';
    const href = absoluteUrl(link.getAttribute('href') || '');
    if (href) {
      lines.push('');
      lines.push(`  [${linkLabel}](${href})`);
    }
  }

  return cleanText(lines.join('\n'));
}

function getBadges(item: HTMLElement): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  item.querySelectorAll<HTMLElement>('.cc_accordion_badge[badge-label]').forEach((badge) => {
    const label = cleanText(badge.getAttribute('badge-label') || badge.textContent);
    if (!label || seen.has(label)) {
      return;
    }
    seen.add(label);
    labels.push(label);
  });

  return labels;
}

function richTextToMarkdown(root: HTMLElement | null): string {
  if (!root) {
    return '';
  }

  const walk = (node: Node, listType?: 'ul' | 'ol'): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return normalizeInlineText(node.nodeValue);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes);
    const walkChildren = () => joinInlineMarkdown(children.map((child) => walk(child, listType)));

    if (tag === 'br') {
      return '\n';
    }

    if (tag === 'strong' || tag === 'b') {
      const strong = cleanText(walkChildren());
      return strong ? `**${strong}**` : '';
    }

    if (tag === 'em' || tag === 'i') {
      const emphasis = cleanText(walkChildren());
      return emphasis ? `*${emphasis}*` : '';
    }

    if (tag === 'a') {
      const label = cleanText(walkChildren()) || cleanText(element.textContent);
      const href = absoluteUrl(element.getAttribute('href') || '');
      if (!label) {
        return '';
      }
      return href ? `[${label}](${href})` : label;
    }

    if (tag === 'p' || tag === 'div') {
      const paragraph = cleanText(walkChildren());
      return paragraph ? `${paragraph}\n\n` : '';
    }

    if (tag === 'ul' || tag === 'ol') {
      const type = tag === 'ol' ? 'ol' : 'ul';
      const items = Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((li, index) => {
          const body = cleanText(walk(li, type)).replace(/\n+/g, '\n  ');
          if (!body) {
            return '';
          }
          const bullet = type === 'ol' ? `${index + 1}.` : '-';
          return `${bullet} ${body}`;
        })
        .filter(Boolean)
        .join('\n');

      return items ? `${items}\n\n` : '';
    }

    if (tag === 'li') {
      return cleanText(walkChildren());
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag.charAt(1));
      const heading = cleanText(walkChildren());
      return heading ? `${'#'.repeat(level)} ${heading}\n\n` : '';
    }

    return walkChildren();
  };

  return cleanText(walk(root));
}

function getPrecedingHeading(listWrap: HTMLElement): HTMLElement | null {
  let node: Element | null = listWrap.previousElementSibling;

  while (node) {
    if (node instanceof HTMLElement && node.matches('h2')) {
      return node;
    }
    const nested = node.querySelector?.('h2');
    if (nested instanceof HTMLElement) {
      return nested;
    }
    node = node.previousElementSibling;
  }

  let parent: HTMLElement | null = listWrap.parentElement;
  for (let depth = 0; parent && depth < 4; depth += 1) {
    node = parent.previousElementSibling;
    while (node) {
      if (node instanceof HTMLElement && node.matches('h2')) {
        return node;
      }
      const nested = node.querySelector?.('h2');
      if (nested instanceof HTMLElement) {
        return nested;
      }
      node = node.previousElementSibling;
    }

    const own = parent.querySelector(':scope > h2, :scope > * > h2');
    if (own instanceof HTMLElement && !listWrap.contains(own)) {
      return own;
    }

    parent = parent.parentElement;
  }

  return null;
}

function getPhaseIntro(listWrap: HTMLElement, heading: HTMLElement | null): string {
  if (!heading) {
    return '';
  }

  const parts: string[] = [];
  let node: Element | null = heading.nextElementSibling;

  while (
    node &&
    node !== listWrap &&
    !(node instanceof HTMLElement && node.matches(LIST_SELECTOR)) &&
    !node.querySelector?.(LIST_SELECTOR)
  ) {
    if (node instanceof HTMLElement && node.classList.contains('cc_checklist_header')) {
      node = node.nextElementSibling;
      continue;
    }

    if (
      node instanceof HTMLElement &&
      (node.matches('p') || node.matches('.w-richtext') || node.matches('div'))
    ) {
      if (node.querySelector(LIST_SELECTOR) || node.querySelector(ITEM_SELECTOR)) {
        break;
      }

      const text = stripUiHelperText(
        node.classList.contains('w-richtext')
          ? richTextToMarkdown(node)
          : cleanText(node.textContent)
      );

      if (text) {
        parts.push(text);
      }
    }

    node = node.nextElementSibling;
  }

  return cleanText(parts.join('\n\n'));
}

function getPageIntro(root: ParentNode, firstList: HTMLElement): string {
  const h1 = root.querySelector('h1');
  if (!h1) {
    return '';
  }

  const parts: string[] = [];
  let node: Element | null = h1.nextElementSibling;

  while (node && node !== firstList && !node.querySelector?.(LIST_SELECTOR)) {
    if (node instanceof HTMLElement && node.matches('h2')) {
      const text = cleanText(node.textContent);
      if (text) {
        parts.push(text);
      }
    } else if (
      node instanceof HTMLElement &&
      (node.matches('p') || node.classList.contains('w-richtext'))
    ) {
      const text = stripUiHelperText(
        node.classList.contains('w-richtext')
          ? richTextToMarkdown(node)
          : cleanText(node.textContent)
      );
      if (text) {
        parts.push(text);
      }
    }

    if (node.querySelector?.(LIST_SELECTOR)) {
      break;
    }

    node = node.nextElementSibling;
  }

  if (parts.length) {
    return cleanText(parts.join('\n\n'));
  }

  // Common Webflow structure: intro lives in a sibling/wrapper near the h1
  const container = h1.parentElement;
  if (!container) {
    return '';
  }

  container.querySelectorAll('h2, p').forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    if (
      firstList.contains(element) ||
      element.closest(ITEM_SELECTOR) ||
      element.closest(LIST_SELECTOR)
    ) {
      return;
    }

    const position = firstList.compareDocumentPosition(element);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      const text = stripUiHelperText(element.textContent);
      if (text && parts.length < 2) {
        parts.push(text);
      }
    }
  });

  return cleanText(parts.join('\n\n'));
}

function setDownloadedState(button: HTMLElement): void {
  if (button.dataset.downloadBusy === '1') {
    return;
  }

  const original =
    button.getAttribute('data-original-label') ||
    cleanText(button.textContent) ||
    'Download Markdown';
  button.setAttribute('data-original-label', original);
  button.dataset.downloadBusy = '1';

  const labelTarget = button.querySelector<HTMLElement>('.button-text, .btn-text, span') || button;
  const previous = labelTarget.textContent;
  labelTarget.textContent = DOWNLOADED_LABEL;

  window.setTimeout(() => {
    labelTarget.textContent = button.getAttribute('data-original-label') || previous;
    button.dataset.downloadBusy = '0';
  }, DOWNLOADED_MS);
}

function getSourceUrl(): string {
  return window.location.href;
}

function getDocumentTitle(): string {
  return cleanText(document.title) || 'Checklist';
}

function absoluteUrl(href: string): string {
  if (!href) {
    return '';
  }

  try {
    return new URL(href, window.location.href).href;
  } catch {
    return href;
  }
}

function sanitizeFilename(value: string): string {
  return (
    cleanText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'checklist'
  );
}

function stripUiHelperText(value: string | null | undefined): string {
  return cleanText(
    String(value || '').replace(/\s*Select each task below for more details\.?/gi, '')
  );
}

function normalizeInlineText(value: string | null | undefined): string {
  const raw = String(value || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ');

  // Whitespace-only nodes collapse to empty so block joins stay clean;
  // joinInlineMarkdown inserts spaces for glued inline boundaries.
  if (!raw.trim()) {
    return '';
  }

  const leading = /^\s/.test(raw) ? ' ' : '';
  const trailing = /\s$/.test(raw) ? ' ' : '';
  return `${leading}${raw.trim().replace(/\s+/g, ' ')}${trailing}`;
}

function joinInlineMarkdown(parts: string[]): string {
  let result = '';

  for (const part of parts) {
    if (!part) {
      continue;
    }

    if (!result) {
      result = part;
      continue;
    }

    const needsSpace =
      /[\w*):\]]$/.test(result) &&
      /^[\w[*(]/.test(part) &&
      !/\s$/.test(result) &&
      !/^\s/.test(part);

    result += needsSpace ? ` ${part}` : part;
  }

  return result;
}

function cleanText(value: string | null | undefined): string {
  return String(value || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
