/**
 * "Recommended next courses" on the dashboard, served by Nexus.
 *
 * The section is built in the Designer and starts hidden through the site-wide
 * `[data-display-none-on-load]` rule. For a logged-in user this fetches course
 * recommendations, drops courses the user is already enrolled in (Nexus v1 does
 * not know about enrollment), clones the template card once per course, and
 * removes the hiding attribute. With nothing to show, the section stays hidden
 * unless it contains a `[data-nexus-recs-fallback]` element.
 *
 * Each rendered card sends a Nexus `view` event when it is mostly in view and a
 * `click` event when followed. Nexus does not dedupe, so views are sent once
 * per card per page load.
 */

import {
  buildEventContext,
  createNexusBrowserClient,
  type FeedbackType,
  type NexusBrowserClient,
  type NexusItem,
} from '../vendor/nexus-events-browser.js';
import {
  NEXUS_BASE_URL,
  NEXUS_CLIENT_KEY,
  NEXUS_COURSE_SLUG_PREFIX,
  NEXUS_SURFACE,
} from './nexus-config.js';

const SECTION_SELECTOR = '[data-nexus-recs]';
const LIST_SELECTOR = '[data-nexus-recs-list]';
const TEMPLATE_SELECTOR = '[data-nexus-rec-template]';
const LINK_SELECTOR = '[data-nexus-rec-link]';
const TITLE_SELECTOR = '[data-nexus-rec-title]';
const DESCRIPTION_SELECTOR = '[data-nexus-rec-description]';
const IMAGE_SELECTOR = '[data-nexus-rec-image]';
const CTA_SELECTOR = '[data-nexus-rec-cta]';
const FALLBACK_SELECTOR = '[data-nexus-recs-fallback]';
const COUNT_ATTRIBUTE = 'data-nexus-recs-count';
const HIDDEN_ON_LOAD_ATTRIBUTE = 'data-display-none-on-load';

const DEFAULT_COUNT = 3;
/** Nexus caps `n` at 12. Asking for the maximum leaves room to drop enrolled courses. */
const FETCH_COUNT = 12;
/** `getEnrolledCourses` never calls back on a network error. */
const ENROLLMENT_TIMEOUT_MS = 5000;
const VIEW_THRESHOLD = 0.5;
const SESSION_STORAGE_KEY = 'wfu_nexus_session';

type Recommendation = {
  item: NexusItem;
  url: string;
};

export function initDashboardRecommendations(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  const list = section?.querySelector<HTMLElement>(LIST_SELECTOR);
  const template = list?.querySelector<HTMLElement>(TEMPLATE_SELECTOR);
  const utils = window.wf_utils;
  const university = window.wf_university;
  if (!section || !list || !template || !utils || !university) {
    return;
  }

  template.remove();

  utils.isLoggedIn((loggedIn) => {
    const userId = loggedIn ? utils.getUserId() : null;
    if (!userId) {
      return;
    }
    void loadRecommendations({ section, list, template, university, userId });
  });
}

async function loadRecommendations({
  section,
  list,
  template,
  university,
  userId,
}: {
  section: HTMLElement;
  list: HTMLElement;
  template: HTMLElement;
  university: NonNullable<Window['wf_university']>;
  userId: string;
}): Promise<void> {
  const nexus = createNexusBrowserClient({
    baseUrl: NEXUS_BASE_URL,
    clientKey: NEXUS_CLIENT_KEY,
  });

  const [response, enrolledSlugs] = await Promise.all([
    nexus.getUserItems({ userId, surface: NEXUS_SURFACE, n: FETCH_COUNT }),
    getEnrolledCourseSlugs(university),
  ]);

  const recommendations = selectRecommendations(
    response?.items ?? [],
    enrolledSlugs,
    readCount(section)
  );
  const fallback = section.querySelector<HTMLElement>(FALLBACK_SELECTOR);

  if (!recommendations.length) {
    if (fallback) {
      list.remove();
      reveal(section);
    }
    return;
  }

  fallback?.remove();

  const cards = recommendations.map((recommendation) => ({
    recommendation,
    card: renderCard(template, recommendation),
  }));
  list.append(...cards.map(({ card }) => card));
  reveal(section);

  const track = createTracker(nexus, userId);
  cards.forEach(({ recommendation, card }) => {
    const link = findLink(card);
    link?.addEventListener('click', () => track('click', recommendation.item));
    link?.addEventListener('auxclick', (event) => {
      if (event.button === 1) {
        track('click', recommendation.item);
      }
    });
  });
  trackViews(cards, track);
}

