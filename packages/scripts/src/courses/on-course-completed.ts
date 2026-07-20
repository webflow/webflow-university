export type CourseCompletedPayload = {
  fullName: string | null;
  courseId: string;
  courseName: string | null;
  completedCoursesCount: number | null;
};

export type CourseCompletionQuery = {
  courseSlug: string | null;
};

export type CourseCatalogEntry = {
  slug: string;
  title: string | null;
  imageUrl: string | null;
};

const COURSE_COMPLETION_PATH = '/course-completion';
const PLACEHOLDER_IMAGE_SNIPPET = 'placeholder.60f9b1840c.svg';

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

function escapeSelectorValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Prefer the Complete course button slug; fall back to the platform payload id. */
export function getLessonCourseSlug(payload?: CourseCompletedPayload): string | null {
  const fromButton = document
    .querySelector<HTMLElement>('[data-complete-course-btn][data-course-slug], [data-course-slug]')
    ?.getAttribute('data-course-slug')
    ?.trim();

  if (fromButton) {
    return fromButton;
  }

  const fromPayload = payload?.courseId?.trim();
  return fromPayload || null;
}

export function buildCourseCompletionUrl(courseSlug: string): string {
  const params = new URLSearchParams();
  params.set('courseSlug', courseSlug);
  return `${COURSE_COMPLETION_PATH}?${params.toString()}`;
}

export function readCourseCompletionQuery(search = window.location.search): CourseCompletionQuery {
  const params = new URLSearchParams(search);
  const courseSlug = params.get('courseSlug') || params.get('courseId');

  return {
    courseSlug: courseSlug?.trim() || null,
  };
}

/** Resolve title + thumbnail from the hidden CMS list on the completion page. */
export function readCourseFromCatalog(courseSlug: string): CourseCatalogEntry | null {
  const item = document.querySelector<HTMLElement>(
    `[data-course-id="${escapeSelectorValue(courseSlug)}"]`
  );
  if (!item) {
    return null;
  }

  const img = item.querySelector<HTMLImageElement>('img');
  let imageUrl = img?.currentSrc || img?.src || null;
  if (imageUrl?.includes(PLACEHOLDER_IMAGE_SNIPPET)) {
    imageUrl = null;
  }

  const title =
    Array.from(item.querySelectorAll('div'))
      .map((node) => node.textContent?.trim() || '')
      .find((text) => text.length > 0) || null;

  return {
    slug: courseSlug,
    title,
    imageUrl,
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

function mergeStampSvgPropsFromCatalog(
  current: StampSvgIslandProps,
  catalog: CourseCatalogEntry | null
): StampSvgIslandProps {
  if (!catalog) {
    return current;
  }

  const next: StampSvgIslandProps = { ...current };

  if (catalog.imageUrl) {
    next.imageUrl = catalog.imageUrl;
  }

  if (catalog.title) {
    next.title = catalog.title;
  }

  return next;
}

const STAMP_MOUNT_TIMEOUT_MS = 2500;
const STAMP_READY_TIMEOUT_MS = 1500;

function revealCompletionScrim(): void {
  document.querySelector('.completion-scrim')?.classList.remove('fade-in');
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeUrl(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

/** Compare CDN urls ignoring responsive `-p-500` suffixes and encoding. */
function urlsLooselyMatch(a: string, b: string): boolean {
  const pathKey = (url: string) => {
    try {
      const path = decodeURIComponent(new URL(url, window.location.origin).pathname);
      return path.replace(/-p-\d+(?=\.[^.]+$)/, '');
    } catch {
      return normalizeUrl(url);
    }
  };

  const left = pathKey(a);
  const right = pathKey(b);
  return left === right || left.includes(right) || right.includes(left);
}

function getStampShadowImages(root: ShadowRoot): string[] {
  return Array.from(root.querySelectorAll('image'))
    .map((image) => image.getAttribute('href') || image.getAttribute('xlink:href') || '')
    .filter(Boolean);
}

function stampHasSvg(island: HTMLElement): boolean {
  return Boolean(island.shadowRoot?.querySelector('svg'));
}

/**
 * Ready when the shadow has an svg and either the title or artwork matches.
 * (Requiring both was too brittle — title wrapping / href encoding caused 4s timeouts.)
 */
function stampMatchesExpected(island: HTMLElement, expected: StampSvgIslandProps): boolean {
  const root = island.shadowRoot;
  if (!root?.querySelector('svg')) {
    return false;
  }

  const expectsTitle = Boolean(expected.title);
  const expectsImage = Boolean(expected.imageUrl);
  if (!expectsTitle && !expectsImage) {
    return true;
  }

  const titleOk =
    expectsTitle &&
    normalizeText(root.textContent || '').includes(normalizeText(expected.title!));

  const imageOk =
    expectsImage &&
    getStampShadowImages(root).some((href) => urlsLooselyMatch(href, expected.imageUrl!));

  return Boolean(titleOk || imageOk);
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 16);
  });
}

function observeIsland(
  island: HTMLElement,
  isReady: () => boolean,
  timeoutMs: number
): Promise<void> {
  if (isReady()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const started = Date.now();
    let settled = false;
    let observedShadow: ShadowRoot | null = null;

    const settle = () => {
      if (settled) return;
      settled = true;
      window.clearInterval(intervalId);
      observer.disconnect();
      resolve();
    };

    const poll = () => {
      if (settled) return;

      if (island.shadowRoot && island.shadowRoot !== observedShadow) {
        observedShadow = island.shadowRoot;
        observer.observe(observedShadow, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
      }

      if (isReady() || Date.now() - started >= timeoutMs) {
        settle();
      }
    };

    const observer = new MutationObserver(poll);
    observer.observe(island, { childList: true, subtree: true, attributes: true });
    const intervalId = window.setInterval(poll, 16);
    poll();
  });
}

/** Wait until federation has mounted some stamp SVG (Designer defaults are fine under the scrim). */
function waitForStampMounted(island: HTMLElement): Promise<void> {
  return observeIsland(island, () => stampHasSvg(island), STAMP_MOUNT_TIMEOUT_MS);
}

/**
 * Keep the scrim up until the federation runtime has rendered the updated stamp
 * (and ideally painted it), so the fade doesn't expose the Designer defaults.
 */
function waitForStampReady(
  island: HTMLElement,
  expected: StampSvgIslandProps
): Promise<void> {
  return observeIsland(island, () => stampMatchesExpected(island, expected), STAMP_READY_TIMEOUT_MS);
}

async function preloadStampImage(imageUrl: string | undefined): Promise<void> {
  if (!imageUrl || typeof Image === 'undefined') return;

  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve();
    };

    const timeoutId = window.setTimeout(done, 2000);
    const image = new Image();
    image.onload = done;
    image.onerror = done;
    image.src = imageUrl;
  });
}

