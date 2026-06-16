import type { MementoLike } from "./types";

const KEY = "pinnedSessions";

/** Persists the set of pinned session ids in a VSCode Memento (or any MementoLike). */
export class PinStore {
  constructor(private readonly memento: MementoLike) {}

  list(): string[] {
    return this.memento.get<string[]>(KEY, []);
  }
  has(sessionId: string): boolean {
    return this.list().includes(sessionId);
  }
  async pin(sessionId: string): Promise<void> {
    if (this.has(sessionId)) return;
    await this.memento.update(KEY, [...this.list(), sessionId]);
  }
  async unpin(sessionId: string): Promise<void> {
    await this.memento.update(KEY, this.list().filter((id) => id !== sessionId));
  }
  async toggle(sessionId: string): Promise<void> {
    if (this.has(sessionId)) await this.unpin(sessionId);
    else await this.pin(sessionId);
  }
}
