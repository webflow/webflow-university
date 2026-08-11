/**
 * YouTube embed failure detection for course-lesson and video pages.
 * Reports anonymously to Zapier → Slack (no on-page banner).
 *
 * Webhook URL is supplied at runtime from Webflow (not committed):
 *   window.WFU_YT_ZAPIER_WEBHOOK = '<catch-hook-url>'
 * or <meta name="wfu-yt-zapier-webhook" content="<catch-hook-url>">
 */

export const PLAYER_ELEMENT_ID = 'wfu-yt-player';
export const READY_TIMEOUT_MS = 7000;
export const FORCE_FAIL_PARAM = 'wfu_yt_force_fail';
export const REPORT_SOURCE = 'wfu-youtube-embed';
export const WEBHOOK_META_NAME = 'wfu-yt-zapier-webhook';

export type FailureTrigger = 'error' | 'timeout' | 'force';
export type ForceFailMode = 'timeout' | 'error';
/** Soft triage hint — not a definitive diagnosis. */
export type LikelyCauseHint =
  | 'youtube-side'
  | 'third-party-blocked'
  | 'csp'
  | 'qa-force'
  | 'unknown';
export type YoutubeResourceName = 'iframe_api' | 'embed';

export type YoutubeEmbedFailurePayload = {
  source: typeof REPORT_SOURCE;
  trigger: FailureTrigger;
  errorCode: string;
  /** Human-readable note for known YouTube / loader error codes. */
  errorDetail: string;
  /**
   * Soft hint for Slack triage. Cannot distinguish ad blocker vs corporate firewall;
   * both surface as `third-party-blocked`.
   */
  likelyCauseHint: LikelyCauseHint;
  /** Comma-separated missing/failed YouTube resources, e.g. `iframe_api,embed`. */
  blockedResources: string;
  videoId: string;
  pageUrl: string;
  path: string;
  lessonTitle: string;
  courseId: string;
  lessonId: string;
  /** Webflow logged-in user id from `wf_user` cookie; empty when absent. */
  wfUserId: string;
  /** Segment user id from `ajs_user_id` localStorage; empty when null/absent. */
  ajsUserId: string;
  /**
   * Best-effort anonymous id: `ajs_anonymous_id` (localStorage) then
   * `cb_anonymous_id` (cookie/localStorage).
   */
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

const YT_API_SRC = 'https://www.youtube.com/iframe_api';

let hasReported = false;
let hasHandledFailure = false;
let readyTimeoutId: ReturnType<typeof setTimeout> | null = null;
let sawYoutubeCspViolation = false;
let cspMonitoringStarted = false;

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
 * Safely reads a localStorage value. Handles JSON-encoded strings/null.
 * Never throws; returns '' when missing or unusable.
 */
export function readLocalStorageValue(key: string): string {
  try {
    const raw = window.localStorage?.getItem(key);
    if (raw === null || raw === undefined) {
      return '';
    }

    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      return '';
    }

    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed === null || parsed === undefined) {
        return '';
      }
      if (typeof parsed === 'string') {
        return parsed.trim();
      }
      if (typeof parsed === 'number' || typeof parsed === 'boolean') {
        return String(parsed);
      }
      // Objects/arrays are not useful identity values for Slack.
      return '';
    } catch {
      return normalizeCookieValue(trimmed);
    }
  } catch {
    return '';
  }
}

/**
 * Collects optional identity/context from cookies + localStorage.
 * All fields are empty strings when unavailable.
 */
export function readSessionContext(): {
  wfUserId: string;
  ajsUserId: string;
  anonymousId: string;
  referralSource: string;
  sessionLandingPage: string;
} {
  const ajsAnonymousId = readLocalStorageValue('ajs_anonymous_id');
  const cbAnonymousId = readCookie('cb_anonymous_id') || readLocalStorageValue('cb_anonymous_id');

  return {
    wfUserId: readCookie('wf_user'),
    ajsUserId: readLocalStorageValue('ajs_user_id'),
    anonymousId: ajsAnonymousId || cbAnonymousId,
    referralSource:
      readCookie('sa-r-source') ||
      readCookie('sa-u-source') ||
      readLocalStorageValue('sa-r-source'),
    sessionLandingPage: readCookie('sessionLandingPage'),
  };
}

/**
 * Starts listening for CSP violations that mention YouTube.
 */
