import { NextResponse } from "next/server";

import { getLocalDate } from "@/lib/date";
import { clearPastDays } from "@/lib/db";

// Always run fresh; never cache this endpoint.
export const dynamic = "force-dynamic";

/**
 * Daily cleanup. Vercel Cron hits this once a day (see vercel.json); it clears
 * every day before "today" (NYC time) that hasn't been finalized, recording each
 * day's leftover count as `cleared`. Because it catches up all past days, a
 * missed or DST-shifted run self-heals on the next invocation.
 *
 * If CRON_SECRET is set, the request must carry `Authorization: Bearer <secret>`
 * (Vercel Cron sends this automatically when the env var exists).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const today = getLocalDate();
  try {
    const cleared = await clearPastDays(today);
    const total = cleared.reduce((sum, d) => sum + d.cleared, 0);
    return NextResponse.json({ ok: true, today, total, cleared });
  } catch (error) {
    console.error("daily-reset cron failed:", error);
    return NextResponse.json(
      { ok: false, error: "daily-reset failed" },
      { status: 500 },
    );
  }
}
