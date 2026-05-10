---
title: OpenSpec：灵活的 SDD（规范驱动开发）
publishedAt: 2026-04-15
tags:
  - AI Coding
  - 规范驱动开发
---


# 它是什么？

OPSX 现在是 OpenSpec 的标准工作流。

OpenSpec 的新流程不再像以前那样“先做 A，再做 B，再做 C”，而是更灵活。你可以根据当前需要，随时补需求、改设计、拆任务、调整方案，不必被固定流程卡住。



# 为什么它会存在？

旧版 OpenSpec 虽然能用，但太死板了：

* **指令是硬编码的**——提示词写死在 TypeScript 代码里，普通用户改不了
* **要么全做，要么不做**——一个命令会一次性生成所有内容，不能只测试其中某一步
* **结构固定**——所有人都必须按同一套流程走，不能根据自己的项目调整
* **黑盒**——当 AI 输出不好时，你无法调整提示词



OPSX 把原来封闭的流程打开了，现在每个人都可以自己调整和测试：

* **试验指令**——你可以改模板里的提示词，看看 AI 生成效果会不会更好
* **细粒度测试**——你可以单独测试某个产物的说明，而不是一次性跑完整套流程
* **自定义工作流**——你可以按照自己的项目需要，设计自己的产物和依赖关系
* **快速迭代**——你改完模板后可以马上测试，不用重新打包或重建项目



```txt
旧版工作流：                         OPSX：
┌────────────────────────┐           ┌────────────────────────┐
│  硬编码在包里            │           │  schema.yaml           │◄── 你可以编辑这个
│  （无法修改）            │           │  templates/*.md        │◄── 或者编辑这个
│        ↓               │           │        ↓               │
│  等待新版本发布           │          │      立即生效            │
│        ↓               │           │        ↓               │
│  希望它会变得更好         │           │     自己测试它           │
└────────────────────────┘           └────────────────────────┘
```

这是为所有人准备的：

* 团队——创建与你们实际工作方式相匹配的工作流
* 高级用户——调整提示词，让 AI 针对你的代码库生成更好的输出
* OpenSpec 贡献者——无需发布新版本，就能试验新的方法

现在 AI Coding / OpenSpec 这类工作流还没有唯一标准答案，大家都在探索。OPSX 把模板和流程开放出来，让团队、用户、贡献者都能参与改进。这样不是官方一个人闭门造车，而是大家一起实验，看看什么方法真的更好用。



# 用户体验

**线性流程的问题**是：它假设你会先规划，再开发，最后结束。
但实际开发不是这么顺的。**你可能写着写着发现设计有问题，就得回头改 spec，然后再继续写代码。**
所以，过于固定的阶段流程，反而会妨碍真实开发。

OPSX 的做法：

* **动作，而不是阶段**——创建、实现、更新、归档——这些动作你可以在任何时候执行。

  OPSX 不再把流程分成固定阶段，而是把它看成一组可以随时执行的动作：

  ```txt
  创建
  实现
  更新
  归档
  ```

  你不需要严格按照“规划 → 开发 → 完成”走。

* **依赖关系是赋能条件**——它们展示的是“现在可以做什么”，而不是规定“下一步必须做什么”。

  依赖关系也不是用来强迫你下一步必须做什么，而是告诉你：在当前已有内容的基础上，你现在还能做哪些事情。

```txt
 proposal ──→ specs ──→ design ──→ tasks ──→ implement
   提案    ──→ 规范   ──→ 设计   ──→  任务  ──→    实现
```



# Setup

```bash
# 先确认你已经装好了 openspec，初始化时会自动生成 skills
openspec init
```

运行这个命令后，它会在 `.claude/skills/` 目录里生成一些 skill 文件。Claude Code 这类 AI 编程助手会自动识别这些 skills。

默认安装后，OpenSpec 用的是基础版工作流，里面主要有这些命令：

```TXT
propose、explore、apply、sync、archive
```



如果你想用更多扩展命令，比如：

```txt
new、continue、ff、verify、bulk-archive、onboard
```

就需要先用：

```bash
openspec config profile
```

配置工作流 profile，然后再运行：

```bash
openspec update
```

让配置生效。

初始化的时候，OpenSpec 会问你要不要创建一个项目配置文件：`openspec/config.yaml`，这个文件不是必须的，但**官方建议你创建**。



#  项目配置

项目配置可以让你提前设置一些默认选项，还可以把当前项目的背景信息自动加入到所有产物里。



## 创建配置

你可以在执行 `openspec init` 初始化时生成配置文件，也可以自己手动新建这个配置文件。

```yaml
# openspec/config.yaml
schema: spec-driven

context: |
  技术栈: TypeScript, React, Node.js
  API 约定: RESTful, JSON responses
  测试: 使用 Vitest 进行单元测试，使用 Playwright 进行端到端测试
  代码风格: ESLint 配合 Prettier，严格 TypeScript

rules:
  proposal:
    - 包含回滚计划
    - 识别受影响的团队
  specs:
    - 写 specs 时，需求场景要用 Given/When/Then 格式
  design:
    - 写 design 时，如果流程比较复杂，要加时序图
```



