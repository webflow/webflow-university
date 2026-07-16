/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { initOnCourseCompleted } from './on-course-completed';

function setPathname(pathname: string): void {
  window.history.pushState({}, '', pathname);
}

describe('onCourseCompleted', () => {
  afterEach(() => {
    delete window.onCourseCompleted;
    setPathname('/');
    vi.restoreAllMocks();
  });

  it('logs a congratulations message on course lesson pages', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setPathname('/course-lesson/get-started-mcp-activity-resources');

    initOnCourseCompleted();

    window.onCourseCompleted?.({
      fullName: 'Jane Doe',
      courseId: 'webflow-for-reviewers',
      courseName: 'Webflow for Reviewers',
      completedCoursesCount: 3,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Congratulations, Jane Doe. You completed Webflow for Reviewers, your 3rd course...'
    );
  });

  it('omits the course count when completedCoursesCount is null', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setPathname('/course-lesson/get-started-mcp-activity-resources');

    initOnCourseCompleted();

    window.onCourseCompleted?.({
      fullName: 'Jane Doe',
      courseId: 'webflow-for-reviewers',
      courseName: 'Webflow for Reviewers',
      completedCoursesCount: null,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Congratulations, Jane Doe. You completed Webflow for Reviewers.'
    );
  });

  it('no-ops when called without a payload', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setPathname('/course-lesson/get-started-mcp-activity-resources');

    initOnCourseCompleted();

    expect(() => window.onCourseCompleted?.()).not.toThrow();
    expect(() => window.onCourseCompleted?.(undefined)).not.toThrow();
    expect(() => window.onCourseCompleted?.(null)).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not register the hook outside course lesson pages', () => {
    setPathname('/courses');

    initOnCourseCompleted();

    expect(window.onCourseCompleted).toBeUndefined();
  });
});
