/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildCourseCompletionUrl,
  getLessonCourseSlug,
  initOnCourseCompleted,
  populateCourseCompletionPage,
  readCourseCompletionQuery,
  readCourseFromCatalog,
  toOrdinal,
} from './on-course-completed';

function setLocation(pathWithSearch: string): void {
  window.history.pushState({}, '', pathWithSearch);
}

function stampSvgIslandHtml(props: { imageUrl: string; logoUrl: string; title: string }): string {
  const loader = JSON.stringify({
    tag: 'FEDERATION',
    val: {
      clientModuleUrl:
        'https://code-components.website-files.com/example%2Fmodule%2Fwf-manifest.json',
      moduleId: '_example',
      submoduleId: 'StampSVG',
      exportPath: 'default',
      serverModuleUrl: '_',
    },
  });
  const dataProps = JSON.stringify(props);

  return `<code-island data-loader='${loader}' data-props='${dataProps}' data-hydrate="true" style="display:contents"><!--$--><!--/$--></code-island>`;
}

function courseCatalogHtml(): string {
  return `
    <div class="u-hidden w-dyn-list">
      <div role="list" class="w-dyn-items">
        <div data-course-id="get-started-mcp" role="listitem" class="w-dyn-item">
          <img src="https://cdn.example.com/mcp.webp" alt="" />
          <div>Get started with the Webflow MCP</div>
        </div>
        <div data-course-id="webflow-for-reviewers" role="listitem" class="w-dyn-item">
          <img src="https://cdn.example.com/reviewers.webp" alt="" />
          <div>Webflow for Reviewers</div>
        </div>
      </div>
    </div>
  `;
}

