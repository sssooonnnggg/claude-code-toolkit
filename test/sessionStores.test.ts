import { describe, it, expect } from "vitest";
import { EmojiStore, ColorStore, GroupStore } from "../src/sessionStores";
import type { MementoLike } from "../src/types";

function fakeMemento(): MementoLike {
  const map = new Map<string, unknown>();
  return {
    get<T>(key: string, def: T): T { return map.has(key) ? (map.get(key) as T) : def; },
    update(key: string, value: unknown): Thenable<void> { map.set(key, value); return Promise.resolve(); },
  };
}

describe("attribute stores", () => {
  it("each store uses a distinct key (no collision on one memento)", async () => {
    const m = fakeMemento();
    const emojis = new EmojiStore(m);
    const colors = new ColorStore(m);
    const groups = new GroupStore(m);
    await emojis.set("a", "🎯");
    await colors.set("a", "🔴");
    await groups.set("a", "Work");
    expect(emojis.get("a")).toBe("🎯");
    expect(colors.get("a")).toBe("🔴");
    expect(groups.get("a")).toBe("Work");
  });
});
