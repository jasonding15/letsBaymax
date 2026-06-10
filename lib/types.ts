// Office layout: a square building, floors 8–11, with bays on each side.
export const FLOORS = [8, 9, 10, 11] as const;
export type Floor = (typeof FLOORS)[number];

export const BAYS = ["N", "S", "E", "W"] as const;
export type Bay = (typeof BAYS)[number];

export const MAX_NAME_LENGTH = 50;
export const MAX_COMMENT_LENGTH = 280;

/** A single person checked in to a seat for a given local day. */
export interface SeatEntry {
  id: string;
  name: string;
  floor: Floor;
  bay: Bay;
  createdAt: string;
  localDate: string;
  /** sha256 of the creator's per-browser token. null for legacy rows. */
  ownerHash: string | null;
  /** Optional free-text note shown on the list. null if none. */
  comment: string | null;
}

/** Full-word labels for bays. */
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
