# Changelog

## 0.6.1

- Renamed to **Claude Session Organizer** (formerly "Toolkit for Claude Code") to better reflect its focus on organizing sessions.

## 0.6.0

- Pin sync: pinning a session's editor tab now also pins it in the list (one-way; unpinning the tab does nothing). Works for sessions opened from the Toolkit list.

## 0.5.2

- Rewrite the README and add a screenshot of the session sidebar.

## 0.5.1

- Unify the pin icon across the activity bar, the session list, and the Marketplace icon (now the native VS Code pushpin).

## 0.5.0

- Set a **color dot** and an **emoji** per session, shown at the start of its label.
- Organize sessions into **custom groups** — when any group is used, the list groups by your groups (Pinned → groups → Ungrouped) instead of by date.

## 0.4.0

- Search sessions by name (search icon in the view title, or "Search Sessions" in the command palette).
- Rename and delete are now inline hover buttons on each session row.

## 0.3.0

- Rename sessions with custom names (right-click → Rename; empty resets to auto title).
- Group sessions by date: Pinned, Today, Yesterday, Previous 7 Days, Previous 30 Days, Older.
- Delete a session (moved to the OS trash, with confirmation).
- Copy a session's ID or transcript path.

## 0.1.1

- Add a Marketplace icon.
- Add a Simplified Chinese README with a language switcher.

## 0.1.0

- Initial release.
- 📌 Session pinning: a sidebar view listing the current workspace's Claude Code
  sessions, with a **Pinned** group that keeps important sessions on top.
- Click a session to open it via the official Claude Code extension.
- Auto-refresh on session changes, plus a manual refresh button.
