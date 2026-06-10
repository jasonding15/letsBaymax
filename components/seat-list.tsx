"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/utils";
import {
  BAYS,
  BAY_EMOJI,
  BAY_LABELS,
  FLOORS,
  type Bay,
  type Floor,
  type SeatEntry,
} from "@/lib/types";

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
  return trimmed ? trimmed.charAt(0).toUpperCase() : "🪑";
}

/** A pill-style filter row: an "All" option plus one chip per value. */
function FilterRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (v: T | null) => void;
  render: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground mr-1 text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
      <FilterChip active={value === null} onClick={() => onChange(null)}>
        All
      </FilterChip>
      {options.map((opt) => (
        <FilterChip
          key={String(opt)}
          active={value === opt}
          onClick={() => onChange(value === opt ? null : opt)}
        >
          {render(opt)}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PersonRow({ entry, index }: { entry: SeatEntry; index: number }) {
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
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {BAY_EMOJI[entry.bay]} {BAY_LABELS[entry.bay]} bay
            </Badge>
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
  );
}

export function SeatList({ entries }: { entries: SeatEntry[] }) {
  const [floor, setFloor] = useState<Floor | null>(null);
  const [bay, setBay] = useState<Bay | null>(null);

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (floor === null || e.floor === floor) &&
          (bay === null || e.bay === bay),
      ),
    [entries, floor, bay],
  );

  // Group the filtered people by floor (8 → 11), newest-first within each floor.
  const groups = useMemo(
    () =>
      FLOORS.map((f) => ({
        floor: f,
        people: filtered.filter((e) => e.floor === f),
      })).filter((g) => g.people.length > 0),
    [filtered],
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed bg-card/50 px-6 py-12 text-center">
        <p className="text-4xl">🏢</p>
        <p className="mt-3 font-semibold">No one&apos;s checked in yet today.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Be the first — tell everyone where you&apos;re sitting! 🪑
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted/30 flex flex-col gap-2 rounded-xl border border-dashed p-3">
        <FilterRow
          label="Floor"
          options={FLOORS}
          value={floor}
          onChange={setFloor}
          render={(f) => String(f)}
        />
        <FilterRow
          label="Bay"
          options={BAYS}
          value={bay}
          onChange={setBay}
          render={(b) => `${BAY_EMOJI[b]} ${BAY_LABELS[b]}`}
        />
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 px-6 py-10 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 font-medium">No one here right now.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Nobody matches that filter — try a different floor or bay.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.floor} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-bold">🏢 Floor {group.floor}</h3>
              <span className="text-muted-foreground text-sm">
                {group.people.length}{" "}
                {group.people.length === 1 ? "person" : "people"}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {group.people.map((entry, i) => (
                <PersonRow key={entry.id} entry={entry} index={i} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
