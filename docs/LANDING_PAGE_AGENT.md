# Knocka Landing Page — Agent Notes

Running record of design decisions for the Knocka marketing site. Read this
before changing the header or hero; append a section per phase.

**This file is HOW and RULES.** For WHAT and WHY — positioning, the page story,
section specs, the asset map and the phased implementation plan — read
[LANDING_PAGE_STRATEGY.md](./LANDING_PAGE_STRATEGY.md) first.

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
title case matches the logo).

**Fill, revised on request (post-Phase 3).** It was a lilac-to-cyan vertical
gradient that dissolved into the DNA field. It is now two clipped layers: a
purple that is lit at the cap line and sinks to near-black by the baseline, and
a symmetric darkening at the left and right extremes, so the middle letters are
bright and the outer ones fall into shadow.

**Place gradient stops against the ink, not the box.** `background-clip: text`
paints across the span's whole line box, but the glyphs only occupy about
**12% (cap line) to 82% (baseline)** of it — the rest is leading, and the crop
throws the bottom of the box away entirely. Stops written 0-100% put their
darkest end in the part that gets cut off, so the shadow does not read at all.
Measure the ink band before touching these numbers.

**The wordmark is cut by the floor, not resting on it.** `margin-bottom:
-0.22em` runs the letterforms past the panel's inner edge; `margin-top: -0.1em`
removes the font's half-leading, which was opening dead space above the caps.
Measured flush at 320-1920 (the only gap is the panel's own 1px border), with
the crop scaling proportionally from 14px to 77px. No filters: the shadow is
gradient, so the entrance animation stays cheap - 59.9fps with the footer
filling the viewport.

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
---

## Phase 2C — Rooms

### Chosen interaction: depth arrival

Three concepts were weighed: a vertical world-reel with counter-parallax, a
portal that widens from message-frame to cinemascope, and a depth stack.

**Depth stack won.** The three worlds are layered in Z inside one pinned
cinematic frame; scroll flies the camera forward, so the world you leave comes
toward you and passes the lens while the next scales up from behind. It is the
only one of the three that says *arrival* — which is the brand — and it is pure
transform/opacity, so it cannot threaten the DNA canvas budget. The widening
portal was rejected because it needs animated clip-path/layout on a large video
layer every frame, and it would crop the cinematography differently per room.

Outgoing worlds paint **above** incoming ones (`zIndex: total - index`), which
is what makes it read as flying through rather than cross-dissolving.

### Scroll architecture

`.rooms-runway` (340vh, 300vh under 900px) holds a `position: sticky` stage.
`useScroll({ target: runwayRef, offset: ["start start", "end end"] })` maps the
pinned distance to 0→1. Each `RoomScene` derives its own transforms from that
single value.

**Two traps worth knowing, both cost real debugging time:**

1. **Transform input ranges must stay inside `[0, 1]`.** Framer Motion v13 hands
   scroll-linked chains to the browser as native WAAPI animations, where the
   input range becomes keyframe *offsets*. A stop at `-0.1` threw
   `Offsets must be monotonically non-decreasing` at mount and blanked the whole
   page. The outer worlds now get three stops instead of four.
2. **That acceleration is desynced from `useScroll` offsets.** Once accelerated,
   framer stops writing the JS value and the native ViewTimeline drives it — but
   it reported 52.8% progress at the end of the runway, so the first world faded
   back in over the last. Acceleration only attaches when a transform maps an
   array range straight off the scroll value, so `Rooms.tsx` routes progress
   through one identity function transform to detach it. **Keep that
   indirection**; removing it silently reintroduces the bug.

### Video behaviour

All three are 1536x672 (2.29:1 cinemascope), 8s, muted + `playsInline` + `loop`.

- `src` is withheld until `useInView` says the section is within 80% of the
  viewport, so the page never pays 6.3MB on first load.
- Playback is gated by a bitmask off scroll position. Only the active world
  decodes; the next warms at 72% through the previous band.
- The outgoing world **freezes** once the label swaps rather than playing
  through its fade. Two videos decoding at once halves the canvas frame rate,
  and by then it is scaling away, so a still frame does not read.
- `aspect-ratio` on the frame matches the source exactly, so there is no layout
  shift and no letterbox.

### Responsive

The frame trades width for height as the screen narrows, so the avatars stay
large instead of the video becoming a slot: 2.29:1 above 900px, 16:9 to 560px,
4:3 below. Checked against the source frames — both avatars survive the 4:3
crop. The width also carries an `svh` term so the frame always fits a short
viewport without breaking ratio. Caption and progress stack under 560px.

### Performance

- No second canvas. The portal floats over the existing fixed DNA canvas, and
  the three glows step purple -> magenta -> cyan, so travelling the rooms walks
  the brand gradient. That is the whole DNA tie-in.
- Glows crossfade by class with a CSS transition, not a per-frame style write.
- A scrim div carries the depth dimming instead of a `brightness()` filter — no
  filters on moving layers, per the drop-shadow lesson above.
- Canvas holds **60fps** while a world is pinned. It dips to **~33fps** during a
  crossfade, when two videos decode. Measured in headless Chrome with
  `--disable-gpu`, so that is software decode and a worst case; the overlap is
  already as short as the crossfade allows. Worth re-measuring on real hardware
  before optimising further.

### Validation

`tsc` clean, `eslint` clean, production build clean. No horizontal overflow at
320/375/390/768/1024/1280/1440/1920. Sticky confirmed working under
`.knocka-page { overflow-x: clip }`. Reduced motion drops scale, drift and the
scrim and leaves a plain opacity crossfade. DNA rotation and scroll reaction
unchanged; header, hero and footer untouched.

### Files added

- `src/components/sections/Rooms/Rooms.tsx`, `RoomScene.tsx`, `RoomProgress.tsx`, `index.ts`
- `src/styles/rooms.css`
- `src/lib/site-config.ts` — `rooms`

### Note

Lenis is installed but still unused. Enabling it would smooth every scroll-driven
section, but it changes the feel of the header, hero parallax and DNA reaction
too, so it was left alone here — it should be its own decision.
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

---

## Phase 0 — Product and content decisions

Ran after Phase 2C despite the number; it is Phase 0 of the plan in
[LANDING_PAGE_STRATEGY.md](./LANDING_PAGE_STRATEGY.md). Content and navigation
only — no new sections, no visual redesign.

### The nav conflict, and how it was resolved

Phase 0 required every active nav item to point at a real element, but every
nav *label* is still an open client question. Renaming them would have been
guessing; leaving them would have shipped four dead links (all four, once Rooms
took `#rooms`).

Resolution: **`navLinks` keeps the full intended navigation, and a `ready` flag
decides what renders.** No label was renamed or deleted; unready entries are
simply not painted. `activeNavLinks` is what the header and the footer Explore
column consume.

This makes each later phase a one-line change: build the section, flip its flag.

| Label | Anchor | ready | Unblocked by |
|---|---|---|---|
| Flow & Motivi *(label unresolved)* | `#arrival` | false | Phase 1 |
| Features | `#range` | false | Phase 2 |
| **Rooms** | `#rooms` | **true** | — |
| Modes | `#modes` | false | Phase 4 |
| FAQ *(existence unresolved)* | `#faq` | false | Client |

Anchors were pre-wired to the strategy's targets. Anchors are implementation
detail, not client-facing copy, so changing them decides nothing.

### Also changed

- **Rooms `id="modes"` → `id="rooms"`.** The only item the strategy marked
  *Decided*. `#modes` now belongs to S5 and intentionally resolves to nothing
  until Phase 4.
- **Hero lead, second sentence only.** Was four abstract nouns ("emotion, voice,
  movement and presence"); now names the category. Headline, artwork, layout,
  type scale, animation and CTA untouched. Verified 2 lines at desktop before
  and after — no reflow.

### Deliberately NOT changed

- **"Glass Matrix"** — still in the header and mobile menu. Strategy marks it
  *Client confirmation*; it is meaningless but not misleading, so the smallest
  safe change was none.
- **App Store / Google Play badges** — still read "Download on the / App Store".
  Whether the product is pre-launch is open question 2. Guessing either way
  risks shipping a false claim, so the visual implementation is untouched.

### Known cosmetic consequence

The footer Explore column now lists a single link. It refills as phases land.
Not worth a footer redesign to hide a temporary state.

### Validation

`npm run lint` clean · `tsc --noEmit` clean · `npm run build` clean. Checked at
320/390/768/1024/1440/1920: one rendered anchor (`#rooms`), zero dead anchors,
zero horizontal overflow. DNA unchanged (500 particles, scroll reaction Δy 430).
Rooms walk identical at all 7 scroll stops. Reduced motion unaffected. No
dependency changes.

---

## Phase 1 — S2 The Flat -> The Arrival

The section spec, the beat table and the video decision live in
[LANDING_PAGE_STRATEGY.md](./LANDING_PAGE_STRATEGY.md). This is only what an
implementer needs to know before touching the files.

### Where the timing lives

`Arrival/score.ts` holds the entire section: every beat as a fraction of the
runway, plus the two knock offsets. Nothing is timed anywhere else. If a beat
needs to move, move it there — the thread, the plate, the spark and the frame
all read from it, and they only read correctly relative to each other.

### The one trick worth understanding

The thread and the arrival frame sit in the **same grid cell**
(`.arrival-core`, `grid-template-areas: "core"`). So the thread's transform
origin and the frame's transform origin are the same point, and the collapse
is one `scale` on the thread wrapper — no measurement, no layout reads, no
per-bubble journey to a computed centre. The bubbles only add a small
horizontal drift so it reads as a squeeze rather than a uniform shrink.

The cell is sized by the frame, not by the thread, which is why nothing
reflows when the frame appears.

### Two scroll ranges, not one

The plate (`.arrival-scrim`) hides the DNA canvas, so it has to be opaque
before the section pins and gone before it ends. It is driven by **two**
`useScroll` calls on the same ref:

- `["start start", "end end"]` — the runway, which drives every beat;
- `["start end", "start start"]` — the approach, which the plate is multiplied by.

**A plate that overhangs upward will cover the hero.** The section is a later
sibling at the same `z-index`, so it paints over it. An earlier revision used
`inset: -70vh 0` to keep the feathered edges off-screen during the pin, and at
page load that put an opaque layer across the hero's lead and CTA — caught by
screenshotting the hero, not by any automated check. The plate now starts
exactly at the stage's top edge and overhangs downward only.

### The two knocks

Scroll **arms** the sequence; `KNOCK_BEATS` **performs** it. A purely
scroll-linked knock would let the visitor's scroll speed set its rhythm, and
the rhythm is the brand. The arm/disarm thresholds are 0.84 / 0.66 —
hysteresis, so a scroll resting on the boundary cannot retrigger every frame.

The frame kick and the edge flash ride one shared impulse track
(`KNOCK_PULSE`), whose two peaks are the same 0.34s apart. Change one number
and both stay in sync.

If the welcome video is ever approved, it knocks twice itself: **retime
`KNOCK_BEATS` to its knock frames.** Do not add a second knock animation.

### The media slot

`arrivalMedia` in `site-config.ts` is a discriminated union, and
`ArrivalMedia.tsx` implements both arms. The frame is authored at the welcome
video's own 4:3, so the swap is the config object and nothing else. The video
path withholds `src` until `useInView` says the section is near, is muted +
`playsInline`, does not loop, and rewinds when it leaves the arrival beat.

### Traps this section re-confirms

- **The identity `useTransform` is mandatory.** Same WAAPI acceleration trap
  as Rooms, same fix, same reason. Every stop in `score.ts` is also inside
  `[0, 1]`.
- **No filter on anything that moves.** The bloom and the spark are painted
  radial gradients rather than blurred shapes, because both of them scale.
- **The grey thread is authored grey.** `filter: grayscale()` on a wrapper
  that is being scaled repaints it every frame.

### Static composition

`@media (prefers-reduced-motion: reduce), (scripting: none)` drops the pin,
removes the plate and un-stacks the core into a column. The same block covers
reduced motion and no-JS, so `layout.tsx`'s `NOSCRIPT_REVEAL` did not need a
new entry — this section's server HTML is visible by default, not hidden.

### Validation

`tsc` clean, `eslint` clean, production build clean. DNA canvas **60fps at
every beat and 60.3fps scrubbing the whole runway** (hero and Rooms controls
both 60fps). No horizontal overflow at 320/375/390/768/1024/1280/1440/1920;
the composition fits inside the pinned stage at all of them, including
320x568. Knock sequence: exactly two marks, exactly two flashes, 332–357ms
apart, replayable, holding from 0.84 down to 0.66. Rooms re-walked at 7 stops
and unchanged; hero screenshot-verified intact. The welcome video is never
requested; S2's avatar image is the URL the hero already loads.

### Note on measuring this page

A long-lived `next dev` server was serving stale hot-reloaded modules where
**every** framer scroll value was frozen at 0 — Rooms included, not just the
new section. If scroll-linked animation appears completely dead, measure
against `next build && next start` before believing it. Restart that server
after every rebuild, or it serves a build whose assets no longer exist.

### Files added

- `src/components/sections/Arrival/Arrival.tsx`, `ConversationThread.tsx`,
  `ArrivalMedia.tsx`, `score.ts`, `index.ts`
- `src/styles/arrival.css`
- `src/lib/site-config.ts` — `arrivalThread`, `arrivalMedia`; `#arrival` nav
  flag flipped to `ready: true` (the label is still unresolved and was **not**
  renamed)

---

## Phase 2 — S3 The Range

The asset audit, the composition and the known limitations are in
[LANDING_PAGE_STRATEGY.md](./LANDING_PAGE_STRATEGY.md). This is what an
implementer needs before touching the files.

### The trap: a masked reveal can never fire on `whileInView`

This one cost real debugging time and will bite again.

`IntersectionObserver` clips the intersection rectangle against **ancestor
`overflow: hidden`**. `.text-reveal` is exactly that — a mask holding its line
110% below itself — so the line reports an intersection ratio of **0.05** no
matter where the page is scrolled, and `viewport={{ amount: 0.5 }}` never
fires. The headline simply never appeared, at any scroll position.

**The observer has to sit on the unclipped wrapper**, with the masked line
following as a variant:

```tsx
<motion.span className="text-reveal" initial="hidden" whileInView="shown"
             viewport={{ once: true, amount: 0.5 }}>
  <motion.span className="text-reveal-inner" variants={{ hidden: {...}, shown: {...} }} />
</motion.span>
```

`TextReveal` does not hit this because it animates from `animate` on mount —
but that is also why it is not used here: for a section this far down the
page its reveal is over long before anyone scrolls to it. (The same is true
of the Rooms title today. Left alone; not this phase's file.)

### The knock is imported, not copied

`KnockMarks.tsx` imports `KNOCK_BEATS` from `Arrival/score.ts`. The gap
between the two hits is the brand, and two copies of it would drift apart.
S2 owns the constant; this is a read-only reuse and S2 was not modified.
**When a phase is allowed to touch both sections, move it to `src/lib/`.**

S2 arms from scroll progress (it is pinned); S3 arms from `useInView` (it is
not). Both perform on a clock. Measured across 5 / 14 / 90 px per frame:
332 / 333 / 349ms. Scroll speed does not touch the rhythm.

### The waveform is a drawing

There is no audio anywhere in this project. `VoiceWave` therefore has no
transport controls, no duration, no scrubber, and **stops moving once it has
drawn** — a waveform that keeps animating reads as playback. Generated
deterministically (three sine terms under one envelope) so SSR and the client
produce the same path. `pathLength` draw-on measured free against the DNA
canvas.

If real voice assets ever arrive, that is the moment to reconsider controls —
not before.

### Why there is no state machine

An earlier plan had the avatar's halo walking purple -> magenta -> cyan as
each state came into view. It was dropped: with one avatar pose the avatar is
the *constant*, and the honest way to carry the brand gradient is the **spine**
— a static CSS gradient on a 1px rule through all three states. That removed
three `IntersectionObserver`s, all the glow, and any implication that the
avatar reacts. The section is calmer and cheaper for it.

### Scroll

No `sticky`, no `useScroll`, no scroll-linked value, no scroll container.
Verified by walking every width and asserting nothing inside `#range`
scrolls independently. This is the pacing relief between two pinned
sequences and it has to stay that way.

### Navigation — deliberately NOT flipped

Phase 0's contract says the phase that builds a section flips its `ready`
flag, and Phase 1 did exactly that for `#arrival`. **Phase 2 did not**, on two
grounds: the phase brief explicitly said not to modify navigation, and unlike
"Flow & Motivi" the label "Features" carries its own pending rename
("What it does"). `#range` exists and resolves; the link is one line away
when both are cleared.

### Validation

`tsc` clean, `eslint` clean, production build clean. DNA canvas **60fps** at
the head, the waveform and the knock, and **60.1fps scrubbing the section end
to end** (hero, S2 and Rooms controls all 60fps). No horizontal overflow and
no scroll container at 320/375/390/768/1024/1280/1440/1920; every reveal
completes at all eight. Exactly two knock marks everywhere (four page-wide:
two in S2, two here). Reduced motion shows all three states, both headline
lines, the avatar, the drawn waveform and both marks, with no transform.
S2 re-walked at 11 stops and Rooms at 7 — both identical to their recorded
baselines; hero and footer verified unchanged. No new network cost: S3's
avatar is the same optimised URL the hero already loads, and the welcome
video is still never requested.

### Note for the next measuring pass

`html` has `scroll-behavior: smooth`, so per-frame scripted scrolling must
pass `behavior: "auto"` explicitly — otherwise each step supersedes the last
and the page barely moves, which looks exactly like a broken trigger.

### Files added

- `src/components/sections/Range/Range.tsx`, `VoiceWave.tsx`,
  `KnockMarks.tsx`, `index.ts`
- `src/styles/range.css`

---

## Phase 3 — S4 Rooms polish

Polish, not a rebuild. The depth stack, the scroll architecture, the caption
and the progress indicator were all left exactly as they were — they work.
What the section needed was pacing, an ending, and two performance fixes.
The numbers and the creative reasoning are in
[LANDING_PAGE_STRATEGY.md](./LANDING_PAGE_STRATEGY.md).

### Heights are arithmetic, not taste

The section is `intro + runway + payoff`, and the strategy caps any section
at 300vh. Measure the three parts before touching the runway:

```
intro   47vh  (eyebrow + 2-line title + 1-line lead + padding)
runway 220vh  (the only part worth spending on)
payoff  30vh
        ----
        297vh at 1440x900
```

The runway minus one viewport is the travel, and the travel divided by three
is the band per world. At 220vh that is 40vh a world, so a crossfade
(`ROOM_FADE` = 0.3 of a band) is 12vh. Below about 200vh the crossfade drops
under a tenth of a viewport and starts reading as a cut. **That is the floor,**
not the 300vh cap.

### The two-decode window is one number

Two videos decoding at once halves the DNA canvas. The window where that
happens is bounded by exactly two things:

- it **opens** at `WARM_AT` (the incoming world starts playing), and
- it **closes** at 0.85 of the band, when the label swaps and the outgoing
  world freezes — that is `ROOM_FADE / 2` before the band boundary.

So the window is `0.85 - WARM_AT` of a band. It was 0.72, giving 13%; it is
now **0.82, giving 3%**. Nothing else needs touching to tune it.

**What this does not fix:** the *depth* of the dip. Two simultaneous software
decodes cost what they cost — still ~30fps inside the window. Only its
duration improved, by about three quarters. Do not record this as "fixed".

To find the window rather than guess at it, step progress in 0.01 increments
and count `.room-scene video:not(:paused)`. Sampling at round numbers like
0.33 misses it entirely and reports a comfortable 56fps.

### Staged preload

`isEager={index === 0 || isOnScreen}` picks `preload="auto"` vs
`"metadata"`. `metadata` still issues a request — the win is bytes, not
request count, so measure `Network.dataReceived` and not
`requestWillBeSent`. At the arming moment: **6.2MB -> 2.5MB**.

The two deferred worlds finish loading during the first world. Verified by
asserting `readyState === 4` on all three at every walk stop; if that ever
fails, the first visible frame of a room will be stale.

### Room 03 breaking frame: measured, then dropped

The portal clears the caption by **23px**. Full-bleed width at 1440 needs
`scale(1.207)`, which pushes the frame 54px past each edge — 31px into the
caption. The largest collision-free scale is 1.088, which is not a frame
break. Rejected. If anyone revisits it, move the caption out of the portal's
growth path first; a bigger scale value is not the missing piece.

### Hero, mid-phase

`<KnockPortal />` was deleted from the hero by the owner while this phase was
running — confirmed intentional. `tsconfig` has `noUnusedLocals`, so the
orphaned import was a hard **build** error, not a lint warning; the whole
toolchain was red until it was removed. That one line is the only Hero change
in this phase. `KnockPortal.tsx`, `portalY` and the empty
`.hero-portal-slot` wrapper are all still there, so restoring the artwork is
one line — and the leftover wrapper and parallax value are dead weight until
someone decides which way it goes.

### Validation

`tsc` clean, `eslint` clean, production build clean. Runway re-walked at 7
stops at 1440 and 390: clean 1/0 opacities, one decoder outside the crossfade,
`readyState` 4 throughout, glow and caption tracking the picture. No overflow
and **no nested scroll container** at 320/375/390/768/1024/1280/1440/1920;
caption fits inside the stage at all eight. Section 274–298vh. DNA 60fps
pinned and scrubbing, 56.7fps on the disco world, ~30fps in the 3% two-decode
window. Reduced motion: zero transforms on all three worlds, no scrims
rendered, payoff fully visible. S2 re-walked at 11 stops and S3 at 8 widths —
both identical to their recorded baselines.

### Files changed

- `src/components/sections/Rooms/Rooms.tsx` — lead, payoff, `WARM_AT`, `isEager`
- `src/components/sections/Rooms/RoomScene.tsx` — staged `preload`
- `src/styles/rooms.css` — runway heights, intro padding, payoff
- `src/components/sections/Hero/Hero.tsx` — one orphaned import, see above