## 配置字段

| Field     | Type   | Description                                       |
| --------- | ------ | ------------------------------------------------- |
| `schema`  | string | 新变更默认使用的 哪个schema（比如 `spec-driven`） |
| `context` | string | 项目背景信息，会自动加到所有产物的提示词里        |
| `rules`   | object | 给不同产物单独设置规则，用产物 ID 来区分          |





## 如何生效

* **Schema 优先级（从高到低）**
  1. CLI 参数（`--schema <name>`）
  2. 变更元数据（变更目录中的 `.openspec.yaml`）
  3. 项目配置（`openspec/config.yaml`）
  4. 默认值（`spec-driven`）
* **上下文注入**：
  * 上下文会被添加到每个 artifact 指令的最前面
  * 会被包裹在 `<context>...</context>` 标签中
  * 帮助 AI 理解你项目的约定
* **规则注入**：
  * 规则只会注入到匹配的 artifact 中
  * 会被包裹在 `<rules>...</rules>` 标签中
  * 出现在 context 之后、template 之前



## 不同 Schema 里有哪些 artifact ID

`spec-driven`（默认）：

- `proposal` —— 变更提案
- `specs` —— 规格说明
- `design` —— 技术设计
- `tasks` —— 实现任务



## 配置校验

* 如果你在 `rules` 里写了不存在的 artifact ID，OpenSpec 会给你警告
* 如果你写的 schema 名称不存在，OpenSpec 会检查出来
* `context` 不能太大，最大 50KB
* 如果 YAML 格式写错了，它会告诉你错在哪一行





## 故障排查

"**rules 中存在未知的 artifact ID：X**"：

* 检查 artifact ID 是否与你使用的 schema 匹配（见上方列表）。
* 运行 `openspec schemas --json`，查看每个 schema 对应的 artifact ID。



**配置没有被应用**：

* 确保文件位于 `openspec/config.yaml`，而不是 `.yml`
* 使用 YAML 校验器检查 YAML 语法
* 配置变更会立即生效，不需要重启



**上下文过大**：

* `context` 限制为 50KB
* 请改为总结内容，或链接到外部文档



# 命令

| Command              | What it does                                                 |
| -------------------- | ------------------------------------------------------------ |
| `/opsx:propose`      | 一步创建一个 change，并生成 planning artifact（默认的快速路径） |
| `/opsx:explore`      | 思考想法、调查问题、澄清需求                                 |
| `/opsx:new`          | 开始一个新的 change 脚手架（扩展工作流）                     |
| `/opsx:continue`     | 创建下一个产物（扩展工作流）                                 |
| `/opsx:ff`           | 快速推进规划产物（扩展工作流）                               |
| `/opsx:apply`        | 实现任务，并根据需要更新产物                                 |
| `/opsx:verify`       | 根据产物校验实现结果（扩展工作流）                           |
| `/opsx:sync`         | 将增量 specs 同步到主 specs（默认工作流，可选）              |
| `/opsx:archive`      | 完成后归档                                                   |
| `/opsx:bulk-archive` | 批量归档多个已完成的 changes（扩展工作流）                   |
| `/opsx:onboard`      | 带你完整走一遍 OPSX 的端到端流程（扩展工作流）               |



# 使用

## 探索一个想法

```bash
/opsx:explore
```

这个命令适合用来思考想法、调查问题、比较不同方案。不要求固定结构——**它只是一个思考伙伴**。当思路逐渐清晰成形后，可以切换到 `/opsx:propose`（默认工作流），或 `/opsx:new` / `/opsx:ff`（扩展工作流）。



## 开始一个新 change

`change`：它可以是一个新功能、一次重构、一个 bug 修复、一次 UI 优化、一次架构调整。



```bash
/opsx:propose
```

它会新建一个 change，并生成开始写代码前需要的规划文件。

如果你开启了 expanded workflows，也可以用下面这些命令：

```txt
/opsx:new        # 只新建 change 的基础结构，不生成完整内容
/opsx:continue   # 按顺序一个一个生成 artifact
/opsx:ff         # 快速生成所有规划阶段需要的 artifact
```



## 创建 artifact

`artifact ` ： **为了完成这个 change，需要生成或维护的具体产物**（对应的 `.md` 文件）。

在默认的 `spec-driven` 工作流里，常见 artifact 有：

```txt
proposal：变更提案
specs：规格说明 / 需求说明
design：技术设计
tasks：任务拆分
```



```bash
/opsx:continue
```

它会先看当前已有的文件和依赖关系，告诉你现在可以生成哪些 artifact，然后帮你生成其中一个。

你可以反复运行这个命令，一点一点把这次变更需要的内容补齐。



```bash
/opsx:ff add-dark-mode
```

如果你还没想清楚，适合用 `/opsx:explore` 或 `/opsx:continue` 慢慢推进。
但如果你已经知道这次 change 要做什么，需求、设计方向和任务都比较明确，就可以用 `/opsx:ff` 一次性把 proposal、specs、design、tasks 这些规划产物全部生成出来。





