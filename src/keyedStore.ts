import type { MementoLike } from "./types";

/** Persists a sessionId -> string map under a single Memento key. */
export class KeyedStore {
  constructor(private readonly memento: MementoLike, private readonly key: string) {}

  private map(): Record<string, string> {
    return this.memento.get<Record<string, string>>(this.key, {});
  }
  all(): Record<string, string> {
    return this.map();
  }
  get(id: string): string | undefined {
    return this.map()[id];
  }
  async set(id: string, value: string): Promise<void> {
    const trimmed = value.trim();
    if (trimmed === "") { await this.clear(id); return; }
    await this.memento.update(this.key, { ...this.map(), [id]: trimmed });
  }
  async clear(id: string): Promise<void> {
    const next = { ...this.map() };
    delete next[id];
    await this.memento.update(this.key, next);
  }
}
