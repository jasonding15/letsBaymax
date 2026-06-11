"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/utils";
import {
  BAY_EMOJI,
  BAY_LABELS,
  STATUS_EMOJI,
  STATUS_LABELS,
  TENURES,
  type Bay,
  type Floor,
  type SeatEntry,
  type Tenure,
} from "@/lib/types";

/** A list entry plus a server-formatted "last updated" time label. */
type SeatEntryView = SeatEntry & { updatedLabel: string };

// Display order for the "At a bay" list: top floor first, bays clockwise-ish.
const FLOOR_ORDER: Floor[] = [11, 10, 9, 8];
const BAY_ORDER: Bay[] = ["N", "W", "S", "E"];

// Colorful avatar gradients picked deterministically from each name.
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

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function PersonRow({
  entry,
  index,
  showBay = true,
}: {
  entry: SeatEntryView;
  index: number;
  showBay?: boolean;
}) {
  return (
    <li
      style={{
        animation: "pop-in 0.4s ease-out both",
        animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
      className="bg-card flex items-center justify-between gap-2 rounded-lg border px-3 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm",
            avatarGradient(entry.name),
          )}
        >
          {initial(entry.name)}
        </span>
        {/* Name, tenure/bay, caption, and time share one wrapping line. */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-semibold">{entry.name}</span>
          {entry.tenure ? (
            <Badge variant="outline" className="px-1.5 py-0 text-xs">
              {entry.tenure}
            </Badge>
          ) : null}
          {showBay && entry.status === "at_bay" && entry.bay ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-xs">
              {BAY_EMOJI[entry.bay]} {BAY_LABELS[entry.bay]}
            </Badge>
          ) : null}
          {entry.comment ? (
            <span className="text-muted-foreground min-w-0 text-sm break-words italic">
              {entry.comment}
            </span>
          ) : null}
          <span className="text-muted-foreground/60 text-xs whitespace-nowrap">
            {entry.updatedLabel}
          </span>
        </div>
      </div>
      <DeleteButton
        id={entry.id}
        name={entry.name}
        ownerHash={entry.ownerHash}
      />
    </li>
  );
}

function SectionHeader({
  emoji,
  label,
  count,
  dotClass,
}: {
  emoji: string;
  label: string;
  count: number;
  dotClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2.5 rounded-full", dotClass)} aria-hidden />
      <h3 className="text-xl font-bold">
        {emoji} {label}
      </h3>
      <span className="text-muted-foreground text-sm">{count}</span>
    </div>
  );
}

export function SeatList({ entries }: { entries: SeatEntryView[] }) {
  const [tenureFilter, setTenureFilter] = useState<Tenure | null>(null);

  const filtered = useMemo(
    () =>
      tenureFilter ? entries.filter((e) => e.tenure === tenureFilter) : entries,
    [entries, tenureFilter],
  );

  const { downToBay, atBay, working } = useMemo(
    () => ({
      downToBay: filtered.filter((e) => e.status === "down_to_bay"),
      atBay: filtered.filter((e) => e.status === "at_bay"),
      working: filtered.filter((e) => e.status === "working"),
    }),
    [filtered],
  );

  // "At a bay" people grouped by floor (11 → 8) then bay (N, W, S, E). Only
  // occupied floor/bay combos show up.
  const atBayGroups = useMemo(
    () =>
      FLOOR_ORDER.flatMap((floor) =>
        BAY_ORDER.map((bay) => ({
          floor,
          bay,
          people: atBay.filter((e) => e.floor === floor && e.bay === bay),
        })).filter((g) => g.people.length > 0),
      ),
    [atBay],
  );

  if (entries.length === 0) {
    return (
      <div className="bg-card/50 flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center">
        <div className="relative h-40 w-32">
          <Image
            src="/baymaxlolipop.jpg"
            alt="Baymax holding a lollipop"
            fill
            className="object-contain"
          />
        </div>
        <p className="mt-3 font-semibold">No one&apos;s checked in yet today.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Be the first — set your status above!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-xs font-semibold tracking-wide uppercase">
          View
        </span>
        {([null, ...TENURES] as (Tenure | null)[]).map((t) => {
          const active = tenureFilter === t;
          return (
            <button
              key={t ?? "all"}
              type="button"
              aria-pressed={active}
              onClick={() => setTenureFilter(t)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {t ?? "All"}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card/50 flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
          <div className="relative h-32 w-28">
            <Image
              src="/baymaxlolipop.jpg"
              alt="Baymax holding a lollipop"
              fill
              className="object-contain"
            />
          </div>
          <p className="mt-3 font-medium">No one here.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            No {tenureFilter} is checked in right now.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {atBay.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeader
            emoji={STATUS_EMOJI.at_bay}
            label={STATUS_LABELS.at_bay}
            count={atBay.length}
            dotClass="bg-primary"
          />
          {atBayGroups.map((group) => (
            <div
              key={`${group.floor}-${group.bay}`}
              className="flex flex-col gap-2"
            >
              <h4 className="flex items-baseline gap-2 text-xl font-extrabold">
                <span aria-hidden>{BAY_EMOJI[group.bay]}</span>
                <span>
                  {group.floor} {BAY_LABELS[group.bay]}
                </span>
                <span className="text-muted-foreground text-sm font-normal">
                  · {group.people.length}
                </span>
              </h4>
              <ul className="flex flex-col gap-1.5">
                {group.people.map((entry, i) => (
                  <PersonRow
                    key={entry.id}
                    entry={entry}
                    index={i}
                    showBay={false}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {downToBay.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeader
            emoji={STATUS_EMOJI.down_to_bay}
            label={STATUS_LABELS.down_to_bay}
            count={downToBay.length}
            dotClass="bg-emerald-500"
          />
          <ul className="flex flex-col gap-1.5">
            {downToBay.map((entry, i) => (
              <PersonRow key={entry.id} entry={entry} index={i} />
            ))}
          </ul>
        </section>
      ) : null}

      {working.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeader
            emoji={STATUS_EMOJI.working}
            label={STATUS_LABELS.working}
            count={working.length}
            dotClass="bg-slate-400"
          />
          <ul className="flex flex-col gap-1.5">
            {working.map((entry, i) => (
              <PersonRow key={entry.id} entry={entry} index={i} />
            ))}
          </ul>
        </section>
      ) : null}
        </div>
      )}
    </div>
  );
}
