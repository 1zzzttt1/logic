---
title: 3. 快速创建 Skill
description: 阅读时间：10分钟
order: 3
---

创建你的第一个 Agent Skill，并在 VS Code 中看到它实际运行。

在这个教程中，你将创建一个 skill，让 agent 具**备用随机数生成器掷骰子的能力**。

# 1. 提前准备

* [VS Code](https://code.visualstudio.com/) with [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)

> 本教程使用 VS Code，但 Agent Skills 是一种开放格式。同一个 skill 可以在任何兼容的 agent 中运行，包括 Claude Code 和 OpenAI Codex。

# 2. 创建 skill

一个 skill 就是一个包含 `SKILL.md` 文件的文件夹。
 VS Code 默认会在 `.agents/skills/` 目录下查找 skills。
 请在你的项目中创建这个文件：`.agents/skills/roll-dice/SKILL.md`

```txt
---
name: roll-dice
description: 使用随机数生成器掷骰子。当被要求掷一个骰子（如 d6、d20 等）、掷骰子，或生成随机骰子结果时使用。
---

要掷一个骰子，可使用下面的命令，它会生成一个从 1 到指定面数之间的随机数：

```bash
echo $((RANDOM % <sides> + 1))
```

就是这样——只需要一个文件，不到 20 行。下面是每一部分的作用：

* `name` —— skill 的简短标识符，**必须和文件夹名称一致**。
* `description` —— 告诉 agent 什么时候该使用这个 skill。agent 会根据这段描述来判断是否激活它。
* 正文内容 —— 当 skill 被激活时，agent 需要遵循的指令。这里的意思是：让 agent 用终端命令生成一个随机数，并把用户请求中的骰子面数替换进去。



# 3. 动手试一下

1. 在 VS Code 中打开你的项目。
2. 打开 Copilot Chat 面板。
3. 在聊天面板底部的模式下拉菜单中，选择 **Agent mode**。
4. 输入 `/skills`，确认列表中是否出现 `roll-dice`。如果没有出现，请检查该文件是否位于相对于项目根目录的 `.agents/skills/roll-dice/SKILL.md`。
5. 然后提问：**“Roll a d20”**。

agent 应该会激活 `roll-dice` 这个 skill。
 它可能会请求你的权限来运行一个终端命令——允许即可。
 随后，它会执行该命令，并返回一个 **1 到 20 之间的随机数**。

> 不同模型在**工具调用的可靠性**上会有差异——有些模型会比较稳定地按照 skill 指令去执行命令，而另一些模型可能会试图自己直接回答。
>
> 如果 agent 在没有运行终端命令的情况下就直接作答了，可以尝试在模型下拉菜单中切换到另一个模型。



# 4. 它是如何工作的

幕后实际发生的是这样的：

* **发现（Discovery）** —— 当聊天会话开始时，agent 会扫描默认的 skill 目录，并找到你的 skill。此时它只会读取 `name` 和 `description`，这些信息刚好足够让它判断这个 skill 什么时候可能相关。
* **激活（Activation）** —— 当你提到掷骰子时，agent 会把你的问题与这个 skill 的 `description` 进行匹配；一旦判断相关，就会把完整的 `SKILL.md` 正文加载进上下文。
* **执行（Execution）** —— agent 会按照正文里的说明执行操作，并根据你的请求中的骰子面数，调整对应的终端命令。

这个过程采用了 渐进式披露（progressive disclosure）的方式，使 agent 能够访问很多 skill，而不必一开始就把所有 skill 的完整说明全部加载进来。更多细节可参见 **[How skills work](https://agentskills.io/what-are-skills#how-skills-work).**。
