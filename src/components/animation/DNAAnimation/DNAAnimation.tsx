"use client";

import { useEffect, useRef } from "react";

/**
 * Rotating DNA strand of particles painted on a fixed, full-viewport
 * canvas. The strand phase and the particles' vertical drift are both
 * driven by window scroll, so the helix twists as the page moves.
 *
 * Same particle count, same maths and same flat 2D fills as the original.
 * Two things are cheaper, because this runs on every frame of every scroll
 * and was measured costing frames on the hero -> Arrival handoff:
 *
 *  - **One path per colour, not one per particle.** 500 `fill()` calls were
 *    500 GPU draws a frame; three batched paths are three. The only visible
 *    difference: where two same-coloured particles overlap, the overlap is
 *    no longer doubled up.
 *  - **The page height is measured when it changes, not every frame.**
 *    Reading `scrollHeight` inside the frame forced a synchronous style and
 *    layout pass straight after framer had written that frame's transforms.
 */

interface Particle {
  /** Seed position along the strand, before scroll and time offsets. */
  yPos: number;
  /** 0 or PI: which of the two helix strands the particle belongs to. */
  strandOffset: number;
  size: number;
  scatterX: number;
  scatterY: number;
}

/** Optimized light count (500 particles) for zero lag. */
const PARTICLE_COUNT = 500;
const BACKGROUND_COLOR = "#030305";
/** Cyan, violet, magenta — picked per particle at 35% / 35% / 30%. */
const COLORS = ["#38bdf8", "#c084fc", "#ec4899"] as const;

const STRAND_CENTER_RATIO = 0.72;
const STRAND_FREQUENCY = 1.4;
const STRAND_AMPLITUDE = 180;
const TIME_STEP = 0.008;
const DRIFT_SPEED = 45;
const SCROLL_DRIFT = 0.4;
const SCROLL_TWIST = 3;
const PARTICLE_ALPHA = 0.8;
const TAU = Math.PI * 2;

const colorIndex = (seed: number) => (seed > 0.65 ? 0 : seed > 0.3 ? 1 : 2);

/** The particles, already grouped by colour so each group is one path. */
const createParticleGroups = (): Particle[][] => {
  const groups: Particle[][] = COLORS.map(() => []);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    groups[colorIndex(Math.random())].push({
      yPos: Math.random() * 2000,
      strandOffset: Math.random() > 0.5 ? 0 : Math.PI,
      size: Math.random() * 1.4 + 0.6,
      scatterX: (Math.random() - 0.5) * 30,
      scatterY: (Math.random() - 0.5) * 30,
    });
  }
  return groups;
};

export function DNAAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let maxScroll = 1;

    const measureScroll = () => {
      maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      measureScroll();
    };
    window.addEventListener("resize", handleResize);

    // The page grows as media loads and sections mount; the observer reports
    // it after layout, so reading the height here costs nothing extra.
    const pageObserver = new ResizeObserver(measureScroll);
    pageObserver.observe(document.body);
    measureScroll();

    const groups = createParticleGroups();

    let time = 0;

    const render = () => {
      time += TIME_STEP;

      // Laid at the particles' alpha, as the original was: a fifth of the
      // previous frame survives, which is what draws the faint trails.
      ctx.globalAlpha = PARTICLE_ALPHA;
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, width, height);

      const scrollY = window.scrollY;
      const scrollPhase = (scrollY / maxScroll) * Math.PI * SCROLL_TWIST;
      const drift = time * DRIFT_SPEED - scrollY * SCROLL_DRIFT;
      const spin = time * 2 + scrollPhase;
      const cx = width * STRAND_CENTER_RATIO;

      for (let c = 0; c < groups.length; c++) {
        ctx.fillStyle = COLORS[c];
        ctx.beginPath();

        for (const p of groups[c]) {
          const screenY = (p.yPos + drift) % height;
          const normalizedY = screenY < 0 ? screenY + height : screenY;

          const phase =
            (normalizedY / height) * Math.PI * STRAND_FREQUENCY +
            spin +
            p.strandOffset;

          const x = cx + Math.sin(phase) * STRAND_AMPLITUDE + p.scatterX;
          const y = normalizedY + p.scatterY;

          // moveTo starts each circle as its own subpath, so no connecting
          // line is drawn between particles.
          ctx.moveTo(x + p.size, y);
          ctx.arc(x, y, p.size, 0, TAU);
        }

        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      pageObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Sized in viewport units on purpose: base.css deliberately excludes canvas
  // from the img/video max-width rule so the scrollbar gutter cannot shrink it.
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed top-0 left-0 z-0 h-screen w-screen"
      aria-hidden="true"
    />
  );
}