## 实现（流动的部分）

```bash
/opsx:apply
```

`/opsx:apply` 会按照 `tasks` 里的任务一步步实现，做完一个就勾选一个。如果你同时有多个 change，可以明确指定：

```bash
/opsx:apply <change-name>
```

如果你没有指定，它会根据当前对话判断你想处理哪个 change。
如果它判断不出来，就会让你选择。



## 收尾

```bash
/opsx:archive   # 这次 change 做完后，把它归档；如果 specs 还没同步，会提醒你先同步
```





# 什么时候继续改当前 change，什么时候新建一个 change

在开始写代码前，你随时都可以修改 proposal 或 specs。
但问题是：改到什么程度时，它就不再只是“完善当前变更”，而是变成了“另一件新的事情”？

**有些修改只是让当前 change 更清楚**，比如补充边界条件、调整措辞、明确验收标准。
但**有些修改已经改变了原来的目标**，比如原本只是优化文章字体，后来变成重构整套主题系统。那就不应该继续塞进当前 change，而应该新开一个 change。



## Proposal 里面应该写清楚什么内容

proposal 主要要讲清楚三件事：

1. **意图**——你要解决什么问题？
2. **范围**——做哪些，不做哪些。哪些内容在范围内，哪些内容不在范围内？
3. **方法**——大致准备用什么方案来解决？

关键要看：到底是意图、范围、还是方法变了？而且变动幅度有多大？

当你修改 proposal 时，要判断这是不是还属于同一个 change，**就看这三项里面哪一项变了，以及变得大不大**。

比如只是补充细节，通常还是当前 change；
但如果“要解决的问题”变了，或者“改动范围”扩大很多，那可能就应该新开一个 change。



## 以下情况，更新现有 change



* **相同的意图，只是执行细节需要改，那就更新当前 change**：
  * 写着写着发现还有一些特殊情况没考虑
  * 方案需要稍微改一下，但要解决的问题还是同一个
  * 真正实现时发现原来的设计有点不准确，需要修正
* **范围缩小**：
  * 原本想一次性做完整功能，但发现太大了，所以先做最小可用版本
  * 比如原本是“添加暗色模式”，后来改成“先做暗色模式开关，自动跟随系统设置放到第二版再做”
* **开发过程中你会不断学到新信息，如果这些新信息只是让你调整实现方式，而不是改变目标，那就继续更新当前 change**：
  * 你以为项目是某种结构，结果发现不是
  * 你以为某个库能这样用，结果实际不行
  * 原本计划“用 CSS 变量实现”，后来发现更适合用 Tailwind 的 `dark:` 前缀



## 以下情况，开始一个新的 change

* **意图发生了根本变化**：
  * 要解决的问题本身现在已经不同了
  * “添加暗色模式” → “添加一套完整的主题系统，支持自定义颜色、字体和间距”
* 如果这次**改动的范围突然变得非常大**，就应该新开一个 change：
  * 这个 change 扩大得太多，本质上已经变成了另一项工作
  * 原始 proposal 在多次更新后会变得面目全非
  * “修复登录 bug” → “重写认证系统”
* **如果原来的 change 已经能交付，就先把它完成并归档，后面新增的内容如果是独立工作，就不要继续塞进原来的 change 里**：
  * 原来的 change 已经可以标记为“完成”
  * 新工作是独立存在的，不是对原工作的细化
  * 完成“添加暗色模式 MVP” → 归档 → 新建 change：“增强暗色模式”



## 判断准则

```txt
                   ┌─────────────────────────────────────┐
                   │        这还是同一项工作吗？            │
                   └──────────────┬──────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────│──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
             意图相同吗？       重叠度 >50% 吗？      原始 change
             问题相同吗？       范围相同吗？          不包含这些新改动，
                    │                  │               也能算“完成”吗？
                    │                  │                  │
           ┌────────┴────────┐   ┌──────┴──────┐   ┌───────┴───────┐
           │                 │   │             │   │               │
          是                 否  是            否   否               是
           │                 │   │             │   │               │
           ▼                 ▼   ▼             ▼   ▼               ▼
        更新当前 change      新建  更新当前      新建 更新当前          新建
```

| 判断点               | 更新当前 change                  | 新建 change                          |
| -------------------- | -------------------------------- | ------------------------------------ |
| **是不是同一件事**   | "还是原来的事，只是变得更明确"   | "不同的工作"                         |
| **内容重叠多不多**   | 重叠度 > 50%                     | 重叠度 < 50%                         |
| **原任务能不能完成** | 不加这些改动，原任务就完成不了   | 原任务已经能完成，新工作可以独立存在 |
| **整体说明是否清楚** | 连续更新后，别人还能看懂演变过程 | 继续改会让 proposal / specs 越来越乱 |



## 原则

> 继续更新当前 change 的好处是：能保留之前的思考过程和上下文。
> 新开一个 change 的好处是：能让事情重新变得清楚。
>
> 如果前面的讨论、修改过程对理解当前工作很重要，就继续更新。
> 如果继续在原来的基础上改只会越来越乱，那就新开一个 change。

