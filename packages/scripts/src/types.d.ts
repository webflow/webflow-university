declare global {
  interface Window {
    Webflow: (() => void)[] & {
      require?: (module: string) => {
        init: () => void;
      };
    };
    onCourseCompleted?: (payload: {
      fullName: string;
      courseName: string;
      completedCoursesCount: number;
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
