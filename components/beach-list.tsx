import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LABELS,
  DRINKING_LABELS,
  type ActivityPreference,
  type BeachEntry,
  type DrinkingPreference,
} from "@/lib/types";

// Fun, beachy avatar gradients picked deterministically from each name.
const AVATAR_GRADIENTS = [
  "from-rose-400 to-orange-400",
  "from-amber-400 to-yellow-400",
  "from-emerald-400 to-teal-400",
  "from-sky-400 to-cyan-400",
  "from-violet-400 to-fuchsia-400",
  "from-pink-400 to-rose-400",
  "from-lime-400 to-emerald-400",
  "from-blue-400 to-indigo-400",
];

const ACTIVITY_EMOJI: Record<ActivityPreference, string> = {
  indoors: "🏠",
  outdoors: "🌞",
  either: "🤙",
};

const DRINKING_EMOJI: Record<DrinkingPreference, string> = {
  yes: "🍹",
  no: "🚫",
  indifferent: "🤷",
};

/** Stable hash → gradient index, so a given name always gets the same color. */
function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "🏖️";
}

export function BeachList({ entries }: { entries: BeachEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed bg-card/50 px-6 py-12 text-center">
        <p className="text-4xl">🏝️</p>
        <p className="mt-3 font-semibold">Nobody&apos;s on the beach yet today.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Be the first to grab a towel! 🏖️
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <li
          key={entry.id}
          style={{
            animation: "pop-in 0.4s ease-out both",
            animationDelay: `${Math.min(i, 8) * 55}ms`,
          }}
          className="bg-card flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white shadow-sm",
                avatarGradient(entry.name),
              )}
            >
              {initial(entry.name)}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-lg font-semibold">
                {entry.name}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {entry.activityPreference ? (
                  <Badge variant="secondary">
                    {ACTIVITY_EMOJI[entry.activityPreference]}{" "}
                    {ACTIVITY_LABELS[entry.activityPreference]}
                  </Badge>
                ) : null}
                {entry.drinkingPreference ? (
                  <Badge variant="outline">
                    {DRINKING_EMOJI[entry.drinkingPreference]}{" "}
                    {DRINKING_LABELS[entry.drinkingPreference]}
                  </Badge>
                ) : null}
                {!entry.activityPreference && !entry.drinkingPreference ? (
                  <span className="text-muted-foreground text-sm">
                    No preference
                  </span>
                ) : null}
              </div>
              {entry.comment ? (
                <p className="text-muted-foreground text-sm italic break-words whitespace-pre-wrap">
                  {entry.comment}
                </p>
              ) : null}
            </div>
          </div>
          <DeleteButton
            id={entry.id}
            name={entry.name}
            ownerHash={entry.ownerHash}
          />
        </li>
      ))}
    </ul>
  );
}
