# Knocka Landing Page — Agent Notes

Running record of design decisions for the Knocka marketing site. Read this
before changing the header or hero; append a section per phase.

---

## Phase 1 — Foundation

Structure moved to `src/` (`app`, `components`, `lib`, `styles`), Tailwind v4
fixed (the stylesheet was using v3 `@tailwind` directives, so no Tailwind was
being emitted at all), design tokens extracted, the DNA canvas isolated into
`components/animation/DNAAnimation`, and responsive breakage fixed. No visual
redesign. Styles for sections that have no markup yet are preserved verbatim in
`src/styles/sections.css`.

---

## Phase 2A — Header + Hero

### Header

A **floating glass control layer**, not a docked navbar: fixed, inset from all
edges, `1fr auto 1fr` grid so the nav stays optically centred no matter how wide
the logo or actions get. Translucent surface + `backdrop-filter`, hairline
border, inner top highlight, deep shadow.

- **Logo** is the real `public/branding/knocka-logo.svg` asset (wordmark with the
  gradient K and chat-bubble "a"), 32px tall. Not recreated in text.
- **Scroll state**: past 24px the bar densifies — more opaque, tighter padding,
  a purple glow joins the shadow. Toggled by a boolean off `useScroll`, so it is
  one class change, not a per-frame style write.
- **Hover**: a single pill slides between nav links via a shared `layoutId`, so
  the nav reads as one instrument rather than four independent buttons.
- **Mobile**: collapses progressively — nav into the menu at 1024px, the ghost
  CTA at 760px, the primary CTA at 360px. The menu is a glass panel that drops
  from the bar with both CTAs; the toggle's two bars fold into a cross, echoing
  the knock marks in the avatar artwork. Escape closes it.

### Hero composition

Art-directed **stage**, not a two-column grid. Copy and portal share a single
grid cell (`grid-template-areas: "stack"`) so they can overlap, with
`align-items: center` lining the portal up with the middle of the **copy block**
rather than the middle of the stage. Stacking in a cell rather than positioning
absolutely keeps the parallax translate free for Framer Motion to write.

The portal sits on the DNA strand (the canvas paints its helix at ~72% of
viewport width) so the particles read as the energy the knock releases.

The portal column (42%) is narrower than the copy column (62%) reaches, which
is what opens the gap between the headline and the artwork — a measured 35–49px
of clear space from 901px up. Earlier revisions ran the headline *behind* the
portal; that was pulled back in favour of the gap. If the interleave is ever
wanted again, widen the portal or raise the headline's `clamp()` cap and
re-measure, because those two values are what set the relationship.

### Right-side visual — "the knock"

`public/branding/knocka-avatar-logo.png`: the Knocka character knocking through
a message frame. Chosen over an invented object because the asset *is* the brand
metaphor — "don't text, arrive" is literally what the artwork shows. No video,
no card, no mockup.

Two things make it a composition rather than a pasted image:

1. **The artwork is cut out**, so the DNA particles read straight through the
   hollow message frame and around the character. This is the main hero↔DNA
   integration and it is why the frame reads as a portal rather than a card.
   (The asset was swapped to a background-removed version mid-build — 615x512.
   An earlier version shipped on an opaque black plate and needed a radial mask
   to fake this; that mask is gone. If the asset is ever replaced with a
   plated one again, the mask has to come back.)
2. **Two static glow layers** sit behind it: a wide radial bloom that tints the
   DNA in that region, and a blurred rounded-rect *ring* that hugs the frame.
   The ring is a border, not a fill — a filled glow washes out the particles
   visible through the hollow frame.

The artwork keeps a slow 7s float and its entrance; it has no other motion.
An earlier revision had knock ripples leaving the knuckles, replayed on CTA
hover — **removed on request**, along with the "hover to knock" label and the
throttled state that drove it.

### Typography

- **Display: Outfit** (`next/font/google`), geometric and rounded, chosen to
  harmonise with the Knocka wordmark's own geometry. Weight 900, uppercase,
  `line-height: .88`, `letter-spacing: -.045em`.
- **Body: Inter**, the stack the project already declared but never actually
  loaded — it was silently falling back to Arial.
- Both wired through the existing `--font-display` / `--font-sans` tokens.
- Headline scale `clamp(42px, 11vw, 148px)`. The cap, the copy column width and
  the portal width together set the gap beside the artwork, so re-measure if you
  touch any of them.
- Mobile deliberately tops out around 43–47px. Big, not shouty.

### Animation

Framer Motion (already a dependency). Everything is transform/opacity.

- Header slides down on load; hover pill is a shared-layout animation.
- Headline uses a **masked line reveal** (`components/animation/TextReveal`) —
  lines rise out of their own overflow box. No fades on the headline.
- Eyebrow → headline → lead → CTA stagger between 0.12s and 0.74s.
- Portal scales up from 0.92 with a long ease, then floats on a 7s cycle.
- Parallax on scroll: portal drifts -90px, copy -34px, which separates them in
  depth against the DNA field.
