/**
 * YouTube embed failure detection for course-lesson and video pages.
 * Shows a Watch-on-YouTube fallback and reports anonymously to Zapier → Slack.
 *
 * Webhook URL is supplied at runtime from Webflow (not committed):
 *   window.WFU_YT_ZAPIER_WEBHOOK = '<catch-hook-url>'
 * or <meta name="wfu-yt-zapier-webhook" content="<catch-hook-url>">
 */

export const PLAYER_ELEMENT_ID = 'wfu-yt-player';
export const FALLBACK_ELEMENT_ID = 'wfu-yt-fallback';
export const READY_TIMEOUT_MS = 7000;
export const FORCE_FAIL_PARAM = 'wfu_yt_force_fail';
export const REPORT_SOURCE = 'wfu-youtube-embed';
export const WEBHOOK_META_NAME = 'wfu-yt-zapier-webhook';

export type FailureTrigger = 'error' | 'timeout' | 'force';
export type ForceFailMode = 'timeout' | 'error';

export type YoutubeEmbedFailurePayload = {
  source: typeof REPORT_SOURCE;
  trigger: FailureTrigger;
  errorCode: string;
  videoId: string;
  pageUrl: string;
  path: string;
  lessonTitle: string;
  courseId: string;
  lessonId: string;
  /** Webflow logged-in user id from `wf_user` cookie; empty when absent. */
  wfUserId: string;
  /** Segment/customer.io anonymous id from `cb_anonymous_id`; empty when absent. */
  anonymousId: string;
  /** Referral host from `sa-r-source` (falls back to `sa-u-source`). */
  referralSource: string;
  /** First page of the session from `sessionLandingPage`. */
  sessionLandingPage: string;
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  timestamp: string;
  forced: boolean;
};

const STYLE_ELEMENT_ID = 'wfu-yt-fallback-styles';
const YT_API_SRC = 'https://www.youtube.com/iframe_api';

let hasReported = false;
let hasShownFallback = false;
let readyTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Resolves the Zapier Catch Hook URL from a Webflow-provided runtime config.
 */
export function getZapierWebhookUrl(): string {
  const fromWindow = window.WFU_YT_ZAPIER_WEBHOOK;
  if (typeof fromWindow === 'string' && fromWindow.trim()) {
    return fromWindow.trim();
  }

  const fromMeta = document
    .querySelector(`meta[name="${WEBHOOK_META_NAME}"]`)
    ?.getAttribute('content');
  if (fromMeta?.trim()) {
    return fromMeta.trim();
  }

  return '';
}

/**
 * Parses a YouTube video ID from an embed iframe src.
 */
export function parseVideoIdFromSrc(src: string | null | undefined): string {
  if (!src) return '';
  const match = src.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? '';
}

/**
 * Reads optional QA force-fail mode from the URL query string.
 */
export function getForceFailMode(search: string = window.location.search): ForceFailMode | null {
  const value = new URLSearchParams(search).get(FORCE_FAIL_PARAM);
  if (value === 'timeout' || value === 'error') {
    return value;
  }
  return null;
}

/**
 * Resolves the video ID from the iframe src or parent data attributes.
 */
export function resolveVideoId(iframe: HTMLIFrameElement): string {
  const fromSrc = parseVideoIdFromSrc(iframe.getAttribute('src'));
  if (fromSrc) return fromSrc;

  const wrapper = iframe.closest('.cc_video');
  const fromLesson = wrapper?.getAttribute('data-lesson-id');
  if (fromLesson) return fromLesson;

  return '';
}

/**
 * Safely reads a cookie value. Never throws; returns '' when missing.
 */
export function readCookie(name: string): string {
  try {
    if (typeof Cookies !== 'undefined' && typeof Cookies.get === 'function') {
      const fromLib = Cookies.get(name);
      if (typeof fromLib === 'string' && fromLib.trim()) {
        return normalizeCookieValue(fromLib);
      }
    }
  } catch {
    // Fall through to document.cookie.
  }

  try {
    const encodedName = encodeURIComponent(name);
    const parts = document.cookie ? document.cookie.split(';') : [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed.startsWith(`${encodedName}=`) && !trimmed.startsWith(`${name}=`)) {
        continue;
      }
      const raw = trimmed.slice(trimmed.indexOf('=') + 1);
      return normalizeCookieValue(raw);
    }
  } catch {
    // Ignore cookie access errors (privacy mode, etc.).
  }

  return '';
}

