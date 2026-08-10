/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  downloadMarkdown,
  getDownloadFilename,
  initDownloadChecklistMarkdown,
  serializeChecklistToMarkdown,
} from './index';

function setupChecklistDom({ checked = false }: { checked?: boolean } = {}): void {
  document.head.innerHTML =
    '<link rel="canonical" href="https://university.webflow.com/resources/seo-checklist" />';
  document.body.innerHTML = `
    <button data-copy-checklist-md>Download Markdown</button>
    <h1>SEO checklist</h1>
    <h2 class="text-md">Page intro for SEO.</h2>
    <section>
      <h2>Design and build with SEO in mind</h2>
      <p>Ensure your website is structured for search. Select each task below for more details.</p>
      <div class="cc_checklist_header">
        <div>TASK</div><div>IMPACT</div><div>DIFFICULTY</div>
      </div>
      <div class="cc_list-wrap">
        <details class="cc_accordion-item">
          <summary class="cc_accordion_summary">
            <label class="cc_accordion_checkbox-label">
              <input type="checkbox" class="cc_accordion_checkbox" ${checked ? 'checked' : ''} />
              <h3 class="cc_accordion_title">Plan a clear site structure and navigation</h3>
            </label>
            <div class="cc_accordion_labels-wrap">
              <div badge-label="High" class="cc_accordion_badge"><div>High</div></div>
              <div badge-label="Intermediate" class="cc_accordion_badge"><div>Intermediate</div></div>
            </div>
          </summary>
          <div>
            <div class="accordion_rich-text w-richtext">
              <p>Site structure refers to how pages are organized.\u200B</p>
              <p><strong>Pro tips:</strong></p>
              <ul role="list">
                <li>Keep structure shallow</li>
                <li>Use <em>internal</em> linking</li>
              </ul>
            </div>
            <a class="cc_guide-note-link" href="https://webflow.com/blog/website-structure">
              <div>Learn more about site structure and SEO</div>
            </a>
          </div>
        </details>
        <details class="cc_accordion-item">
          <summary class="cc_accordion_summary">
            <label class="cc_accordion_checkbox-label">
              <input type="checkbox" class="cc_accordion_checkbox" />
              <h3 class="cc_accordion_title">Ensure site is responsive</h3>
            </label>
            <div class="cc_accordion_labels-wrap">
              <div badge-label="Critical" class="cc_accordion_badge"><div>Critical</div></div>
              <div badge-label="Beginner" class="cc_accordion_badge"><div>Beginner</div></div>
            </div>
          </summary>
          <div>
            <div class="accordion_rich-text w-richtext">
              <p>Responsive design adapts to devices.</p>
            </div>
          </div>
        </details>
      </div>
    </section>
  `;
}

describe('download checklist markdown', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/resources/seo-checklist');
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('early-returns when the download button attribute is missing', () => {
    document.body.innerHTML = '<h1>SEO checklist</h1><div class="cc_list-wrap"></div>';
    const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');

    initDownloadChecklistMarkdown();

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('binds click handlers when the download button attribute is present', () => {
    setupChecklistDom();
    const button = document.querySelector<HTMLElement>('[data-copy-checklist-md]');
    const addEventListenerSpy = vi.spyOn(button as HTMLElement, 'addEventListener');

    initDownloadChecklistMarkdown();

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('serializes checklist content into markdown', () => {
    setupChecklistDom({ checked: true });

    const markdown = serializeChecklistToMarkdown();

    expect(markdown).toContain('# SEO checklist');
    expect(markdown).toContain(`Source: ${window.location.href}`);
    expect(markdown).not.toContain('university.webflow.com');
    expect(markdown).toContain('Page intro for SEO.');
    expect(markdown).toContain('## Design and build with SEO in mind');
    expect(markdown).toContain('Ensure your website is structured for search.');
    expect(markdown).not.toContain('Select each task below');
    expect(markdown).toContain('- [x] **Plan a clear site structure and navigation**');
    expect(markdown).toContain('*Impact: High · Difficulty: Intermediate*');
    expect(markdown).toContain('**Pro tips:**');
    expect(markdown).toContain('- Keep structure shallow');
    expect(markdown).toContain('*internal*');
    expect(markdown).not.toContain('\u200B');
    expect(markdown).toContain(
      '[Learn more about site structure and SEO](https://webflow.com/blog/website-structure)'
    );
    expect(markdown).toContain('- [ ] **Ensure site is responsive**');
    expect(markdown).toContain('*Impact: Critical · Difficulty: Beginner*');
  });

  it('inserts spaces around glued inline markdown in rich text', () => {
    document.body.innerHTML = `
      <h1>Spacing checklist</h1>
      <div class="cc_list-wrap">
        <details class="cc_accordion-item">
          <summary>
            <input type="checkbox" class="cc_accordion_checkbox" />
            <h3 class="cc_accordion_title">Keyword research</h3>
          </summary>
          <div class="accordion_rich-text w-richtext">
            <p>Tools like<a href="https://ads.google.com/keyword-planner">Google Keyword Planner</a>can help.</p>
            <p><strong>Pro tip:</strong>For localized sites, use<a href="https://university.webflow.com/article/localized-urls"><strong>Localized URLs</strong></a>:<strong>Webflow</strong> handles this well.</p>
          </div>
        </details>
      </div>
    `;

    const markdown = serializeChecklistToMarkdown();

    expect(markdown).toContain(
      'Tools like [Google Keyword Planner](https://ads.google.com/keyword-planner) can help.'
    );
    expect(markdown).toContain('**Pro tip:** For localized sites, use');
    expect(markdown).toContain(
      '[**Localized URLs**](https://university.webflow.com/article/localized-urls): **Webflow** handles this well.'
    );
  });

  it('falls back to orphan accordion items when list wraps are missing', () => {
    document.body.innerHTML = `
      <h1>Orphan checklist</h1>
      <details class="cc_accordion-item">
        <summary>
          <input type="checkbox" class="cc_accordion_checkbox" />
          <h3 class="cc_accordion_title">Standalone task</h3>
        </summary>
        <div class="accordion_rich-text w-richtext"><p>Body copy.</p></div>
      </details>
    `;

    const markdown = serializeChecklistToMarkdown();

    expect(markdown).toContain('# Orphan checklist');
    expect(markdown).toContain('- [ ] **Standalone task**');
    expect(markdown).toContain('Body copy.');
  });

  it('builds a filename from the page slug', () => {
    expect(getDownloadFilename()).toBe('seo-checklist.md');
  });

  it('downloads markdown on button click and restores the label', () => {
    vi.useFakeTimers();
    setupChecklistDom();

    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock-url');
    const revokeObjectURL = vi.fn((_url: string) => undefined);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    initDownloadChecklistMarkdown();

    const button = document.querySelector<HTMLElement>('[data-copy-checklist-md]');
    expect(button).not.toBeNull();
    button?.click();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURL.mock.calls[0]?.[0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg?.type).toBe('text/markdown;charset=utf-8');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(button?.textContent).toBe('Downloaded');

    vi.advanceTimersByTime(2000);
    expect(button?.textContent).toBe('Download Markdown');
  });

  it('downloadMarkdown creates an anchor with the expected filename', () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:file-url');
    const revokeObjectURL = vi.fn((_url: string) => undefined);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });

    let downloadedName = '';
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadedName = this.download;
    });

    downloadMarkdown('# Hello\n', 'seo-checklist.md');

    expect(downloadedName).toBe('seo-checklist.md');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:file-url');
  });
});
