import Image from "next/image";
import Link from "next/link";

import { getDailyStats } from "@/lib/db";
import { getFriendlyDate, getLocalDate } from "@/lib/date";

// Read fresh every load — these numbers change as people add/remove entries.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stats · let's Baymax",
};

export default async function StatsPage() {
  // Render gracefully even if the DB isn't reachable yet.
  let stats: Awaited<ReturnType<typeof getDailyStats>> = [];
  try {
    stats = await getDailyStats();
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
  const today = getLocalDate();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← Back to let&apos;s Baymax
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">📊 Daily stats</h1>
        <p className="text-muted-foreground text-sm">
          For each day: how many entries were <strong>created</strong>, how many
          were <strong>deleted</strong> by people, and how many leftovers got{" "}
          <strong>cleared</strong> at day&apos;s end. When a day is finalized,{" "}
          <code>created − deleted</code> should equal <code>cleared</code>.
        </p>
      </header>

      {stats.length === 0 ? (
        <div className="bg-card/50 flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
          <div className="relative h-36 w-36">
            <Image
              src="/baymax.png"
              alt="Baymax"
              fill
              className="object-contain"
            />
          </div>
          <p className="mt-3 font-medium">No stats yet.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Numbers show up here once people start checking in.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Created</th>
                <th className="px-4 py-3 text-right font-semibold">Deleted</th>
                <th className="px-4 py-3 text-right font-semibold">Cleared</th>
                <th className="px-4 py-3 text-right font-semibold">Check</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const isToday = s.localDate === today;
                const expected = s.created - s.deleted;
                const finalized = s.cleared !== null;
                const matches = finalized && s.cleared === expected;
                return (
                  <tr key={s.localDate} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {s.localDate}
                      {isToday ? (
                        <span className="text-primary ml-2 text-xs font-semibold">
                          (today)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {s.created}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {s.deleted}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {finalized ? (
                        s.cleared
                      ) : (
                        <span className="text-muted-foreground" title="Not cleared yet">
                          — ({expected} live)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!finalized ? (
                        <span className="text-muted-foreground">pending</span>
                      ) : matches ? (
                        <span title="created − deleted = cleared">✅</span>
                      ) : (
                        <span title={`expected ${expected}`}>⚠️ {expected}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-muted-foreground/70 text-xs">
        As of {getFriendlyDate()} (NYC time). Days are cleared automatically
        overnight.
      </p>
    </main>
  );
}
