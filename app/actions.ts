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
  BAY_LABELS,
  MAX_COMMENT_LENGTH,
  MAX_NAME_LENGTH,
  STATUS_LABELS,
  isBay,
  isFloor,
  isStatus,
  type Bay,
  type Floor,
} from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

/**
 * Checks the submitter in (or updates them) with a status for today. When the
 * status is "at_bay", a valid floor + bay are required; otherwise they're ignored.
 */
export async function addSeatEntry(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name) {
    return { ok: false, message: "Please enter your name." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }

  const rawStatus = formData.get("status");
  if (!isStatus(rawStatus)) {
    return { ok: false, message: "Please pick your status." };
  }
  const status = rawStatus;

  // Floor + bay only apply when actually at a bay.
  let floor: Floor | null = null;
  let bay: Bay | null = null;
  if (status === "at_bay") {
    const rawFloor = formData.get("floor");
    const rawBay = formData.get("bay");
    if (!isFloor(rawFloor)) {
      return { ok: false, message: "Please pick your floor (8–11)." };
    }
    if (!isBay(rawBay)) {
      return { ok: false, message: "Please pick your bay (N/S/E/W)." };
    }
    floor = Number(rawFloor) as Floor;
    bay = rawBay;
  }

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
      status,
      floor,
      bay,
      localDate,
      ownerHash,
      comment,
    });

    // Only count brand-new check-ins toward the daily `created` stat, not updates.
    if (result.outcome === "created") {
      try {
        await incrementCreated(localDate);
      } catch (statsError) {
        console.error("incrementCreated failed:", statsError);
      }
    }

    const where =
      status === "at_bay" && floor && bay
        ? `Floor ${floor} · ${BAY_LABELS[bay]}`
        : STATUS_LABELS[status];
    const verb = result.outcome === "created" ? "checked in" : "updated";

    revalidatePath("/");
    return {
      ok: true,
      message: `${name} ${verb} — ${where}!`,
    };
  } catch (error) {
    console.error("addSeatEntry failed:", error);
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
export async function removeSeatEntry(
  id: string,
  ownerToken: string,
): Promise<ActionResult> {
  if (!id) {
    return { ok: false, message: "Missing entry id." };
  }
  if (!ownerToken) {
    return {
      ok: false,
      message: "You can only remove check-ins you added on this device.",
    };
  }
  try {
    const deletedDate = await dbDeleteEntry(id, hashOwnerToken(ownerToken));
    if (!deletedDate) {
      return {
        ok: false,
        message: "You can only remove check-ins you added on this device.",
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
    console.error("removeSeatEntry failed:", error);
    return { ok: false, message: "Could not remove that check-in." };
  }
}
