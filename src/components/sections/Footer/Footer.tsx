"use client";

import Image from "next/image";

import { footerGroups, siteConfig, socialGroup } from "@/lib/site-config";

import { StoreBadges } from "./StoreBadges";

const WORDMARK = "Knocka";
const LINK_COLUMNS = [...footerGroups, socialGroup];

/**
 * `group` on the anchor is what replaces the two `a:hover span` descendant
 * rules: the nudge is declared on the thing that moves, next to the thing
 * that triggers it. Both states are spelled out rather than using the
 * `interact` variant, because `interact` is a selector variant and does not
 * compose onto `group-*`.
 */
const LINK =
  "group inline-block text-[14px] text-text-secondary no-underline " +
  "transition-[color] duration-[220ms] ease-[ease] interact:text-text-primary";

const TOP_LINK =
  "group inline-flex items-center gap-2.5 rounded-pill border border-border-subtle " +
  "bg-transparent px-4 py-[9px] text-[13px] text-[rgba(255,255,255,0.55)] " +
  "transition-[color,border-color,background-color] duration-[220ms] ease-[ease] " +
  "interact:border-border-accent interact:bg-[rgba(168,85,247,0.1)] interact:text-text-primary " +
  "upto-560:justify-center upto-560:self-stretch";

/**
 * Still a client component, but only for the back-to-top handler — all four
 * reveals are AOS now, so framer-motion is gone from this file.
 *
 * The motion preference is read directly rather than through
 * `useReducedMotion`, which was the last thing pulling Framer in for a
 * one-line behaviour. Reading it at click time is also more correct: someone
 * can change the OS setting while the page is open.
 */
export function Footer() {
  const scrollToTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <footer className="relative z-10 px-[var(--container-gutter)] pt-[clamp(40px,6vw,80px)] pb-[clamp(24px,3vw,40px)]">
      {/* The panel keeps its stylesheet rule: it owns --footer-pad, which the
          wordmark cancels with a negative margin, and the cqw container the
          wordmark is sized against. See footer.css. */}
      <div className="site-footer-panel">
        <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.45fr)] gap-[clamp(36px,5vw,72px)] upto-900:grid-cols-[minmax(0,1fr)] upto-900:gap-[clamp(32px,6vw,48px)]">
          {/* delay-* utilities rather than data-aos-delay: AOS's delay rules
              live in the stylesheet we deliberately do not import. */}
          <div data-aos="knocka-rise">
            <Image
              src="/branding/knocka-logo.svg"
              alt={siteConfig.name}
              width={272}
              height={82}
              className="h-[34px] w-auto"
            />
            {/* Reuses the site description rather than repeating the
                hero lead word for word. */}
            <p className="mt-[22px] max-w-[34ch] text-[15px]/[1.6] text-text-secondary">
              {siteConfig.description}
            </p>

            <div className="mt-[clamp(28px,3vw,38px)]">
              <span className="mb-3.5 block text-[10px] font-[500] tracking-[0.24em] text-[rgba(255,255,255,0.34)] uppercase">
                Get Knocka
              </span>
              <StoreBadges />
            </div>
          </div>

          <div
            data-aos="knocka-rise"
            className="grid grid-cols-4 gap-[clamp(18px,2.4vw,32px)] delay-[80ms] upto-560:grid-cols-2 upto-560:gap-x-5 upto-560:gap-y-7"
          >
            {LINK_COLUMNS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-[18px] font-display text-[13px] font-medium tracking-[0.02em] text-text-primary">
                  {group.title}
                </h2>
                <ul className="m-0 grid list-none gap-[11px] p-0">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <a href={link.href} className={LINK}>
                        {/* Nudge on hover so the column feels responsive
                            without any motion code. */}
                        <span className="inline-block transition-[transform] duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-focus-visible:translate-x-1">
                          {link.label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Negative offset — see the wordmark below for why the last two
            reveals on the page need one. */}
        <div
          data-aos="knocka-rise"
          data-aos-offset="-160"
          className="mt-[clamp(36px,4.5vw,60px)] flex flex-wrap items-center justify-between gap-x-7 gap-y-4 border-t border-t-border-faint pt-[22px] text-[13px] text-[rgba(255,255,255,0.4)] delay-[140ms] upto-560:flex-col upto-560:items-start"
        >
          <p>© {new Date().getFullYear()} Knocka. All rights reserved.</p>
          <button type="button" className={TOP_LINK} onClick={scrollToTop}>
            Back to top
            <span
              className="transition-[transform] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[3px] group-focus-visible:-translate-y-[3px]"
              aria-hidden="true"
            >
              ↑
            </span>
          </button>
        </div>

        {/*
          The oversized wordmark is the floor of the site: it rises into the
          panel and is cropped by the panel's own rounded edge, and its fill
          dissolves downward so the DNA field reads through the bottom of the
          letterforms. Stays in CSS — see footer.css.
        */}
        <div className="site-footer-wordmark" aria-hidden="true">
          {/*
            data-aos-offset is NOT a taste knob here.

            AOS fires on an absolute document offset: elementTop + offset,
            compared against scrollY + innerHeight. For the LAST element on
            the page that sum can land beyond the furthest the page can
            actually scroll, and then the reveal never runs at all. Measured
            at 390x844 with the global 90px offset, this element's trigger sat
            27px inside the maximum scroll position — the site's signature
            element was one layout change away from never appearing. The
            negative offset pulls the trigger up to a ~280px margin.

            IntersectionObserver, which is what Framer's whileInView uses,
            cannot fail this way. This is the cost of the AOS model, and it is
            why nothing above the footer should adopt it without checking the
            same arithmetic.
          */}
          <span data-aos="knocka-wordmark" data-aos-offset="-160">
            {WORDMARK}
          </span>
        </div>
      </div>
    </footer>
  );
}
