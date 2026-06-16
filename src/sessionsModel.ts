import type { SessionMeta, SessionGroup } from "./types";

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

const DATE_GROUPS: { key: DateBucket; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "prev7", label: "Previous 7 Days" },
  { key: "prev30", label: "Previous 30 Days" },
  { key: "older", label: "Older" },
];

/**
 * Build an ordered list of groups: a Pinned group first (if any), then non-empty
 * date buckets in fixed order. Pinned sessions never appear in date buckets.
 * Items within every group are mtime-descending.
 */
export function buildGroups(sessions: SessionMeta[], pinned: Set<string>, nowMs: number): SessionGroup[] {
  const sorted = [...sessions].sort((a, b) => b.mtimeMs - a.mtimeMs);
  const groups: SessionGroup[] = [];

  const pinnedItems = sorted.filter((s) => pinned.has(s.sessionId));
  if (pinnedItems.length > 0) groups.push({ key: "pinned", label: "Pinned", items: pinnedItems });

  const rest = sorted.filter((s) => !pinned.has(s.sessionId));
  for (const { key, label } of DATE_GROUPS) {
    const items = rest.filter((s) => bucketOf(s.mtimeMs, nowMs) === key);
    if (items.length > 0) groups.push({ key, label, items });
  }
  return groups;
}
