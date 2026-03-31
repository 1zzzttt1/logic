---
title: skills扩展 Claude code
description: 阅读时间：30分钟
order: 1
---

通过创建、管理和共享 skills 来扩展 Claude Code 的能力，其中包括自定义命令和打包技能。

**Skills 可以扩展 Claude 的能力**。你只需要创建一个 `SKILL.md` 文件，写入相应说明，Claude 就会把它加入自己的工具集中。**当场景相关时，Claude 会自动使用这些技能**；你也可以通过 `/skill-name` 直接手动调用某个技能。

> 对于像 `/help` 和 `/compact` 这样的内置命令，请查看**内置命令参考文档** ：[built-in commands reference](https://code.claude.com/docs/en/commands).。
>
> **自定义命令已经并入 Skills**。放在 `.claude/commands/deploy.md` 的文件，和放在`.claude/skills/deploy/SKILL.md` 的技能，都会创建 `/deploy`，而且工作方式相同
>
> 你现有的 `.claude/commands/` 文件仍然可以继续使用。
>
> **Skills 额外提供了一些可选功能**：**可以带一个用于存放辅助文件的目录**、可以通过 frontmatter 控制是由你手动调用还是由 Claude 调用，以及 Claude 能在相关场景下自动加载这些 Skills。

Claude Code 的技能遵循 [Agent Skills](https://agentskills.io/) 开放标准，这个标准可以在多种 AI 工具之间通用。Claude Code 又在这个标准基础上扩展了一些额外功能，例如：**调用控制**、**子代理执行**，以及**动态上下文注入**。