async function revealCompletionScrimWhenReady(
  island: HTMLElement,
  expected: StampSvgIslandProps
): Promise<void> {
  await Promise.all([waitForStampReady(island, expected), preloadStampImage(expected.imageUrl)]);
  // Two frames: commit the updated stamp paint while the scrim is still opaque
  await waitForAnimationFrame();
  await waitForAnimationFrame();
  revealCompletionScrim();
}

async function populateCourseCompletionPageAsync(
  island: HTMLElement,
  query: CourseCompletionQuery
): Promise<void> {
  const catalog = query.courseSlug ? readCourseFromCatalog(query.courseSlug) : null;
  const current = parseJsonAttribute<StampSvgIslandProps>(island.getAttribute('data-props')) ?? {};
  const next = mergeStampSvgPropsFromCatalog(current, catalog);
  const nextRaw = JSON.stringify(next);
  const propsChanged = island.getAttribute('data-props') !== nextRaw;

  // Wait for the client render (StampSVG is ssr:false) before swapping props, so the
  // federation runtime mounts once with Designer defaults under the scrim, then updates.
  await waitForStampMounted(island);
  await waitForAnimationFrame();
  await waitForAnimationFrame();

  if (propsChanged) {
    island.setAttribute('data-props', nextRaw);
  }

  await revealCompletionScrimWhenReady(island, next);
}

/**
 * Populate completion-page UI from `courseSlug` + the hidden course catalog list.
 * The federation runtime observes `data-props` changes and re-renders in place.
 * Keeps `.completion-scrim.fade-in` until the stamp has rendered the new props.
 */
export function populateCourseCompletionPage(
  query: CourseCompletionQuery = readCourseCompletionQuery()
): boolean {
  const island = findStampSvgCodeIsland();
  if (!island) {
    return false;
  }

  void populateCourseCompletionPageAsync(island, query);
  return true;
}

export function initOnCourseCompleted(): void {
  if (isCourseLessonPage()) {
    window.onCourseCompleted = (payload: CourseCompletedPayload) => {
      const courseSlug = getLessonCourseSlug(payload);
      if (!courseSlug) {
        return;
      }
      window.location.assign(buildCourseCompletionUrl(courseSlug));
    };
    return;
  }

  if (isCourseCompletionPage()) {
    populateCourseCompletionPage();
  }
}
