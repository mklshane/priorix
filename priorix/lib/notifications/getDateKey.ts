/**
 * Returns the UTC date as a YYYY-MM-DD string.
 * Used as the idempotency key scope for notification logs.
 */
export function getDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Returns a Date set to the start of today in UTC (midnight). */
export function getStartOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
