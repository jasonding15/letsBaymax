-- whosbeAChed database schema
-- Apply with: npm run db:setup  (or paste into the Neon SQL editor)

CREATE TABLE IF NOT EXISTS beach_entries (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                TEXT        NOT NULL,
  activity_preference TEXT,        -- 'indoors' | 'outdoors' | 'either' | NULL
  drinking_preference TEXT,        -- 'yes' | 'no' | 'indifferent' | NULL
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  local_date          DATE        NOT NULL,
  owner_hash          TEXT,        -- sha256 of the creator's per-browser token; NULL for legacy rows
  comment             TEXT         -- optional free-text note shown on the list; NULL if none
);

-- Migrations for tables created before these columns existed.
ALTER TABLE beach_entries ADD COLUMN IF NOT EXISTS owner_hash TEXT;
ALTER TABLE beach_entries ADD COLUMN IF NOT EXISTS comment TEXT;

-- One entry per name per day (case-insensitive). Also powers ON CONFLICT DO NOTHING.
CREATE UNIQUE INDEX IF NOT EXISTS beach_entries_day_name_unique
  ON beach_entries (local_date, lower(name));

-- Fast lookups for "who's on the beach today".
CREATE INDEX IF NOT EXISTS beach_entries_local_date_idx
  ON beach_entries (local_date);

-- Per-day stats. `created` and `deleted` are counted live as users act; `cleared`
-- is filled in by the daily cron when it removes the day's leftover rows.
-- Invariant once finalized: cleared = created - deleted.
CREATE TABLE IF NOT EXISTS daily_stats (
  local_date   DATE PRIMARY KEY,
  created      INTEGER     NOT NULL DEFAULT 0,  -- entries added that day
  deleted      INTEGER     NOT NULL DEFAULT 0,  -- entries removed by users that day
  cleared      INTEGER,                          -- leftovers removed at day's end; NULL until finalized
  finalized_at TIMESTAMPTZ                       -- when the daily cron cleared the day
);

-- One-time seed so existing rows count toward their day's `created` total. Safe to
-- re-run: ON CONFLICT DO NOTHING means already-tracked days are left untouched.
INSERT INTO daily_stats (local_date, created)
  SELECT local_date, count(*) FROM beach_entries GROUP BY local_date
  ON CONFLICT (local_date) DO NOTHING;
