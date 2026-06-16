# Claude Session Pins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone VSCode extension that lists the current workspace's Claude Code sessions in a native sidebar tree and lets the user pin important ones to the top.

**Architecture:** Pure logic (path encoding, jsonl title extraction, pin set, grouping/sorting, relative time) lives in `vscode`-free modules unit-tested with Vitest. A thin VSCode adapter layer (TreeDataProvider, commands, activation) wires them to the UI and reuses the official `claude-vscode.editor.open` command to open a session. Pin state is stored in the extension's own `globalState`; no official files are touched.

**Tech Stack:** TypeScript, VSCode Extension API, esbuild (bundle), Vitest (unit tests), npm.

---

## File Structure

```
f:\P4\claude-extension\
  package.json              # manifest: views, commands, menus, scripts, deps
  tsconfig.json
  esbuild.js                # bundles src/extension.ts -> dist/extension.js
  vitest.config.ts
  .vscodeignore
  .gitignore
  media/pin.svg             # activity-bar icon
  src/
    types.ts                # SessionMeta, SessionGroups, MementoLike
    pathEncoder.ts          # encodeProjectDir(workspacePath) -> dir name   [pure]
    relativeTime.ts         # formatRelative(mtimeMs, nowMs) -> "5m"/"1d"    [pure]
    sessionScanner.ts       # titleOf(jsonlText), scanSessions(dir)          [fs, no vscode]
    pinStore.ts             # PinStore over MementoLike                       [no vscode]
    sessionsModel.ts        # buildGroups(sessions, pinnedSet)               [pure]
    treeProvider.ts         # SessionsTreeProvider                           [vscode adapter]
    commands.ts             # open/pin/unpin/refresh handlers                 [vscode adapter]
    extension.ts            # activate / deactivate                          [vscode adapter]
  test/
    pathEncoder.test.ts
    relativeTime.test.ts
    sessionScanner.test.ts
    pinStore.test.ts
    sessionsModel.test.ts
```

**Shared types (referenced by many tasks — defined in Task 2):**

```ts
// src/types.ts
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
```

---

## Task 1: Project scaffold + build pipeline

**Files:**
- Create: `package.json`, `tsconfig.json`, `esbuild.js`, `vitest.config.ts`, `.gitignore`, `.vscodeignore`, `media/pin.svg`, `src/extension.ts`

- [ ] **Step 1: Initialize git and create `.gitignore`**

Run: `git init f:/P4/claude-extension` (if not already a repo)

Create `.gitignore`:
```
node_modules/
dist/
*.vsix
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "claude-session-pins",
  "displayName": "Claude Session Pins",
  "description": "Pin important Claude Code sessions to the top of a sidebar list.",
  "version": "0.0.1",
  "publisher": "local",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "main": "./dist/extension.js",
  "activationEvents": ["onView:claudeSessionPinsView"],
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "claudeSessionPins",
          "title": "Claude Pins",
          "icon": "media/pin.svg"
        }
      ]
    },
    "views": {
      "claudeSessionPins": [
        { "id": "claudeSessionPinsView", "name": "Sessions" }
      ]
    },
    "commands": [
      { "command": "claudeSessionPins.refresh", "title": "Refresh", "icon": "$(refresh)" },
      { "command": "claudeSessionPins.open", "title": "Open Session" },
      { "command": "claudeSessionPins.pin", "title": "Pin", "icon": "$(pin)" },
      { "command": "claudeSessionPins.unpin", "title": "Unpin", "icon": "$(pinned)" }
    ],
    "menus": {
      "view/title": [
        { "command": "claudeSessionPins.refresh", "when": "view == claudeSessionPinsView", "group": "navigation" }
      ],
      "view/item/context": [
        { "command": "claudeSessionPins.pin", "when": "view == claudeSessionPinsView && viewItem == unpinnedSession", "group": "inline" },
        { "command": "claudeSessionPins.unpin", "when": "view == claudeSessionPinsView && viewItem == pinnedSession", "group": "inline" }
      ]
    }
  },
  "scripts": {
    "compile": "node esbuild.js",
    "watch": "node esbuild.js --watch",
    "test": "vitest run",
    "vscode:prepublish": "node esbuild.js --production"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.85.0",
    "esbuild": "^0.21.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2021"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 4: Create `esbuild.js`**

```js
const esbuild = require("esbuild");
const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node18",
    outfile: "dist/extension.js",
    external: ["vscode"],
    sourcemap: !production,
    minify: production,
  });
  if (watch) { await ctx.watch(); }
  else { await ctx.rebuild(); await ctx.dispose(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["test/**/*.test.ts"], environment: "node" },
});
```

- [ ] **Step 6: Create `.vscodeignore`**

```
src/**
test/**
node_modules/**
esbuild.js
vitest.config.ts
tsconfig.json
docs/**
**/*.map
```

- [ ] **Step 7: Create `media/pin.svg`** (monochrome, uses currentColor so VSCode themes it)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 1l-1 1 .75.75L5.5 7H3l2.25 2.25L2 12.5V14h1.5l3.25-3.25L9 13l3.25-3.75.75.75 1-1L9.5 1z"/></svg>
```

