const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR, WEEK = 7 * DAY, MONTH = 30 * DAY, YEAR = 365 * DAY;

/** Short human duration like "5m", "1d", "3w", "2mo", "1y". */
export function formatRelative(mtimeMs: number, nowMs: number): string {
  const d = Math.max(0, nowMs - mtimeMs);
  if (d < MIN) return "now";
  if (d < HOUR) return `${Math.floor(d / MIN)}m`;
  if (d < DAY) return `${Math.floor(d / HOUR)}h`;
  if (d < WEEK) return `${Math.floor(d / DAY)}d`;
  if (d < MONTH) return `${Math.floor(d / WEEK)}w`;
  if (d < YEAR) return `${Math.floor(d / MONTH)}mo`;
  return `${Math.floor(d / YEAR)}y`;
}