/**
 * Decodes and cleans a cookie value (URI-encoding + surrounding quotes).
 */
export function normalizeCookieValue(raw: string): string {
  let value = raw.trim();
  if (!value) return '';

  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep the raw value if it is not URI-encoded.
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return value.trim();
}

/**
 * Collects optional identity/context cookies for Slack debugging.
 * All fields are empty strings when unavailable.
 */
export function readSessionContextCookies(): {
  wfUserId: string;
  anonymousId: string;
  referralSource: string;
  sessionLandingPage: string;
} {
  return {
    wfUserId: readCookie('wf_user'),
    anonymousId: readCookie('cb_anonymous_id'),
    referralSource: readCookie('sa-r-source') || readCookie('sa-u-source'),
    sessionLandingPage: readCookie('sessionLandingPage'),
  };
}

/**
 * Builds the Zapier payload for a failed embed.
 */
export function buildFailurePayload(options: {
  trigger: FailureTrigger;
  errorCode?: string | number | null;
  videoId: string;
  iframe?: HTMLIFrameElement | null;
  forced?: boolean;
}): YoutubeEmbedFailurePayload {
  const wrapper = options.iframe?.closest('.cc_video') ?? null;
  const session = readSessionContextCookies();

  return {
    source: REPORT_SOURCE,
    trigger: options.trigger,
    errorCode:
      options.errorCode === null || options.errorCode === undefined || options.errorCode === ''
        ? 'none'
        : String(options.errorCode),
    videoId: options.videoId || 'unknown',
    pageUrl: window.location.href,
    path: window.location.pathname,
    lessonTitle: wrapper?.getAttribute('data-lesson-title') ?? '',
    courseId: wrapper?.getAttribute('data-course-id') ?? '',
    lessonId: wrapper?.getAttribute('data-lesson-id') ?? '',
    wfUserId: session.wfUserId,
    anonymousId: session.anonymousId,
    referralSource: session.referralSource,
    sessionLandingPage: session.sessionLandingPage,
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    timestamp: new Date().toISOString(),
    forced: Boolean(options.forced),
  };
}

/**
 * Posts failure details to Zapier once per page load.
 */
export function reportEmbedFailure(payload: YoutubeEmbedFailurePayload): void {
  if (hasReported) {
    return;
  }

  const webhookUrl = getZapierWebhookUrl();
  if (!webhookUrl) {
    console.warn(
      '[wfu-youtube-embed] Zapier webhook URL missing. Set window.WFU_YT_ZAPIER_WEBHOOK or a meta[name="wfu-yt-zapier-webhook"].'
    );
    return;
  }

  hasReported = true;

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon?.(webhookUrl, new Blob([body], { type: 'application/json' }))) {
      return;
    }
  } catch {
    // Fall through to fetch.
  }

  void fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    mode: 'cors',
  }).catch(() => {
    // Fire-and-forget; ignore network errors.
  });
}

