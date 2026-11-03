import Image from "next/image";
import type { CSSProperties } from "react";

import { siteConfig } from "@/lib/site-config";

import { KnockKnock } from "./KnockKnock";

/** A CSS custom property on an inline style, typed. */
type Vars = CSSProperties & Record<`--${string}`, string>;

/** Seconds; the stagger of the entrance, top to bottom. */
const delay = (seconds: number): Vars => ({ "--cs-delay": `${seconds}s` });

const HEADLINE_TOP = "COMING";
const HEADLINE_BOTTOM = "SOON";

/**
 * Points of light in the backdrop. Fixed rather than random, so the server
 * HTML and the browser agree and nothing shifts on hydration: x and y are
 * percentages of the stage, size in px, then the twinkle's delay and length.
 */
const PARTICLES: readonly (readonly [number, number, number, number, number])[] = [
  [8, 18, 2, 0, 7],
  [17, 64, 1.5, 2.4, 9],
  [24, 32, 1, 4.1, 8],
  [31, 82, 2, 1.2, 10],
  [39, 12, 1.5, 3.3, 7.5],
  [47, 71, 1, 5.2, 9.5],
  [56, 24, 2, 0.8, 8.5],
  [63, 88, 1.5, 2.9, 7],
  [71, 41, 1, 4.6, 10],
  [78, 15, 2, 1.7, 9],
  [86, 58, 1.5, 3.8, 8],
  [92, 29, 1, 0.4, 7.5],
  [12, 46, 1, 5.6, 9],
  [67, 6, 1, 2.1, 8],
  [95, 79, 2, 4.4, 10],
  [3, 90, 1.5, 1.5, 8.5],
];

/**
 * The temporary public face of weknocka.com — see app/page.tsx for the switch
 * and docs/COMING_SOON.md for how to bring the landing page back.
 *
 * A server component. Everything that moves is CSS (styles/coming-soon.css),
 * on transform and opacity only, and stops under prefers-reduced-motion. The
 * only client code is the knock button. There is deliberately no waitlist
 * form here; the signup lives on the landing page.
 */
export function ComingSoon() {
  return (
    <div className="cs-stage text-text-primary">
      <div className="cs-backdrop" aria-hidden="true">
        <span className="cs-aurora cs-aurora--purple" />
        <span className="cs-aurora cs-aurora--pink" />
        <span className="cs-aurora cs-aurora--blue" />
        <span className="cs-halo" />
        {PARTICLES.map(([x, y, size, wait, length]) => (
          <span
            key={`${x}-${y}`}
            className="cs-particle"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${wait}s`,
              animationDuration: `${length}s`,
            }}
          />
        ))}
        <span className="cs-grain" />
        <span className="cs-vignette" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center px-4 py-[clamp(28px,6svh,64px)] text-center min-[768px]:px-8">
        <Image
          src="/branding/knocka-logo.svg"
          alt={siteConfig.name}
          width={272}
          height={82}
          priority
          className="cs-enter h-[clamp(30px,4.2vw,44px)] w-auto"
          style={delay(0)}
        />

        <KnockKnock className="cs-enter mt-[clamp(24px,4svh,44px)]" style={delay(0.15)} />

        <h1 className="cs-headline mt-[clamp(14px,2.4svh,26px)]">
          <span className="sr-only">Coming soon.</span>
          <span className="cs-headline-line" aria-hidden="true">
            {[...HEADLINE_TOP].map((letter, index) => (
              <span key={index} className="cs-letter" style={delay(0.3 + index * 0.06)}>
                {letter}
              </span>
            ))}
          </span>
          <span className="cs-headline-line" aria-hidden="true">
            <span className="cs-soon" style={delay(0.72)}>
              {HEADLINE_BOTTOM}
            </span>
            {/* The full stop is the knock: it pulses twice and sends out two
                rings, the brand's signature, every few seconds. */}
            <span className="cs-dot" style={delay(1.1)}>
              <span className="cs-ring" />
              <span className="cs-ring cs-ring--late" />
            </span>
          </span>
        </h1>

        <p
          className="cs-enter mt-[clamp(18px,3svh,32px)] font-display text-[clamp(21px,2.5vw,32px)]/[1.2] font-medium tracking-[-0.02em] text-balance text-text-bright"
          style={delay(1.15)}
        >
          Something exciting is about to knock.
        </p>

        <p
          className="cs-enter cs-tagline mt-4 text-[clamp(11px,1vw,13px)]/[1.7] font-medium tracking-[0.3em] text-balance uppercase"
          style={delay(1.25)}
        >
          Feel the message. Don&apos;t text. <span className="cs-tagline-accent">Arrive.</span>
        </p>

        <p
          className="cs-enter mt-5 max-w-[46ch] text-[clamp(15px,1.15vw,17px)]/[1.65] text-pretty text-text-secondary"
          style={delay(1.35)}
        >
          We&apos;re creating a new way to connect, express emotions, and bring
          messages to life. The next chapter of messaging is almost here.
        </p>

      </main>

      <footer className="relative z-10 w-full px-4 pb-[max(24px,env(safe-area-inset-bottom))] min-[768px]:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-t-border-subtle pt-6 text-[12px] text-[rgba(255,255,255,0.42)] min-[768px]:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/branding/knocka-logo.svg"
              alt=""
              width={272}
              height={82}
              className="h-[18px] w-auto opacity-80"
            />
            <span className="tracking-[0.18em] uppercase">Don&apos;t Text. Arrive.</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="mailto:knocka@weknocka.com"
              className="rounded-sm no-underline transition-[color] duration-200 interact:text-text-primary"
            >
              knocka@weknocka.com
            </a>
            <p className="m-0">© {new Date().getFullYear()} Knocka</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
