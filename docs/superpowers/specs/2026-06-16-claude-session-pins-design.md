# Claude Session Pins — 设计文档

日期：2026-06-16
状态：已确认，待写实现计划

## 1. 背景与目标

官方 Claude Code VSCode 扩展（`anthropic.claude-code`）在侧边栏提供一个会话列表，按最后活动时间排序。重要会话会随着新会话产生被挤到下面、不易找回。

**目标**：提供"置顶（pin）"能力，把用户标记的重要会话固定在列表顶部。

**核心诉求**：置顶不被新会话冲走（不是做收藏分组）。

## 2. 关键约束（已通过逆向官方扩展验证）

- 官方会话列表是一个 **webview**（视图 id `claudeVSCodeSessionsList`）。VSCode 的 webview 是沙箱化 iframe，**其它扩展无法注入按钮或修改其 DOM**。因此"在官方原列表里加 pin 按钮"通过正规扩展机制不可行。
- 会话数据是明文、可读：`~/.claude/projects/<工作区路径编码>/<会话uuid>.jsonl`，一个会话一个文件，文件 mtime ≈ 最后活动时间。
- 路径编码规则：把工作区绝对路径中的 `:` `\` `/` 全部替换为 `-`。示例：`f:\P4\claude-extension` → `f--P4-claude-extension`（已验证）。
- 官方提供按会话 id 打开会话的命令（已在官方代码中确认其内部调用方式）：
  ```js
  vscode.commands.executeCommand("claude-vscode.editor.open", sessionId, initialPrompt /*可为 undefined*/, viewColumn)
  ```
- 官方列表标题是它从对话内容**生成的摘要**，保存在官方扩展进程/私有存储中，外部无法稳定获取。本插件需自行生成标题。

**结论**：采用"独立插件 + 自建原生列表面板"方案（路线 A）。放弃"注入 JS 改官方 webview"（路线 B，过于脆弱、随官方更新失效）。

## 3. 方案设计

独立 VSCode 扩展，名称暂定 **Claude Session Pins**。

### 3.1 数据来源（SessionScanner）

- 输入：当前工作区根路径 → 编码为 projects 子目录名 → 定位 `~/.claude/projects/<编码>/`。
- 扫描该目录下所有 `*.jsonl`，每个文件产出一条会话记录：
  - `sessionId`：文件名去掉 `.jsonl`（即会话 uuid）。
  - `mtime`：文件最后修改时间，用于排序与显示。
  - `title`：解析文件，取**第一条人类真正输入的文本**：
    - 跳过 `type !== "user"` 的行；
    - 跳过 user 行中 content 为纯图片、或文本以 `<ide_opened_file>`、`<system-reminder>` 等系统注入开头的内容；
    - 取到的文本截断为单行短标题（约 60 字符）。
    - 兜底：取不到时显示 `会话 <uuid前8位> · <mtime>`。
- 范围：**仅当前工作区**对应的 project 目录（与官方列表口径一致）。

### 3.2 置顶存储（PinStore）

- 用本扩展自己的 `context.globalState`，存一个 `Set<sessionId>`（或 `string[]`）。
- key 仅为 sessionId，不写入任何官方文件 / `~/.claude` 目录。
- 提供 `isPinned / pin / unpin / list` 接口；变更后触发 TreeView 刷新。

### 3.3 界面（TreeView）

- 在活动栏新增**独立图标**，对应一个原生 `TreeDataProvider`。
- 两个分组（折叠节点）：
  - **📌 已置顶**：所有 pinned 会话，置顶组始终在最上面（组内按 mtime 倒序）。
  - **最近**：其余会话，按 mtime 倒序。
- 每个会话项：
  - label = 标题；description = 相对时间（如 `5m`、`1d`）。
  - inline 按钮 + 右键菜单：**置顶 / 取消置顶**（用 `when` 上下文区分已/未置顶）。
  - 点击项本身 = 打开会话。
- 顶部标题栏：手动**刷新**按钮。

### 3.4 打开动作（OpenSession 命令）

- 本扩展注册命令 `claudeSessionPins.open`，参数为 sessionId。
- 实现：
  ```js
  await vscode.commands.executeCommand(
    "claude-vscode.editor.open", sessionId, undefined, vscode.ViewColumn.Active
  );
  ```
- 若官方扩展未安装/命令不存在：捕获异常并提示用户安装/启用官方 Claude Code 扩展。

### 3.5 刷新机制

- 对 `~/.claude/projects/<编码>/` 挂 `FileSystemWatcher`（`*.jsonl` 的 create/change/delete）→ 自动刷新。
- 同时提供手动刷新命令兜底。
- 工作区切换时重新定位目录。

## 4. 组件划分

| 组件 | 职责 | 依赖 |
|------|------|------|
| `pathEncoder` | 工作区路径 → projects 目录名 | 无 |
| `SessionScanner` | 扫描 jsonl，产出会话列表（id/mtime/title） | `pathEncoder`、fs |
| `PinStore` | 读写置顶集合 | `globalState` |
| `SessionsTreeProvider` | 组装两组树节点、emit 刷新 | `SessionScanner`、`PinStore` |
| `commands` | open / pin / unpin / refresh | 上述 + 官方 open 命令 |
| `extension.ts` | 激活、注册视图与命令、挂 watcher | 全部 |

## 5. 错误处理

- projects 目录不存在（新工作区无会话）：显示空态占位项（如"暂无会话"）。
- jsonl 解析失败（坏行/超大文件）：逐行容错，单行解析失败跳过；标题取不到走兜底。
- 官方 open 命令缺失：提示并不崩溃。
- pin 的会话文件已被删除：列表中标灰或在下次扫描时自动从置顶集合清理（可选，MVP 可仅在展示时过滤不存在的 id）。

## 6. 测试策略

- `pathEncoder`：单测若干路径样例（盘符、含已有连字符、不同分隔符）。
- `SessionScanner.titleOf`：用构造的 jsonl 片段单测——首条为图片、为 `<ide_opened_file>`、为正常文本、空文件等。
- `PinStore`：pin/unpin/持久化往返。
- `SessionsTreeProvider`：给定会话集合 + pin 集合，断言两组结构与排序。
- 打开动作：用 mock 的 `executeCommand` 验证传参；官方命令缺失时的降级路径。
- 手动冒烟：实际安装到 VSCode，置顶、刷新、点击打开走一遍。

## 7. 明确不做（YAGNI）

- 不做收藏夹/自定义分组。
- 不做跨工作区聚合（仅当前工作区）。
- 不改官方扩展任何文件，不注入 webview。
- 不自建会话内容预览（点击直接交给官方打开）。
- 不重新生成与官方一致的 AI 摘要标题。

## 8. 已知风险 / 需在实现早期验证（spike）

- `claude-vscode.editor.open` 以任意历史 sessionId 调用，能否稳定恢复该会话（不同官方版本行为可能有差异）。**实现第一步先做最小验证。**
- projects 目录路径编码在带特殊字符工作区下的准确性。
