/** Webflow Analyze / Optimize Browser API (`wf`), distinct from `window.Webflow`. */
interface WebflowBrowserApi {
  ready: (callback: () => void) => void;
  sendEvent: (eventName: string, params?: Record<string, unknown>) => void;
}

/** Subset of `wf_utils` from webflow.com/resources/marketing-head-v2.js. */
interface WfUtils {
  isLoggedIn: (callback: (loggedIn: boolean) => void) => void;
  /** Raw Webflow user ID from the `wf_user` cookie. */
  getUserId: () => string | null;
}

/** Course enrollment as returned by `wf_university.getEnrolledCourses`. */
interface WfEnrolledCourse {
  /** CMS course slug. */
  courseId: string;
  progress?: number;
  enrolledOn?: string;
}

/** Subset of `wf_university` from webflow.com/resources/university.js. */
interface WfUniversity {
  /** Calls back with `[]` on any failure. */
  getEnrolledCourses: (callback: (courses: WfEnrolledCourse[]) => void) => void;
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
    wf_utils?: WfUtils;
    wf_university?: WfUniversity;
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