**你可以把 change 理解得像 Git 分支一样**：

* 还在做同一个功能，就继续在当前分支上提交
* 如果已经变成新的需求或新的工作，就开一个新分支
* 有时候先把第一阶段做完并合并，再为第二阶段开一个新的分支继续做





# 它和以前相比有什么变化？

|            | 旧版（`/openspec:proposal`）       | OPSX（`/opsx:*`）                                     |
| ---------- | ---------------------------------- | ----------------------------------------------------- |
| **结构**   | 所有内容都塞进一个大 proposal 里   | 拆成多个独立产物，比如 proposal、specs、design、tasks |
| **工作流** | 固定顺序：先规划，再实现，最后归档 | 更灵活，创建、更新、实现、归档这些动作随时可以做      |
| **迭代**   | 想回头改东西比较麻烦               | 开发过程中学到新信息后，可以随时更新对应 artifact     |
| **自定义** | 固定结构                           | 由 schema 驱动，可以自己定义 artifacts 和依赖关系     |

**核心想法**：真实工作不是一步接一步直线推进的。OPSX 承认这一点，不再强行把工作流程设计成固定顺序。



# 深入讲解架构设计

这一节会讲 OPSX 背后是怎么运行的，以及它和旧版 OpenSpec 工作流有什么区别。
这里的示例会用扩展版命令，比如：`new、continue 等`

但如果你没有开启扩展工作流，也不用担心。你可以把它对应理解为默认流程里的：

```txt
/opsx:propose → /opsx:apply → /opsx:sync → /opsx:archive
```


## 设计理念：固定阶段和灵活动作的区别

```txt
┌─────────────────────────────────────────────────────────────────────────────┐
│                         旧版工作流                                            │
│                    （阶段锁定，要么全做要么不做）                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│   │   规划阶段    │ ───► │   实现阶段    │ ───► │   归档阶段    │               │
│   └──────────────┘      └──────────────┘      └──────────────┘              │
│         │                     │                     │                       │
│         ▼                     ▼                     ▼                       │
│   /openspec:proposal   /openspec:apply      /openspec:archive               │
│                                                                             │
│   • 一次性创建所有 artifacts                                                  │
│   • 实现过程中不能回头更新 specs                                               │
│   • 阶段关卡强制线性推进                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                            OPSX 工作流                                       │
│                      （流动式动作，可迭代）                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│              ┌────────────────────────────────────────────┐                 │
│              │           动作，而不是阶段                  │                   │
│              │                                            │                 │
│              │   new ◄──► continue ◄──► apply ◄──► archive │                │
│              │    │          │           │           │    │                 │
│              │    └──────────┴───────────┴───────────┘    │                 │
│              │              任意顺序                       │                 │
│              └────────────────────────────────────────────┘                 │
│                                                                             │
│   • 可以一次创建一个 artifact，也可以快速推进一次性创建                            │
│   • 实现过程中可以更新 specs / design / tasks                                  │
│   • 依赖关系只是推动进展，阶段本身不存在                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```



## 各个组成部分是怎么设计和协作的

旧版 OpenSpec 的**提示词模板**不是普通用户能直接编辑的 `.md` 或 `.yaml` 文件，而是**写在工具内部的 TypeScript 源码里**。所以如果你觉得模板不好，想改提示词、改结构、改输出格式，就很麻烦。你不能简单改一个模板文件，而**可能要等官方改代码、重新发布版本**。

```txt
┌─────────────────────────────────────────────────────────────────────────────┐
│                      旧版工作流组件                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   硬编码模板（TypeScript 字符串）                                             │
│                    │                                                        │
│                    ▼                                                        │
│   针对特定工具的配置器 / 适配器                                               │
│                    │                                                        │
│                    ▼                                                        │
│   生成的命令文件（.claude/commands/openspec/*.md）                            │
│                                                                             │
│   • 结构固定，没有 artifact 感知能力                                          │
│   • 想修改就需要改代码 + 重新构建                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```



OPSX 则把工作流结构放到外部 schema 里，比如定义有哪些 artifact、它们之间有什么依赖关系、哪个 artifact 可以在什么时候生成。

```txt
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPSX 组件                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Schema 定义（YAML）                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  name: spec-driven                                                  │   │
│   │  artifacts:                                                         │   │
│   │    - id: proposal                                                   │   │
│   │      generates: proposal.md                                         │   │
│   │      requires: []              ◄── 依赖项                            │   │
│   │    - id: specs                                                      │   │
│   │      generates: specs/**/*.md  ◄── Glob 匹配模式                     │   │
│   │      requires: [proposal]      ◄── proposal 生成后才启用              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Artifact 图引擎                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • 拓扑排序（依赖顺序）                                                │
│   │  • 状态检测（文件系统中是否已存在）                                      │
│   │  • 生成丰富指令（模板 + 上下文）                                         │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Skill 文件（.claude/skills/openspec-*/SKILL.md）                           │
│                                                                             │
│   • 跨编辑器兼容（Claude Code、Cursor、Windsurf）                            │
│   • Skills 可查询 CLI 以获取结构化数据                                       │
│   • 可通过 schema 文件完全自定义                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```



