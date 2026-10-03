export type ExpiryStatus = "none" | "ok" | "due" | "expired";

export type ExpiryState = { status: ExpiryStatus; daysLeft: number | null; warnDay: number | null };

/**
 * Where a qualification sits against its warning thresholds (e.g. 60 and 30
 * days). `today` and `expiresOn` are venue-local ISO dates (YYYY-MM-DD).
 */
export function expiryState(expiresOn: string | null, today: string, warnDays: readonly number[]): ExpiryState {
  if (!expiresOn) return { status: "none", daysLeft: null, warnDay: null };
  const daysLeft = Math.round((Date.parse(`${expiresOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (daysLeft < 0) return { status: "expired", daysLeft, warnDay: null };
  const crossed = [...warnDays].sort((a, b) => a - b).find((d) => daysLeft <= d) ?? null;
  return { status: crossed === null ? "ok" : "due", daysLeft, warnDay: crossed };
}

/** Today's date in a venue's timezone, as YYYY-MM-DD. */
export function venueToday(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
