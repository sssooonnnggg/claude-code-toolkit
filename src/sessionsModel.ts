import type { SessionMeta, SessionGroups } from "./types";

export type DateBucket = "today" | "yesterday" | "prev7" | "prev30" | "older";

const DAY_MS = 86_400_000;

/** Classify a file mtime into a date bucket relative to nowMs (local calendar day). */
export function bucketOf(mtimeMs: number, nowMs: number): DateBucket {
  const d = new Date(nowMs);
  const startOfToday = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (mtimeMs >= startOfToday) return "today";
  if (mtimeMs >= startOfToday - DAY_MS) return "yesterday";
  if (mtimeMs >= startOfToday - 7 * DAY_MS) return "prev7";
  if (mtimeMs >= startOfToday - 30 * DAY_MS) return "prev30";
  return "older";
}

/** Split sessions into pinned vs recent, re-sorting each group mtime-desc. */
export function buildGroups(sessions: SessionMeta[], pinned: Set<string>): SessionGroups {
  const sorted = [...sessions].sort((a, b) => b.mtimeMs - a.mtimeMs);
  return {
    pinned: sorted.filter((s) => pinned.has(s.sessionId)),
    recent: sorted.filter((s) => !pinned.has(s.sessionId)),
  };
}
