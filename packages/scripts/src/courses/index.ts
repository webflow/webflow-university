const COURSES_PATH = '/courses';
const COURSE_GRID_VIEW_STORAGE_KEY = 'courseGridView';

export function initCoursesPage(): void {
  if (!isCoursesPage()) {
    return;
  }

  const coursesGrid = document.querySelector<HTMLElement>('.cc_courses-grid');

  if (!coursesGrid) {
    console.warn('Courses grid not found');
    return;
  }

  setupGridToggle(coursesGrid);
  setupCourseCardStyling(coursesGrid);
}

export function isCoursesPage(pathname = window.location.pathname): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  return normalizedPath === COURSES_PATH;
}

function setupGridToggle(coursesGrid: HTMLElement): void {
  const cardsButton = document.getElementById('cardBtn');
  const listButton = document.getElementById('listBtn');

  if (!cardsButton || !listButton) {
    console.error('No cardButton or listButton found');
    return;
  }

  const updateGridClass = (listView: boolean, activeButton: HTMLElement): void => {
    if (listView) {
      coursesGrid.classList.add('list');
      localStorage.setItem(COURSE_GRID_VIEW_STORAGE_KEY, 'list');
    } else {
      coursesGrid.classList.remove('list');
      localStorage.setItem(COURSE_GRID_VIEW_STORAGE_KEY, 'cards');
    }

    cardsButton.classList.remove('active');
    listButton.classList.remove('active');
    activeButton.classList.add('active');
  };

  cardsButton.addEventListener('click', () => updateGridClass(false, cardsButton));
  listButton.addEventListener('click', () => updateGridClass(true, listButton));

  if (localStorage.getItem(COURSE_GRID_VIEW_STORAGE_KEY) === 'list') {
    updateGridClass(true, listButton);
  } else {
    updateGridClass(false, cardsButton);
  }
}

function setupCourseCardStyling(coursesGrid: HTMLElement): void {
  const updateCardStyling = (): void => {
    const courseCards = coursesGrid.querySelectorAll<HTMLElement>('.cc_course-card');

    courseCards.forEach((card) => {
      card.style.borderRadius = '';
      card.style.borderBottom = '';
      card.style.borderBottomColor = '';
      card.style.borderBottomStyle = '';
      card.style.borderBottomWidth = '';
    });

    if (courseCards.length === 1) {
      courseCards[0].style.borderRadius = '0.25rem';
      setCourseCardBottomBorder(courseCards[0]);
      return;
    }

    if (courseCards.length > 1) {
      courseCards[0].style.borderRadius = '0.25rem 0.25rem 0 0';
      courseCards[courseCards.length - 1].style.borderRadius = '0 0 0.25rem 0.25rem';
      setCourseCardBottomBorder(courseCards[courseCards.length - 1]);
    }
  };

  const observer = new MutationObserver(updateCardStyling);

  observer.observe(coursesGrid, {
    childList: true,
    subtree: true,
  });

  updateCardStyling();
}

function setCourseCardBottomBorder(card: HTMLElement): void {
  card.style.borderBottomWidth = '1px';
  card.style.borderBottomStyle = 'solid';
  card.style.borderBottomColor = 'var(--theme--t_border-primary)';
}