## 依赖图模型

这一节要讲 OPSX **如何根据 artifact 之间的依赖关系来决定生成顺序**。

比如：`proposal → specs → design → tasks`

意思是：

* 先有 `proposal`，才能生成 `specs`；
* 先有 `specs`，才能生成 `design`；
* 先有 `design`，才能生成 `tasks`。

OPSX 会把这些关系看成一张图，然后判断：

```txt
哪些 artifact 已经存在？
哪些 artifact 的依赖已经满足？
接下来可以创建哪些 artifact？
```

所以它不是靠固定阶段推进，而是靠依赖关系判断“现在能做什么”。

OPSX 的 artifact 不是简单线性排列，而是一个 DAG。
比如：`proposal → specs → design → tasks`

这里的箭头表示依赖关系：`specs` 依赖 `proposal`，所以有了 `proposal` 之后，`specs` 就可以生成。
但这个依赖不是传统意义上的“阶段门禁”。它不是说你进入 `tasks` 后就不能回头改 `design`。
它只是告诉系统：**当前哪些 artifact 已经满足生成条件，哪些还没满足。**

```TXT
                              proposal
                             （根节点）
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
                 specs                       design
              （依赖：                    （依赖：
               proposal）                   proposal）
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                               tasks
                           （依赖：
                            specs、design）
                                  │
                                  ▼
                          ┌──────────────┐
                          │   APPLY 阶段  │
                          │ （依赖：      │
                          │  tasks）      │
                          └──────────────┘
```



状态转换：

```txt
   阻塞 ────────────────► 就绪 ────────────────► 完成
      │                     │                    │
   缺少依赖               所有依赖已完成          文件已存在于文件系统中
```





## 信息流

旧版工作流里，AI Agent 拿到的是固定不变的提示词说明。

旧版 OpenSpec 给 Agent 的指令是提前写死的、静态的。
不管你的项目是什么、当前 change 到哪一步、哪些 artifact 已经存在，Agent 拿到的核心说明都差不多。

```txt
  用户："/openspec:proposal"
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  静态指令：                              │
  │  • 创建 proposal.md                      │
  │  • 创建 tasks.md                         │
  │  • 创建 design.md                        │
  │  • 创建 specs/<capability>/spec.md       │
  │                                         │
  │  不知道哪些文件已经存在，                │
  │  也不了解 artifacts 之间的依赖关系        │
  └─────────────────────────────────────────┘
           │
           ▼
  Agent 一次性创建所有 artifacts
```



OPSX 不像旧版那样只给 Agent 一段写死的说明。
它会让 Agent 先了解当前状态，比如：

```txt
现在有哪些 artifacts 已经存在？
哪些 artifact 还没生成？
哪些依赖已经满足？
项目配置里有哪些 context 和 rules？
当前应该创建哪个 artifact？
```

然后 Agent 再根据这些动态信息生成或更新对应内容。

```txt
  用户："/opsx:continue"
           │
           ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  第 1 步：查询当前状态                                                    │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec status --change "add-auth" --json                      │
  │  │                                                                    │
  │  │  {                                                                 │
  │  │    "artifacts": [                                                  │
  │  │      {"id": "proposal", "status": "done"},                         │
  │  │      {"id": "specs", "status": "ready"},      ◄── 第一个就绪项       │
  │  │      {"id": "design", "status": "ready"},                          │
  │  │      {"id": "tasks", "status": "blocked", "missingDeps": ["specs"]}│
  │  │    ]                                                               │
  │  │  }                                                                 │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  第 2 步：获取就绪 artifact 的详细指令                                     │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec instructions specs --change "add-auth" --json          │
  │  │                                                                    │
  │  │  {                                                                 │
  │  │    "template": "# Specification\n\n## ADDED Requirements...",      │
  │  │    "dependencies": [{"id": "proposal", "path": "...", "done": true}│
  │  │    "unlocks": ["tasks"]                                            │
  │  │  }                                                                 │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  第 3 步：读取依赖项 → 创建一个 artifact → 显示解锁了什么                 │
  └──────────────────────────────────────────────────────────────────────────┘
```





## 迭代模型

旧版工作流——迭代起来很别扭：

```txt
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │/proposal│ ──► │ /apply  │ ──► │/archive │
  └─────────┘     └─────────┘     └─────────┘
       │               │
       │               ├── “等等，设计错了”
       │               │
       │               ├── 可选做法：
       │               │   • 手动编辑文件（会破坏上下文）
       │               │   • 放弃并重新开始
       │               │   • 硬着头皮继续，之后再修
       │               │
       │               └── 没有官方的“回退”机制
       │
       └── 一次性创建所有 artifacts
```



OPSX —— 自然的迭代：