function selectRecommendations(
  items: NexusItem[],
  enrolledSlugs: Set<string>,
  count: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const item of items) {
    const url = toSafeUrl(item.buttonUrl);
    if (!url) {
      continue;
    }
    const slug = toCourseSlug(item);
    if (slug && enrolledSlugs.has(slug)) {
      continue;
    }
    recommendations.push({ item, url });
    if (recommendations.length === count) {
      break;
    }
  }

  return recommendations;
}

/** CMS course slug for a Nexus item, from its slug or else its `/courses/{slug}` link. */
function toCourseSlug(item: Pick<NexusItem, 'slug' | 'buttonUrl'>): string | null {
  if (item.slug.startsWith(NEXUS_COURSE_SLUG_PREFIX)) {
    return item.slug.slice(NEXUS_COURSE_SLUG_PREFIX.length) || null;
  }

  if (!item.buttonUrl) {
    return null;
  }
  try {
    const match = new URL(item.buttonUrl).pathname.match(/^\/courses\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function toSafeUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function getEnrolledCourseSlugs(
  university: NonNullable<Window['wf_university']>
): Promise<Set<string>> {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => resolve(new Set()), ENROLLMENT_TIMEOUT_MS);
    university.getEnrolledCourses((courses) => {
      window.clearTimeout(timeoutId);
      const slugs = Array.isArray(courses)
        ? courses.map((course) => course.courseId).filter(Boolean)
        : [];
      resolve(new Set(slugs));
    });
  });
}

function readCount(section: HTMLElement): number {
  const count = Number.parseInt(section.getAttribute(COUNT_ATTRIBUTE) ?? '', 10);
  if (!Number.isFinite(count) || count < 1) {
    return DEFAULT_COUNT;
  }
  return Math.min(count, FETCH_COUNT);
}

function renderCard(template: HTMLElement, { item, url }: Recommendation): HTMLElement {
  const card = template.cloneNode(true) as HTMLElement;
  card.removeAttribute('data-nexus-rec-template');
  card.setAttribute('data-nexus-rec-item', item.itemId);

  const link = findLink(card);
  if (link instanceof HTMLAnchorElement) {
    link.href = url;
  }

  setText(card, TITLE_SELECTOR, item.title);
  // `description` starts with the CMS item ID; `body` is the plain CMS description.
  setText(card, DESCRIPTION_SELECTOR, item.body);
  setText(card, CTA_SELECTOR, item.buttonText);

  const image = card.querySelector<HTMLImageElement>(IMAGE_SELECTOR);
  if (image) {
    if (item.imageUrl) {
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      image.src = item.imageUrl;
      image.alt = '';
    } else {
      image.remove();
    }
  }

  return card;
}

function findLink(card: HTMLElement): HTMLElement | null {
  return card.matches(LINK_SELECTOR) ? card : card.querySelector<HTMLElement>(LINK_SELECTOR);
}

function setText(card: HTMLElement, selector: string, value: string | null): void {
  const element = card.querySelector<HTMLElement>(selector);
  if (!element) {
    return;
  }
  if (value) {
    element.textContent = value;
  } else {
    element.remove();
  }
}

function reveal(section: HTMLElement): void {
  section.removeAttribute(HIDDEN_ON_LOAD_ATTRIBUTE);
}

function createTracker(nexus: NexusBrowserClient, userId: string) {
  const sessionId = getSessionId();
  const context = buildEventContext({ path: window.location.pathname });

  return (feedbackType: FeedbackType, item: NexusItem): void => {
    void nexus.sendEvent({
      feedbackType,
      userId,
      itemId: item.itemId,
      surface: NEXUS_SURFACE,
      sessionId,
      context,
    });
  };
}

/** One `view` per card: each card is unobserved after it first comes into view. */
function trackViews(
  cards: { recommendation: Recommendation; card: HTMLElement }[],
  track: (feedbackType: FeedbackType, item: NexusItem) => void
): void {
  const items = new Map(cards.map(({ card, recommendation }) => [card, recommendation.item]));

  if (typeof IntersectionObserver === 'undefined') {
    items.forEach((item) => track('view', item));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const item = items.get(entry.target as HTMLElement);
        if (!entry.isIntersecting || !item) {
          return;
        }
        observer.unobserve(entry.target);
        track('view', item);
      });
    },
    { threshold: VIEW_THRESHOLD }
  );

  items.forEach((_item, card) => observer.observe(card));
}

function getSessionId(): string | undefined {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
      return undefined;
    }
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    return undefined;
  }
}
