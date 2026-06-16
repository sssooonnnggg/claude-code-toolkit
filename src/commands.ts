import * as vscode from "vscode";
import { PinStore } from "./pinStore";
import { NameStore } from "./nameStore";
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
  names: NameStore,
  provider: SessionsTreeProvider,
): void {
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
      if (input === undefined) return; // cancelled
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
  );
}