```txt
  /opsx:new ───► /opsx:continue ───► /opsx:apply ───► /opsx:archive
      │                │                  │
      │                │                  ├── “设计错了”
      │                │                  │
      │                │                  ▼
      │                │            直接编辑 design.md
      │                │            然后继续！
      │                │                  │
      │                │                  ▼
      │                │         /opsx:apply 会从你
      │                │         上次停下的地方继续
      │                │
      │                └── 创建一个 artifact，并显示解锁了什么
      │
      └── 创建 change 脚手架，然后等待下一步指令
```



## 自定义 Schema

你可以通过管理 schema 的相关命令，来创建自己的自定义工作流。

```txt
# 新建一套自己的工作流 schema，会交互式引导你填写
openspec schema init my-workflow

# 也可以复制默认的 spec-driven schema，改成自己的 my-workflow
openspec schema fork spec-driven my-workflow

# 检查你的 schema 有没有写错
openspec schema validate my-workflow

# 查看 OpenSpec 实际使用的是哪个位置的 my-workflow schema
openspec schema which my-workflow	
```

schema 文件可以放在两个地方：

* `openspec/schemas/`，这是当前项目里的 schema，通常会提交到 Git，团队成员都能一起使用。
* `~/.local/share/openspec/schemas/`，这是你电脑用户级别的全局 schema，主要给你自己在多个项目里复用。

​	

**Schema structure:**（文件结构）

```txt
openspec/schemas/research-first/
├── schema.yaml
└── templates/
    ├── research.md
    ├── proposal.md
    └── tasks.md
```

示例 `schema.yaml`：

```txt
name: research-first
artifacts:
  - id: research        # 添加在 proposal 之前。
    generates: research.md
    requires: []

  - id: proposal
    generates: proposal.md
    requires: [research]  # proposal 要等 research 完成后才能进行

  - id: tasks
    generates: tasks.md
    requires: [proposal]
```



各个 artifact 之间的依赖关系图：

```txt
   research ──► proposal ──► tasks
```





### Schema 说明

这里的 Schema 可以理解成 `OPSX 工作流的“结构说明书”`
它用来告诉 OpenSpec：

```txt
这套工作流叫什么？
有哪些 artifact？
每个 artifact 生成什么文件？
artifact 之间谁依赖谁？
每个 artifact 用什么模板？
什么时候可以生成下一个 artifact？
```



* **schema 不是数据库 schema**

  这里的 schema **不是** MySQL / MongoDB 里的表结构。

  它更像是一个 **工作流定义文件**。
  比如默认的 `spec-driven` schema 可能规定：

  ```txt
  proposal → specs / design → tasks → apply
  ```

  意思是：

  ```txt
  先生成 proposal
  有了 proposal 后，可以生成 specs 和 design
  有了 specs 和 design 后，才能生成 tasks
  有了 tasks 后，才能开始实现
  ```

* **schema 决定有哪些 artifact**

  比如默认 `spec-driven` schema 里有这些 artifact：

  ```txt
  proposal：变更提案
  specs：规格说明
  design：技术设计
  tasks：实现任务
  ```

  也就是说，schema 会定义：

  ```txt
  artifacts:
    - id: proposal
      generates: proposal.md
      requires: []
  
    - id: specs
      generates: specs/**/*.md
      requires: [proposal]
  
    - id: design
      generates: design.md
      requires: [proposal]
  
    - id: tasks
      generates: tasks.md
      requires: [specs, design]
  ```

  这就表示：

  `proposal` 不依赖任何东西，可以最先生成。
  `specs` 和 `design` 依赖 `proposal`。
  `tasks` 依赖 `specs` 和 `design`。

> **schema = 定义 OPSX 工作流结构的配置**。





## 总结

| Aspect         | Legacy                         | OPSX                             |
| -------------- | ------------------------------ | -------------------------------- |
| **模板**       | 硬编码在 TypeScript 中         | 外部 YAML + Markdown             |
| **依赖关系**   | 没有依赖关系（一次性全部生成） | 使用 DAG，并通过拓扑排序确定顺序 |
| **状态**       | 基于阶段的心智模型             | 根据文件系统中是否存在文件来判断 |
| **自定义**     | 修改源码并重新构建             | 创建 `schema.yaml`               |
| **迭代**       | 被阶段锁定                     | 流动式，可以编辑任何内容         |
| **编辑器支持** | 针对不同工具的配置器 / 适配器  | 单一 skills 目录                 |





## Schemas

OpenSpec 里的 schema 就像一份工作流结构表。它会告诉系统：这个工作流里应该有哪些产物，比如 `proposal`、`specs`、`design`、`tasks`，以及它们应该按什么依赖关系推进。

* **spec-driven** (默认工作流): proposal → specs → design → tasks

  ```txt
  # 查看当前有哪些 schema 可以用
  openspec schemas
  
  # 查看每个 schema 实际是从哪个位置加载的
  openspec schema which --all
  
  # 通过交互式方式新建一个自己的工作流 schema
  openspec schema init my-workflow
  
  # 复制默认的 spec-driven schema，改成自己的 my-workflow
  openspec schema fork spec-driven my-workflow
  
  # 在使用前检查 my-workflow 这个 schema 有没有写错
  openspec schema validate my-workflow
  ```



# Tips

