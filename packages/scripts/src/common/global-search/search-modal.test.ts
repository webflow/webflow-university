/**
 * @vitest-environment happy-dom
 */
import { afterEach, expect, it, vi } from 'vitest';

import { initSearchModal } from './search-modal.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('tracks committed searches once while keeping empty-query Popular navigation custom', () => {
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
    <div class="st-default-autocomplete">
      <div class="st-query-present">
        <a class="st-ui-result" href="#result">
          <span class="st-ui-type-heading">Grid result</span>
        </a>
      </div>
    </div>
  `;

  const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', fetchMock);

  delete (window as Window & { __wfuSearchModal?: boolean }).__wfuSearchModal;
  initSearchModal();

  const input = document.querySelector<HTMLInputElement>('#g-search');
  expect(input).not.toBeNull();

  const swiftypeKeydown = vi.fn();
  input!.addEventListener('keydown', swiftypeKeydown);
  input!.value = 'grid';
  input!.dispatchEvent(new Event('input', { bubbles: true }));

  document.querySelector<HTMLElement>('.st-ui-result .st-ui-type-heading')!.click();

  expect(fetchMock).toHaveBeenCalledOnce();
  const [searchUrl, searchRequest] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(searchUrl).toContain('/installs/8tPjZM7QFLqxMEpVo-ws/search.json');
  expect(searchRequest).toMatchObject({
    method: 'POST',
    credentials: 'include',
    keepalive: true,
  });
  expect((searchRequest.body as URLSearchParams).get('q')).toBe('grid');

  fetchMock.mockClear();
  input!.value = 'layout';
  input!.dispatchEvent(new Event('input', { bubbles: true }));

  const typedEnter = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  input!.dispatchEvent(typedEnter);

  expect(swiftypeKeydown).toHaveBeenCalledOnce();
  expect(typedEnter.defaultPrevented).toBe(false);

  document.querySelector<HTMLElement>('.st-ui-result .st-ui-type-heading')!.click();
  expect(fetchMock).not.toHaveBeenCalled();

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
