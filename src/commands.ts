import * as vscode from "vscode";
import { sessionLabel } from "./display";
import { formatRelative } from "./relativeTime";
import type { SessionMeta } from "./types";
import type { SessionStores } from "./sessionStores";
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
  stores: SessionStores,
  provider: SessionsTreeProvider,
  load: () => Promise<SessionMeta[]>,
): void {
  const { pins, names } = stores;
  const refresh = () => provider.refresh();
  context.subscriptions.push(
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.open", (sessionId: string) => openSession(sessionId)),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.refresh", () => refresh()),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.pin", async (node: { meta?: { sessionId: string } }) => {
      if (node?.meta) { await pins.pin(node.meta.sessionId); refresh(); }
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.unpin", async (node: { meta?: { sessionId: string } }) => {
      if (node?.meta) { await pins.unpin(node.meta.sessionId); refresh(); }
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.rename", async (node: { meta?: { sessionId: string; title: string } }) => {
      if (!node?.meta) return;
      const current = names.get(node.meta.sessionId) ?? node.meta.title ?? "";
      const input = await vscode.window.showInputBox({ value: current, prompt: "Rename session (leave empty to reset)" });
      if (input === undefined) return;
      if (input.trim() === "") await names.clear(node.meta.sessionId);
      else await names.set(node.meta.sessionId, input);
      refresh();
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.delete", async (node: { meta?: { sessionId: string; title: string; filePath: string } }) => {
      if (!node?.meta) return;
      const label = names.get(node.meta.sessionId) ?? node.meta.title ?? node.meta.sessionId;
      const pick = await vscode.window.showWarningMessage(
        `Delete session "${label}"? It will be moved to the trash.`,
        { modal: true },
        "Delete",
      );
      if (pick !== "Delete") return;
      try {
        await vscode.workspace.fs.delete(vscode.Uri.file(node.meta.filePath), { useTrash: true });
        await pins.unpin(node.meta.sessionId);
        await names.clear(node.meta.sessionId);
        await stores.emojis.clear(node.meta.sessionId);
        await stores.colors.clear(node.meta.sessionId);
        await stores.groups.clear(node.meta.sessionId);
      } catch (e) {
        void vscode.window.showErrorMessage(`Could not delete session: ${e instanceof Error ? e.message : String(e)}`);
      }
      refresh();
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.copyId", async (node: { meta?: { sessionId: string } }) => {
      if (node?.meta) await vscode.env.clipboard.writeText(node.meta.sessionId);
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.copyPath", async (node: { meta?: { filePath: string } }) => {
      if (node?.meta) await vscode.env.clipboard.writeText(node.meta.filePath);
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.search", async () => {
      const sessions = await load();
      if (sessions.length === 0) {
        void vscode.window.showInformationMessage("No sessions to search.");
        return;
      }
      const items = sessions.map((sm) => ({
        label: sessionLabel(sm, stores),
        description: formatRelative(sm.mtimeMs, Date.now()),
        sessionId: sm.sessionId,
      }));
      const pick = await vscode.window.showQuickPick(items, { placeHolder: "Search sessions by name" });
      if (pick) await openSession(pick.sessionId);
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.setColor", async (node: { meta?: { sessionId: string } }) => {
      if (!node?.meta) return;
      const options = [
        { label: "🔴 Red", value: "🔴" },
        { label: "🟠 Orange", value: "🟠" },
        { label: "🟡 Yellow", value: "🟡" },
        { label: "🟢 Green", value: "🟢" },
        { label: "🔵 Blue", value: "🔵" },
        { label: "🟣 Purple", value: "🟣" },
        { label: "🟤 Brown", value: "🟤" },
        { label: "None", value: "" },
      ];
      const pick = await vscode.window.showQuickPick(options, { placeHolder: "Set session color" });
      if (!pick) return;
      await stores.colors.set(node.meta.sessionId, pick.value);
      refresh();
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.setEmoji", async (node: { meta?: { sessionId: string } }) => {
      if (!node?.meta) return;
      const current = stores.emojis.get(node.meta.sessionId) ?? "";
      const input = await vscode.window.showInputBox({ value: current, prompt: "Set emoji (leave empty to clear)" });
      if (input === undefined) return;
      await stores.emojis.set(node.meta.sessionId, input);
      refresh();
    }),
    vscode.commands.registerCommand("claudeCodeToolkit.sessions.setGroup", async (node: { meta?: { sessionId: string } }) => {
      if (!node?.meta) return;
      const id = node.meta.sessionId;
      const existing = [...new Set(Object.values(stores.groups.all()))].sort();
      const CREATE = "$(add) Create new group…";
      const REMOVE = "$(close) Remove from group";
      const picks = [...existing, CREATE, ...(stores.groups.get(id) ? [REMOVE] : [])];
      const choice = await vscode.window.showQuickPick(picks, { placeHolder: "Set session group" });
      if (choice === undefined) return;
      if (choice === REMOVE) {
        await stores.groups.clear(id);
      } else if (choice === CREATE) {
        const name = await vscode.window.showInputBox({ prompt: "New group name" });
        if (name === undefined || name.trim() === "") return;
        await stores.groups.set(id, name);
      } else {
        await stores.groups.set(id, choice);
      }
      refresh();
    }),
  );
}