- [ ] **Step 8: Create minimal `src/extension.ts`**

```ts
import * as vscode from "vscode";

export function activate(_context: vscode.ExtensionContext): void {
  console.log("claude-session-pins activated");
}

export function deactivate(): void {}
```

- [ ] **Step 9: Install deps and build**

Run: `cd f:/P4/claude-extension && npm install && npm run compile`
Expected: `dist/extension.js` is produced with no errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold claude-session-pins extension"
```

---

## Task 2: Shared types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create `src/types.ts`** with the exact content from the "Shared types" block above.

- [ ] **Step 2: Type-check**

Run: `cd f:/P4/claude-extension && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared types"
```

---

## Task 3: pathEncoder

**Files:**
- Create: `src/pathEncoder.ts`
- Test: `test/pathEncoder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/pathEncoder.test.ts
import { describe, it, expect } from "vitest";
import { encodeProjectDir } from "../src/pathEncoder";

describe("encodeProjectDir", () => {
  it("replaces drive colon and backslashes with single dashes", () => {
    expect(encodeProjectDir("f:\\P4\\claude-extension")).toBe("f--P4-claude-extension");
  });
  it("preserves case of the drive letter", () => {
    expect(encodeProjectDir("F:\\P4\\w3\\Client")).toBe("F--P4-w3-Client");
  });
  it("handles forward slashes", () => {
    expect(encodeProjectDir("d:/P4/unity-mcp")).toBe("d--P4-unity-mcp");
  });
  it("does not collapse separators or alter existing hyphens", () => {
    expect(encodeProjectDir("f:\\a-b\\c")).toBe("f--a-b-c");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd f:/P4/claude-extension && npx vitest run test/pathEncoder.test.ts`
Expected: FAIL — cannot find module `../src/pathEncoder`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/pathEncoder.ts
/** Maps a workspace absolute path to its ~/.claude/projects subdirectory name. */
export function encodeProjectDir(workspacePath: string): string {
  return workspacePath.replace(/[:\\/]/g, "-");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd f:/P4/claude-extension && npx vitest run test/pathEncoder.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pathEncoder.ts test/pathEncoder.test.ts
git commit -m "feat: add project path encoder"
```

---

## Task 4: relativeTime

**Files:**
- Create: `src/relativeTime.ts`
- Test: `test/relativeTime.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/relativeTime.test.ts
import { describe, it, expect } from "vitest";
import { formatRelative } from "../src/relativeTime";

const now = 1_000_000_000_000;
const ago = (ms: number) => now - ms;
const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR, WEEK = 7 * DAY;

describe("formatRelative", () => {
  it("shows 'now' under a minute", () => {
    expect(formatRelative(ago(30 * SEC), now)).toBe("now");
  });
  it("shows minutes", () => {
    expect(formatRelative(ago(5 * MIN), now)).toBe("5m");
  });
  it("shows hours", () => {
    expect(formatRelative(ago(3 * HOUR), now)).toBe("3h");
  });
  it("shows days", () => {
    expect(formatRelative(ago(2 * DAY), now)).toBe("2d");
  });
  it("shows weeks", () => {
    expect(formatRelative(ago(3 * WEEK), now)).toBe("3w");
  });
  it("shows months beyond ~4 weeks", () => {
    expect(formatRelative(ago(60 * DAY), now)).toBe("2mo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd f:/P4/claude-extension && npx vitest run test/relativeTime.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/relativeTime.ts
const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR, WEEK = 7 * DAY, MONTH = 30 * DAY, YEAR = 365 * DAY;

/** Short human duration like "5m", "1d", "3w", "2mo", "1y". */
export function formatRelative(mtimeMs: number, nowMs: number): string {
  const d = Math.max(0, nowMs - mtimeMs);
  if (d < MIN) return "now";
  if (d < HOUR) return `${Math.floor(d / MIN)}m`;
  if (d < DAY) return `${Math.floor(d / HOUR)}h`;
  if (d < WEEK) return `${Math.floor(d / DAY)}d`;
  if (d < MONTH) return `${Math.floor(d / WEEK)}w`;
  if (d < YEAR) return `${Math.floor(d / MONTH)}mo`;
  return `${Math.floor(d / YEAR)}y`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd f:/P4/claude-extension && npx vitest run test/relativeTime.test.ts`
Expected: PASS (6 tests).

Note: 60 days / 30-day month = 2 → "2mo". 3 weeks = 21 days < 30 → "3w". Verified against test expectations.

- [ ] **Step 5: Commit**

```bash
git add src/relativeTime.ts test/relativeTime.test.ts
git commit -m "feat: add relative time formatter"
```

---

## Task 5: sessionScanner (title extraction + directory scan)

**Files:**
- Create: `src/sessionScanner.ts`
- Test: `test/sessionScanner.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/sessionScanner.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { titleOf, scanSessions } from "../src/sessionScanner";

function userText(text: string): string {
  return JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text }] } });
}
function userImage(): string {
  return JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "image", source: { type: "base64", data: "AAA" } }] } });
}
function assistant(text: string): string {
  return JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text }] } });
}

describe("titleOf", () => {
  it("returns the first human text prompt", () => {
    const jsonl = [userText("Add a pin feature"), assistant("Sure")].join("\n");
    expect(titleOf(jsonl)).toBe("Add a pin feature");
  });
  it("skips image-only and system-injected user messages", () => {
    const jsonl = [
      userImage(),
      userText("<ide_opened_file>some file</ide_opened_file>"),
      userText("<system-reminder>noise</system-reminder>"),
      userText("Real question here"),
    ].join("\n");
    expect(titleOf(jsonl)).toBe("Real question here");
  });
  it("collapses whitespace and truncates long titles", () => {
    const long = "word ".repeat(40).trim();
    const out = titleOf(userText(long));
    expect(out.length).toBeLessThanOrEqual(60);
  });
  it("tolerates malformed lines", () => {
    const jsonl = ["{not json", userText("After bad line")].join("\n");
    expect(titleOf(jsonl)).toBe("After bad line");
  });
  it("returns empty string when no human prompt exists", () => {
    expect(titleOf([userImage(), assistant("hi")].join("\n"))).toBe("");
  });
  it("handles string content (not array)", () => {
    const jsonl = JSON.stringify({ type: "user", message: { role: "user", content: "Plain string prompt" } });
    expect(titleOf(jsonl)).toBe("Plain string prompt");
  });
});

describe("scanSessions", () => {
  let dir: string;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "csp-")); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("returns [] for a missing directory", async () => {
    expect(await scanSessions(path.join(dir, "nope"))).toEqual([]);
  });

  it("reads sessions and sorts by mtime descending with fallback titles", async () => {
    const older = path.join(dir, "11111111-1111-1111-1111-111111111111.jsonl");
    const newer = path.join(dir, "22222222-2222-2222-2222-222222222222.jsonl");
    fs.writeFileSync(older, userText("Older session"));
    fs.writeFileSync(newer, userImage()); // no human text -> fallback title
    fs.utimesSync(older, new Date(1000), new Date(1000));
    fs.utimesSync(newer, new Date(2000), new Date(2000));

    const out = await scanSessions(dir);
    expect(out.map((s) => s.sessionId)).toEqual([
      "22222222-2222-2222-2222-222222222222",
      "11111111-1111-1111-1111-111111111111",
    ]);
    expect(out[1].title).toBe("Older session");
    expect(out[0].title).toContain("22222222"); // fallback includes short id
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd f:/P4/claude-extension && npx vitest run test/sessionScanner.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/sessionScanner.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { SessionMeta } from "./types";

const SYSTEM_PREFIXES = ["<ide_opened_file>", "<ide_selection>", "<system-reminder>", "<command-name>", "<command-message>", "<local-command-stdout>"];
const MAX_TITLE = 60;

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((c) => c && typeof c === "object" && (c as { type?: string }).type === "text")
      .map((c) => (c as { text?: string }).text ?? "")
      .join(" ");
  }
  return "";
}

function isSystemInjected(text: string): boolean {
  return SYSTEM_PREFIXES.some((p) => text.startsWith(p));
}

/** First human-typed prompt in a session transcript, or "" if none. */
export function titleOf(jsonlText: string): string {
  for (const line of jsonlText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj: any;
    try { obj = JSON.parse(trimmed); } catch { continue; }
    if (obj?.type !== "user" || obj?.message?.role !== "user") continue;
    const text = extractText(obj.message.content).replace(/\s+/g, " ").trim();
    if (!text || isSystemInjected(text)) continue;
    return text.length > MAX_TITLE ? text.slice(0, MAX_TITLE - 1) + "…" : text;
  }
  return "";
}

function fallbackTitle(sessionId: string): string {
  return `Session ${sessionId.slice(0, 8)}`;
}

/** Scan a ~/.claude/projects/<encoded> directory into session metadata, mtime desc. */
export async function scanSessions(projectsDir: string): Promise<SessionMeta[]> {
  let entries: string[];
  try { entries = await fs.readdir(projectsDir); }
  catch { return []; }

  const out: SessionMeta[] = [];
  for (const name of entries) {
    if (!name.endsWith(".jsonl")) continue;
    const sessionId = name.slice(0, -".jsonl".length);
    const full = path.join(projectsDir, name);
    try {
      const stat = await fs.stat(full);
      const text = await fs.readFile(full, "utf8");
      const title = titleOf(text) || fallbackTitle(sessionId);
      out.push({ sessionId, mtimeMs: stat.mtimeMs, title });
    } catch { /* skip unreadable file */ }
  }
  out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd f:/P4/claude-extension && npx vitest run test/sessionScanner.test.ts`
Expected: PASS (all `titleOf` + `scanSessions` tests).

- [ ] **Step 5: Commit**

```bash
git add src/sessionScanner.ts test/sessionScanner.test.ts
git commit -m "feat: add session scanner and title extraction"
```

---

## Task 6: PinStore

**Files:**
- Create: `src/pinStore.ts`
- Test: `test/pinStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/pinStore.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd f:/P4/claude-extension && npx vitest run test/pinStore.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/pinStore.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd f:/P4/claude-extension && npx vitest run test/pinStore.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pinStore.ts test/pinStore.test.ts
git commit -m "feat: add pin store"
```

---

## Task 7: sessionsModel (grouping)

**Files:**
- Create: `src/sessionsModel.ts`
- Test: `test/sessionsModel.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/sessionsModel.test.ts
import { describe, it, expect } from "vitest";
import { buildGroups } from "../src/sessionsModel";
import type { SessionMeta } from "../src/types";

const s = (id: string, mtimeMs: number): SessionMeta => ({ sessionId: id, mtimeMs, title: id });

describe("buildGroups", () => {
  const sessions = [s("a", 300), s("b", 200), s("c", 100)]; // already mtime desc

  it("puts pinned ids into the pinned group, rest into recent, both mtime desc", () => {
    const g = buildGroups(sessions, new Set(["b"]));
    expect(g.pinned.map((x) => x.sessionId)).toEqual(["b"]);
    expect(g.recent.map((x) => x.sessionId)).toEqual(["a", "c"]);
  });

  it("keeps mtime-desc ordering within the pinned group", () => {
    const g = buildGroups(sessions, new Set(["c", "a"]));
    expect(g.pinned.map((x) => x.sessionId)).toEqual(["a", "c"]);
  });

  it("ignores pinned ids that no longer exist", () => {
    const g = buildGroups(sessions, new Set(["zzz"]));
    expect(g.pinned).toEqual([]);
    expect(g.recent.map((x) => x.sessionId)).toEqual(["a", "b", "c"]);
  });

  it("handles empty input", () => {
    const g = buildGroups([], new Set<string>());
    expect(g).toEqual({ pinned: [], recent: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd f:/P4/claude-extension && npx vitest run test/sessionsModel.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/sessionsModel.ts
import type { SessionMeta, SessionGroups } from "./types";

/** Split sessions (assumed mtime-desc) into pinned vs recent, preserving order. */
export function buildGroups(sessions: SessionMeta[], pinned: Set<string>): SessionGroups {
  const sorted = [...sessions].sort((a, b) => b.mtimeMs - a.mtimeMs);
  return {
    pinned: sorted.filter((s) => pinned.has(s.sessionId)),
    recent: sorted.filter((s) => !pinned.has(s.sessionId)),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd f:/P4/claude-extension && npx vitest run test/sessionsModel.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/sessionsModel.ts test/sessionsModel.test.ts
git commit -m "feat: add session grouping model"
```

---

## Task 8: SessionsTreeProvider (VSCode adapter)

VSCode-dependent; validated by build + manual smoke (Task 11), not Vitest.

**Files:**
- Create: `src/treeProvider.ts`

- [ ] **Step 1: Write `src/treeProvider.ts`**

```ts
// src/treeProvider.ts
import * as vscode from "vscode";
import type { SessionMeta } from "./types";
import { buildGroups } from "./sessionsModel";
import { formatRelative } from "./relativeTime";
import { PinStore } from "./pinStore";

type Node =
  | { kind: "group"; label: string; children: SessionMeta[] }
  | { kind: "session"; meta: SessionMeta; pinned: boolean }
  | { kind: "empty"; label: string };

export class SessionsTreeProvider implements vscode.TreeDataProvider<Node> {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  constructor(
    private readonly load: () => Promise<SessionMeta[]>,
    private readonly pins: PinStore,
    private readonly now: () => number = () => Date.now(),
  ) {}

  refresh(): void { this._onDidChange.fire(); }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === "empty") {
      return new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
    }
    if (node.kind === "group") {
      const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Expanded);
      item.contextValue = "group";
      return item;
    }
    const item = new vscode.TreeItem(node.meta.title || node.meta.sessionId, vscode.TreeItemCollapsibleState.None);
    item.description = formatRelative(node.meta.mtimeMs, this.now());
    item.tooltip = `${node.meta.title}\n${node.meta.sessionId}`;
    item.contextValue = node.pinned ? "pinnedSession" : "unpinnedSession";
    item.iconPath = new vscode.ThemeIcon(node.pinned ? "pinned" : "comment-discussion");
    item.command = { command: "claudeSessionPins.open", title: "Open Session", arguments: [node.meta.sessionId] };
    return item;
  }

  async getChildren(node?: Node): Promise<Node[]> {
    if (node) {
      if (node.kind === "group") {
        const pinnedSet = new Set(this.pins.list());
        return node.children.map((meta) => ({ kind: "session", meta, pinned: pinnedSet.has(meta.sessionId) }));
      }
      return [];
    }
    const sessions = await this.load();
    if (sessions.length === 0) return [{ kind: "empty", label: "No sessions for this workspace" }];
    const groups = buildGroups(sessions, new Set(this.pins.list()));
    const roots: Node[] = [];
    if (groups.pinned.length > 0) roots.push({ kind: "group", label: "Pinned", children: groups.pinned });
    roots.push({ kind: "group", label: "Recent", children: groups.recent });
    return roots;
  }
}
```

- [ ] **Step 2: Type-check**

Run: `cd f:/P4/claude-extension && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/treeProvider.ts
git commit -m "feat: add sessions tree provider"
```

---

## Task 9: Commands (open with official-command reuse)

**Files:**
- Create: `src/commands.ts`

- [ ] **Step 1: Write `src/commands.ts`**

```ts
// src/commands.ts
import * as vscode from "vscode";
import { PinStore } from "./pinStore";
import { SessionsTreeProvider } from "./treeProvider";

const OFFICIAL_OPEN = "claude-vscode.editor.open";

/** Open a session by reusing the official Claude Code command. */
export async function openSession(sessionId: string): Promise<void> {
  try {
    await vscode.commands.executeCommand(OFFICIAL_OPEN, sessionId, undefined, vscode.ViewColumn.Active);
  } catch {
    void vscode.window.showErrorMessage(
      "Could not open the session. Make sure the official Claude Code extension is installed and enabled.",
    );
  }
}

export function registerCommands(
  context: vscode.ExtensionContext,
  pins: PinStore,
  provider: SessionsTreeProvider,
): void {
  const refresh = () => provider.refresh();
  context.subscriptions.push(
    vscode.commands.registerCommand("claudeSessionPins.open", (sessionId: string) => openSession(sessionId)),
    vscode.commands.registerCommand("claudeSessionPins.refresh", () => refresh()),
    vscode.commands.registerCommand("claudeSessionPins.pin", async (node: { meta?: { sessionId: string } }) => {
      if (node?.meta) { await pins.pin(node.meta.sessionId); refresh(); }
    }),
    vscode.commands.registerCommand("claudeSessionPins.unpin", async (node: { meta?: { sessionId: string } }) => {
      if (node?.meta) { await pins.unpin(node.meta.sessionId); refresh(); }
    }),
  );
}
```

Note: inline menu commands (`pin`/`unpin`) receive the tree **node** as their argument (the `{ kind: "session", meta, pinned }` object from the provider), so we read `node.meta.sessionId`. The `open` command is invoked via `TreeItem.command.arguments`, which we set to `[sessionId]` (a raw string) in the provider — hence its different signature.

- [ ] **Step 2: Type-check**

Run: `cd f:/P4/claude-extension && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/commands.ts
git commit -m "feat: add commands and official-open reuse"
```

---

## Task 10: Activation wiring + file watcher

**Files:**
- Modify: `src/extension.ts` (replace the Task 1 stub entirely)

- [ ] **Step 1: Replace `src/extension.ts`**

```ts
// src/extension.ts
import * as vscode from "vscode";
import * as os from "node:os";
import * as path from "node:path";
import { encodeProjectDir } from "./pathEncoder";
import { scanSessions } from "./sessionScanner";
import { PinStore } from "./pinStore";
import { SessionsTreeProvider } from "./treeProvider";
import { registerCommands } from "./commands";

function projectsDirFor(workspacePath: string): string {
  return path.join(os.homedir(), ".claude", "projects", encodeProjectDir(workspacePath));
}

export function activate(context: vscode.ExtensionContext): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  const dir = folder ? projectsDirFor(folder.uri.fsPath) : undefined;

  const pins = new PinStore(context.globalState);
  const provider = new SessionsTreeProvider(
    () => (dir ? scanSessions(dir) : Promise.resolve([])),
    pins,
  );

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("claudeSessionPinsView", provider),
  );
  registerCommands(context, pins, provider);

  if (dir) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(dir, "*.jsonl"),
    );
    watcher.onDidCreate(() => provider.refresh());
    watcher.onDidChange(() => provider.refresh());
    watcher.onDidDelete(() => provider.refresh());
    context.subscriptions.push(watcher);
  }
}

export function deactivate(): void {}
```

- [ ] **Step 2: Type-check and build**

Run: `cd f:/P4/claude-extension && npx tsc --noEmit && npm run compile`
Expected: no errors; `dist/extension.js` rebuilt.

- [ ] **Step 3: Run the full unit suite**

Run: `cd f:/P4/claude-extension && npm test`
Expected: all suites PASS (pathEncoder, relativeTime, sessionScanner, pinStore, sessionsModel).

- [ ] **Step 4: Commit**

```bash
git add src/extension.ts
git commit -m "feat: wire activation, tree view, and file watcher"
```

---

## Task 11: Manual smoke test (validates the official-open linchpin)

No code. Confirms the cross-extension open and the end-to-end UX. **This is where the design's stated spike risk (opening an arbitrary session via `claude-vscode.editor.open`) gets verified.**

- [ ] **Step 1: Launch the Extension Development Host**

In VSCode, open `f:\P4\claude-extension` and press F5 (Run Extension). A second VSCode window opens with the extension loaded. Open a workspace folder that has existing Claude sessions (e.g. `f:\P4\claude-extension` itself, which has sessions under `~/.claude/projects/f--P4-claude-extension`).

- [ ] **Step 2: Verify the list renders**

Click the "Claude Pins" icon in the activity bar. Expected: a "Recent" group listing sessions with readable titles and relative times. (No "Pinned" group yet.)

- [ ] **Step 3: Verify open**

Click a session row. Expected: the official Claude Code extension opens/resumes that session in an editor tab. If an error toast appears instead, confirm the official extension is installed/enabled and that the command id `claude-vscode.editor.open` still exists in its `package.json` (it may change across official versions — note any discrepancy).

- [ ] **Step 4: Verify pin/unpin + ordering**

Hover a row, click the inline pin icon. Expected: a "Pinned" group appears at the top containing that session; it stays on top regardless of recency. Click unpin; it returns to "Recent". Reload the window (Developer: Reload Window) and confirm the pin persisted.

- [ ] **Step 5: Verify auto-refresh**

In the dev-host workspace, send a message in a Claude session (updates its `.jsonl`). Expected: the list reorders within a moment without a manual refresh.

- [ ] **Step 6: (Optional) Package**

Run: `cd f:/P4/claude-extension && npx @vscode/vsce package`
Expected: `claude-session-pins-0.0.1.vsix` produced, installable via "Extensions: Install from VSIX".

---

## Self-Review Notes

- **Spec coverage:** §3.1 scanner→Task 5; §3.1 path encoding→Task 3; §3.2 PinStore→Task 6; §3.3 TreeView/groups/inline→Tasks 7–8 + package.json menus (Task 1); §3.4 open→Task 9; §3.5 watcher→Task 10; §5 error handling→scanSessions returns [] (Task 5), titleOf try/catch (Task 5), open fallback toast (Task 9), empty-state node (Task 8), non-existent pinned filtered in buildGroups (Task 7); §6 tests→Tasks 3–7; §8 spike→Task 11 Step 3.
- **Type consistency:** `SessionMeta`/`SessionGroups`/`MementoLike` defined once in Task 2 and reused verbatim; `buildGroups(sessions, Set<string>)`, `PinStore` methods, and `scanSessions`/`titleOf` signatures match across tasks.
- **Pin store source of truth:** TreeProvider reads pin membership from `PinStore.list()` (Task 8), the same store the commands mutate (Task 9) — single source of truth.
```
