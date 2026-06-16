# Toolkit for Claude Code

**English** | [简体中文](README.zh-CN.md)

Handy enhancements for the [Claude Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) VSCode extension.

This is an **unofficial, community** add-on (not affiliated with Anthropic). It lives alongside the official Claude Code extension and adds quality-of-life features on top of it.

## Features

### 📌 Pin sessions

The official session list is ordered by recency, so important conversations get pushed down as new ones appear. Toolkit for Claude Code adds a sidebar with a **Pinned** group that keeps the sessions you care about at the top.

- Browse the current workspace's Claude Code sessions in a native sidebar view.
- **Pin / unpin** any session — pinned ones stay on top, regardless of recency.
- **Click a session to open it** — it reuses the official extension's own "open session" command, so it opens exactly as it would natively.
- The list refreshes automatically as sessions change, plus a manual refresh button.
- **Rename** any session to a friendly name (the auto title is just the first prompt).
- Sessions are **grouped by date** (Today / Yesterday / Previous 7 Days / Previous 30 Days / Older), with pinned ones on top.
- **Delete** a session (moved to the trash) or **copy** its ID / transcript path from the right-click menu.
- **Search** sessions by name from the view's search button (fuzzy match as you type).

More toolkit features are planned — see [Roadmap](#roadmap).

## How it works

The extension reads Claude Code's local session transcripts from `~/.claude/projects/<encoded-workspace>/*.jsonl` (read-only) to build the list, and derives each session's title from its first human prompt. Pinned state is stored in this extension's own VSCode storage. **Everything stays on your machine** — nothing is sent anywhere, and no official files are modified.

## Requirements

- The official **Claude Code** extension (`anthropic.claude-code`) installed and enabled — it provides the session-open command this extension reuses.

## Usage

1. Install this extension.
2. Open a workspace where you've used Claude Code.
3. Click the **Toolkit for Claude Code** icon in the activity bar.
4. Hover a session and click the pin icon to keep it on top; click a session to open it.

## Roadmap

This extension is a home for small Claude Code enhancements. Pinning is the first; more are planned. Suggestions welcome via [issues](https://github.com/sssooonnnggg/claude-code-toolkit/issues).

## Privacy

This extension only reads local files under `~/.claude/projects` and stores pin state locally. It makes no network requests.

## License

[MIT](LICENSE)
