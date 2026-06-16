import type { SessionMeta, SessionGroups } from "./types";

/** Split sessions (assumed mtime-desc) into pinned vs recent, preserving order. */
export function buildGroups(sessions: SessionMeta[], pinned: Set<string>): SessionGroups {
  const sorted = [...sessions].sort((a, b) => b.mtimeMs - a.mtimeMs);
  return {
    pinned: sorted.filter((s) => pinned.has(s.sessionId)),
    recent: sorted.filter((s) => !pinned.has(s.sessionId)),
  };
}
