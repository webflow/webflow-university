declare global {
  interface Window {
    Webflow: (() => void)[];
  }
}

export {};
