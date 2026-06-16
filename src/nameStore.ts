import type { MementoLike } from "./types";

const KEY = "sessionNames";

/** Persists user-assigned custom names (sessionId -> name) in a VSCode Memento. */
export class NameStore {
  constructor(private readonly memento: MementoLike) {}

  private map(): Record<string, string> {
    return this.memento.get<Record<string, string>>(KEY, {});
  }
  all(): Record<string, string> {
    return this.map();
  }
  get(sessionId: string): string | undefined {
    return this.map()[sessionId];
  }
  async set(sessionId: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (trimmed === "") { await this.clear(sessionId); return; }
    await this.memento.update(KEY, { ...this.map(), [sessionId]: trimmed });
  }
  async clear(sessionId: string): Promise<void> {
    const next = { ...this.map() };
    delete next[sessionId];
    await this.memento.update(KEY, next);
  }
}
