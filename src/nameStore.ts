import type { MementoLike } from "./types";
import { KeyedStore } from "./keyedStore";

/** Persists user-assigned custom names (sessionId -> name). */
export class NameStore extends KeyedStore {
  constructor(memento: MementoLike) {
    super(memento, "sessionNames");
  }
}
