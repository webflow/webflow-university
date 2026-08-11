declare global {
  interface Window {
    Webflow: (() => void)[] & {
      require?: (module: string) => {
        init: () => void;
      };
    };
    /** Platform completion hook — we only use courseId as a slug fallback. */
    onCourseCompleted?: (payload: {
      fullName: string | null;
      courseId: string;
      courseName: string | null;
      completedCoursesCount: number | null;
    }) => void;
    /** Minimal YouTube IFrame Player API surface used by embed fallback. */
    YT?: {
      Player: new (
        elementId: string,
        options?: {
          events?: {
            onReady?: (event: unknown) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => unknown;
    };
    onYouTubeIframeAPIReady?: () => void;
    /** Zapier Catch Hook URL for YouTube embed failure reports (set in Webflow). */
    WFU_YT_ZAPIER_WEBHOOK?: string;
  }

  // js-cookie library types
  const Cookies: {
    get: (name: string) => string | undefined;
    set: (
      name: string,
      value: string,
      options?: {
        expires?: number;
        domain?: string;
        path?: string;
      }
    ) => void;
    remove: (name: string, options?: { domain?: string; path?: string }) => void;
  };
}

export {};
