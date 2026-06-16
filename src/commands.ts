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
