export interface SessionMeta {
  sessionId: string;   // jsonl filename without extension (uuid)
  mtimeMs: number;     // file last-modified, for sorting/relative time
  title: string;       // first human prompt, or fallback
}

export interface SessionGroups {
  pinned: SessionMeta[];  // mtime desc
  recent: SessionMeta[];  // mtime desc
}

export interface MementoLike {
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: unknown): Thenable<void>;
}
