"use server";

import { revalidatePath } from "next/cache";
import {
  addEntry as dbAddEntry,
  deleteEntry as dbDeleteEntry,
  incrementCreated,
  incrementDeleted,
} from "@/lib/db";
import { getLocalDate } from "@/lib/date";
import { hashOwnerToken } from "@/lib/owner-server";
import {
  MAX_COMMENT_LENGTH,
  MAX_NAME_LENGTH,
  isActivityPreference,
  isDrinkingPreference,
} from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

/**
 * Adds the submitter to today's beach list.
 * Validates name (trimmed, non-empty, max length) and optional preferences.
 */
export async function addBeachEntry(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name) {
    return { ok: false, message: "Please enter a name." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }

  const rawActivity = formData.get("activityPreference");
  const rawDrinking = formData.get("drinkingPreference");
  const activityPreference = isActivityPreference(rawActivity)
    ? rawActivity
    : null;
  const drinkingPreference = isDrinkingPreference(rawDrinking)
    ? rawDrinking
    : null;

  const rawComment = formData.get("comment");
  const trimmedComment =
    typeof rawComment === "string" ? rawComment.trim() : "";
  if (trimmedComment.length > MAX_COMMENT_LENGTH) {
    return {
      ok: false,
      message: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`,
    };
  }
  const comment = trimmedComment || null;

  const rawOwnerToken = formData.get("ownerToken");
  const ownerToken =
    typeof rawOwnerToken === "string" ? rawOwnerToken.trim() : "";
  const ownerHash = ownerToken ? hashOwnerToken(ownerToken) : null;

  const localDate = getLocalDate();

  try {
    const result = await dbAddEntry({
      name,
      activityPreference,
      drinkingPreference,
      localDate,
      ownerHash,
      comment,
    });

    if (result.status === "duplicate") {
      return {
        ok: false,
        message: `"${name}" is already on the beach today 🏖️`,
      };
    }

    // Stats are best-effort: a counter hiccup must never block adding to the list.
    try {
      await incrementCreated(localDate);
    } catch (statsError) {
      console.error("incrementCreated failed:", statsError);
    }

    revalidatePath("/");
    return { ok: true, message: `${name} is on the beach! 🏖️` };
  } catch (error) {
    console.error("addBeachEntry failed:", error);
    return {
      ok: false,
      message: "Something went wrong saving your spot. Please try again.",
    };
  }
}

/**
 * Removes an entry, but only if the caller's per-browser token hashes to the
 * owner_hash stored on the row. This is a friction layer, not real auth.
 */
export async function removeBeachEntry(
  id: string,
  ownerToken: string,
): Promise<ActionResult> {
  if (!id) {
    return { ok: false, message: "Missing entry id." };
  }
  if (!ownerToken) {
    return {
      ok: false,
      message: "You can only remove entries you added on this device.",
    };
  }
  try {
    const deletedDate = await dbDeleteEntry(id, hashOwnerToken(ownerToken));
    if (!deletedDate) {
      return {
        ok: false,
        message: "You can only remove entries you added on this device.",
      };
    }

    // Best-effort: attribute the delete to the entry's own day for stats.
    try {
      await incrementDeleted(deletedDate);
    } catch (statsError) {
      console.error("incrementDeleted failed:", statsError);
    }

    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("removeBeachEntry failed:", error);
    return { ok: false, message: "Could not remove that entry." };
  }
}
