/**
 * @vitest-environment happy-dom
 */
import { expect, it, vi } from 'vitest';

import { initSearchModal } from './search-modal.js';

it('defers typed Enter to Swiftype and keeps empty-query Popular navigation custom', () => {
  document.body.innerHTML = `
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
  expect(input).not.toBeNull();

  const swiftypeKeydown = vi.fn();
  input!.addEventListener('keydown', swiftypeKeydown);
  input!.value = 'grid';

  const typedEnter = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(typedEnter);

  expect(swiftypeKeydown).toHaveBeenCalledOnce();
  expect(typedEnter.defaultPrevented).toBe(false);

  swiftypeKeydown.mockClear();
  input!.value = '';
  input!.dispatchEvent(new Event('input', { bubbles: true }));
  input!.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })
  );

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
  expect(emptyEnter.defaultPrevented).toBe(true);
});
