"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

import { footerGroups, siteConfig, socialGroup } from "@/lib/site-config";

import { StoreBadges } from "./StoreBadges";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const WORDMARK = "Knocka";
const LINK_COLUMNS = [...footerGroups, socialGroup];

export function Footer() {
  const reduceMotion = useReducedMotion();

  const rise = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0.3 : 0.8, ease: EASE_OUT, delay },
  });

  return (
    <footer className="site-footer">
      <div className="site-footer-panel">
        <div className="site-footer-grid">
          <motion.div className="site-footer-brand" {...rise(0)}>
            <Image
              src="/branding/knocka-logo.svg"
              alt={siteConfig.name}
              width={272}
              height={82}
              className="site-footer-logo"
            />
            {/* Reuses the site description rather than repeating the
                hero lead word for word. */}
            <p className="site-footer-tagline">{siteConfig.description}</p>

            <div className="site-footer-app">
              <span className="site-footer-app-label">Get Knocka</span>
              <StoreBadges />
            </div>
          </motion.div>

          <motion.div className="site-footer-links" {...rise(0.08)}>
            {LINK_COLUMNS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="site-footer-group-title">{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <a href={link.href}>
                        <span>{link.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </motion.div>
        </div>

        <motion.div className="site-footer-meta" {...rise(0.14)}>
          <p>© {new Date().getFullYear()} Knocka. All rights reserved.</p>
          <button
            type="button"
            className="site-footer-top-link"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: reduceMotion ? "auto" : "smooth",
              })
            }
          >
            Back to top
            <span className="site-footer-top-arrow" aria-hidden="true">
              ↑
            </span>
          </button>
        </motion.div>

        {/*
          The oversized wordmark is the floor of the site: it rises into the
          panel and is cropped by the panel's own rounded edge, and its fill
          dissolves downward so the DNA field reads through the bottom of the
          letterforms.
        */}
        <div className="site-footer-wordmark" aria-hidden="true">
          <motion.span
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "24%" }}
            whileInView={{ opacity: 1, y: "0%" }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduceMotion ? 0.3 : 1.3, ease: EASE_OUT }}
          >
            {WORDMARK}
          </motion.span>
        </div>
      </div>
    </footer>
  );
}
