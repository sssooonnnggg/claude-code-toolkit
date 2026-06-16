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
