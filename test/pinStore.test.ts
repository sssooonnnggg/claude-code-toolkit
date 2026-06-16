import { describe, it, expect, beforeEach } from "vitest";
import { PinStore } from "../src/pinStore";
import type { MementoLike } from "../src/types";

function fakeMemento(): MementoLike {
  const map = new Map<string, unknown>();
  return {
    get<T>(key: string, def: T): T { return map.has(key) ? (map.get(key) as T) : def; },
    update(key: string, value: unknown): Thenable<void> { map.set(key, value); return Promise.resolve(); },
  };
}

describe("PinStore", () => {
  let store: PinStore;
  beforeEach(() => { store = new PinStore(fakeMemento()); });

  it("starts empty", () => {
    expect(store.list()).toEqual([]);
    expect(store.has("a")).toBe(false);
  });
  it("pins and reports membership", async () => {
    await store.pin("a");
    expect(store.has("a")).toBe(true);
    expect(store.list()).toEqual(["a"]);
  });
  it("does not duplicate on double pin", async () => {
    await store.pin("a"); await store.pin("a");
    expect(store.list()).toEqual(["a"]);
  });
  it("unpins", async () => {
    await store.pin("a"); await store.unpin("a");
    expect(store.has("a")).toBe(false);
  });
  it("toggles", async () => {
    await store.toggle("a");
    expect(store.has("a")).toBe(true);
    await store.toggle("a");
    expect(store.has("a")).toBe(false);
  });
  it("persists across instances sharing a memento", async () => {
    const m = fakeMemento();
    await new PinStore(m).pin("x");
    expect(new PinStore(m).has("x")).toBe(true);
  });
});
