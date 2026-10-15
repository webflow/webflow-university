/**
 * True for a plain key press aimed at the focused scene `element` itself. Keys from anything
 * else, shortcuts with modifiers, IME composition and events a page handler already claimed are
 * left alone, so the page's own keyboard handling keeps working.
 */
export function isPlainSceneKey(event: KeyboardEvent, element: HTMLElement) {
  return (
    event.target === element &&
    !event.defaultPrevented &&
    !event.isComposing &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  );
}
