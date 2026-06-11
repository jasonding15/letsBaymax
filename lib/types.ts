// Office layout: a square building, floors 8–11, with bays on each side.
export const FLOORS = [8, 9, 10, 11] as const;
export type Floor = (typeof FLOORS)[number];

export const BAYS = ["N", "S", "E", "W"] as const;
export type Bay = (typeof BAYS)[number];

// Tenure buckets (Bain ACs, plus a catch-all).
export const TENURES = ["AC1", "AC2", "Other"] as const;
export type Tenure = (typeof TENURES)[number];

// Availability through the day. Only `at_bay` carries a floor + bay.
export const STATUSES = ["working", "down_to_bay", "at_bay"] as const;
export type Status = (typeof STATUSES)[number];

export const MAX_NAME_LENGTH = 50;
export const MAX_COMMENT_LENGTH = 280;

/** A single person's current status for a given local day. */
export interface SeatEntry {
  id: string;
  name: string;
  tenure: Tenure | null;
  status: Status;
  /** Set only when status is "at_bay". */
  floor: Floor | null;
  /** Set only when status is "at_bay". */
  bay: Bay | null;
  createdAt: string;
  localDate: string;
  /** sha256 of the creator's per-browser token. null for legacy rows. */
  ownerHash: string | null;
  /** Optional free-text note shown on the list. null if none. */
  comment: string | null;
}

export const STATUS_LABELS: Record<Status, string> = {
  working: "Teammaxxing",
  down_to_bay: "Down to bay",
  at_bay: "At a bay",
};

export const STATUS_EMOJI: Record<Status, string> = {
  working: "💻",
  down_to_bay: "🙋",
  at_bay: "📍",
};

/** Short helper text shown under each status option. */
export const STATUS_HINTS: Record<Status, string> = {
  working: "Heads down and locked in — not at a bay",
  down_to_bay: "Free and down to hang, not there yet",
  at_bay: "Actually at a bay right now",
};

export const BAY_LABELS: Record<Bay, string> = {
  N: "North",
  S: "South",
  E: "East",
  W: "West",
};

/** A directional arrow per bay, used as a little visual cue. */
export const BAY_EMOJI: Record<Bay, string> = {
  N: "⬆️",
  S: "⬇️",
  E: "➡️",
  W: "⬅️",
};

export function isFloor(value: unknown): value is Floor {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && (FLOORS as readonly number[]).includes(n);
}

export function isBay(value: unknown): value is Bay {
  return typeof value === "string" && (BAYS as readonly string[]).includes(value);
}

export function isTenure(value: unknown): value is Tenure {
  return (
    typeof value === "string" && (TENURES as readonly string[]).includes(value)
  );
}

export function isStatus(value: unknown): value is Status {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
  );
}
