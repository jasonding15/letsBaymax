import { cn } from "@/lib/utils";

/**
 * Playful, non-interactive beach emoji arranged in the side gutters beside the
 * centered content column. Purely decorative: hidden from assistive tech and
 * ignores pointer events. They sit *outside* the max-w-2xl column (never behind
 * it) and only show on large screens where there's gutter room, so nothing ever
 * overlaps the form or list.
 */
type Decoration = {
  emoji: string;
  side: "left" | "right";
  top: string;
  delay: string;
};

const DECORATIONS: Decoration[] = [
  // Left gutter, staggered top-to-bottom.
  { emoji: "🌴", side: "left", top: "6%", delay: "0s" },
  { emoji: "🏐", side: "left", top: "31%", delay: "0.8s" },
  { emoji: "🐚", side: "left", top: "56%", delay: "1.6s" },
  { emoji: "🩴", side: "left", top: "81%", delay: "0.4s" },
  // Right gutter, offset so the two columns interleave.
  { emoji: "⛱️", side: "right", top: "14%", delay: "1.2s" },
  { emoji: "🏖️", side: "right", top: "39%", delay: "0.2s" },
  { emoji: "🦀", side: "right", top: "64%", delay: "2s" },
  { emoji: "🌊", side: "right", top: "89%", delay: "1s" },
];

export function BeachDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden select-none overflow-hidden lg:block"
    >
      {/* Centered guide matching the content column; emoji are pushed into the
          gutters just outside its left/right edges. */}
      <div className="relative mx-auto h-full max-w-2xl">
        {DECORATIONS.map((d, i) => (
          <span
            key={i}
            className={cn(
              "absolute",
              d.side === "left"
                ? "left-0 -translate-x-[calc(100%+2rem)]"
                : "right-0 translate-x-[calc(100%+2rem)]",
            )}
            style={{ top: d.top }}
          >
            {/* Inner element does the bob so the gutter offset above is never
                overridden by the animation's transform. */}
            <span
              className="block text-6xl opacity-60 drop-shadow-sm xl:text-7xl"
              style={{
                animation: `beach-bob ${5 + (i % 3)}s ease-in-out infinite`,
                animationDelay: d.delay,
              }}
            >
              {d.emoji}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
