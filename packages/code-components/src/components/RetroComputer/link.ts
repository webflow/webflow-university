export interface RetroComputerLink {
  href: string;
  target?: string;
}

/**
 * Webflow passes `href: "#"` for a Link prop that hasn't been set, and following it would scroll
 * the page to the top, so only real destinations count.
 */
export function getNavigableHref(link: RetroComputerLink | undefined): string | null {
  const href = link?.href?.trim();
  if (!href || href === '#') return null;
  return href;
}