export function startYoutubeCspMonitoring(): void {
  if (cspMonitoringStarted || typeof window === 'undefined') {
    return;
  }
  cspMonitoringStarted = true;

  window.addEventListener('securitypolicyviolation', (event) => {
    try {
      const haystack = [
        event.blockedURI,
        event.violatedDirective,
        event.effectiveDirective,
        event.sourceFile,
      ]
        .filter(Boolean)
        .join(' ');
      if (/youtube|youtu\.be|ytimg/i.test(haystack)) {
        sawYoutubeCspViolation = true;
      }
    } catch {
      // Ignore CSP event access issues.
    }
  });
}

/**
 * Maps known YouTube / loader error codes to a short detail string.
 */
export function describeErrorCode(errorCode: string): string {
  switch (errorCode) {
    case 'none':
      return '';
    case '2':
      return 'Invalid video parameter';
    case '5':
      return 'HTML5 player error';
    case '100':
      return 'Video not found / private';
    case '101':
    case '150':
      return 'Embedding disabled by owner';
    case 'api-load':
      return 'YouTube IFrame API script failed to load';
    case 'api-missing':
      return 'YouTube IFrame API missing after load';
    case 'player-init':
      return 'YT.Player failed to initialize';
    case 'timeout':
      return 'QA force-fail timeout';
    case 'error':
      return 'QA force-fail error';
    default:
      return errorCode ? `Code ${errorCode}` : '';
  }
}

function findResourceEntry(matcher: RegExp): PerformanceResourceTiming | undefined {
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return entries.find((entry) => matcher.test(entry.name));
  } catch {
    return undefined;
  }
}

function classifyResourceEntry(
  entry: PerformanceResourceTiming | undefined
): 'ok' | 'failed' | 'missing' {
  if (!entry) {
    return 'missing';
  }

  const status = (entry as PerformanceResourceTiming & { responseStatus?: number }).responseStatus;
  if (typeof status === 'number') {
    if (status >= 400) return 'failed';
    if (status > 0) return 'ok';
  }

  // Cross-origin successes often report transferSize 0; treat a completed timing as ok.
  if (entry.duration > 0 || entry.responseEnd > 0) {
    return 'ok';
  }

  return 'failed';
}

/**
 * Inspects Performance resource timings for YouTube API + embed requests.
 */
