import { describe, it, expect } from "vitest";
import { buildGroups, bucketOf } from "../src/sessionsModel";
import type { SessionMeta } from "../src/types";

const s = (id: string, mtimeMs: number): SessionMeta => ({ sessionId: id, mtimeMs, title: id });

describe("buildGroups", () => {
  const sessions = [s("a", 300), s("b", 200), s("c", 100)]; // already mtime desc

  it("puts pinned ids into the pinned group, rest into recent, both mtime desc", () => {
    const g = buildGroups(sessions, new Set(["b"]));
    expect(g.pinned.map((x) => x.sessionId)).toEqual(["b"]);
    expect(g.recent.map((x) => x.sessionId)).toEqual(["a", "c"]);
  });

  it("keeps mtime-desc ordering within the pinned group", () => {
    const g = buildGroups(sessions, new Set(["c", "a"]));
    expect(g.pinned.map((x) => x.sessionId)).toEqual(["a", "c"]);
  });

  it("ignores pinned ids that no longer exist", () => {
    const g = buildGroups(sessions, new Set(["zzz"]));
    expect(g.pinned).toEqual([]);
    expect(g.recent.map((x) => x.sessionId)).toEqual(["a", "b", "c"]);
  });

  it("handles empty input", () => {
    const g = buildGroups([], new Set<string>());
    expect(g).toEqual({ pinned: [], recent: [] });
  });
});

describe("bucketOf", () => {
  // Local-midnight today, derived the same way the implementation does — TZ-independent.
  const now = new Date(2026, 5, 16, 15, 0, 0).getTime();
  const startOfToday = new Date(2026, 5, 16, 0, 0, 0, 0).getTime();
  const DAY = 86_400_000;

  it("classifies today (including future)", () => {
    expect(bucketOf(startOfToday, now)).toBe("today");
    expect(bucketOf(now + DAY, now)).toBe("today");
  });
  it("classifies yesterday", () => {
    expect(bucketOf(startOfToday - 1, now)).toBe("yesterday");
    expect(bucketOf(startOfToday - DAY, now)).toBe("yesterday");
  });
  it("classifies previous 7 days", () => {
    expect(bucketOf(startOfToday - DAY - 1, now)).toBe("prev7");
    expect(bucketOf(startOfToday - 7 * DAY, now)).toBe("prev7");
  });
  it("classifies previous 30 days", () => {
    expect(bucketOf(startOfToday - 7 * DAY - 1, now)).toBe("prev30");
    expect(bucketOf(startOfToday - 30 * DAY, now)).toBe("prev30");
  });
  it("classifies older", () => {
    expect(bucketOf(startOfToday - 30 * DAY - 1, now)).toBe("older");
  });
});
