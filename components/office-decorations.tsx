import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Baymax mascots in the side gutters — three per side, alternating between the
 * waving and standing poses. Both images are cropped tight to the subject so
 * they render at the same on-screen size. Purely decorative (hidden from
 * assistive tech, ignores pointer events) and only shown on large screens.
 */
const WAVE = { src: "/baymaxhi.png", w: 249, h: 330 };
const STAND = { src: "/baymax.png", w: 995, h: 1156 };

const ITEMS = [
  { ...WAVE, side: "left" as const, top: "12%" },
  { ...STAND, side: "left" as const, top: "46%" },
  { ...WAVE, side: "left" as const, top: "80%" },
  { ...STAND, side: "right" as const, top: "24%" },
  { ...WAVE, side: "right" as const, top: "58%" },
  { ...STAND, side: "right" as const, top: "92%" },
];

export function OfficeDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden select-none lg:block"
    >
      {ITEMS.map((it, i) => (
        <Image
          key={i}
          src={it.src}
          alt=""
          width={it.w}
          height={it.h}
          style={{ top: it.top }}
          className={cn(
            "absolute h-auto w-16 -translate-y-1/2 opacity-90 drop-shadow-sm xl:w-24",
            it.side === "left"
              ? "left-3 -scale-x-100 xl:left-8"
              : "right-3 xl:right-8",
          )}
        />
      ))}
    </div>
  );
}
