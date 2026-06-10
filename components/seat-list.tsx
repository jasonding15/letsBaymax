"use client";

import Image from "next/image";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/utils";
import {
  BAY_EMOJI,
  BAY_LABELS,
  FLOORS,
  STATUS_EMOJI,
  STATUS_LABELS,
  type SeatEntry,
} from "@/lib/types";

/** A list entry plus a server-formatted "last updated" time label. */
type SeatEntryView = SeatEntry & { updatedLabel: string };

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

function PersonRow({ entry, index }: { entry: SeatEntryView; index: number }) {
  return (
    <li
      style={{
        animation: "pop-in 0.4s ease-out both",
        animationDelay: `${Math.min(index, 8) * 45}ms`,
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
          <span className="truncate text-lg font-semibold">{entry.name}</span>
          {entry.status === "at_bay" && entry.bay ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">
                {BAY_EMOJI[entry.bay]} {BAY_LABELS[entry.bay]} bay
              </Badge>
            </div>
          ) : null}
          {entry.comment ? (
            <p className="text-muted-foreground text-sm italic break-words whitespace-pre-wrap">
              {entry.comment}
            </p>
          ) : null}
          <p className="text-muted-foreground/70 text-xs">
            Updated {entry.updatedLabel}
          </p>
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
  const { downToBay, atBay, working } = useMemo(
    () => ({
      downToBay: entries.filter((e) => e.status === "down_to_bay"),
      atBay: entries.filter((e) => e.status === "at_bay"),
      working: entries.filter((e) => e.status === "working"),
    }),
    [entries],
  );

  // "At a bay" people grouped by floor (8 → 11).
  const atBayByFloor = useMemo(
    () =>
      FLOORS.map((f) => ({
        floor: f,
        people: atBay.filter((e) => e.floor === f),
      })).filter((g) => g.people.length > 0),
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
    <div className="flex flex-col gap-6">
      {downToBay.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeader
            emoji={STATUS_EMOJI.down_to_bay}
            label={STATUS_LABELS.down_to_bay}
            count={downToBay.length}
            dotClass="bg-emerald-500"
          />
          <ul className="flex flex-col gap-2">
            {downToBay.map((entry, i) => (
              <PersonRow key={entry.id} entry={entry} index={i} />
            ))}
          </ul>
        </section>
      ) : null}

      {atBay.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeader
            emoji={STATUS_EMOJI.at_bay}
            label={STATUS_LABELS.at_bay}
            count={atBay.length}
            dotClass="bg-primary"
          />
          {atBayByFloor.map((group) => (
            <div key={group.floor} className="flex flex-col gap-2">
              <h4 className="text-muted-foreground text-sm font-semibold">
                🏢 Floor {group.floor}
              </h4>
              <ul className="flex flex-col gap-2">
                {group.people.map((entry, i) => (
                  <PersonRow key={entry.id} entry={entry} index={i} />
                ))}
              </ul>
            </div>
          ))}
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
          <ul className="flex flex-col gap-2">
            {working.map((entry, i) => (
              <PersonRow key={entry.id} entry={entry} index={i} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
