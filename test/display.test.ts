import { describe, it, expect } from "vitest";
import { displayName } from "../src/display";
import { NameStore } from "../src/nameStore";
import type { MementoLike, SessionMeta } from "../src/types";

function fakeMemento(): MementoLike {
  const map = new Map<string, unknown>();
  return {
    get<T>(key: string, def: T): T { return map.has(key) ? (map.get(key) as T) : def; },
    update(key: string, value: unknown): Thenable<void> { map.set(key, value); return Promise.resolve(); },
  };
}

const meta = (over: Partial<SessionMeta> = {}): SessionMeta =>
  ({ sessionId: "id1", mtimeMs: 1, title: "Auto title", filePath: "/p/id1.jsonl", ...over });

describe("displayName", () => {
  it("prefers the custom name", async () => {
    const names = new NameStore(fakeMemento());
    await names.set("id1", "My name");
    expect(displayName(meta(), names)).toBe("My name");
  });
  it("falls back to the auto title when there is no custom name", () => {
    expect(displayName(meta(), new NameStore(fakeMemento()))).toBe("Auto title");
  });
  it("falls back to the session id when title is empty", () => {
    expect(displayName(meta({ title: "" }), new NameStore(fakeMemento()))).toBe("id1");
  });
});
