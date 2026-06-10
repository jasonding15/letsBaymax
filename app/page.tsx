import { BeachDecorations } from "@/components/beach-decorations";
import { BeachForm } from "@/components/beach-form";
import { BeachList } from "@/components/beach-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEntriesForDate } from "@/lib/db";
import { getFriendlyDate, getLocalDate } from "@/lib/date";

// Always read fresh from the DB so the list reflects today's entries.
export const dynamic = "force-dynamic";

export default async function Home() {
  const today = getLocalDate();
  const entries = await getEntriesForDate(today);
  const count = entries.length;

  return (
    <>
      <BeachDecorations />
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="flex items-center gap-2 text-4xl font-extrabold tracking-tight drop-shadow-sm sm:text-5xl">
            <span aria-hidden>🏖️</span>
            <span>
              who&apos;s be<span className="text-[#EE3224]">A</span>
              <span className="text-[#EE3224]">C</span>hed?
            </span>
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 px-5 py-2 text-lg font-bold text-white shadow-md sm:text-xl">
            <span aria-hidden>☀️</span>
            {getFriendlyDate()}
          </div>
          <p className="text-muted-foreground text-balance">
            Add yourself to today&apos;s beach and see who else is free. Resets
            every night at midnight.
          </p>
        </header>

        <Card className="border-primary/30 gap-4 py-5 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Unstaffed &amp; free to hang?</CardTitle>
            <CardDescription className="text-base">
              Drop your name so others know you&apos;re around.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BeachForm />
          </CardContent>
        </Card>

        {/* TODO: project-specific — set your contact name/handle. */}
        <p className="text-muted-foreground/80 -mt-1 text-center text-xs">
          Pls reach out to {`{{CONTACT_NAME}}`} if you find any bugs / have any
          suggestions!
        </p>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold">🏖️ On the beach today</h2>
            {count === 0 ? (
              <span className="text-muted-foreground text-sm font-medium">
                Nobody yet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
                {count} {count === 1 ? "friend" : "friends"} 🎉
              </span>
            )}
          </div>
          <BeachList entries={entries} />
        </section>

        <footer className="text-muted-foreground/70 mt-auto pt-4 text-center text-xs text-balance">
          Heads up: no logins here, so anyone with the link can see this. Let&apos;s
          keep it in the family — please don&apos;t share outside {`{{ORG}}`}. 🙂
        </footer>
      </main>
    </>
  );
}
