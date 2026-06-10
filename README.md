# letsbaymax

> ⚠️ **This is a template/skeleton** cloned from the *whosbeAChed* app. The beach
> branding below is kept as a **working reference** — see **[`TEMPLATE_NOTES.md`](./TEMPLATE_NOTES.md)**
> for the full list of placeholders (`{{...}}` / `TODO:`) and project-specific things to
> update (database, GitHub repo, Vercel project, contact name/org). The docs below still
> describe the original beach app.

---

## 🏖️ whosbeAChed (reference app)

A tiny private utility for consulting friends. **"On the beach"** means *unstaffed /
available*. Add yourself to today's public beach list, see who else is free, and let the
list reset itself automatically at midnight.

- No login, no verification — anyone with the URL can add or remove entries (fine for v1).
- The visible list only shows entries for the **current local day**, so it "resets" at
  midnight just by filtering. No destructive cron job required.
- Timezone-aware (defaults to `America/Chicago`).

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Neon Postgres**,
and deploys cleanly on **Vercel**.

---

## Features

- **Add yourself** with a name (required), an optional **Activity** preference
  (Indoors / Outdoors / Either), and an optional **Drinking** preference (Yes / No / Indifferent).
- **Live-feeling list** of everyone beached today, with a count and an empty state.
- **Duplicate protection** — the same name can't be added twice in one day (case-insensitive).
- **Delete** any entry with a small trash button.
- Clean, playful, mobile-friendly beach-themed UI.

---

## Tech stack

| Concern   | Choice |
|-----------|--------|
| Framework | Next.js App Router + React 19 + TypeScript |
| Styling   | Tailwind CSS v4 + shadcn/ui (new-york) |
| Data      | Neon serverless Postgres via `@neondatabase/serverless` |
| Server    | Server Actions (`app/actions.ts`) |
| Hosting   | Vercel |

> **Why Neon and not Vercel Postgres?** Vercel Postgres has been sunset; Neon Postgres is the
> drop-in serverless Postgres offered through the Vercel Marketplace. The code is plain SQL, so
> any standard Postgres connection string (Supabase, Railway, local, etc.) works too.

---

## Project structure

```
app/
  layout.tsx        Root layout, fonts, <Toaster/>
  page.tsx          Home page — reads today's list, renders form + list
  actions.ts        Server actions: addBeachEntry / removeBeachEntry (+ validation)
  globals.css       Tailwind v4 + theme tokens (beachy palette)
components/
  beach-form.tsx    Add-yourself form (client) -> server action -> toast
  beach-list.tsx    The list, count, tags, empty state (server)
  delete-button.tsx Per-row delete (client)
  ui/               shadcn/ui components (button, input, label, select, card, badge, sonner)
lib/
  db.ts             Neon client + getEntriesForDate / addEntry / deleteEntry
  date.ts           Timezone + "today" (YYYY-MM-DD) helpers
  types.ts          BeachEntry + preference enums and labels
  utils.ts          cn() helper
db/
  schema.sql        Table + indexes
scripts/
  setup-db.ts       Applies schema.sql to DATABASE_URL (npm run db:setup)
```

---

## Database schema

```sql
CREATE TABLE IF NOT EXISTS beach_entries (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                TEXT        NOT NULL,
  activity_preference TEXT,        -- 'indoors' | 'outdoors' | 'either' | NULL
  drinking_preference TEXT,        -- 'yes' | 'no' | 'indifferent' | NULL
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  local_date          DATE        NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS beach_entries_day_name_unique
  ON beach_entries (local_date, lower(name));   -- one name per day (case-insensitive)

CREATE INDEX IF NOT EXISTS beach_entries_local_date_idx
  ON beach_entries (local_date);
```

The full file lives in [`db/schema.sql`](./db/schema.sql).

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get a Postgres database

**Option A — Neon (recommended):** create a free project at <https://neon.tech> and copy the
connection string (it looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).

**Option B — Vercel Marketplace:** in your Vercel project go to **Storage → Neon Postgres**,
provision it, and Vercel will inject `DATABASE_URL` automatically (see Deploy below).

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
APP_TIMEZONE="America/Chicago"   # optional; this is the default
```

| Variable       | Required | Default          | Description |
|----------------|----------|------------------|-------------|
| `DATABASE_URL` | ✅       | —                | Postgres connection string |
| `APP_TIMEZONE` | ❌       | `America/Chicago`| IANA timezone used to decide what "today" is |

### 4. Create the table

```bash
npm run db:setup
```

This applies `db/schema.sql`. (Alternatively, paste the SQL into the Neon SQL editor.)

### 5. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo (framework auto-detected as Next.js).
3. Add the database:
   - **Easiest:** Project → **Storage → Neon Postgres → Connect**. Vercel sets `DATABASE_URL`
     for you across Production/Preview/Development.
   - Or add `DATABASE_URL` manually under **Settings → Environment Variables**.
4. (Optional) Add `APP_TIMEZONE` if you don't want `America/Chicago`.
5. Apply the schema once against the production database:
   ```bash
   # locally, with the production DATABASE_URL in .env.local
   npm run db:setup
   ```
   …or paste `db/schema.sql` into the Neon SQL editor.
6. **Deploy.** Done.

> No cron job is needed — the list resets simply because the home page queries
> `WHERE local_date = <today>`. If you ever want to purge old rows to keep the table tidy,
> add a daily Vercel Cron that runs `DELETE FROM beach_entries WHERE local_date < <today>`.
> It's optional and off by default.

---

## How the daily reset works

`lib/date.ts` computes the current local date as a `YYYY-MM-DD` string in `APP_TIMEZONE`
using `Intl.DateTimeFormat('en-CA', { timeZone })`. Each new entry stores that string in
`local_date`, and the home page only fetches rows matching today's value. At local midnight,
"today" changes, so the previous day's entries silently drop off the list (they remain in the
database for history unless you choose to purge them).

---

## Notes & edge cases handled

- Names are trimmed; blank names are rejected; max length is 50 characters.
- Optional preferences default to "No preference" and are stored as `NULL`.
- Exact duplicate names per day are prevented via a unique index + `ON CONFLICT DO NOTHING`,
  surfaced as a friendly message rather than an error.
- Database errors are caught and shown as a non-crashing toast.
- Since there's no auth, anyone can delete entries — acceptable for a small friend-group tool.
