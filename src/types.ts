export interface SessionMeta {
  sessionId: string;   // jsonl filename without extension (uuid)
  mtimeMs: number;     // file last-modified, for sorting/relative time
  title: string;       // first human prompt, or fallback
  filePath: string;    // absolute path to the .jsonl transcript
}

export interface SessionGroup {
  key: string;            // "pinned" | "today" | "yesterday" | "prev7" | "prev30" | "older"
  label: string;          // human-facing group header
  items: SessionMeta[];   // mtime desc
}

export interface MementoLike {
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: unknown): Thenable<void>;
}
