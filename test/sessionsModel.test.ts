import { describe, it, expect } from "vitest";
import { buildGroups, bucketOf } from "../src/sessionsModel";
import type { SessionMeta } from "../src/types";

const now = new Date(2026, 5, 16, 15, 0, 0).getTime();
const startOfToday = new Date(2026, 5, 16, 0, 0, 0, 0).getTime();
const DAY = 86_400_000;

const s = (id: string, mtimeMs: number): SessionMeta =>
  ({ sessionId: id, mtimeMs, title: id, filePath: `/p/${id}.jsonl` });

describe("buildGroups", () => {
  it("puts pinned into a Pinned group first, mtime desc, excluded from date groups", () => {
    const sessions = [s("a", startOfToday + 10), s("b", startOfToday + 20)];
    const g = buildGroups(sessions, new Set(["a"]), now);
    expect(g[0].key).toBe("pinned");
    expect(g[0].items.map((x) => x.sessionId)).toEqual(["a"]);
    // "b" is today and not pinned
    expect(g[1].key).toBe("today");
    expect(g[1].items.map((x) => x.sessionId)).toEqual(["b"]);
  });

  it("orders date groups today/yesterday/prev7/prev30/older and omits empty ones", () => {
    const sessions = [
      s("today", startOfToday + 5),
      s("yd", startOfToday - DAY),
      s("old", startOfToday - 60 * DAY),
    ];
    const g = buildGroups(sessions, new Set<string>(), now);
    expect(g.map((x) => x.key)).toEqual(["today", "yesterday", "older"]);
    expect(g.map((x) => x.label)).toEqual(["Today", "Yesterday", "Older"]);
  });

  it("sorts items within a group mtime desc", () => {
    const sessions = [s("a", startOfToday + 1), s("b", startOfToday + 3), s("c", startOfToday + 2)];
    const g = buildGroups(sessions, new Set<string>(), now);
    expect(g[0].key).toBe("today");
    expect(g[0].items.map((x) => x.sessionId)).toEqual(["b", "c", "a"]);
  });

  it("returns [] for no sessions", () => {
    expect(buildGroups([], new Set<string>(), now)).toEqual([]);
  });
});

describe("bucketOf", () => {
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