- `prefers-reduced-motion` is honoured throughout: rings are not rendered, the
  float and parallax are dropped, reveals become short opacity fades.

### Responsive

- **≥901px**: copy and portal stacked in one centred grid cell. Copy column 62%
  (64% at 1440+), portal 42% pinned right.
- Page gutter is `clamp(24px, 3vw, 40px)` — a global token, so the header bar,
  the hero stage and every future section inset together.
- **≤900px**: single flow, but recomposed rather than stacked — the portal is
  cropped off the right edge and the copy rides *up* over its faded lower edge,
  so the layering survives. Verified at 320/360/375/390/430/600/768/820/900.
- No horizontal overflow at any width from 320px to 1920px. The portal's bleed
  is intentional and contained by `.knocka-page { overflow-x: clip }`.

---

## Phase 2B — Footer

### Composition

One glass panel, echoing the header's control-layer language, built on the
device all three reference footers share: an **oversized wordmark cropped by
the panel edge**, acting as the floor of the site.

Inside the panel: brand block + app download on the left, four link columns on
the right, a hairline divider, a meta row, then the wordmark.

### The wordmark

Set in the display face at title case (the hero already carries uppercase, and
title case matches the logo). Its fill is a vertical gradient from lilac to
cyan so the letterforms hand off to the DNA field rather than ending flat.

**Sized in `cqw`, not `vw`.** The panel stops growing at `--stage-max` while
the viewport does not, so a vw-based size drifted from 89% to 104% of the
panel width — cropping the outer letters at wide viewports. `container-type:
inline-size` on the panel plus `31cqw` holds it at a steady 85–96% everywhere.
The bottom crop is an em-based negative margin, so the same slice is cut at
every size.

### App download

App Store and Google Play badges, marks drawn as inline SVG so they cost no
network weight. Glass pills with the same tactile press as the site buttons.
Links are `href="#"` — visual only, as requested.

### Performance

The panel is translucent but has **no `backdrop-filter`**. The DNA canvas
repaints behind it continuously, so blurring a panel this large would re-blur
the backdrop every frame — the same class of trap as the drop-shadow noted
above. Plain alpha lets the particles read through at zero cost: measured 60fps
with the footer filling the viewport.

### Notes

- `--page-min-height: 220vh` is **retired**. It was a placeholder giving the DNA
  scroll reaction room while the hero stood alone; the footer now supplies real
  height, and `.knocka-page` is back to `min-height: 100vh`.
- Namespaced `.site-footer*` because `sections.css` still reserves `.footer`,
  `.footer-brand` and `.footer-column` for a later design.
- Link labels outside the Explore column (Company, Legal, Social) are
  **placeholders** in `site-config.ts` — real destinations still needed.
- "Back to top" is real behaviour and respects reduced motion (it passes
  `behavior: "auto"` rather than relying on the CSS media query, which
  programmatic scrolls ignore).

### Files added

- `src/components/sections/Footer/Footer.tsx`, `StoreBadges.tsx`, `index.ts`
- `src/styles/footer.css`
- `src/lib/site-config.ts` — `footerGroups`, `socialGroup`
### Files changed

- `src/app/layout.tsx` — fonts, noscript reveal safeguard
- `src/components/navigation/SiteHeader.tsx`
- `src/components/sections/Hero/Hero.tsx`, `KnockPortal.tsx`
- `src/components/animation/TextReveal/` (new)
- `src/components/ui/Button.tsx` — now a client motion component with a press
- `src/lib/site-config.ts` — nav label "Flow & Motivi"
- `src/styles/site-header.css`, `hero.css`, `tokens.css`, `utilities.css`
- `public/branding/knocka-logo.svg` — see below

### Future considerations

- **The logo SVG was 1.8 MB.** It embedded a 1024×1024 PNG for a glyph that
  renders at ~30px. Downsampled to 192px: **1.8 MB → 55 KB**, visually identical.
  The original is kept at `knocka-logo.original.svg`. If the logo is ever
  re-exported, check for the same problem.
- **Nav has no active state yet** because there are no sections to be active in.
  When the sections land, drive it from a scroll-spy and reuse the existing
  `layoutId` pill.
- **`--page-min-height: 220vh`** is still a placeholder that gives the DNA scroll
  reaction room. Remove it once real sections provide the height.
- The old hero's CSS (`.hero-video`, `.avatar-bubble`, `.eyebrow`) was replaced,
  not preserved — that markup no longer exists. `sections.css` is untouched.
- **Never put `filter: drop-shadow()` on the portal artwork.** It follows the
  image's alpha silhouette, so the float animation forces a re-rasterisation
  every frame. Measured: the DNA canvas fell from 60fps to **11fps**, and
  removing that one declaration restored it. The static glow layers behind the
  artwork do the same job for free because they never move. The same trap
  applies to any animated element carrying a blur/shadow filter.
- Canvas frame rate is the cheapest regression signal on this page. If the hero
  ever feels heavy, measure the DNA loop's fps before anything else.
- The DNA canvas still ignores `devicePixelRatio` (soft on retina). Changing it
  costs fill rate; left alone deliberately.