* 如果你还没确定要不要开始一个正式 change，可以先用 `/opsx:explore` 和 AI 一起梳理想法。

* 如果你已经很明确要做什么，就用：`/opsx:ff`，一次性生成规划产物。
  如果你还在边想边推进，就用：`/opsx:continue`，一步一步生成 artifact。 

* 执行 `/opsx:apply` 写代码时，如果发现 proposal、specs、design 或 tasks 里有问题，不需要重来。你只要把有问题的 artifact 改对，然后继续执行 `/opsx:apply`。

* 任务完成情况会记录在 `tasks.md` 里的 checkbox 里，比如：

  ```markdown
  - [x] 完成文章页字体调整
  - [ ] 优化移动端间距
  - [ ] 运行 pnpm build
  ```

* 你可以在任何时候运行这个命令，查看某个 change 当前进展到哪一步：

  ```bash
  openspec status --change "name"
  ```

  这里的 `"name"` 换成你的 change 名称。



> **现在这套东西还不够完善，但这是故意保持开放和粗糙的。因为大家还在探索，到底什么样的流程最好用。**







# 示例

我们的脑海里始终要有一个概念，最后一定会产出 4 个 artifact（产物）：

```txt
 proposal ──→ specs ──→ design ──→ tasks
```





## 从 0 开始

如果你刚开始用 OPSX，我建议你按这个流程来执行命令：

```txt
/opsx:explore -->  /opsx:propose  --> /opsx:apply -->  /opsx:archive
```

这是默认核心工作流，最简单。



* 例子1：**你还没想清楚需求时**

  比如你现在只是觉得：`文章页看起来不舒服，字体和排版不够适合中文阅读。`

  这时不要直接 `/opsx:propose`，**先用**：`/opsx:explore`

  然后你可以对 AI 说：

  ```txt
  我想优化文章详情页的中文阅读体验，但还没想清楚具体要改哪些地方。
  请你帮我一起分析：
  1. 当前页面可能有哪些阅读体验问题
  2. 中文阅读适合什么字体、字号、行高、段落间距
  3. 哪些地方应该改，哪些地方暂时不要动
  4. 最后帮我整理成一个适合进入 OPSX change 的方向
  ```

  这个阶段不会强制生成正式文档，它更像是和 AI 讨论。

  

  **使用场景**：

  ```txt
  我还没想清楚要不要做
  我不确定问题在哪
  我想先比较几个方案
  我想让 AI 帮我梳理需求
  ```

* 例子2： **想清楚后正式创建 change**

  当你已经明确要做：**优化文章页中文阅读体验**。

  就可以用： `/opsx:propose`

  你可以这样输入：

  ```txt
  /opsx:propose
  
  创建一个 change：improve-article-reading-experience
  
  目标：
  优化文章详情页的中文阅读体验，让字体、标题间距、正文行高、段落间距更适合中文用户阅读。
  
  范围：
  1. 修改文章详情页的排版和字体
  2. 优化标题、正文、列表、代码块的阅读层级
  3. 弱化底部“上一章 / 下一章”按钮的视觉重量
  4. 保持现有功能不变
  5. 不重构路由、不重构 markdown 渲染逻辑
  
  技术约束：
  1. 项目是 Vue 3 + TypeScript + Vite
  2. 尽量只修改文章详情页相关文件
  3. 字体要适合国内用户，不能依赖 Google Fonts
  4. 修改后需要运行 pnpm build
  ```

  这时 OPSX 会帮你生成规划产物，比如：

  ```txt
  proposal.md
  specs.md
  design.md
  tasks.md
  ```

  或者根据默认核心流程，**一次性生成**实现前需要的规划内容。

* **开始实现**

  规划文件生成后，用：`/opsx:apply`，如果当前只有一个 change，它可能会自动识别。

  如果你有多个 change，建议明确指定：`/opsx:apply improve-article-reading-experience`

  然后**你可以补充要求**：

  ```txt
  只执行 tasks.md 里的第一个未完成任务。
  修改前先说明你要改哪个文件。
  不要顺手修其他问题。
  修改后运行 pnpm build。
  完成后把 tasks.md 对应任务打勾。
  ```

  AI 会按 `tasks.md` 里的任务一步步做。

  例如 `tasks.md` 可能长这样：

  ```markdown
  - [ ] 调整文章详情页整体字体栈
  - [ ] 优化正文 font-size、line-height、letter-spacing
  - [ ] 调整 h1/h2/h3 的 margin 和层级
  - [ ] 弱化上一章 / 下一章按钮样式
  - [ ] 检查移动端阅读体验
  - [ ] 运行 pnpm build
  ```

  做完第一个任务后，它会改成：

  ```markdown
  - [x] 调整文章详情页整体字体栈
  - [ ] 优化正文 font-size、line-height、letter-spacing
  ```

