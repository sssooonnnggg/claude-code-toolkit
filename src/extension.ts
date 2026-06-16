import * as vscode from "vscode";
import * as os from "node:os";
import * as path from "node:path";
import { encodeProjectDir } from "./pathEncoder";
import { scanSessions } from "./sessionScanner";
import { PinStore } from "./pinStore";
import { NameStore } from "./nameStore";
import { SessionsTreeProvider } from "./treeProvider";
import { registerCommands } from "./commands";

function projectsDirFor(workspacePath: string): string {
  return path.join(os.homedir(), ".claude", "projects", encodeProjectDir(workspacePath));
}

export function activate(context: vscode.ExtensionContext): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  const dir = folder ? projectsDirFor(folder.uri.fsPath) : undefined;

  const pins = new PinStore(context.globalState);
  const names = new NameStore(context.globalState);
  const load = () => (dir ? scanSessions(dir) : Promise.resolve([]));
  const provider = new SessionsTreeProvider(load, pins, names);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("claudeCodeToolkit.sessions", provider),
  );
  registerCommands(context, pins, names, provider, load);

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
