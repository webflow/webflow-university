export type CourseCompletedPayload = {
  fullName: string | null;
  courseId: string;
  courseName: string | null;
  completedCoursesCount: number | null;
};

export type CourseCompletionQuery = {
  fullName: string | null;
  courseId: string | null;
  courseName: string | null;
  completedCoursesCount: number | null;
  courseThumbnail: string | null;
};

const COURSE_COMPLETION_PATH = '/course-completion';

export function toOrdinal(count: number): string {
  const absolute = Math.abs(count);
  const mod100 = absolute % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${count}th`;
  }

  switch (absolute % 10) {
    case 1:
      return `${count}st`;
    case 2:
      return `${count}nd`;
    case 3:
      return `${count}rd`;
    default:
      return `${count}th`;
  }
}

function isCourseLessonPage(): boolean {
  return window.location.pathname.startsWith('/course-lesson');
}

function isCourseCompletionPage(): boolean {
  return (
    window.location.pathname === COURSE_COMPLETION_PATH ||
    window.location.pathname.startsWith(`${COURSE_COMPLETION_PATH}/`)
  );
}

function getCourseThumbnail(): string | null {
  const img = document.querySelector<HTMLImageElement>('img[data-course-thumbnail]');
  return img?.currentSrc || img?.src || null;
}

export function buildCourseCompletionUrl(payload: CourseCompletedPayload): string {
  const params = new URLSearchParams();

  if (payload.fullName) {
    params.set('fullName', payload.fullName);
  }

  params.set('courseId', payload.courseId);

  if (payload.courseName) {
    params.set('courseName', payload.courseName);
  }

  if (payload.completedCoursesCount != null) {
    params.set('completedCoursesCount', String(payload.completedCoursesCount));
  }

  const courseThumbnail = getCourseThumbnail();
  if (courseThumbnail) {
    params.set('courseThumbnail', courseThumbnail);
  }

  const query = params.toString();
  return query ? `${COURSE_COMPLETION_PATH}?${query}` : COURSE_COMPLETION_PATH;
}

export function readCourseCompletionQuery(search = window.location.search): CourseCompletionQuery {
  const params = new URLSearchParams(search);
  const completedCoursesCountRaw = params.get('completedCoursesCount');
  const completedCoursesCount =
    completedCoursesCountRaw != null && completedCoursesCountRaw !== ''
      ? Number(completedCoursesCountRaw)
      : null;

  return {
    fullName: params.get('fullName'),
    courseId: params.get('courseId'),
    courseName: params.get('courseName'),
    completedCoursesCount:
      completedCoursesCount != null && Number.isFinite(completedCoursesCount)
        ? completedCoursesCount
        : null,
    courseThumbnail: params.get('courseThumbnail'),
  };
}

/**
 * Populate completion-page UI from URL query params.
 * Data-attribute targets will be wired once the page markup is ready.
 */
export function populateCourseCompletionPage(
  query: CourseCompletionQuery = readCourseCompletionQuery()
): void {
  // TODO: map `query` onto elements via data attributes once available.
  void query;
}

export function initOnCourseCompleted(): void {
  if (isCourseLessonPage()) {
    window.onCourseCompleted = (payload: CourseCompletedPayload) => {
      window.location.assign(buildCourseCompletionUrl(payload));
    };
    return;
  }

  if (isCourseCompletionPage()) {
    populateCourseCompletionPage();
  }
}
