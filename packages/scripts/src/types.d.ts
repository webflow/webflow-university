/** Webflow Analyze / Optimize Browser API (`wf`), distinct from `window.Webflow`. */
interface WebflowBrowserApi {
  ready: (callback: () => void) => void;
  sendEvent: (eventName: string, params?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    Webflow: (() => void)[] & {
      require?: (module: string) => {
        init: () => void;
      };
    };
    /** Analyze / Optimize Browser API — present when the site has Analyze enabled. */
    wf?: WebflowBrowserApi;
    /** Platform completion hook — we only use courseId as a slug fallback. */
    onCourseCompleted?: (payload: {
      fullName: string | null;
      courseId: string;
      courseName: string | null;
      completedCoursesCount: number | null;
    }) => void;
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