export function inspectYoutubeResources(): {
  iframeApi: 'ok' | 'failed' | 'missing';
  embed: 'ok' | 'failed' | 'missing';
  blockedResources: YoutubeResourceName[];
} {
  const iframeApi = classifyResourceEntry(findResourceEntry(/youtube\.com\/iframe_api/i));
  const embed = classifyResourceEntry(findResourceEntry(/youtube(?:-nocookie)?\.com\/embed\//i));

  const blockedResources: YoutubeResourceName[] = [];
  if (iframeApi === 'missing' || iframeApi === 'failed') {
    blockedResources.push('iframe_api');
  }
  if (embed === 'missing' || embed === 'failed') {
    blockedResources.push('embed');
  }

  return { iframeApi, embed, blockedResources };
}

/**
 * Soft triage hint for Slack. Not a definitive ad-blocker vs firewall label.
 */
export function inferLikelyCauseHint(options: {
  trigger: FailureTrigger;
  errorCode: string;
  forced?: boolean;
  blockedResources: YoutubeResourceName[];
  cspViolation?: boolean;
}): LikelyCauseHint {
  if (options.forced || options.trigger === 'force') {
    return 'qa-force';
  }

  if (options.cspViolation ?? sawYoutubeCspViolation) {
    return 'csp';
  }

  if (options.trigger === 'error') {
    return 'youtube-side';
  }

  if (
    options.errorCode === 'api-load' ||
    options.errorCode === 'api-missing' ||
    options.blockedResources.length > 0
  ) {
    return 'third-party-blocked';
  }

  if (options.trigger === 'timeout') {
    // Timeout with no resource evidence — still usually third-party blocked, but softer.
    return 'third-party-blocked';
  }

  return 'unknown';
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
  const session = readSessionContext();
  const errorCode =
    options.errorCode === null || options.errorCode === undefined || options.errorCode === ''
      ? 'none'
      : String(options.errorCode);
  const resources = inspectYoutubeResources();
  const likelyCauseHint = inferLikelyCauseHint({
    trigger: options.trigger,
    errorCode,
    forced: options.forced,
    blockedResources: resources.blockedResources,
    cspViolation: sawYoutubeCspViolation,
  });

  return {
    source: REPORT_SOURCE,
    trigger: options.trigger,
    errorCode,
    errorDetail: describeErrorCode(errorCode),
    likelyCauseHint,
    blockedResources: resources.blockedResources.join(','),
    videoId: options.videoId || 'unknown',
    pageUrl: window.location.href,
    path: window.location.pathname,
    lessonTitle: wrapper?.getAttribute('data-lesson-title') ?? '',
    courseId: wrapper?.getAttribute('data-course-id') ?? '',
    lessonId: wrapper?.getAttribute('data-lesson-id') ?? '',
    wfUserId: session.wfUserId,
    ajsUserId: session.ajsUserId,
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
 *
 * Uses text/plain + no-cors / credentials omit so privacy layers (e.g. Transcend
 * airgap) that force credentials:include don't trip Zapier's ACAO: * CORS response.
 * Falls back to a hidden form POST, which does not require CORS.
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
  postToZapier(webhookUrl, payload);
}

/**
 * Best-effort POST to a Zapier Catch Hook from the browser.
 */
export function postToZapier(webhookUrl: string, payload: YoutubeEmbedFailurePayload): void {
  const body = JSON.stringify(payload);
  const plainBlob = new Blob([body], { type: 'text/plain;charset=UTF-8' });

  try {
    if (navigator.sendBeacon?.(webhookUrl, plainBlob)) {
      return;
    }
  } catch {
    // Fall through.
  }

  try {
    void fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'omit',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body,
    }).catch(() => {
      postToZapierViaForm(webhookUrl, payload);
    });
    return;
  } catch {
    // Fall through to form POST.
  }

  postToZapierViaForm(webhookUrl, payload);
}

/**
 * CORS-proof fallback: submit a hidden form into a disposable iframe.
 */
export function postToZapierViaForm(webhookUrl: string, payload: YoutubeEmbedFailurePayload): void {
  try {
    const iframeName = `wfu-yt-zapier-${Date.now()}`;
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.title = 'wfu-yt-zapier';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'display:none;width:0;height:0;border:0;';

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = webhookUrl;
    form.target = iframeName;
    form.acceptCharset = 'UTF-8';
    form.style.display = 'none';
    // text/plain keeps this a "simple" request; Zapier still receives the fields.
    form.enctype = 'application/x-www-form-urlencoded';

    for (const [key, value] of Object.entries(payload)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value === null || value === undefined ? '' : String(value);
      form.appendChild(input);
    }

    document.body.append(iframe, form);
    form.submit();

    window.setTimeout(() => {
      form.remove();
      iframe.remove();
    }, 5000);
  } catch {
    // Last-resort path failed; nothing else we can do client-side.
  }
}

/**
 * Handles a detected embed failure: Zapier report only (no on-page UI).
 */
export function handleEmbedFailure(options: {
  iframe: HTMLIFrameElement;
  videoId: string;
  trigger: FailureTrigger;
  errorCode?: string | number | null;
  forced?: boolean;
}): void {
  if (hasHandledFailure) {
    return;
  }
  hasHandledFailure = true;
  clearReadyTimeout();
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
  hasHandledFailure = false;
  sawYoutubeCspViolation = false;
  cspMonitoringStarted = false;
  clearReadyTimeout();
}

/**
 * True when this page has a real, visible YouTube lesson/video embed to monitor.
 *
 * Rich-text lessons still render `.cc_video` + `#wfu-yt-player` for platform
 * progress metadata, but Webflow marks the wrapper `w-condition-invisible` and
 * leaves an empty embed src (`/embed/?…`). Those must not be monitored.
 */
export function hasYoutubeEmbedToMonitor(root: ParentNode = document): HTMLIFrameElement | null {
  const el = root.querySelector(`#${PLAYER_ELEMENT_ID}`);
  if (!(el instanceof HTMLIFrameElement)) {
    return null;
  }

  const wrapper = el.closest('.cc_video');
  if (wrapper?.classList.contains('w-condition-invisible')) {
    return null;
  }

  // Require a real ID in the iframe src — do not treat empty embeds as video lessons
  // even if other data attrs exist on the wrapper.
  const videoId = parseVideoIdFromSrc(el.getAttribute('src'));
  if (!videoId) {
    return null;
  }

  return el;
}

/**
 * Initializes YouTube embed monitoring when a real video embed is present.
 * Skips rich-text lessons (hidden `.cc_video` / empty embed src).
 * Zapier is only contacted from handleEmbedFailure (error / timeout / QA force).
 */
export function initYoutubeEmbedFallback(): void {
  const iframe = hasYoutubeEmbedToMonitor();
  if (!iframe) {
    return;
  }

  startYoutubeCspMonitoring();

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
      // A prior failure may have already been reported.
      if (hasHandledFailure) return;
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
