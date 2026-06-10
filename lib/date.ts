/**
 * Timezone used to decide what "today" means. The visible beach list filters by
 * this local date, so the list effectively resets at local midnight.
 * Defaults to America/Chicago; override with APP_TIMEZONE.
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Chicago";

/**
 * Returns the local calendar date as a `YYYY-MM-DD` string for the given
 * timezone. `en-CA` formats dates as ISO `YYYY-MM-DD`.
 */
export function getLocalDate(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** A friendly, human-readable version of today's date (e.g. "Sunday, June 7"). */
export function getFriendlyDate(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * A short clock time in the app timezone (e.g. "2:45 PM"). Formatted server-side
 * so every viewer sees the same time regardless of their own timezone.
 */
export function getFriendlyTime(
  date: Date | string,
  timeZone: string = APP_TIMEZONE,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
