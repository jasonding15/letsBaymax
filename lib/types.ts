export const ACTIVITY_PREFERENCES = ["indoors", "outdoors", "either"] as const;
export type ActivityPreference = (typeof ACTIVITY_PREFERENCES)[number];

export const DRINKING_PREFERENCES = ["yes", "no", "indifferent"] as const;
export type DrinkingPreference = (typeof DRINKING_PREFERENCES)[number];

export const MAX_NAME_LENGTH = 50;
export const MAX_COMMENT_LENGTH = 280;

/** A single person on the beach for a given local day. */
export interface BeachEntry {
  id: string;
  name: string;
  activityPreference: ActivityPreference | null;
  drinkingPreference: DrinkingPreference | null;
  createdAt: string;
  localDate: string;
  /** sha256 of the creator's per-browser token. null for legacy rows. */
  ownerHash: string | null;
  /** Optional free-text note shown on the list. null if none. */
  comment: string | null;
}

/** Human-friendly labels for activity preferences (shown as badges after submit). */
export const ACTIVITY_LABELS: Record<ActivityPreference, string> = {
  indoors: "Indoors",
  outdoors: "Outdoors",
  either: "Indoors or outdoors",
};

/** Human-friendly labels for drinking preferences (shown as badges after submit). */
export const DRINKING_LABELS: Record<DrinkingPreference, string> = {
  yes: "Down to drink",
  no: "Prefers not to drink",
  indifferent: "Indifferent on drinking",
};

export function isActivityPreference(
  value: unknown,
): value is ActivityPreference {
  return (
    typeof value === "string" &&
    (ACTIVITY_PREFERENCES as readonly string[]).includes(value)
  );
}

export function isDrinkingPreference(
  value: unknown,
): value is DrinkingPreference {
  return (
    typeof value === "string" &&
    (DRINKING_PREFERENCES as readonly string[]).includes(value)
  );
}
