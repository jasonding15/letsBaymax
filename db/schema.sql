-- letsBaymax database schema
-- Apply with: npm run db:setup  (or paste into the Neon SQL editor)

CREATE TABLE IF NOT EXISTS seat_entries (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT        NOT NULL,
  floor       INTEGER     NOT NULL,   -- 8 | 9 | 10 | 11
  bay         TEXT        NOT NULL,   -- 'N' | 'S' | 'E' | 'W'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  local_date  DATE        NOT NULL,
  owner_hash  TEXT,                   -- sha256 of the creator's per-browser token; NULL for legacy rows
  comment     TEXT                    -- optional free-text note shown on the list; NULL if none
);

-- One check-in per name per day (case-insensitive). Also powers ON CONFLICT DO NOTHING.
CREATE UNIQUE INDEX IF NOT EXISTS seat_entries_day_name_unique
  ON seat_entries (local_date, lower(name));

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

-- One-time seed so existing rows count toward their day's `created` total. Safe to
-- re-run: ON CONFLICT DO NOTHING means already-tracked days are left untouched.
INSERT INTO daily_stats (local_date, created)
  SELECT local_date, count(*) FROM seat_entries GROUP BY local_date
  ON CONFLICT (local_date) DO NOTHING;
