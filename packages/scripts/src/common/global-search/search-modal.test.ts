/**
 * @vitest-environment happy-dom
 */
import { expect, it, vi } from 'vitest';

import { initSearchModal } from './search-modal.js';

it('keeps Popular custom while leaving non-empty queries entirely to Swiftype', () => {
  vi.useFakeTimers();
  document.body.innerHTML = `
    <div class="st-default-autocomplete"></div>
    <div data-sm-modal="true" class="active">
      <div class="sm-ovl-root">
        <button class="g_search-close-bg" type="button"></button>
        <div class="sm-ovl__panel">
          <div class="sm-ovl__field">
            <input id="g-search" />
            <button class="sm-kbd" type="button">Esc</button>
          </div>
        </div>
      </div>
    </div>
  `;

  delete (window as Window & { __wfuSearchModal?: boolean }).__wfuSearchModal;
  initSearchModal();

  const input = document.querySelector<HTMLInputElement>('#g-search');
  const autocomplete = document.querySelector<HTMLElement>('.st-default-autocomplete');
  const popular = document.querySelector<HTMLElement>('.sm-popular');
  expect(input).not.toBeNull();
  expect(popular?.hidden).toBe(false);
  expect(autocomplete?.parentElement).toBe(document.body);

  const swiftypeKeydown = vi.fn();
  input!.addEventListener('keydown', swiftypeKeydown);
  input!.value = 'grid';
  input!.dispatchEvent(new Event('input', { bubbles: true }));

  expect(popular?.hidden).toBe(true);
  expect(autocomplete?.parentElement).toBe(document.body);

  const typedArrow = new KeyboardEvent('keydown', {
    key: 'ArrowDown',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(typedArrow);

  const typedEnter = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(typedEnter);

  expect(swiftypeKeydown).toHaveBeenCalledTimes(2);
  expect(typedArrow.defaultPrevented).toBe(false);
  expect(typedEnter.defaultPrevented).toBe(false);
  vi.runOnlyPendingTimers();
  expect(document.querySelector('[data-sm-modal="true"]')?.classList.contains('active')).toBe(
    false
  );

  swiftypeKeydown.mockClear();
  document.querySelector('[data-sm-modal="true"]')?.classList.add('active');
  input!.value = '';
  input!.dispatchEvent(new Event('input', { bubbles: true }));
  expect(popular?.hidden).toBe(false);

  const emptyArrow = new KeyboardEvent('keydown', {
    key: 'ArrowDown',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(emptyArrow);

  const popularRow = document.querySelector<HTMLAnchorElement>('.sm-popular__row');
  expect(popularRow?.getAttribute('aria-selected')).toBe('true');
  popularRow!.href = '#popular';

  const emptyEnter = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(emptyEnter);

  expect(swiftypeKeydown).not.toHaveBeenCalled();
  expect(emptyArrow.defaultPrevented).toBe(true);
  expect(emptyEnter.defaultPrevented).toBe(true);
  vi.useRealTimers();
});
