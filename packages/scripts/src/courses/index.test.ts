/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';

import { initCoursesPage, isCoursesPage } from './index';

function setPathname(pathname: string): void {
  window.history.pushState({}, '', pathname);
}

function setupCoursesDom(cardCount = 2): void {
  const cards = Array.from(
    { length: cardCount },
    (_, index) => `<div class="cc_course-card">Course ${index + 1}</div>`
  ).join('');

  document.body.innerHTML = `
    <button id="cardBtn">Cards</button>
    <button id="listBtn">List</button>
    <div class="cc_courses-grid">${cards}</div>
  `;
}

describe('courses page script', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    setPathname('/');
  });

  it('only matches the courses index page', () => {
    expect(isCoursesPage('/courses')).toBe(true);
    expect(isCoursesPage('/courses/')).toBe(true);
    expect(isCoursesPage('/courses/webflow-101')).toBe(false);
  });

  it('does not initialize outside the courses page', () => {
    setPathname('/videos');
    setupCoursesDom();

    initCoursesPage();

    expect(document.querySelector('.cc_courses-grid')?.classList.contains('list')).toBe(false);
    expect(localStorage.getItem('courseGridView')).toBeNull();
  });

  it('toggles and persists the selected courses grid view', () => {
    setPathname('/courses');
    setupCoursesDom();

    initCoursesPage();

    const coursesGrid = document.querySelector('.cc_courses-grid');
    const cardsButton = document.getElementById('cardBtn');
    const listButton = document.getElementById('listBtn');

    expect(coursesGrid?.classList.contains('list')).toBe(false);
    expect(cardsButton?.classList.contains('active')).toBe(true);
    expect(localStorage.getItem('courseGridView')).toBe('cards');

    listButton?.click();

    expect(coursesGrid?.classList.contains('list')).toBe(true);
    expect(listButton?.classList.contains('active')).toBe(true);
    expect(cardsButton?.classList.contains('active')).toBe(false);
    expect(localStorage.getItem('courseGridView')).toBe('list');
  });

  it('updates course card styling for list view edges', () => {
    setPathname('/courses');
    setupCoursesDom(2);

    initCoursesPage();

    const courseCards = document.querySelectorAll<HTMLElement>('.cc_course-card');

    expect(courseCards[0].style.borderTopLeftRadius).toBe('0.25rem');
    expect(courseCards[0].style.borderTopRightRadius).toBe('0.25rem');
    expect(courseCards[1].style.borderBottomRightRadius).toBe('0.25rem');
    expect(courseCards[1].style.borderBottomLeftRadius).toBe('0.25rem');
    expect(courseCards[1].style.borderBottomWidth).toBe('1px');
    expect(courseCards[1].style.borderBottomStyle).toBe('solid');
    expect(courseCards[1].style.borderBottomColor).toBe('var(--theme--t_border-primary)');
  });
});