* **实现过程中发现设计错了怎么办？**

  假设你执行 `/opsx:apply` 时发现：" **原来设计里说用某个字体，但这个字体在国内系统里不稳定**。 "

  这时**不要重新创建一个 change**。

  你可以直接说：

  ```txt
  当前 design.md 里的字体方案不合适。
  请更新 design.md：
  1. 不使用 Google Fonts
  2. 使用系统中文字体栈
  3. Windows 优先 Microsoft YaHei / DengXian
  4. macOS 优先 PingFang SC
  5. 保持原 change 的目标不变
  
  更新后继续执行 /opsx:apply。
  ```

  这就是 OPSX 的核心思想：

  ```txt
  实现中发现问题
  ↓
  修改 artifact
  ↓
  继续 apply
  ```

  不用重来，也不用硬着头皮继续。

* **随时查看当前状态**

  如果你不知道当前 change 到哪一步了，可以运行：

  ```bash
  openspec status --change "improve-article-reading-experience"
  ```

  它可能会告诉你类似：

  ```txt
  proposal: done
  specs: done
  design: done
  tasks: done
  apply: in progress
  ```

  

  或者：

  ```txt
  proposal: done
  specs: ready
  design: ready
  tasks: blocked
  ```

  意思是：

  ```txt
  proposal 已经完成
  specs 和 design 可以生成
  tasks 还不能生成，因为依赖没满足
  ```

* **完成后归档**

  当所有任务做完，构建也通过了，就用命令：`/opsx:archive`

  或者：`/opsx:archive improve-article-reading-experience`

  它的作用是：

  ```txt
  把这个 change 移到归档区
  必要时提醒你同步 specs
  结束这次变更
  ```

  





## 扩展工作流

如果你启用了 expanded workflow，可以用更细的命令：

```txt
/opsx:new
/opsx:continue
/opsx:ff
/opsx:apply
/opsx:verify
/opsx:archive
```



* `/opsx:new`：**只创建 change 骨架**

  适合你想先创建一个 change，但不急着生成所有文档。

  例子：

  ```txt
  /opsx:new improve-article-reading-experience
  
  目标：
  优化文章详情页中文阅读体验。
  ```

  它可能只创建目录和基础文件结构。

* `/opsx:continue`：**一次生成一个 artifact**

  适合你想一步一步来，比如：

  ```txt
  /opsx:continue improve-article-reading-experience
  ```

  第一次可能生成：`proposal.md`，你检查没问题后，再运行

  ```txt
  /opsx:continue improve-article-reading-experience
  ```

  它再生成：`specs.md`，

  再运行一次，可能生成：`design.md`，

  再运行一次，可能生成：`tasks.md`，

  适合这种情况：

  ```txt
  我想每一步都检查
  我不想一次性生成太多
  我还在边想边推进
  ```

* `/opsx:ff`：**一次性生成所有规划产物**

  如果你已经很清楚要做什么，可以用：

  ```txt
  /opsx:ff improve-article-reading-experience
  ```

  它会快速生成所有 planning artifacts。

* `/opsx:verify`：**检查实现是否符合文档**

  实现完成后，可以用：

  ```bash
  /opsx:verify improve-article-reading-experience
  ```

  它会检查：

  ```txt
  代码是否符合 proposal
  是否满足 specs
  是否按 design 实现
  tasks 是否都完成
  有没有遗漏
  ```

  **适合提交 PR 或 commit 前用**。







## /opsx:propose vs. /opsx:ff

| 对比点           | `/opsx:propose`                                     | `/opsx:ff`                              |
| ---------------- | --------------------------------------------------- | --------------------------------------- |
| 所属流程         | 默认核心工作流                                      | 扩展工作流                              |
| 起点             | 一个想法 / 一个需求                                 | 一个 change / 一个明确目标              |
| 主要职责         | 创建 change，并生成规划 artifacts                   | 快进当前 change，补齐规划 artifacts     |
| 是否强调状态检查 | 不强调，你直接走快速路径                            | 强调，会根据当前 artifact 状态补齐      |
| 替代谁           | **替代 `/opsx:new + /opsx:continue...` 的简单入口** | **替代多次 `/opsx:continue`**           |
| 适合场景         | 普通用户快速开始                                    | 高级用户在 expanded workflow 里快速推进 |

最关键的一行是：

```txt
/opsx:propose = 创建 change + 生成规划
/opsx:ff      = 对已有 change 做 fast-forward，补齐规划
```





### 使用流程图



* **默认核心流程**

  ```txt
  /opsx:explore
        ↓
  /opsx:propose
        ↓
  /opsx:apply
        ↓
  /opsx:archive
  ```

  这里 `/opsx:propose` 是默认流程里的正式入口。

* **扩展工作流**

  ```txt
  /opsx:explore
        ↓
  /opsx:new
        ↓
  /opsx:continue
        ↓
  /opsx:continue
        ↓
  /opsx:continue
        ↓
  /opsx:apply
        ↓
  /opsx:archive
  ```

* **如果你不想多次 continue，可以用**：

  ```txt
  /opsx:explore
        ↓
  /opsx:new
        ↓
  /opsx:ff
        ↓
  /opsx:apply
        ↓
  /opsx:archive
  ```

  所以 `/opsx:ff` 的真正作用是：

  ```txt
  把多次 /opsx:continue 快进成一次
  ```

  
