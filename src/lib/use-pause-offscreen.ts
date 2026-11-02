import { useEffect, type RefObject } from "react";

/**
 * Marks the element `data-offscreen` while none of it is in the viewport,
 * which pauses every CSS animation inside it (see utilities.css).
 *
 * For sections with infinite CSS animations (the hero's marquee and prompt,
 * the Expression strips). Chrome was measured ticking those on the main
 * thread every frame, transform-only and far off-screen included. Each tick
 * dirties style, and framer's scroll measurement then has to settle it
 * synchronously: a second style pass on every scroll frame, for animations
 * nobody can see.
 */
export function usePauseOffscreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      element.toggleAttribute("data-offscreen", !entry.isIntersecting);
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
      element.removeAttribute("data-offscreen");
    };
  }, [ref]);
}
