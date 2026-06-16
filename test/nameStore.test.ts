import { describe, it, expect, beforeEach } from "vitest";
import { NameStore } from "../src/nameStore";
import type { MementoLike } from "../src/types";

function fakeMemento(): MementoLike {
  const map = new Map<string, unknown>();
  return {
    get<T>(key: string, def: T): T { return map.has(key) ? (map.get(key) as T) : def; },
    update(key: string, value: unknown): Thenable<void> { map.set(key, value); return Promise.resolve(); },
  };
}

describe("NameStore", () => {
  let store: NameStore;
  beforeEach(() => { store = new NameStore(fakeMemento()); });

  it("returns undefined for an unset id", () => {
    expect(store.get("a")).toBeUndefined();
  });
  it("sets and gets a name (trimmed)", async () => {
    await store.set("a", "  My session  ");
    expect(store.get("a")).toBe("My session");
  });
  it("treats an empty/whitespace name as clear", async () => {
    await store.set("a", "x");
    await store.set("a", "   ");
    expect(store.get("a")).toBeUndefined();
  });
  it("clears a name", async () => {
    await store.set("a", "x");
    await store.clear("a");
    expect(store.get("a")).toBeUndefined();
  });
  it("exposes all names", async () => {
    await store.set("a", "x");
    await store.set("b", "y");
    expect(store.all()).toEqual({ a: "x", b: "y" });
  });
  it("persists across instances sharing a memento", async () => {
    const m = fakeMemento();
    await new NameStore(m).set("a", "x");
    expect(new NameStore(m).get("a")).toBe("x");
  });
});
