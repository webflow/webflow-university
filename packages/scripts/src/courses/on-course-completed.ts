type CourseCompletedPayload = {
  fullName: string;
  courseName: string;
  completedCoursesCount: number;
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

  window.onCourseCompleted = ({ fullName, courseName, completedCoursesCount }: CourseCompletedPayload) => {
    console.log(
      `Congratulations, ${fullName}. You completed ${courseName}, your ${toOrdinal(completedCoursesCount)} course...`
    );
  };
}
