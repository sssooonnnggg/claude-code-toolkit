import { describe, it, expect } from "vitest";
import { displayName } from "../src/display";
import { sessionLabel } from "../src/display";
import { NameStore } from "../src/nameStore";
import { PinStore } from "../src/pinStore";
import { EmojiStore, ColorStore, GroupStore } from "../src/sessionStores";
import type { SessionStores } from "../src/sessionStores";
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

function makeStores(): SessionStores {
  const m = fakeMemento();
  return {
    pins: new PinStore(m),
    names: new NameStore(m),
    emojis: new EmojiStore(m),
    colors: new ColorStore(m),
    groups: new GroupStore(m),
  };
}

describe("sessionLabel", () => {
  it("plain name when no decorations", () => {
    expect(sessionLabel(meta(), makeStores())).toBe("Auto title");
  });
  it("prepends emoji", async () => {
    const stores = makeStores();
    await stores.emojis.set("id1", "🎯");
    expect(sessionLabel(meta(), stores)).toBe("🎯 Auto title");
  });
  it("prepends color dot", async () => {
    const stores = makeStores();
    await stores.colors.set("id1", "🔴");
    expect(sessionLabel(meta(), stores)).toBe("🔴 Auto title");
  });
  it("prepends color then emoji", async () => {
    const stores = makeStores();
    await stores.colors.set("id1", "🔴");
    await stores.emojis.set("id1", "🎯");
    expect(sessionLabel(meta(), stores)).toBe("🔴🎯 Auto title");
  });
  it("uses the custom name with decorations", async () => {
    const stores = makeStores();
    await stores.names.set("id1", "My session");
    await stores.colors.set("id1", "🔵");
    expect(sessionLabel(meta(), stores)).toBe("🔵 My session");
  });
});