describe('onCourseCompleted', () => {
  afterEach(() => {
    delete window.onCourseCompleted;
    document.body.innerHTML = '';
    setLocation('/');
    vi.restoreAllMocks();
  });

  it('redirects to the completion page with only the course slug', () => {
    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    setLocation('/course-lesson/get-started-mcp-activity-resources');
    document.body.innerHTML =
      '<a data-complete-course-btn data-course-slug="get-started-mcp" href="#">Complete course</a>';

    initOnCourseCompleted();

    window.onCourseCompleted?.({
      fullName: 'Jane Doe',
      courseId: 'platform-id-should-be-ignored',
      courseName: 'Ignored',
      completedCoursesCount: 3,
    });

    expect(assignSpy).toHaveBeenCalledWith('/course-completion?courseSlug=get-started-mcp');
  });

  it('falls back to payload courseId when the button slug is missing', () => {
    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    setLocation('/course-lesson/get-started-mcp-activity-resources');

    initOnCourseCompleted();

    window.onCourseCompleted?.({
      fullName: null,
      courseId: 'webflow-for-reviewers',
      courseName: null,
      completedCoursesCount: null,
    });

    expect(assignSpy).toHaveBeenCalledWith('/course-completion?courseSlug=webflow-for-reviewers');
  });

  it('does not register the hook outside course lesson pages', () => {
    setLocation('/courses');

    initOnCourseCompleted();

    expect(window.onCourseCompleted).toBeUndefined();
  });

  it('reads the course slug from the URL on the completion page', () => {
    setLocation('/course-completion?courseSlug=webflow-for-reviewers');

    expect(readCourseCompletionQuery()).toEqual({
      courseSlug: 'webflow-for-reviewers',
    });

    initOnCourseCompleted();

    expect(window.onCourseCompleted).toBeUndefined();
  });

  it('updates StampSVG from the hidden course catalog', async () => {
    class ImmediateImage {
      onload: ((this: GlobalEventHandlers, ev: Event) => unknown) | null = null;
      onerror: ((this: GlobalEventHandlers, ev: Event | string) => unknown) | null = null;
      set src(_value: string) {
        queueMicrotask(() => {
          this.onload?.call(null as unknown as GlobalEventHandlers, new Event('load'));
        });
      }
    }
    vi.stubGlobal('Image', ImmediateImage);

    setLocation('/course-completion?courseSlug=webflow-for-reviewers');
    document.body.innerHTML =
      '<div class="completion-scrim fade-in"></div>' +
      courseCatalogHtml() +
      stampSvgIslandHtml({
        imageUrl: 'https://cdn.example.com/placeholder.jpg',
        logoUrl: 'https://cdn.example.com/logo.png',
        title: 'Webflow HELLO',
      });

    const island = document.querySelector('code-island')!;
    const shadow = island.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<svg><text>Webflow for Reviewers</text><image href="https://cdn.example.com/reviewers.webp" /></svg>';

    initOnCourseCompleted();

    await vi.waitFor(() => {
      expect(JSON.parse(island.getAttribute('data-props')!)).toEqual({
        imageUrl: 'https://cdn.example.com/reviewers.webp',
        logoUrl: 'https://cdn.example.com/logo.png',
        title: 'Webflow for Reviewers',
      });
    });

    await vi.waitFor(() => {
      expect(document.querySelector('.completion-scrim')?.classList.contains('fade-in')).toBe(
        false
      );
    });
  });

  it('leaves existing StampSVG props when the catalog entry is missing', async () => {
    setLocation('/course-completion?courseSlug=missing-course');
    document.body.innerHTML =
      courseCatalogHtml() +
      stampSvgIslandHtml({
        imageUrl: 'https://cdn.example.com/placeholder.jpg',
        logoUrl: 'https://cdn.example.com/logo.png',
        title: 'Webflow HELLO',
      });
    const island = document.querySelector('code-island')!;
    const shadow = island.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<svg><text>Webflow HELLO</text></svg>';

    populateCourseCompletionPage();

    await vi.waitFor(() => {
      expect(JSON.parse(island.getAttribute('data-props')!)).toEqual({
        imageUrl: 'https://cdn.example.com/placeholder.jpg',
        logoUrl: 'https://cdn.example.com/logo.png',
        title: 'Webflow HELLO',
      });
    });
  });

  it('updates StampSVG data-props in place without replacing the island', async () => {
    setLocation('/course-completion?courseSlug=get-started-mcp');
    document.body.innerHTML =
      courseCatalogHtml() +
      stampSvgIslandHtml({
        imageUrl: 'https://cdn.example.com/placeholder.jpg',
        logoUrl: 'https://cdn.example.com/logo.png',
        title: 'Webflow HELLO',
      });
    const island = document.querySelector('code-island')!;
    const child = document.createElement('div');
    island.appendChild(child);
    const shadow = island.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<svg><text>Get started with the Webflow MCP</text><image href="https://cdn.example.com/mcp.webp" /></svg>';

    const updated = populateCourseCompletionPage();

    expect(updated).toBe(true);
    expect(document.querySelector('code-island')).toBe(island);
    expect(island.contains(child)).toBe(true);

    await vi.waitFor(() => {
      expect(JSON.parse(island.getAttribute('data-props')!)).toEqual({
        imageUrl: 'https://cdn.example.com/mcp.webp',
        logoUrl: 'https://cdn.example.com/logo.png',
        title: 'Get started with the Webflow MCP',
      });
    });
  });
});

describe('getLessonCourseSlug', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads data-course-slug from the complete-course button', () => {
    document.body.innerHTML =
      '<a data-complete-course-btn data-course-slug="get-started-mcp" href="#">Complete</a>';

    expect(
      getLessonCourseSlug({
        fullName: null,
        courseId: 'other-id',
        courseName: null,
        completedCoursesCount: null,
      })
    ).toBe('get-started-mcp');
  });
});

describe('readCourseFromCatalog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns title and image for a matching data-course-id', () => {
    document.body.innerHTML = courseCatalogHtml();

    expect(readCourseFromCatalog('get-started-mcp')).toEqual({
      slug: 'get-started-mcp',
      title: 'Get started with the Webflow MCP',
      imageUrl: 'https://cdn.example.com/mcp.webp',
    });
  });
});

describe('buildCourseCompletionUrl', () => {
  it('builds a slug-only completion URL', () => {
    expect(buildCourseCompletionUrl('course-a')).toBe('/course-completion?courseSlug=course-a');
  });
});

describe('toOrdinal', () => {
  it('formats common ordinals', () => {
    expect(toOrdinal(1)).toBe('1st');
    expect(toOrdinal(2)).toBe('2nd');
    expect(toOrdinal(3)).toBe('3rd');
    expect(toOrdinal(4)).toBe('4th');
    expect(toOrdinal(11)).toBe('11th');
    expect(toOrdinal(21)).toBe('21st');
  });
});
