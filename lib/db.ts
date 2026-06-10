import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import {
  type Bay,
  type Floor,
  type SeatEntry,
  isBay,
  isFloor,
} from "@/lib/types";

let client: NeonQueryFunction<false, false> | null = null;

/**
 * Lazily creates the Neon client. We don't throw at import time so that
 * `next build` can analyze the module without DATABASE_URL present; the error
 * only surfaces if a query actually runs without a connection string.
 */
function getSql(): NeonQueryFunction<false, false> {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and add your Postgres connection string.",
      );
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

/** Shape of a row as it comes back from Postgres (snake_case). */
interface SeatEntryRow {
  id: string;
  name: string;
  floor: number;
  bay: string;
  created_at: string | Date;
  local_date: string | Date;
  owner_hash: string | null;
  comment: string | null;
}

function mapRow(row: SeatEntryRow): SeatEntry {
  // floor/bay are NOT NULL in the schema, but fall back defensively just in case.
  const floor = isFloor(row.floor) ? row.floor : (8 as Floor);
  const bay = isBay(row.bay) ? row.bay : ("N" as Bay);
  return {
    id: String(row.id),
    name: row.name,
    floor,
    bay,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    localDate: String(row.local_date),
    ownerHash: row.owner_hash,
    comment: row.comment,
  };
}

/** Everyone checked in for the given local date, newest first. */
export async function getEntriesForDate(
  localDate: string,
): Promise<SeatEntry[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, floor, bay, created_at, local_date, owner_hash, comment
    FROM seat_entries
    WHERE local_date = ${localDate}
    ORDER BY created_at DESC
  `) as SeatEntryRow[];
  return rows.map(mapRow);
}

export interface AddEntryInput {
  name: string;
  floor: Floor;
  bay: Bay;
  localDate: string;
  /** sha256 of the creator's per-browser token, or null if none was provided. */
  ownerHash: string | null;
  /** Optional free-text note, or null if none. */
  comment: string | null;
}

export type AddEntryResult =
  | { status: "created"; entry: SeatEntry }
  | { status: "duplicate" };

/**
 * Checks a person in for today. If the same name (case-insensitive) is already
 * checked in for the day, no row is inserted and `duplicate` is returned.
 */
export async function addEntry(input: AddEntryInput): Promise<AddEntryResult> {
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO seat_entries (name, floor, bay, local_date, owner_hash, comment)
    VALUES (
      ${input.name},
      ${input.floor},
      ${input.bay},
      ${input.localDate},
      ${input.ownerHash},
      ${input.comment}
    )
    ON CONFLICT (local_date, lower(name)) DO NOTHING
    RETURNING id, name, floor, bay, created_at, local_date, owner_hash, comment
  `) as SeatEntryRow[];

  if (rows.length === 0) {
    return { status: "duplicate" };
  }
  return { status: "created", entry: mapRow(rows[0]) };
}

/**
 * Removes an entry only if the supplied owner hash matches the one stored on the
 * row. Returns the deleted row's local_date (so the caller can attribute the
 * deletion to the right day), or null if nothing matched (wrong owner, missing
 * id, or a legacy row with no owner — `= NULL` never matches).
 */
export async function deleteEntry(
  id: string,
  ownerHash: string,
): Promise<string | null> {
  const sql = getSql();
  const rows = (await sql`
    DELETE FROM seat_entries
    WHERE id = ${id} AND owner_hash = ${ownerHash}
    RETURNING local_date
  `) as { local_date: string | Date }[];
  return rows.length > 0 ? String(rows[0].local_date) : null;
}

/** Bumps the `created` counter for the given day. Best-effort; never throws. */
export async function incrementCreated(localDate: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO daily_stats (local_date, created) VALUES (${localDate}, 1)
    ON CONFLICT (local_date) DO UPDATE SET created = daily_stats.created + 1
  `;
}

/** Bumps the `deleted` counter for the given day. Best-effort; never throws. */
export async function incrementDeleted(localDate: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO daily_stats (local_date, deleted) VALUES (${localDate}, 1)
    ON CONFLICT (local_date) DO UPDATE SET deleted = daily_stats.deleted + 1
  `;
}

export interface DailyStat {
  localDate: string;
  created: number;
  deleted: number;
  cleared: number | null;
  finalizedAt: string | null;
}

interface DailyStatRow {
  local_date: string | Date;
  created: number;
  deleted: number;
  cleared: number | null;
  finalized_at: string | Date | null;
}

/** All daily stats, newest day first. */
export async function getDailyStats(): Promise<DailyStat[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT local_date, created, deleted, cleared, finalized_at
    FROM daily_stats
    ORDER BY local_date DESC
  `) as DailyStatRow[];
  return rows.map((r) => ({
    localDate: String(r.local_date),
    created: Number(r.created),
    deleted: Number(r.deleted),
    cleared: r.cleared === null ? null : Number(r.cleared),
    finalizedAt:
      r.finalized_at === null
        ? null
        : r.finalized_at instanceof Date
          ? r.finalized_at.toISOString()
          : String(r.finalized_at),
  }));
}

export interface ClearedDay {
  localDate: string;
  cleared: number;
}

/**
 * Clears every day before `today` that hasn't been finalized yet: deletes the
 * day's leftover rows, records the count as `cleared`, and stamps finalized_at.
 * Catches up multiple days at once, so a missed cron run self-heals on the next.
 * Returns what it cleared. Idempotent — already-finalized days are skipped.
 */
export async function clearPastDays(today: string): Promise<ClearedDay[]> {
  const sql = getSql();

  // Candidate days: any past day with leftover rows, plus any past stats row not
  // yet finalized (covers days where users deleted everything before midnight).
  const dateRows = (await sql`
    SELECT DISTINCT d FROM (
      SELECT local_date AS d FROM seat_entries WHERE local_date < ${today}
      UNION
      SELECT local_date AS d FROM daily_stats
        WHERE local_date < ${today} AND finalized_at IS NULL
    ) candidates
    ORDER BY d
  `) as { d: string | Date }[];

  const cleared: ClearedDay[] = [];
  for (const { d } of dateRows) {
    const day = String(d);
    const result = (await sql`
      WITH del AS (
        DELETE FROM seat_entries WHERE local_date = ${day} RETURNING id
      )
      INSERT INTO daily_stats (local_date, cleared, finalized_at)
        VALUES (${day}, (SELECT count(*) FROM del), now())
      ON CONFLICT (local_date) DO UPDATE
        SET cleared = (SELECT count(*) FROM del), finalized_at = now()
        WHERE daily_stats.finalized_at IS NULL
      RETURNING cleared
    `) as { cleared: number }[];
    if (result.length > 0) {
      cleared.push({ localDate: day, cleared: Number(result[0].cleared) });
    }
  }
  return cleared;
}
