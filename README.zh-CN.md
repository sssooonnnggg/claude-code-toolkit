# Toolkit for Claude Code

[English](README.md) | **简体中文**

为官方 [Claude Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) VSCode 扩展提供的实用增强。

这是一个**非官方、社区**插件（与 Anthropic 无关）。它与官方 Claude Code 扩展并存，在其之上添加一些提升体验的小功能。

## 功能

### 📌 会话置顶

官方的会话列表按最近活动排序，重要的会话会随着新会话产生被挤到下面。Toolkit for Claude Code 在侧边栏提供一个带 **Pinned（已置顶）** 分组的视图，把你在意的会话固定在最上面。

- 在原生侧边栏视图里浏览当前工作区的 Claude Code 会话。
- **置顶 / 取消置顶** 任意会话——置顶的会话始终在最上面，不受时间影响。
- **点击会话即可打开**——复用官方扩展自带的"打开会话"命令，打开方式与原生完全一致。
- 会话变化时列表自动刷新，另有手动刷新按钮。
- **重命名**任意会话为友好名字（自动标题只是第一条输入）。
- 会话**按日期分组**（Today / Yesterday / Previous 7 Days / Previous 30 Days / Older），置顶的在最上面。
- 右键菜单可**删除**会话（移到回收站）或**复制** id / transcript 路径。

更多工具集功能正在规划中——见 [路线图](#路线图)。

## 工作原理

扩展以**只读**方式读取 Claude Code 的本地会话记录 `~/.claude/projects/<编码后的工作区>/*.jsonl` 来生成列表，并从每个会话的第一条人类输入提取标题。置顶状态保存在本扩展自己的 VSCode 存储里。**所有数据都留在你本地**——不向任何地方发送，也不修改任何官方文件。

## 前置要求

- 已安装并启用官方 **Claude Code** 扩展（`anthropic.claude-code`）——它提供了本扩展所复用的"打开会话"命令。

## 使用方法

1. 安装本扩展。
2. 打开一个你用过 Claude Code 的工作区。
3. 点击活动栏里的 **Toolkit for Claude Code** 图标。
4. 悬停某个会话点图钉图标即可置顶；点击会话即可打开。

## 路线图

本扩展是一系列 Claude Code 小增强的集合。置顶是第一个，后续还会加更多。欢迎通过 [issues](https://github.com/sssooonnnggg/claude-code-toolkit/issues) 提建议。

## 隐私

本扩展只读取 `~/.claude/projects` 下的本地文件，并在本地保存置顶状态，不发起任何网络请求。

## 许可证

[MIT](LICENSE)
