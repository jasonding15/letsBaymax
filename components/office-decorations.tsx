import { cn } from "@/lib/utils";

/**
 * Playful, non-interactive office emoji arranged in the side gutters beside the
 * centered content column. Purely decorative: hidden from assistive tech and
 * ignores pointer events. They sit *outside* the max-w-2xl column and only show
 * on large screens where there's gutter room, so nothing overlaps the content.
 * Static (no animation) to keep things calm.
 */
type Decoration = {
  emoji: string;
  side: "left" | "right";
  top: string;
};

const DECORATIONS: Decoration[] = [
  { emoji: "🤖", side: "left", top: "6%" },
  { emoji: "🏢", side: "left", top: "31%" },
  { emoji: "❤️", side: "left", top: "56%" },
  { emoji: "☕", side: "left", top: "81%" },
  { emoji: "🩹", side: "right", top: "14%" },
  { emoji: "💻", side: "right", top: "39%" },
  { emoji: "📍", side: "right", top: "64%" },
  { emoji: "🎈", side: "right", top: "89%" },
];

export function OfficeDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden select-none overflow-hidden lg:block"
    >
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
            <span className="block text-6xl opacity-50 drop-shadow-sm xl:text-7xl">
              {d.emoji}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
