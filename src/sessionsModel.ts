import type { SessionMeta, SessionGroups } from "./types";

/** Split sessions into pinned vs recent, re-sorting each group mtime-desc. */
export function buildGroups(sessions: SessionMeta[], pinned: Set<string>): SessionGroups {
  const sorted = [...sessions].sort((a, b) => b.mtimeMs - a.mtimeMs);
  return {
    pinned: sorted.filter((s) => pinned.has(s.sessionId)),
    recent: sorted.filter((s) => !pinned.has(s.sessionId)),
  };
}
