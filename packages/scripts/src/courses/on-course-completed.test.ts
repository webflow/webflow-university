/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildCourseCompletionUrl,
  initOnCourseCompleted,
  populateCourseCompletionPage,
  readCourseCompletionQuery,
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

describe('onCourseCompleted', () => {
  afterEach(() => {
    delete window.onCourseCompleted;
    document.body.innerHTML = '';
    setLocation('/');
    vi.restoreAllMocks();
  });

  it('redirects to the completion page with metadata query params', () => {
    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    setLocation('/course-lesson/get-started-mcp-activity-resources');
    document.body.innerHTML =
      '<img data-course-thumbnail src="https://cdn.example.com/course.webp" alt="" />';

    initOnCourseCompleted();

    window.onCourseCompleted?.({
      fullName: 'Jane Doe',
      courseId: 'webflow-for-reviewers',
      courseName: 'Webflow for Reviewers',
      completedCoursesCount: 3,
    });

    expect(assignSpy).toHaveBeenCalledWith(
      '/course-completion?fullName=Jane+Doe&courseId=webflow-for-reviewers&courseName=Webflow+for+Reviewers&completedCoursesCount=3&courseThumbnail=https%3A%2F%2Fcdn.example.com%2Fcourse.webp'
    );
  });

  it('omits null optional fields from the redirect URL', () => {
    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    setLocation('/course-lesson/get-started-mcp-activity-resources');

    initOnCourseCompleted();

    window.onCourseCompleted?.({
      fullName: null,
      courseId: 'webflow-for-reviewers',
      courseName: null,
      completedCoursesCount: null,
    });

    expect(assignSpy).toHaveBeenCalledWith('/course-completion?courseId=webflow-for-reviewers');
  });

  it('does not register the hook outside course lesson pages', () => {
    setLocation('/courses');

    initOnCourseCompleted();

    expect(window.onCourseCompleted).toBeUndefined();
  });

  it('reads completion metadata from the URL on the completion page', () => {
    setLocation(
      '/course-completion?fullName=Jane+Doe&courseId=webflow-for-reviewers&courseName=Webflow+for+Reviewers&completedCoursesCount=3&courseThumbnail=https%3A%2F%2Fcdn.example.com%2Fcourse.webp'
    );

    expect(readCourseCompletionQuery()).toEqual({
      fullName: 'Jane Doe',
      courseId: 'webflow-for-reviewers',
      courseName: 'Webflow for Reviewers',
      completedCoursesCount: 3,
      courseThumbnail: 'https://cdn.example.com/course.webp',
    });

    initOnCourseCompleted();

    expect(window.onCourseCompleted).toBeUndefined();
  });

  it('updates StampSVG code-island data-props from query params', () => {
    setLocation(
      '/course-completion?courseName=Webflow+for+Reviewers&courseThumbnail=https%3A%2F%2Fcdn.example.com%2Fcourse.webp'
    );
    document.body.innerHTML = stampSvgIslandHtml({
      imageUrl: 'https://cdn.example.com/placeholder.jpg',
      logoUrl: 'https://cdn.example.com/logo.png',
      title: 'Webflow HELLO',
    });

    initOnCourseCompleted();

    const island = document.querySelector('code-island');
    expect(island).not.toBeNull();
    expect(JSON.parse(island!.getAttribute('data-props')!)).toEqual({
      imageUrl: 'https://cdn.example.com/course.webp',
      logoUrl: 'https://cdn.example.com/logo.png',
      title: 'Webflow for Reviewers',
    });
  });

  it('leaves existing StampSVG props when query values are missing', () => {
    setLocation('/course-completion?courseId=webflow-for-reviewers');
    document.body.innerHTML = stampSvgIslandHtml({
      imageUrl: 'https://cdn.example.com/placeholder.jpg',
      logoUrl: 'https://cdn.example.com/logo.png',
      title: 'Webflow HELLO',
    });

    populateCourseCompletionPage();

    const island = document.querySelector('code-island');
    expect(JSON.parse(island!.getAttribute('data-props')!)).toEqual({
      imageUrl: 'https://cdn.example.com/placeholder.jpg',
      logoUrl: 'https://cdn.example.com/logo.png',
      title: 'Webflow HELLO',
    });
  });

  it('replaces the StampSVG island so updated props are re-read on connect', () => {
    setLocation(
      '/course-completion?courseName=Course+A&courseThumbnail=https%3A%2F%2Fcdn.example.com%2Fthumb.png'
    );
    document.body.innerHTML = stampSvgIslandHtml({
      imageUrl: 'https://cdn.example.com/placeholder.jpg',
      logoUrl: 'https://cdn.example.com/logo.png',
      title: 'Webflow HELLO',
    });
    const island = document.querySelector('code-island')!;
    island.appendChild(document.createElement('div'));

    populateCourseCompletionPage();

    const nextIsland = document.querySelector('code-island');
    expect(nextIsland).not.toBe(island);
    expect(nextIsland?.childElementCount).toBe(0);
    expect(JSON.parse(nextIsland!.getAttribute('data-props')!)).toEqual({
      imageUrl: 'https://cdn.example.com/thumb.png',
      logoUrl: 'https://cdn.example.com/logo.png',
      title: 'Course A',
    });
  });
});

describe('buildCourseCompletionUrl', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('includes the course thumbnail when present', () => {
    document.body.innerHTML =
      '<img data-course-thumbnail src="https://cdn.example.com/thumb.png" alt="" />';

    expect(
      buildCourseCompletionUrl({
        fullName: 'Ada',
        courseId: 'course-a',
        courseName: 'Course A',
        completedCoursesCount: 1,
      })
    ).toBe(
      '/course-completion?fullName=Ada&courseId=course-a&courseName=Course+A&completedCoursesCount=1&courseThumbnail=https%3A%2F%2Fcdn.example.com%2Fthumb.png'
    );
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
