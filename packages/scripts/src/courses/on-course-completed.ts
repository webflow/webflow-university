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

type StampSvgIslandProps = {
  imageUrl?: string;
  logoUrl?: string;
  title?: string;
};

function parseJsonAttribute<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function findStampSvgCodeIsland(): HTMLElement | null {
  const islands = document.querySelectorAll<HTMLElement>('code-island[data-loader]');

  for (const island of islands) {
    const loader = parseJsonAttribute<{ val?: { submoduleId?: string } }>(
      island.getAttribute('data-loader')
    );

    if (loader?.val?.submoduleId === 'StampSVG') {
      return island;
    }
  }

  return document.querySelector<HTMLElement>('code-island[data-loader*="StampSVG"]');
}

function mergeStampSvgPropsFromQuery(
  current: StampSvgIslandProps,
  query: CourseCompletionQuery
): StampSvgIslandProps {
  const next: StampSvgIslandProps = { ...current };

  if (query.courseThumbnail) {
    next.imageUrl = query.courseThumbnail;
  }

  if (query.courseName) {
    next.title = query.courseName;
  }

  return next;
}

/**
 * Populate completion-page UI from URL query params.
 * Updates the StampSVG code-island `data-props` before (or by forcing) hydration.
 */
export function populateCourseCompletionPage(
  query: CourseCompletionQuery = readCourseCompletionQuery()
): void {
  const island = findStampSvgCodeIsland();
  if (!island) {
    return;
  }

  const current = parseJsonAttribute<StampSvgIslandProps>(island.getAttribute('data-props')) ?? {};
  const next = mergeStampSvgPropsFromQuery(current, query);
  const nextRaw = JSON.stringify(next);

  if (island.getAttribute('data-props') === nextRaw) {
    return;
  }

  // Replace the island so the runtime always re-reads `data-props` on connect,
  // even if hydration already started with the Designer defaults.
  const clone = island.cloneNode(false) as HTMLElement;
  clone.setAttribute('data-props', nextRaw);
  island.replaceWith(clone);
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
