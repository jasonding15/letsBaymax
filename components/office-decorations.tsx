import Image from "next/image";

/**
 * Two large Baymax mascots in the side gutters, beside the centered content
 * column. Purely decorative (hidden from assistive tech, ignores pointer events)
 * and only shown on large screens where there's gutter room. Vertically centered
 * so they sit in the page's light zone (the lollipop shot has a white backdrop).
 */
export function OfficeDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden select-none lg:block"
    >
      {/* Left: waving Baymax, mirrored so the wave faces inward. */}
      <Image
        src="/baymaxhi.png"
        alt=""
        width={250}
        height={331}
        className="absolute top-1/2 left-4 h-auto w-28 -translate-y-1/2 -scale-x-100 opacity-95 drop-shadow-md xl:left-10 xl:w-44"
      />
      {/* Right: Baymax with a lollipop. */}
      <Image
        src="/baymaxlolipop.jpg"
        alt=""
        width={552}
        height={786}
        className="absolute top-1/2 right-4 h-auto w-28 -translate-y-1/2 opacity-95 xl:right-10 xl:w-44"
      />
    </div>
  );
}
