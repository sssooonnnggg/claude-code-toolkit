import { describe, it, expect } from "vitest";
import { buildGroups } from "../src/sessionsModel";
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
