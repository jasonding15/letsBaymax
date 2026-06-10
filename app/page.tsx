import { OfficeDecorations } from "@/components/office-decorations";
import { SeatForm } from "@/components/seat-form";
import { SeatList } from "@/components/seat-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEntriesForDate } from "@/lib/db";
import { getFriendlyDate, getLocalDate } from "@/lib/date";

// Always read fresh from the DB so the list reflects today's check-ins.
export const dynamic = "force-dynamic";

export default async function Home() {
  const today = getLocalDate();
  // Don't hard-crash the page if the DB isn't reachable yet (e.g. before the new
  // database is set up) — just show the empty state.
  let entries: Awaited<ReturnType<typeof getEntriesForDate>> = [];
  try {
    entries = await getEntriesForDate(today);
  } catch (error) {
    console.error("Failed to load entries:", error);
  }
  const count = entries.length;

  return (
    <>
      <OfficeDecorations />
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="flex items-center gap-2 text-4xl font-extrabold tracking-tight drop-shadow-sm sm:text-5xl">
            <span aria-hidden>🏢</span>
            <span>
              lets<span className="text-primary">Baymax</span>
            </span>
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-lg font-bold text-white shadow-md sm:text-xl">
            <span aria-hidden>📅</span>
            {getFriendlyDate()}
          </div>
          <p className="text-muted-foreground text-balance">
            Check in with your floor &amp; bay so the team can find you. Resets
            every night at midnight.
          </p>
        </header>

        <Card className="border-primary/30 gap-4 py-5 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Where are you sitting?</CardTitle>
            <CardDescription className="text-base">
              Drop your floor &amp; bay so others know where to find you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeatForm />
          </CardContent>
        </Card>

        {/* TODO: project-specific — set your contact name/handle. */}
        <p className="text-muted-foreground/80 -mt-1 text-center text-xs">
          Pls reach out to {`{{CONTACT_NAME}}`} if you find any bugs / have any
          suggestions!
        </p>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold">🧭 Who&apos;s where today</h2>
            {count === 0 ? (
              <span className="text-muted-foreground text-sm font-medium">
                Nobody yet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
                {count} {count === 1 ? "person" : "people"} in 🎉
              </span>
            )}
          </div>
          <SeatList entries={entries} />
        </section>

        <footer className="text-muted-foreground/70 mt-auto pt-4 text-center text-xs text-balance">
          Heads up: no logins here, so anyone with the link can see this. Let&apos;s
          keep it in the family — please don&apos;t share outside {`{{ORG}}`}. 🙂
        </footer>
      </main>
    </>
  );
}
