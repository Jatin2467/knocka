/**
 * Scroll to a selector, an element or a pixel offset, with the browser's own
 * smooth scrolling. `scrollIntoView` honours `scroll-margin-top`, so the
 * offsets in base.css that keep headings clear of the header still apply.
 *
 * Native on purpose. The page used Lenis for inertial wheel scrolling until it
 * was measured as the main cause of the lag into S2: it sets the scroll
 * position from JavaScript every frame, so the scroll itself waited on the
 * main thread, and halving it there was worth more than the inertia. Native
 * scrolling runs on the compositor and stays smooth even when a frame of
 * scroll-linked animation runs long.
 *
 * Reduced motion is read at click time so a mid-session OS change is honoured.
 */
export function scrollToTarget(target: string | HTMLElement | number) {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches
    ? "auto"
    : "smooth";

  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior });
    return;
  }

  const element =
    typeof target === "string" ? document.querySelector(target) : target;
  element?.scrollIntoView({ behavior, block: "start" });
}
