# Melete · DSH 插件

[English](README.md) | 简体中文 | [Español](README.es.md)

回看你和 AI 是怎么一起做事的。

Melete 是 DeepSeek Harness（DSH）的复盘插件。在 DSH 中选择时间范围，生成复盘卡片，看看你和 AI 如何协作，以及 AI 在其中的表现。观察附有出处和可能的读法，好坏由你判断。

## 使用

1. 在 DSH 的「插件」中选择「添加插件」，输入插件文件夹的绝对路径并启用。
2. 打开左侧「复盘」，选择时间范围；也可以写下你的意图。
3. 点击「开始复盘」。结果可在「复盘记录」中查看或删除。

## 功能

- 回看 DSH 会话，呈现观察、出处、AI 的表现和开放问题；填写意图后可提出小实验。
- 可选择八种古代文明风格，界面支持简体中文、英语、日语、西班牙语、法语、德语、俄语和葡萄牙语。
- 可主动导出分享图片或 HTML；复盘记录保存在本机。
- 「写给你自己的信」目前尚未开放生成，相关设计仍在调整。

## 隐私

插件在本机读取会话并先进行脱敏，将摘要发送给你在 DSH 中选择的模型生成复盘；具体传输和处理取决于所选模型。Melete 不运营服务器，也不收集数据。复盘和设置保存在 `~/.melete/`，可在设置中删除。

## 当前状态

当前为开发版本，暂时只支持 DSH 的会话记录。npm 安装方式将在发布后提供。

## 许可

代码采用 Apache 2.0；照见图谱采用 CC BY 4.0。图片与其他素材的来源和许可见 [NOTICE](NOTICE)。

## Melete 的其他版本

- [Melete Skill](https://github.com/yancanny/melete-skill)：适用于支持 Skill 的 AI 工具。
- [Melete Magpie](https://github.com/yancanny/magpie-plugin-melete)：在 Magpie 中回顾 DSH 或 Codex。
