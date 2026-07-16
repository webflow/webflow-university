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
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    setPathname('/course-lesson/get-started-mcp-activity-resources');

    initOnCourseCompleted();

    window.onCourseCompleted?.({
      fullName: 'Jane Doe',
      courseName: 'Webflow for Reviewers',
      completedCoursesCount: 3,
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Congratulations, Jane Doe. You completed Webflow for Reviewers, your 3rd course...'
    );
  });

  it('does not register the hook outside course lesson pages', () => {
    setPathname('/courses');

    initOnCourseCompleted();

    expect(window.onCourseCompleted).toBeUndefined();
  });
});
