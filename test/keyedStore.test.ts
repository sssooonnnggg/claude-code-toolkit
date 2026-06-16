import { describe, it, expect, beforeEach } from "vitest";
import { KeyedStore } from "../src/keyedStore";
import type { MementoLike } from "../src/types";

function fakeMemento(): MementoLike {
  const map = new Map<string, unknown>();
  return {
    get<T>(key: string, def: T): T { return map.has(key) ? (map.get(key) as T) : def; },
    update(key: string, value: unknown): Thenable<void> { map.set(key, value); return Promise.resolve(); },
  };
}

describe("KeyedStore", () => {
  let store: KeyedStore;
  beforeEach(() => { store = new KeyedStore(fakeMemento(), "k"); });

  it("returns undefined for an unset id", () => { expect(store.get("a")).toBeUndefined(); });
  it("sets and gets a trimmed value", async () => { await store.set("a", "  x  "); expect(store.get("a")).toBe("x"); });
  it("treats empty/whitespace as clear", async () => { await store.set("a", "x"); await store.set("a", "  "); expect(store.get("a")).toBeUndefined(); });
  it("clears", async () => { await store.set("a", "x"); await store.clear("a"); expect(store.get("a")).toBeUndefined(); });
  it("exposes all", async () => { await store.set("a", "x"); await store.set("b", "y"); expect(store.all()).toEqual({ a: "x", b: "y" }); });
  it("isolates by key on the same memento", async () => {
    const m = fakeMemento();
    await new KeyedStore(m, "k1").set("a", "1");
    expect(new KeyedStore(m, "k2").get("a")).toBeUndefined();
  });
  it("persists across instances", async () => {
    const m = fakeMemento();
    await new KeyedStore(m, "k").set("a", "1");
    expect(new KeyedStore(m, "k").get("a")).toBe("1");
  });
});
