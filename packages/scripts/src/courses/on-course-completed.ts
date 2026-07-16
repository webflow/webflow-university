type CourseCompletedPayload = {
  fullName: string | null;
  courseId: string;
  courseName: string | null;
  completedCoursesCount: number | null;
};

function toOrdinal(count: number): string {
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

export function initOnCourseCompleted(): void {
  if (!isCourseLessonPage()) {
    return;
  }

  window.onCourseCompleted = (payload?: CourseCompletedPayload | null) => {
    // Host app may call this without a payload (e.g. lesson complete, not course complete).
    if (!payload) {
      return;
    }

    const { fullName, courseName, completedCoursesCount } = payload;
    const name = fullName || 'there';
    const course = courseName || 'the course';

    if (completedCoursesCount == null) {
      console.warn(`Congratulations, ${name}. You completed ${course}.`);
      return;
    }

    console.warn(
      `Congratulations, ${name}. You completed ${course}, your ${toOrdinal(completedCoursesCount)} course...`
    );
  };
}
