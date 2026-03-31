---
title: Skills 是什么？
description: 阅读时间：30分钟
order: 1
---

Agent Skills 是一种**轻量级、开放式的格式**，用于通过专门的知识和**工作流**来扩展 AI 代理的能力。

从本质上说，**一个 skill 就是一个包含 `SKILL.md` 文件的文件夹**。这个文件至少会包含元数据（最少要有名称和描述）以及操作说明，用来告诉代理如何完成某个特定任务。**技能还可以附带脚本、模板和参考资料。**

```txt
my-skill/
├── SKILL.md          # 必需项：指令 + 元数据。
├── scripts/          # 可选项：可执行代码。
├── references/       # 可选项：文档。
└── assets/           # 可选项：模板、资源。
```

# 1. skill 是如何工作的

Skills 使用 **渐进式披露（progressive disclosure）** 来更高效地管理上下文：

* **发现阶段（Discovery）**：在启动时，代理**只会加载每个可用 skill 的名称和描述**，仅保留足够的信息来**判断**它**何时可能相关**。
* **激活阶段（Activation）**：**当某个任务与某个 skill 的描述匹配时**，代理才会把完整的 `SKILL.md` 指令读入上下文。
* **执行阶段（Execution）**：代理按照这些指令执行任务，并在需要时选择性加载被引用的文件或运行 skill 附带的代码。

这种方式既能让代理保持高效轻量，又能在需要时按需获得更多上下文。



# 2. SKILL.md 文件

每个 skill 都以一个 `SKILL.md` 文件开始，其中包含 **YAML frontmatter** 和 **Markdown 指令内容**：

```markdown
---
name: pdf-processing
description: 提取 PDF 文本、填写表单、合并文件。在处理 PDF 时使用。
---

# PDF 处理

## 什么时候使用这个技能
当用户需要处理 PDF 文件时，使用这个技能……

## 如何提取文本
1. 使用 pdfplumber 提取文本……

## 如何填写表单
……
```

