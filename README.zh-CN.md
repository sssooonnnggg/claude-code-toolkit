# Toolkit for Claude Code

[English](README.md) | **简体中文**

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/sssooonnnggg.claudecode-toolkit?label=VS%20Marketplace&color=D97757)](https://marketplace.visualstudio.com/items?itemName=sssooonnnggg.claudecode-toolkit)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/sssooonnnggg.claudecode-toolkit)](https://marketplace.visualstudio.com/items?itemName=sssooonnnggg.claudecode-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

为官方 [Claude Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) VSCode 扩展提供的实用增强。在专属侧边栏里浏览、置顶、搜索、重命名、配色、分组你的 Claude Code 会话。

> **非官方、社区插件** —— 与 Anthropic 无关。它与官方 Claude Code 扩展并存，不修改其任何文件。

![会话侧边栏](media/screenshots/sessions.png)

## 功能

- 📌 **置顶**重要会话到顶部分组，不再被新会话冲走。
- 🗂️ **日期分组** —— Today / Yesterday / Previous 7 Days / Previous 30 Days / Older。
- 📁 **自定义分组** —— 把会话归入你自己的分组；一旦使用，列表就按分组显示（Pinned → 你的分组 → Ungrouped），替代日期分组。
- 🎨 **彩色圆点** 和 😀 **emoji**，显示在标签头部。
- 🔍 **按名字搜索**会话（搜索图标，或命令面板里的 "Search Sessions"）。
- ✏️ **重命名**、🗑️ **删除**（移到回收站）、📋 **复制** id / transcript 路径。
- 🖱️ 单击**打开**会话 —— 复用官方扩展自带的打开命令，打开方式与原生完全一致。
- 🔄 会话变化时自动刷新，另有手动刷新按钮。

## 前置要求

需安装并启用官方 **Claude Code** 扩展（`anthropic.claude-code`）—— 本插件复用它的"打开会话"命令。

## 安装

在 VS Code 扩展面板搜索 **"Toolkit for Claude Code"**，或从 [Marketplace](https://marketplace.visualstudio.com/items?itemName=sssooonnnggg.claudecode-toolkit) 安装。

然后点击活动栏的**图钉图标**，打开一个你用过 Claude Code 的工程，会话即会出现。悬停某行可用行内操作（重命名、置顶、删除）；右键可设置颜色、emoji、分组以及复制。

## 工作原理

本插件以**只读**方式读取 Claude Code 的本地会话记录 `~/.claude/projects/<编码后的工程路径>/*.jsonl` 来生成列表，并从每个会话的第一条输入提取标题。你的置顶、名字、颜色、emoji、分组都保存在本扩展自己的 VS Code 存储里。

## 隐私

所有数据都留在本地。本插件只读取 `~/.claude/projects` 下的本地文件，设置存在本地，**不发起任何网络请求**。

## 路线图

本扩展是一系列 Claude Code 小增强的集合。正在考虑：导出会话为 Markdown、全工程视图、排序选项、本地化等。欢迎通过 [issues](https://github.com/sssooonnnggg/claude-code-toolkit/issues) 提建议或反馈问题。

## 许可证

[MIT](LICENSE)
