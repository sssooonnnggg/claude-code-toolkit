import * as vscode from "vscode";
import type { SessionMeta } from "./types";
import { buildGroups } from "./sessionsModel";
import { formatRelative } from "./relativeTime";
import { sessionLabel } from "./display";
import type { SessionStores } from "./sessionStores";

type Node =
  | { kind: "group"; key: string; label: string; children: SessionMeta[] }
  | { kind: "session"; meta: SessionMeta; pinned: boolean }
  | { kind: "empty"; label: string };

export class SessionsTreeProvider implements vscode.TreeDataProvider<Node> {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  constructor(
    private readonly load: () => Promise<SessionMeta[]>,
    private readonly stores: SessionStores,
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
    const item = new vscode.TreeItem(sessionLabel(node.meta, this.stores), vscode.TreeItemCollapsibleState.None);
    item.description = formatRelative(node.meta.mtimeMs, this.now());
    item.tooltip = `${node.meta.title}\n${node.meta.sessionId}`;
    item.contextValue = node.pinned ? "pinnedSession" : "unpinnedSession";
    item.iconPath = new vscode.ThemeIcon(node.pinned ? "pinned" : "comment-discussion");
    item.command = { command: "claudeSessionOrganizer.sessions.open", title: "Open Session", arguments: [node.meta.sessionId] };
    return item;
  }

  async getChildren(node?: Node): Promise<Node[]> {
    if (node) {
      if (node.kind === "group") {
        const pinnedSet = new Set(this.stores.pins.list());
        return node.children.map((meta) => ({ kind: "session", meta, pinned: pinnedSet.has(meta.sessionId) }));
      }
      return [];
    }
    const sessions = await this.load();
    if (sessions.length === 0) return [{ kind: "empty", label: "No sessions for this workspace" }];
    const groups = buildGroups(
      sessions,
      new Set(this.stores.pins.list()),
      this.now(),
      (id) => this.stores.groups.get(id),
    );
    return groups.map((g) => ({ kind: "group", key: g.key, label: g.label, children: g.items }));
  }
}
