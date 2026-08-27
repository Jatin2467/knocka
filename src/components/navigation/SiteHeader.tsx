"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { navLinks, siteConfig } from "@/lib/site-config";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function SiteHeader() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [isDense, setIsDense] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    setIsDense(value > 24);
  });

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen, closeMenu]);

  return (
    <motion.header
      className="site-header"
      initial={reduceMotion ? false : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.05 }}
    >
      <div className="site-header-bar" data-dense={isDense} data-open={isMenuOpen}>
        <a href="#" className="site-logo" aria-label={`${siteConfig.name} home`}>
          <Image
            src="/branding/knocka-logo.svg"
            alt={siteConfig.name}
            width={272}
            height={82}
            priority
          />
        </a>

        <nav className="site-nav" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="site-nav-link"
              onMouseEnter={() => setHovered(link.href)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(link.href)}
              onBlur={() => setHovered(null)}
            >
              {hovered === link.href && (
                <motion.span
                  className="site-nav-pill"
                  layoutId="site-nav-pill"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }
                  }
                />
              )}
              <span className="site-nav-label">{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          <Button variant="ghost" className="site-header-secondary">
            Glass Matrix
          </Button>
          <Button variant="primary">Join Waitlist →</Button>
        </div>

        <button
          type="button"
          className="site-menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="site-mobile-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="site-menu-icon" data-open={isMenuOpen} />
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="site-mobile-menu"
            className="site-mobile-menu"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: EASE_OUT }}
          >
            <nav aria-label="Mobile">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="site-mobile-actions">
              <Button variant="ghost" onClick={closeMenu}>
                Glass Matrix
              </Button>
              <Button variant="primary" onClick={closeMenu}>
                Join Waitlist →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
