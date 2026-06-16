import type { MementoLike } from "./types";
import { KeyedStore } from "./keyedStore";
import { NameStore } from "./nameStore";
import { PinStore } from "./pinStore";

export class EmojiStore extends KeyedStore {
  constructor(memento: MementoLike) { super(memento, "sessionEmojis"); }
}
export class ColorStore extends KeyedStore {
  constructor(memento: MementoLike) { super(memento, "sessionColors"); }
}
export class GroupStore extends KeyedStore {
  constructor(memento: MementoLike) { super(memento, "sessionGroups"); }
}

/** All per-session stores, passed together to the tree and commands. */
export interface SessionStores {
  pins: PinStore;
  names: NameStore;
  emojis: EmojiStore;
  colors: ColorStore;
  groups: GroupStore;
}
