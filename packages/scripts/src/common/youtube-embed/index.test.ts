/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildFailurePayload,
  describeErrorCode,
  getForceFailMode,
  getZapierWebhookUrl,
  handleEmbedFailure,
  hasYoutubeEmbedToMonitor,
  inferFailureKind,
  inferLikelyCauseHint,
  initYoutubeEmbedFallback,
  isLikelyBot,
  isLikelyThirdPartyBlock,
  normalizeCookieValue,
  parseVideoIdFromSrc,
  PLAYER_ELEMENT_ID,
  readLocalStorageValue,
  READY_TIMEOUT_MS,
  REPORT_SOURCE,
  reportEmbedFailure,
  resetYoutubeEmbedStateForTests,
  resolveVideoId,
  shouldReportFailure,
} from './index';

function setLocation(pathWithSearch: string): void {
  window.history.pushState({}, '', pathWithSearch);
}

function setWebhookUrl(url: string): void {
  window.WFU_YT_ZAPIER_WEBHOOK = url;
}

function setUserAgent(ua: string): void {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    get: () => ua,
  });
}

function setDocumentCookies(cookies: string): void {
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => cookies,
    set: () => {
      // Ignore writes in tests.
    },
  });
}

function mountPlayer(options?: {
  videoId?: string;
  /** Pass '' for no src attribute (avoids happy-dom network fetches). */
  src?: string | null;
  withWrapper?: boolean;
}): HTMLIFrameElement {
  const videoId = options?.videoId ?? 'dQw4w9WgXcQ';
  const src =
    options?.src === undefined
      ? `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0`
      : options.src;

  const iframeAttrs = [
    `id="${PLAYER_ELEMENT_ID}"`,
    'class="responsive-video-iframe"',
    src ? `src="${src}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const iframeHtml = `<iframe ${iframeAttrs}></iframe>`;

  if (options?.withWrapper === false) {
    document.body.innerHTML = iframeHtml;
  } else {
    document.body.innerHTML = `
      <div
        class="cc_video"
        data-course-id="site-build"
        data-lesson-id="${videoId}"
        data-lesson-title="Design review & accessibility"
      >
        ${iframeHtml}
      </div>
    `;
  }

  return document.getElementById(PLAYER_ELEMENT_ID) as HTMLIFrameElement;
}

function mockYoutubeResourceTimings(
  entries: Array<{
    name: string;
    duration?: number;
    responseEnd?: number;
    responseStatus?: number;
  }>
): void {
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue(
    entries.map((entry) => ({
      name: entry.name,
      duration: entry.duration ?? 0,
      responseEnd: entry.responseEnd ?? 0,
      responseStatus: entry.responseStatus,
    })) as PerformanceResourceTiming[]
  );
}

function mockEmbedLoaded(): void {
  mockYoutubeResourceTimings([
    { name: 'https://www.youtube.com/iframe_api', duration: 12, responseEnd: 12 },
    {
      name: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      duration: 40,
      responseEnd: 40,
    },
  ]);
}

function mockEmbedBlocked(): void {
  mockYoutubeResourceTimings([]);
}

describe('youtube embed fallback', () => {
  beforeEach(() => {
    resetYoutubeEmbedStateForTests();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    setLocation('/course-lesson/example');
    setWebhookUrl('https://hooks.example.test/catch/test');
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetYoutubeEmbedStateForTests();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    setLocation('/');
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
    delete window.WFU_YT_ZAPIER_WEBHOOK;
    // Restore default cookie accessor if a test overrode it.
    Reflect.deleteProperty(document, 'cookie');
    // Restore UA if a bot test overrode it (happy-dom default is not a bot).
    Reflect.deleteProperty(navigator, 'userAgent');
    window.localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('parses a video ID from an embed src', () => {
    expect(
      parseVideoIdFromSrc(
        'https://www.youtube-nocookie.com/embed/abc123XYZ_9?enablejsapi=1&autoplay=0&rel=0'
      )
    ).toBe('abc123XYZ_9');
    expect(parseVideoIdFromSrc('https://example.com/nope')).toBe('');
    expect(parseVideoIdFromSrc(null)).toBe('');
  });

  it('reads the Zapier URL from window or meta', () => {
    setWebhookUrl('https://hooks.example.test/from-window');
    expect(getZapierWebhookUrl()).toBe('https://hooks.example.test/from-window');

    delete window.WFU_YT_ZAPIER_WEBHOOK;
    document.head.innerHTML =
      '<meta name="wfu-yt-zapier-webhook" content="https://hooks.example.test/from-meta" />';
    expect(getZapierWebhookUrl()).toBe('https://hooks.example.test/from-meta');
  });

  it('reads force-fail query values', () => {
    expect(getForceFailMode('?wfu_yt_force_fail=timeout')).toBe('timeout');
    expect(getForceFailMode('?wfu_yt_force_fail=error')).toBe('error');
    expect(getForceFailMode('?wfu_yt_force_fail=nope')).toBeNull();
    expect(getForceFailMode('')).toBeNull();
  });

  it('resolves video ID from src, then data-lesson-id', () => {
    const withSrc = document.createElement('iframe');
    withSrc.setAttribute('src', 'https://www.youtube-nocookie.com/embed/fromSrcId?enablejsapi=1');
    expect(resolveVideoId(withSrc)).toBe('fromSrcId');

    const emptySrc = mountPlayer({ src: '', videoId: 'fromDataAttr' });
    expect(resolveVideoId(emptySrc)).toBe('fromDataAttr');
  });

  it('builds a failure payload with optional cookie context', () => {
    setDocumentCookies(
      [
        'wf_user=6761bdd58547141fa6cbc7f9',
        'cb_anonymous_id=%22ad6ec947-2ae5-4aa7-b459-5a4933ea879e%22',
        'sa-r-source=www.google.com',
        'sessionLandingPage=https://university.webflow.com/',
      ].join('; ')
    );
    window.localStorage.setItem('ajs_anonymous_id', '"dcfbff14-a4fe-4fd7-af2a-04e0ba5b3bf8"');
    window.localStorage.setItem('ajs_user_id', 'null');

    const iframe = mountPlayer({ videoId: 'vid123', src: '' });
    const payload = buildFailurePayload({
      trigger: 'error',
      errorCode: 150,
      videoId: 'vid123',
      iframe,
    });

    expect(payload.source).toBe(REPORT_SOURCE);
    expect(payload.trigger).toBe('error');
    expect(payload.errorCode).toBe('150');
    expect(payload.errorDetail).toBe('Embedding disabled by owner');
    expect(payload.videoId).toBe('vid123');
    expect(payload.path).toBe('/course-lesson/example');
    expect(payload.lessonTitle).toBe('Design review & accessibility');
    expect(payload.courseId).toBe('site-build');
    expect(payload.wfUserId).toBe('6761bdd58547141fa6cbc7f9');
    expect(payload.ajsUserId).toBe('');
    expect(payload.anonymousId).toBe('dcfbff14-a4fe-4fd7-af2a-04e0ba5b3bf8');
    expect(payload.referralSource).toBe('www.google.com');
    expect(payload.sessionLandingPage).toBe('https://university.webflow.com/');
    expect(payload.likelyCauseHint).toBe('youtube-side');
    expect(payload.failureKind).toBe('youtube-player');
    expect(payload.forced).toBe(false);
  });

  it('infers likely cause hints', () => {
    expect(
      inferLikelyCauseHint({
        trigger: 'error',
        errorCode: '150',
        blockedResources: [],
      })
    ).toBe('youtube-side');

    expect(
      inferLikelyCauseHint({
        trigger: 'timeout',
        errorCode: 'api-load',
        blockedResources: [],
      })
    ).toBe('third-party-blocked');

    expect(
      inferLikelyCauseHint({
        trigger: 'timeout',
        errorCode: 'none',
        blockedResources: ['iframe_api', 'embed'],
      })
    ).toBe('third-party-blocked');

    expect(
      inferLikelyCauseHint({
        trigger: 'timeout',
        errorCode: 'none',
        blockedResources: [],
      })
    ).toBe('unknown');

    expect(
      inferLikelyCauseHint({
        trigger: 'timeout',
        errorCode: 'none',
        blockedResources: [],
        cspViolation: true,
      })
    ).toBe('csp');

    expect(
      inferLikelyCauseHint({
        trigger: 'force',
        errorCode: 'timeout',
        forced: true,
        blockedResources: [],
      })
    ).toBe('qa-force');

    expect(
      inferFailureKind({
        trigger: 'error',
      })
    ).toBe('youtube-player');

    expect(
      inferFailureKind({
        trigger: 'timeout',
      })
    ).toBe('viewer-blocked');

    expect(
      inferFailureKind({
        trigger: 'force',
        forced: true,
      })
    ).toBe('qa-force');
  });

  it('detects likely bots and reportable triggers', () => {
    expect(isLikelyBot('SEBot-WA')).toBe(true);
    expect(isLikelyBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
    expect(
      isLikelyBot(
        'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/136.0.0.0 Safari/537.36'
      )
    ).toBe(true);
    expect(
      isLikelyBot(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'
      )
    ).toBe(false);
    expect(shouldReportFailure('error')).toBe(true);
    expect(shouldReportFailure('force')).toBe(true);
    expect(shouldReportFailure('timeout')).toBe(true);
    expect(shouldReportFailure('timeout', true)).toBe(true);
  });

  it('treats a missing/failed embed as a third-party block', () => {
    expect(isLikelyThirdPartyBlock({ embed: 'missing' })).toBe(true);
    expect(isLikelyThirdPartyBlock({ embed: 'failed' })).toBe(true);
    expect(isLikelyThirdPartyBlock({ embed: 'ok' })).toBe(false);
    expect(isLikelyThirdPartyBlock({ embed: 'ok', cspViolation: true })).toBe(true);
  });

  it('describes known YouTube error codes', () => {
    expect(describeErrorCode('150')).toBe('Embedding disabled by owner');
    expect(describeErrorCode('api-load')).toBe('YouTube IFrame API script failed to load');
    expect(describeErrorCode('none')).toBe('');
  });

  it('omits identity cookies gracefully when missing', () => {
    setDocumentCookies('');
    window.localStorage.clear();
    const payload = buildFailurePayload({
      trigger: 'error',
      errorCode: 100,
      videoId: 'vid123',
    });

    expect(payload.wfUserId).toBe('');
    expect(payload.ajsUserId).toBe('');
    expect(payload.anonymousId).toBe('');
    expect(payload.referralSource).toBe('');
    expect(payload.sessionLandingPage).toBe('');
  });

  it('reads Segment ids from localStorage and treats null as empty', () => {
    window.localStorage.setItem('ajs_user_id', '"user-123"');
    window.localStorage.setItem('ajs_anonymous_id', 'null');
    expect(readLocalStorageValue('ajs_user_id')).toBe('user-123');
    expect(readLocalStorageValue('ajs_anonymous_id')).toBe('');
  });

  it('falls back to cb_anonymous_id when Segment anonymous id is missing', () => {
    window.localStorage.clear();
    setDocumentCookies('cb_anonymous_id=%22cb-only-id%22');
    const payload = buildFailurePayload({
      trigger: 'timeout',
      videoId: 'vid123',
    });
    expect(payload.anonymousId).toBe('cb-only-id');
  });

  it('normalizes encoded/quoted cookie values', () => {
    expect(normalizeCookieValue('%22abc-123%22')).toBe('abc-123');
    expect(normalizeCookieValue('"plain"')).toBe('plain');
    expect(normalizeCookieValue('')).toBe('');
  });

  it('does not inject an on-page Watch on YouTube banner', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    const iframe = mountPlayer({ videoId: 'vid123', src: '' });
    handleEmbedFailure({
      iframe,
      videoId: 'vid123',
      trigger: 'timeout',
      errorCode: 'api-load',
    });
    handleEmbedFailure({
      iframe,
      videoId: 'vid123',
      trigger: 'timeout',
      errorCode: 'api-load',
    });

    expect(document.getElementById('wfu-yt-fallback')).toBeNull();
    expect(document.body.textContent).not.toContain('Having trouble loading this video');
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('reports timeout-class failures when the embed looks blocked', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    const iframe = mountPlayer({ videoId: 'vid123', src: '' });
    handleEmbedFailure({
      iframe,
      videoId: 'vid123',
      trigger: 'timeout',
      errorCode: 'api-load',
    });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('does not report timeout when the embed iframe itself loaded', () => {
    mockEmbedLoaded();
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    const iframe = mountPlayer({ videoId: 'vid123', src: '' });
    handleEmbedFailure({
      iframe,
      videoId: 'vid123',
      trigger: 'timeout',
    });

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('reports to Zapier only once per page load', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    const payload = buildFailurePayload({
      trigger: 'error',
      errorCode: 100,
      videoId: 'vid123',
    });

    reportEmbedFailure(payload);
    reportEmbedFailure(payload);

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon.mock.calls[0]?.[0]).toBe('https://hooks.example.test/catch/test');
    const blob = sendBeacon.mock.calls[0]?.[1] as Blob;
    expect(blob.type).toContain('text/plain');
  });

  it('falls back to a hidden form POST when beacon/fetch are unavailable', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: undefined,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('blocked');
      })
    );

    const payload = buildFailurePayload({
      trigger: 'timeout',
      videoId: 'vid123',
    });

    reportEmbedFailure(payload);

    const form = document.querySelector('form[action="https://hooks.example.test/catch/test"]');
    expect(form).not.toBeNull();
    expect(form?.querySelector('input[name="source"]')).not.toBeNull();
    expect((form?.querySelector('input[name="source"]') as HTMLInputElement).value).toBe(
      REPORT_SOURCE
    );
  });

  it('skips reporting when webhook URL is missing', () => {
    delete window.WFU_YT_ZAPIER_WEBHOOK;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    reportEmbedFailure(
      buildFailurePayload({
        trigger: 'timeout',
        videoId: 'vid123',
      })
    );

    expect(sendBeacon).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('exits early when the player iframe is missing', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });
    document.body.innerHTML = '<div class="docs_rich-text">rich text only</div>';
    expect(hasYoutubeEmbedToMonitor()).toBeNull();
    initYoutubeEmbedFallback();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('exits early when the player has no video id (empty embed)', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });
    document.body.innerHTML = `
      <div class="cc_video" data-lesson-id="" data-text-lesson-id="get-started-mcp-writing-a-prompt-that-works">
        <iframe id="${PLAYER_ELEMENT_ID}" src="https://www.youtube-nocookie.com/embed/?enablejsapi=1&autoplay=0&rel=0"></iframe>
      </div>
    `;
    expect(hasYoutubeEmbedToMonitor()).toBeNull();
    initYoutubeEmbedFallback();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('exits early when .cc_video is w-condition-invisible (rich-text lesson)', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });
    // Even if a stale video id somehow appeared in src, invisible wrapper means no monitor.
    document.body.innerHTML = `
      <div
        class="cc_video cc_video--offset w-condition-invisible w-embed w-iframe"
        data-course-id="get-started-mcp"
        data-lesson-id=""
        data-text-lesson-id="get-started-mcp-writing-a-prompt-that-works"
      >
        <iframe id="${PLAYER_ELEMENT_ID}" class="responsive-video-iframe" src="https://www.youtube-nocookie.com/embed/?enablejsapi=1&autoplay=0&rel=0"></iframe>
      </div>
    `;
    expect(hasYoutubeEmbedToMonitor()).toBeNull();
    setLocation(
      '/course-lesson/get-started-mcp-writing-a-prompt-that-works?wfu_yt_force_fail=timeout'
    );
    initYoutubeEmbedFallback();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('does not report on rich-text lessons even with force-fail query', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });
    document.body.innerHTML = '<div class="docs_rich-text cc_course-lesson-rtf">no video</div>';
    setLocation('/course-lesson/get-started-mcp-activity-resources?wfu_yt_force_fail=timeout');
    initYoutubeEmbedFallback();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('monitors visible embeds with a real video id', () => {
    mountPlayer({ videoId: 'KC2plnRX7PE' });
    expect(hasYoutubeEmbedToMonitor()?.id).toBe(PLAYER_ELEMENT_ID);
  });

  it('does not monitor when src has no id even if data-lesson-id is set', () => {
    mountPlayer({
      videoId: 'staleFromDataAttr',
      src: 'https://www.youtube-nocookie.com/embed/?enablejsapi=1&autoplay=0&rel=0',
    });
    expect(hasYoutubeEmbedToMonitor()).toBeNull();
  });

  it('force-fails immediately via query param', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    mountPlayer({ videoId: 'forceVid' });
    setLocation('/course-lesson/example?wfu_yt_force_fail=timeout');

    initYoutubeEmbedFallback();

    expect(document.getElementById('wfu-yt-fallback')).toBeNull();
    expect(sendBeacon).toHaveBeenCalledTimes(1);

    const body = sendBeacon.mock.calls[0]?.[1] as Blob;
    expect(body).toBeInstanceOf(Blob);
  });

  it('handleEmbedFailure reports YouTube onError as youtube-player', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    const iframe = mountPlayer({ videoId: 'errVid', src: '' });
    handleEmbedFailure({
      iframe,
      videoId: 'errVid',
      trigger: 'error',
      errorCode: 150,
    });

    expect(document.getElementById('wfu-yt-fallback')).toBeNull();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('does not report blocked embeds from likely bots', () => {
    setUserAgent('SEBot-WA');
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    const iframe = mountPlayer({ videoId: 'OLWSh7VZIRU' });
    handleEmbedFailure({
      iframe,
      videoId: 'OLWSh7VZIRU',
      trigger: 'timeout',
      errorCode: 'api-load',
    });

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('skips init for bots unless force-fail is set', () => {
    setUserAgent('SEBot-WA');
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    mountPlayer({ videoId: 'OLWSh7VZIRU' });
    initYoutubeEmbedFallback();
    expect(sendBeacon).not.toHaveBeenCalled();

    setLocation('/videos/wordpress-to-webflow-introduction?wfu_yt_force_fail=error');
    initYoutubeEmbedFallback();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('reports when YouTube onError fires', async () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'
    );
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    class MockPlayer {
      constructor(
        _id: string,
        options?: { events?: { onReady?: (e: unknown) => void; onError?: (e: unknown) => void } }
      ) {
        options?.events?.onError?.({ data: 150 });
      }
    }

    window.YT = { Player: MockPlayer } as Window['YT'];

    mountPlayer({ videoId: 'OLWSh7VZIRU' });
    initYoutubeEmbedFallback();

    await vi.waitFor(() => {
      expect(sendBeacon).toHaveBeenCalledTimes(1);
    });
  });

  it('does not report when onReady never fires but the embed loaded', async () => {
    vi.useFakeTimers();
    mockEmbedLoaded();

    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    class MockPlayer {
      constructor(
        _id: string,
        _options?: { events?: { onReady?: (e: unknown) => void; onError?: (e: unknown) => void } }
      ) {
        // Intentionally never call onReady.
      }
    }

    window.YT = { Player: MockPlayer } as Window['YT'];

    mountPlayer({ videoId: 'slowVid' });
    initYoutubeEmbedFallback();

    await vi.advanceTimersByTimeAsync(READY_TIMEOUT_MS);

    expect(document.getElementById('wfu-yt-fallback')).toBeNull();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('reports after timeout when YouTube resources look blocked', async () => {
    vi.useFakeTimers();
    mockEmbedBlocked();

    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    class MockPlayer {
      constructor(
        _id: string,
        _options?: { events?: { onReady?: (e: unknown) => void; onError?: (e: unknown) => void } }
      ) {
        // Intentionally never call onReady.
      }
    }

    window.YT = { Player: MockPlayer } as Window['YT'];

    mountPlayer({ videoId: 'blockedVid' });
    initYoutubeEmbedFallback();

    await vi.advanceTimersByTimeAsync(READY_TIMEOUT_MS);

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('reports immediately when the IFrame API fails and the embed is already failed', async () => {
    mockYoutubeResourceTimings([
      {
        name: 'https://www.youtube-nocookie.com/embed/blockedVid',
        duration: 0,
        responseEnd: 0,
      },
    ]);

    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    mountPlayer({ videoId: 'blockedVid' });
    initYoutubeEmbedFallback();

    const script = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    expect(script).not.toBeNull();
    script?.onerror?.(new Event('error'));

    await vi.waitFor(() => {
      expect(sendBeacon).toHaveBeenCalledTimes(1);
    });
  });

  it('clears the timeout when onReady fires', async () => {
    vi.useFakeTimers();

    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    class MockPlayer {
      constructor(_id: string, options?: { events?: { onReady?: (e: unknown) => void } }) {
        options?.events?.onReady?.({});
      }
    }

    window.YT = { Player: MockPlayer } as Window['YT'];

    mountPlayer({ videoId: 'readyVid' });
    initYoutubeEmbedFallback();

    await vi.advanceTimersByTimeAsync(READY_TIMEOUT_MS + 1000);

    expect(sendBeacon).not.toHaveBeenCalled();
  });
});
