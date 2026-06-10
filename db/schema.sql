-- letsBaymax database schema
-- Apply with: npm run db:setup  (or paste into the Neon SQL editor)

CREATE TABLE IF NOT EXISTS seat_entries (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'at_bay',  -- 'working' | 'down_to_bay' | 'at_bay'
  floor       INTEGER,                                 -- set only when status = 'at_bay' (8..11)
  bay         TEXT,                                    -- set only when status = 'at_bay' ('N'|'S'|'E'|'W')
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  local_date  DATE        NOT NULL,
  owner_hash  TEXT,                                    -- sha256 of the creator's per-browser token
  comment     TEXT                                     -- optional free-text note; NULL if none
);

-- Migrations for tables created before `status` / nullable floor+bay existed.
ALTER TABLE seat_entries ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'at_bay';
ALTER TABLE seat_entries ALTER COLUMN floor DROP NOT NULL;
ALTER TABLE seat_entries ALTER COLUMN bay   DROP NOT NULL;

-- Identity is the per-browser owner token, not the name: one check-in per browser
-- per day, so resubmitting (even with a different name) updates your one entry.
-- Drop the old name-based rule if it exists.
DROP INDEX IF EXISTS seat_entries_day_name_unique;

-- Collapse any pre-existing duplicates for the same owner+day (keep the latest)
-- so the unique index below can be created. Anonymous rows (NULL owner) are left.
DELETE FROM seat_entries a USING seat_entries b
  WHERE a.owner_hash IS NOT NULL
    AND a.local_date = b.local_date
    AND a.owner_hash = b.owner_hash
    AND (a.created_at, a.id) < (b.created_at, b.id);

-- One check-in per browser token per day. Powers ON CONFLICT DO UPDATE.
-- NULL owner_hash (no token) rows are exempt — Postgres treats NULLs as distinct.
CREATE UNIQUE INDEX IF NOT EXISTS seat_entries_day_owner_unique
  ON seat_entries (local_date, owner_hash);

-- Fast lookups for "who's in today".
CREATE INDEX IF NOT EXISTS seat_entries_local_date_idx
  ON seat_entries (local_date);

-- Per-day stats. `created` and `deleted` are counted live as users act; `cleared`
-- is filled in by the daily cron when it removes the day's leftover rows.
-- Invariant once finalized: cleared = created - deleted.
CREATE TABLE IF NOT EXISTS daily_stats (
  local_date   DATE PRIMARY KEY,
  created      INTEGER     NOT NULL DEFAULT 0,  -- check-ins added that day
  deleted      INTEGER     NOT NULL DEFAULT 0,  -- check-ins removed by users that day
  cleared      INTEGER,                          -- leftovers removed at day's end; NULL until finalized
  finalized_at TIMESTAMPTZ                       -- when the daily cron cleared the day
);

-- One-time seed so existing rows count toward their day's `created` total.
INSERT INTO daily_stats (local_date, created)
  SELECT local_date, count(*) FROM seat_entries GROUP BY local_date
  ON CONFLICT (local_date) DO NOTHING;
