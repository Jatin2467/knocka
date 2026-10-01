/** Apple mark, drawn inline so the badge carries no network weight. */
function AppleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="h-full w-full"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

/** Google Play mark. */
function PlayGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="h-full w-full"
    >
      <path d="M3.609 1.814 13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92Zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635Zm3.199-3.198 2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.29 12l2.408-2.491ZM5.864 2.658 16.802 8.99l-2.303 2.303-8.635-8.635Z" />
    </svg>
  );
}

interface StoreBadgeProps {
  glyph: "apple" | "play";
  name: string;
}

/**
 * The app is not in either store yet, so each badge is a disabled, non-link
 * label: dimmed, no hover, out of the tab order, and read as "App Store,
 * coming soon". When a store listing goes live, this becomes a link again.
 *
 * The badge goes full width below 560px so two of them stack instead of
 * wrapping into a ragged row.
 */
function StoreBadge({ glyph, name }: StoreBadgeProps) {
  return (
    <span
      data-store={glyph}
      aria-disabled="true"
      title={`${name} — coming soon`}
      className={
        "inline-flex cursor-not-allowed items-center gap-3 rounded-control border border-dashed " +
        "border-border-glass bg-glass-strong py-[11px] pr-4 pl-4 text-text-primary opacity-60 select-none " +
        "upto-560:flex-[1_1_100%]"
      }
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center text-[rgba(255,255,255,0.7)]">
        {glyph === "apple" ? <AppleGlyph /> : <PlayGlyph />}
      </span>
      <span className="grid gap-px text-left">
        <span className="text-[10px] tracking-[0.06em] text-[rgba(255,255,255,0.5)] uppercase">
          Coming soon
        </span>
        <span className="font-display text-[15px] leading-[1.15] font-medium">
          {name}
        </span>
      </span>
    </span>
  );
}

export function StoreBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      <StoreBadge glyph="apple" name="App Store" />
      <StoreBadge glyph="play" name="Google Play" />
    </div>
  );
}
