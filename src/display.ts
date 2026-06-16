import type { SessionMeta } from "./types";
import type { NameStore } from "./nameStore";

/** The label shown for a session: custom name, else auto title, else its id. */
export function displayName(meta: SessionMeta, names: NameStore): string {
  return names.get(meta.sessionId) || meta.title || meta.sessionId;
}