function ensureFallbackStyles(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
#${FALLBACK_ELEMENT_ID} {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  margin: 0 0 1rem;
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  background: color-mix(in srgb, currentColor 6%, transparent);
  font-size: 1rem;
  line-height: 1.4;
}
#${FALLBACK_ELEMENT_ID}[hidden] {
  display: none !important;
}
#${FALLBACK_ELEMENT_ID} a {
  text-decoration: underline;
  font-weight: 600;
}
.cc_video.is-yt-fallback-active,
#${PLAYER_ELEMENT_ID}.is-yt-fallback-hidden {
  display: none !important;
}
`;
  document.head.appendChild(style);
}

/**
 * Hides the broken player and shows a Watch-on-YouTube fallback.
 */
export function showWatchOnYoutubeFallback(iframe: HTMLIFrameElement, videoId: string): void {
  if (hasShownFallback) {
    return;
  }
  hasShownFallback = true;
  ensureFallbackStyles();

  const wrapper = iframe.closest('.cc_video');
  if (wrapper) {
    wrapper.classList.add('is-yt-fallback-active');
  } else {
    iframe.classList.add('is-yt-fallback-hidden');
  }

  let fallback = document.getElementById(FALLBACK_ELEMENT_ID);
  if (!fallback) {
    fallback = document.createElement('div');
    fallback.id = FALLBACK_ELEMENT_ID;
    fallback.setAttribute('role', 'status');

    const message = document.createElement('p');
    message.textContent =
      'Having trouble loading this video? You can watch it directly on YouTube.';

    const link = document.createElement('a');
    link.href = videoId
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
      : 'https://www.youtube.com/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Watch on YouTube';

    fallback.append(message, link);

    const insertTarget = wrapper ?? iframe.parentElement ?? iframe;
    insertTarget.insertAdjacentElement('afterend', fallback);
  }

  fallback.hidden = false;
}

/**
 * Handles a detected embed failure: UI + Zapier report.
 */
export function handleEmbedFailure(options: {
  iframe: HTMLIFrameElement;
  videoId: string;
  trigger: FailureTrigger;
  errorCode?: string | number | null;
  forced?: boolean;
}): void {
  clearReadyTimeout();
  showWatchOnYoutubeFallback(options.iframe, options.videoId);
  reportEmbedFailure(
    buildFailurePayload({
      trigger: options.trigger,
      errorCode: options.errorCode,
      videoId: options.videoId,
      iframe: options.iframe,
      forced: options.forced,
    })
  );
}

function clearReadyTimeout(): void {
  if (readyTimeoutId !== null) {
    clearTimeout(readyTimeoutId);
    readyTimeoutId = null;
  }
}

type YoutubeApi = NonNullable<Window['YT']>;

/**
 * Loads the YouTube IFrame Player API script once.
 */
export function loadYoutubeIframeApi(): Promise<YoutubeApi> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  return new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      try {
        previous?.();
      } catch {
        // Ignore errors from a prior site handler.
      }

      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error('YouTube IFrame API loaded without YT.Player'));
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${YT_API_SRC}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.src = YT_API_SRC;
      script.async = true;
      script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
      document.head.appendChild(script);
    }
  });
}

function ensureOriginOnIframe(iframe: HTMLIFrameElement): void {
  const src = iframe.getAttribute('src');
  if (!src) return;

  try {
    const url = new URL(src, window.location.href);
    if (!url.searchParams.has('origin')) {
      url.searchParams.set('origin', window.location.origin);
      iframe.setAttribute('src', url.toString());
    }
  } catch {
    // Leave src unchanged if it cannot be parsed.
  }
}

function attachPlayer(iframe: HTMLIFrameElement, videoId: string): void {
  ensureOriginOnIframe(iframe);

  readyTimeoutId = setTimeout(() => {
    handleEmbedFailure({
      iframe,
      videoId,
      trigger: 'timeout',
    });
  }, READY_TIMEOUT_MS);

  const Player = window.YT?.Player;
  if (!Player) {
    handleEmbedFailure({
      iframe,
      videoId,
      trigger: 'timeout',
      errorCode: 'api-missing',
    });
    return;
  }

  try {
    new Player(PLAYER_ELEMENT_ID, {
      events: {
        onReady: () => {
          clearReadyTimeout();
        },
        onError: (event) => {
          handleEmbedFailure({
            iframe,
            videoId,
            trigger: 'error',
            errorCode: event?.data ?? 'unknown',
          });
        },
      },
    });
  } catch {
    handleEmbedFailure({
      iframe,
      videoId,
      trigger: 'error',
      errorCode: 'player-init',
    });
  }
}

/**
 * Resets module state — for tests only.
 */
export function resetYoutubeEmbedStateForTests(): void {
  hasReported = false;
  hasShownFallback = false;
  clearReadyTimeout();
}

/**
 * Initializes YouTube embed monitoring when #wfu-yt-player is present.
 */
export function initYoutubeEmbedFallback(): void {
  const iframe = document.getElementById(PLAYER_ELEMENT_ID);
  if (!(iframe instanceof HTMLIFrameElement)) {
    return;
  }

  const videoId = resolveVideoId(iframe);
  const forceMode = getForceFailMode();

  if (forceMode) {
    handleEmbedFailure({
      iframe,
      videoId,
      trigger: 'force',
      errorCode: forceMode,
      forced: true,
    });
    return;
  }

  void loadYoutubeIframeApi()
    .then(() => {
      // Force-fail or a prior failure may have already run.
      if (hasShownFallback) return;
      attachPlayer(iframe, videoId);
    })
    .catch(() => {
      handleEmbedFailure({
        iframe,
        videoId,
        trigger: 'timeout',
        errorCode: 'api-load',
      });
    });
}
