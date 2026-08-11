/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildFailurePayload,
  FALLBACK_ELEMENT_ID,
  getForceFailMode,
  getZapierWebhookUrl,
  handleEmbedFailure,
  initYoutubeEmbedFallback,
  normalizeCookieValue,
  parseVideoIdFromSrc,
  PLAYER_ELEMENT_ID,
  READY_TIMEOUT_MS,
  REPORT_SOURCE,
  reportEmbedFailure,
  resetYoutubeEmbedStateForTests,
  resolveVideoId,
  showWatchOnYoutubeFallback,
} from './index';

function setLocation(pathWithSearch: string): void {
  window.history.pushState({}, '', pathWithSearch);
}

function setWebhookUrl(url: string): void {
  window.WFU_YT_ZAPIER_WEBHOOK = url;
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

describe('youtube embed fallback', () => {
  beforeEach(() => {
    resetYoutubeEmbedStateForTests();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    setLocation('/course-lesson/example');
    setWebhookUrl('https://hooks.example.test/catch/test');
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

    const iframe = mountPlayer({ videoId: 'vid123', src: '' });
    const payload = buildFailurePayload({
      trigger: 'timeout',
      videoId: 'vid123',
      iframe,
    });

    expect(payload.source).toBe(REPORT_SOURCE);
    expect(payload.trigger).toBe('timeout');
    expect(payload.errorCode).toBe('none');
    expect(payload.videoId).toBe('vid123');
    expect(payload.path).toBe('/course-lesson/example');
    expect(payload.lessonTitle).toBe('Design review & accessibility');
    expect(payload.courseId).toBe('site-build');
    expect(payload.wfUserId).toBe('6761bdd58547141fa6cbc7f9');
    expect(payload.anonymousId).toBe('ad6ec947-2ae5-4aa7-b459-5a4933ea879e');
    expect(payload.referralSource).toBe('www.google.com');
    expect(payload.sessionLandingPage).toBe('https://university.webflow.com/');
    expect(payload.forced).toBe(false);
  });

  it('omits identity cookies gracefully when missing', () => {
    setDocumentCookies('');
    const payload = buildFailurePayload({
      trigger: 'error',
      errorCode: 100,
      videoId: 'vid123',
    });

    expect(payload.wfUserId).toBe('');
    expect(payload.anonymousId).toBe('');
    expect(payload.referralSource).toBe('');
    expect(payload.sessionLandingPage).toBe('');
  });

  it('normalizes encoded/quoted cookie values', () => {
    expect(normalizeCookieValue('%22abc-123%22')).toBe('abc-123');
    expect(normalizeCookieValue('"plain"')).toBe('plain');
    expect(normalizeCookieValue('')).toBe('');
  });

  it('injects the Watch on YouTube fallback once', () => {
    const iframe = mountPlayer({ videoId: 'vid123', src: '' });
    showWatchOnYoutubeFallback(iframe, 'vid123');
    showWatchOnYoutubeFallback(iframe, 'vid123');

    const fallback = document.getElementById(FALLBACK_ELEMENT_ID);
    expect(fallback).not.toBeNull();
    expect(document.querySelectorAll(`#${FALLBACK_ELEMENT_ID}`)).toHaveLength(1);
    expect(fallback?.querySelector('a')?.getAttribute('href')).toBe(
      'https://www.youtube.com/watch?v=vid123'
    );
    expect(document.querySelector('.cc_video')?.classList.contains('is-yt-fallback-active')).toBe(
      true
    );
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
    document.body.innerHTML = '<div>no player</div>';
    initYoutubeEmbedFallback();
    expect(document.getElementById(FALLBACK_ELEMENT_ID)).toBeNull();
  });

  it('force-fails immediately via query param', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    mountPlayer({ videoId: 'forceVid', src: '' });
    setLocation('/course-lesson/example?wfu_yt_force_fail=timeout');

    initYoutubeEmbedFallback();

    expect(document.getElementById(FALLBACK_ELEMENT_ID)).not.toBeNull();
    expect(sendBeacon).toHaveBeenCalledTimes(1);

    const body = sendBeacon.mock.calls[0]?.[1] as Blob;
    expect(body).toBeInstanceOf(Blob);
  });

  it('handleEmbedFailure shows UI and reports', () => {
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

    expect(document.getElementById(FALLBACK_ELEMENT_ID)).not.toBeNull();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('times out when onReady never fires', async () => {
    vi.useFakeTimers();

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

    mountPlayer({ videoId: 'slowVid', src: '' });
    initYoutubeEmbedFallback();

    await vi.advanceTimersByTimeAsync(READY_TIMEOUT_MS);

    expect(document.getElementById(FALLBACK_ELEMENT_ID)).not.toBeNull();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
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

    mountPlayer({ videoId: 'readyVid', src: '' });
    initYoutubeEmbedFallback();

    await vi.advanceTimersByTimeAsync(READY_TIMEOUT_MS + 1000);

    expect(document.getElementById(FALLBACK_ELEMENT_ID)).toBeNull();
    expect(sendBeacon).not.toHaveBeenCalled();
  });
});
