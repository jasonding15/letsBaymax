# letsbaymax — template setup notes

This project was cloned from **whosbeAChed** as a skeleton. The reusable mechanics
are intact (Next.js App Router + Neon Postgres + Server Actions, per-browser delete
ownership, daily stats, and the daily-reset cron). The **beach UI is kept as a
working reference** — swap it for your own app as you go.

Below is every project-specific thing that was turned into a placeholder, plus the
beach branding you'll likely want to replace. Search the repo for `{{` or `TODO:`
to jump to each spot.

## 1. Infrastructure (placeholders to fill)

| What | Where | Placeholder / action |
|------|-------|----------------------|
| **Database** | `.env.local` → `DATABASE_URL` | Paste your new Neon/Postgres connection string. Then run `npm run db:setup`. |
| **Timezone** | `.env.local` → `APP_TIMEZONE` | Defaults to `America/New_York`. Change if needed. |
| **Cron secret** (optional) | `.env.local` → `CRON_SECRET` | Uncomment + set to protect the daily-reset endpoint. Also add it in Vercel. |
| **GitHub repo** | `git remote` | Currently a placeholder: `https://github.com/YOUR_USERNAME/letsbaymax.git`. Create the repo, then `git remote set-url origin <real-url>` and push. |
| **Vercel project** | Vercel dashboard | Not linked yet. Import the new GitHub repo at vercel.com/new and add `DATABASE_URL` (+ `APP_TIMEZONE`, optional `CRON_SECRET`) as env vars. |

## 2. Identity / copy (placeholders left in code)

| What | File | Placeholder |
|------|------|-------------|
| App name (browser tab) | `app/layout.tsx` | `title: "letsbaymax"` — rename to taste. |
| App description | `app/layout.tsx` | `{{APP_DESCRIPTION}}` |
| Contact line | `app/page.tsx` | `{{CONTACT_NAME}}` |
| "Don't share outside ___" | `app/page.tsx` (footer) | `{{ORG}}` |
| Package name | `package.json` | `letsbaymax` |

## 3. Beach branding kept as reference (replace when ready)

These were intentionally **left as-is** so you have a working example to adapt:

- Visible title `who's beAChed?` and the 🏖️ emoji — `app/page.tsx` (`<h1>`).
- Beach theme colors/gradients — `app/globals.css`.
- Side gutter decorations (palm, shell, crab…) — `components/beach-decorations.tsx`.
- Form copy, chips, and labels — `components/beach-form.tsx`, `lib/types.ts`.
- Component/file names use `beach-*` and the DB tables are `beach_entries` /
  `daily_stats`. Rename if your domain differs (and update `db/schema.sql`,
  `lib/db.ts`, and imports together).
- App icon — `app/icon.svg`.

## 4. First run

```bash
npm install
# fill DATABASE_URL in .env.local first
npm run db:setup     # creates the tables
npm run dev          # http://localhost:3000
```

The `/stats` page and the `/api/cron/daily-reset` endpoint carry over unchanged.
