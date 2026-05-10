---
title: Superpowers： 强大的 TDD（测试驱动开发）
publishedAt: 2026-04-20
tags:
  - AI Coding
  - 测试驱动开发
---

# Superpowers 是什么？

**Superpowers** 是由 Jesse Vincent（网名 obra）开发的开源的 Agent Skill 框架，
专门解决 AI Coding 中的一个核心问题：**如何让 AI 写出"工程级"的代码，而不是"玩具级"的代码。**

想象一下，普通 AI 编程助手就像一个"聪明的实习生"——它能写出能跑的代码，但可能没有测试、没有文档、没有遵循最佳实践。而 Superpowers 则像是给这个实习生配备了一位"资深工程师导师"，强制它遵循完整的软件开发流程。



# 为什么需要 Superpowers ？

在没有 Superpowers 之前，使用 Claude Code 存在一些问题：

* **Vibe Coding 的混乱**：AI 直接开始写代码，没有规划，导致频繁返工
* **缺少 TDD 纪律**：AI 习惯先写代码再补测试，甚至干脆不写测试
* **需求模糊直接动手**：用户说"做一个登录功能"，AI 就开始写，结果做出来不是想要的
* **代码质量不稳定**：没有代码审查机制，质量依赖 AI 的"心情"

Superpowers 解决了这些问题，让 Claude 变成一个"有纪律的开发团队"——它先帮你澄清需求，然后制定计划，再用 TDD 方式开发，最后通过代码审查确保质量。



# Superpowers 的核心 Skill

Superpowers 包含 **14+ 个可组合技能**，覆盖整个软件开发生命周期。让我们按类别了解它们。

**下面将 Claude Code 作为我们的 AI Agent**



## 测试类 Skill

### test-driven-development

* **它能做什么**？

  强制 Claude 遵循 TDD 红绿重构循环，而不是"想起来再写测试"。

* **如何触发**

  提示词中提到 "TDD"、"测试驱动开发"、"先写测试" 等关键词。

* 传统开发方式（**常见问题**）：

  1. 直接写代码
  2. 手动测试一下
  3. 发现 bug，修改代码
  4. 重复...（测试？下次再说吧）

* **TDD 方式**（ skill 激活后）：

  1. 🔴 **RED**：先写一个失败的测试
  2. 🟢 **GREEN**：写最少的代码让测试通过
  3. 🔵 **REFACTOR**：重构代码，保持测试通过
  4. 重复

使用示例：`用 TDD 方式实现一个用户认证模块`，

Claude Code 会：

1. 先编写测试（测试用户名密码验证、测试 token 生成...）
2. 运行测试，确认全部失败（RED）
3. 编写最小实现代码
4. 运行测试，确认通过（GREEN）
5. 重构代码，提取公共逻辑
6. 再次运行测试，确认仍然通过（REFACTOR）

> **注意**：如果你不提 "TDD"，Claude 可能也可能不写测试。这个技能的作用是**强化流程纪律**，确保测试不会"被遗忘"。



## 调试类技能

### systematic-debugging

* **它能做什么**？

  强制 Claude 在修 bug 时先找出**根本原因**，而不是看到报错就“猜一个原因，然后随手改代码”。
  它的核心原则是：

  > **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**
  >  没有完成根因调查之前，不允许开始修复。

  也就是说，这个 skill 的重点不是“更快改代码”，而是防止 Claude 乱改、误改、修表象不修根因。

* **如何触发**？

  当你让 Claude 处理 bug、报错、异常、测试失败、构建失败、功能不符合预期时，就适合触发。

  常见提示词：`使用 systematic-debugging 帮我排查这个 bug`、`不要直接改代码，请先用系统化调试方式找根因`、
  `pnpm build 报错了，用 systematic-debugging 分析原因`

* 传统调 bug 方式（**常见问题**）：

  1. 看到报错
  2. 猜测原因：“可能是这里的问题”
  3. 直接改代码
  4. 运行一下，好像好了
  5. 结果引入新 bug，或者过一会儿又坏了

  这种方式的问题是：**它可能只是消除了症状，没有找到真正原因**。

* **ystematic-debugging 方式**（skill 激活后）：

  1. **Root Cause Investigation：根因调查**

     先看清楚错误是什么，如何复现，最近改了什么，错误发生在哪个环节。

  2. **Pattern Analysis：模式对比**

     找一个“正常工作的类似代码”，和当前出问题的代码对比，看看差异在哪里。

  3. **Hypothesis and Testing：提出假设并验证**

     一次只提出一个假设，然后用最小证据验证它，而不是同时乱改多个地方。

  4. **Implementation：只修根因**

     找到根因之后，再进行最小修复，并补充测试或验证步骤，防止复发。



### verification-before-completion

* **它能做什么**？

  这个技能防止 Claude "感觉差不多"就停止工作。它要求 Claude 在声称任务完成前：

  1. 运行所有测试
  2. 手动测试关键功能
  3. 检查代码质量（lint）
  4. 确认文档已更新

* **如何触发**？

  有两种触发方式：

  * **自动触发：Claude 准备说“完成”时触发**

    也就是当 Claude 准备说：`完成了`、`修好了`、`测试通过了`、`可以提交了`、`可以提 PR 了`。
    这时就应该自动触发 `verification-before-completion`。

    它的作用是拦住 Claude：`你先别急着说完成，先运行验证命令，拿到证据再说。`

  * **开发者手动触发**

    比如你直接写：

    ```TXT
    使用 verification-before-completion。
    修改完成后先运行 pnpm type-check 和 pnpm build。
    两个命令都通过后，才可以说完成。
    ```

    这就是你主动要求 Claude 遵守这个 skill。



## 协作类 Skill

### brainstorming

* **它能做什么**？

  强制 Claude 在真正写代码、改功能、搭组件之前，先把**需求、约束、方案、设计**想清楚。

  它的核心作用是：**先讨论设计，再进入实现**。

  也就是说，Claude 不能一听到你说“帮我做个功能”，就直接开始改代码。**它必须先了解项目上下文、问清楚需求、提出不同方案、让你确认设计，然后再进入后续计划和实现阶段**。Superpowers 官方说明里也明确写到：在没有展示设计并获得用户批准之前，不允许写代码、搭项目或执行实现动作。

* **如何触发**

  * 常见触发常见：

    提示词：`帮我新增一个功能`、`帮我设计一个组件`、`帮我改一下页面交互`

  * 明确触发

    `使用 brainstorming，先不要写代码，先和我讨论方案。`



### writing-plans

* **它能做什么**？

  强制 Claude 在真正实现之前，先把方案拆成一份**详细、可执行、可验证的实施计划**。

  它的核心作用是：**把“设计方案”变成“工程师可以一步一步执行的任务清单”**。

  也就是说，`brainstorming` 解决的是：`要做什么？为什么做？大概怎么设计？`

  而 `writing-plans` 解决的是：

  ```txt
  具体先改哪个文件？
  每一步做什么？
  每一步怎么测试？
  什么时候提交 commit？
  需要注意哪些风险？
  ```

  Superpowers 官方说明里提到，`writing-plans` 会生成 comprehensive implementation plans，也就是完整的实施计划，并且要假设执行者**不了解当前代码库和问题背景**，所以计划要写清楚文件、代码、测试、文档、验证方式等内容。

  **这个技能将大任务分解为 2-5 分钟可完成的小任务**。

* **如何触发**

  这个 skill 通常在 **brainstorming 完成之后**触发。

  **常见触发方式**：
  `使用 writing-plans，把刚才的设计拆成实施计划。`、`先不要写代码，请先写 plan，把任务拆小。`

  **也可以和前面的 `brainstorming` 连起来**：`先用 brainstorming 确认方案，确认后再用 writing-plans 生成实施计划。`

* **示例**

  需求：用 writing-plans 规划一个待办事项 API 的开发

  Claude 会生成详细计划：

  ```markdown
  # 实现计划
  
  ## 任务 1：设计数据库 schema（预计 5 分钟）
  - 创建 todos 表
  - 定义字段：id, title, completed, createdAt
  
  ## 任务 2：创建 Express 路由（预计 10 分钟）
  - POST /todos - 创建任务
  - GET /todos - 获取列表
  - GET /todos/:id - 获取单个
  - PUT /todos/:id - 更新
  - DELETE /todos/:id - 删除
  
  ## 任务 3：添加输入验证（预计 10 分钟）
  - 标题不能为空
  - completed 必须是布尔值
  
  ## 任务 4：编写测试（预计 15 分钟）
  - 为每个端点编写测试
  - 覆盖边界情况
  
  ## 任务 5：启动服务器并验证（预计 5 分钟）
  - 运行测试
  - 手动测试 API
  
  验收标准：
  - 所有测试通过
  - curl 测试每个端点正常
  ```





### executing-plans

* **它能做什么**？

  强制 Claude 按照已经写好的 implementation plan **逐步执行任务**，而不是边做边改计划、临时发挥、跳步骤。**这个技能批量执行计划，并在每个检查点暂停确认**。

  它的核心作用是：**读取 plan → 审查 plan → 按任务执行 → 每步验证 → 完成后汇报**。

* **如何触发**

  这个 skill 通常在你已经有一份 implementation plan 之后触发。

  常见触发方式：
  `使用 executing-plans，执行这个 implementation plan。`、`按照 docs/superpowers/plans/xxx-plan.md 逐步执行。`

* **示例**

  提示词：`执行上面的计划，每完成一个任务暂停一下`

  Claude 会：

  1. 完成任务 1，然后暂停：`✅ 数据库 schema 完成，继续吗？`
  2. 你确认后完成任务 2，再次暂停
  3. 以此类推

  这让你可以在每个阶段检查方向是否正确，避免跑远了才发现错了。





### dispatching-parallel-agents

* **它能做什么**？

  **这个技能可以同时启动多个子代理并行工作**。

  让 Claude 在遇到**多个互相独立的问题**时，不要一个一个慢慢查，而是把问题拆开，分配给多个子 Agent **同时调查或执行**。

  它的核心原则是：**一个独立问题域，派一个 Agent**。

  比如现在有 3 个测试文件同时报错，而且它们分别属于 3 个不同模块：

  ```txt
  auth.test.ts 失败
  payment.test.ts 失败
  article.test.ts 失败
  ```

  普通方式是 Claude 一个个看。

  `dispatching-parallel-agents` 的方式是：

  ```txt
  Agent A 查 auth 问题
  Agent B 查 payment 问题
  Agent C 查 article 问题
  ```

  官方说明里也强调：当多个失败来自不同测试文件、不同子系统、不同 bug，并且彼此独立时，顺序调查会浪费时间，应该并行派发 Agent。

* **如何触发**

  * **主动触发**

    提示词：`使用 dispatching-parallel-agents，把这些失败测试分给多个 Agent 并行排查。`

* **示例**

  遇到 3 个不同模块的报错，直接写提示词：

  ```TXT
  我有 3 个模块同时报错：登录、文章详情页、移动端菜单。
  使用 dispatching-parallel-agents，每个模块派一个 Agent 先独立分析原因。
  ```





### subagent-driven-development

* **它能做什么**？

  让 Claude 不要用“一个主 Agent 从头写到尾”的方式开发，而是把 plan 里的每个任务交给一个**全新的子 Agent**去做。

  直白说就是：**一个任务，派一个新的子 Agent，每个子 Agent 只拿到当前任务需要的上下文，做完后还要经过两轮 review，通过后，主 Claude 再继续派下一个任务**。

  这个 skill 的核心原则： **每个任务一个新子 Agent + 每个任务完成后做两轮审查**

* **如何触发**

  这个 skill 通常在你已经有一份 implementation plan 之后触发。

  常见触发方式：
  `使用 subagent-driven-development 执行这个 plan。`、`请按这个 implementation plan 执行，每个任务派一个新的 subagent。`、`这个 plan 里的任务相对独立，请用 subagent-driven-development 来做。`

  **它适合的条件**是：

  1. 已经有 implementation plan
  2. **任务之间相对独立**
  3. 想留在当前会话里协调整体进度
  4. **想减少上下文污染**
  5. 想让每个任务做完后自动 review



* **subagent-driven-development 方式**（skill 激活后）：

  1. **先读取 implementation plan**

     先确认 plan 里有哪些任务。

     比如：

     ```
     Task 1：调整文章详情页字体
     Task 2：优化上一章 / 下一章按钮
     Task 3：修复移动端目录按钮
     Task 4：运行最终验证
     ```

  2. **每个任务派一个新的子 Agent**

     不是让同一个 Claude 一直做，而是：

     ```
     Task 1 → 子 Agent A
     Task 2 → 子 Agent B
     Task 3 → 子 Agent C
     ```

     每个子 Agent 都是“新开的”，不会继承主会话里一大堆杂乱上下文。

  3. **只给子 Agent 必要上下文**

     子 Agent 不应该拿到所有历史聊天记录。

     主 Claude 会给它：

     ```
     当前任务目标
     相关文件
     不能改什么
     验证方式
     预期输出
     ```

     这样可以让它更专注。

  4. **子 Agent 执行当前任务**

     子 Agent 负责实现、测试、自查。

     例如：

     ```
     子 Agent A 只负责优化 ArticleDetail.vue 的正文字体。
     不要修改路由。
     不要修改数据结构。
     修改后运行相关检查。
     ```

  5. **第一轮 review：检查是否符合 spec**

     先检查它有没有按照任务要求做。

     重点看：

     ```
     有没有做错需求？
     有没有漏掉任务？
     有没有改了不该改的东西？
     有没有偏离 plan？
     ```

     这叫 **spec compliance review**，也就是“规格符合性审查”。

  6. **第二轮 review：检查代码质量**

     如果第一轮过了，再看代码质量。

     重点看：

     ```
     代码是否清晰？
     有没有重复逻辑？
     有没有潜在 bug？
     有没有性能、安全、可维护性问题？
     ```

     这叫 **code quality review**。

  7. **通过 review 后，再进入下一个任务**

     如果 review 发现问题，就让子 Agent 修。

     修完再 review。

     通过后，主 Claude 再派下一个任务。

  8. **中间不要频繁问用户“要不要继续”**

     官方说明里强调：执行 plan 时不要在任务之间频繁停下来问用户“是否继续”。除非真的阻塞、需求不清楚，或者所有任务已经完成，否则应该继续执行 plan。

  

  subagent-driven-development  和 dispatching-parallel-agents 有什么区别？

  这两个很像，但重点不同。

  * `dispatching-parallel-agents` 更像：`多个独立问题，同时派多个 Agent 去查。`

    比如：

    ```txt
    Agent A 查 type-check
    Agent B 查 build
    Agent C 查移动端菜单
    ```

    重点是：**并行调查多个问题**。

  * 而 `subagent-driven-development` 更像：`按照 plan，一个任务一个 fresh subagent，做完还要 review。`

    重点是：**按计划开发，并且每个任务都有隔离上下文和双重审查**。

  你可以这样记：

  ```txt
  dispatching-parallel-agents = 多个 Agent 分头查问题
  subagent-driven-development = 按 plan 派子 Agent 做开发任务
  ```

  

  **注意**：`subagent-driven-development` 不是一上来就用的，它通常需要前面已经有：

  `brainstorming → writing-plans → subagent-driven-development`



### using-git-worktrees

* **它能做什么**？

  这个技能使用 Git 的 worktree 功能创建隔离的开发环境。

  让 Claude 在开始做功能、重构、执行 implementation plan 之前，先创建一个**隔离的工作区**，避免直接污染你当前正在用的项目目录和分支。

  Git worktree 本质上是 Git 自带的能力：它可以让同一个仓库同时拥有多个工作目录，每个目录可以切到不同分支。`using-git-worktrees` 这个 skill 的目标就是：在开始正式实现前，确保 Claude 是在一个隔离 workspace 里工作。官方说明的核心原则是：先检测是否已经隔离，再优先使用平台自带 worktree 工具，最后才退回到手动 `git worktree`。

* **为什么需要它**？

  有些任务会改很多文件，而且不一定一次成功。
  比如你让 Claude Code 做：

  ```txt
  重构文章详情页
  优化首页 hero 动画
  执行一个 implementation plan
  让 subagent 分多个任务改代码
  升级依赖
  大范围修复 type-check
  ```

  这些任务可能会出现：

  ```txt
  改动范围变大
  中途方案错了
  Claude 顺手改了别的文件
  测试失败
  你想放弃这次尝试
  ```

  这时如果它直接在你当前项目目录里改，你的当前工作区就会变得很乱。

  所以 git worktree 的作用是：**给这次“可能有风险的修改”开一个单独施工现场，成功了再合并，失败了直接丢掉，不影响原来的项目目录**。


  **还可以多次使用 using-git-worktrees 这个 skill 创建多个隔离的工作区，同时开发多个互相独立的功能。**

* **如何触发**

  * 提示词：`这个任务可能会改很多文件，请先开一个隔离工作区`、`我要重构博客文章详情页` 等等

  * 执行 implementation plan 之前

    例如：`使用 executing-plans 执行这个 plan`，
    这时就很适合先触发 `using-git-worktrees`，因为 plan 执行阶段通常会修改多个文件。

    你也可以主动这样写：

    ```txt
    使用 using-git-worktrees。
    在执行这个 plan 之前，先创建一个隔离的 git worktree，不要直接改我当前分支。
    ```

    

* **如何与其他 skill 使用**？

  比较稳的流程是：

  ```txt
  brainstorming
  → using-git-worktrees
  → writing-plans
  → executing-plans / subagent-driven-development
  → verification-before-completion
  → finishing-a-development-branch
  ```

  **正常情况下，使用一次 `using-git-worktrees`，就是为了确保“有一个隔离工作区”**，不是一上来就创建很多个工作区。

  使用一次 skill = 确保当前任务有一个隔离工作区



## 代码审查类 Skill

### requesting-code-review

* **它能做什么**？

  让 Claude 在自己写完代码后，不要马上说“没问题了”，而是**自动**派一个**代码审查子 Agent**来检查这次改动。

* **如何触发**

  * 提示词

    `在创建 PR 前，先做 code review`，

    `在 commit 之前，请派一个 reviewer subagent 检查 diff`,

    `在继续下一个 task 前，先请求代码审查`



### receiving-code-review

* **它能做什么**？

  收到 requesting-code-review 这个 skill 创建的代码审查子代理的反馈后，Claude 不能无脑说“你说得对，我马上改”。 **它要先读懂、验证、判断，再决定接受还是反驳**。

* **如何触发**

  ```txt
  Claude 写完代码
  ↓
  requesting-code-review：派 reviewer 检查
  ↓
  reviewer 返回反馈
  ↓
  receiving-code-review：自动触发，处理反馈
  ↓
  确认哪些接受、哪些反驳、哪些需要修改
  ↓
  修改后验证
  ```

  



# Superpowers 完整工作流

Superpowers 的真正威力在于将**多个技能组合成完整的开发流程**。

## 标准开发流程

```txt
1. Brainstorming（头脑风暴）
   Skill：brainstorming
   触发：自动为主；用户也可以手动点名
   作用：澄清真实需求、项目上下文、约束、成功标准

   ↓ 用户确认设计

2. Design Document（设计文档）
   Skill：仍然是 brainstorming 的一部分
   触发：自动
   作用：保存设计文档 + 自查 spec + 让用户 review

   ↓ 设计文档确认

3. Using Git Worktrees（隔离工作区）
   Skill：using-git-worktrees
   触发：条件触发 / 半自动
   作用：如果要真正改代码，先确认是否需要隔离 worktree

   ↓ baseline 验证通过

4. Writing Plans（编写计划）
   Skill：writing-plans
   触发：自动为主；也可手动点名
   作用：把设计拆成 2-5 分钟的小任务，每步有文件、代码、测试、验证

   ↓ 用户选择执行方式

5A. Subagent Development（推荐）
   Skill：subagent-driven-development
   触发：用户选择后手动进入；进入后内部自动执行
   作用：每个任务一个 fresh subagent，每个任务两阶段 review

   或者

5B. Inline Execution（顺序执行）
   Skill：executing-plans
   触发：用户选择后手动进入
   作用：在当前会话按 plan 顺序执行，有 checkpoints

   ↓ 每个任务执行过程中

6. TDD（测试驱动开发）
   Skill：test-driven-development
   触发：自动
   作用：实现功能 / bugfix / 重构时，必须 RED-GREEN-REFACTOR

   ↓ 遇到失败或异常时

7. Systematic Debugging（系统化调试）
   Skill：systematic-debugging
   触发：自动
   作用：测试失败、构建失败、bug、异常行为时，先找根因再修

   ↓ 每个任务完成后

8. Requesting Code Review（请求代码审查）
   Skill：requesting-code-review
   触发：自动为主
   作用：派 reviewer subagent 检查需求符合度和代码质量

   ↓ 收到 review 反馈

9. Receiving Code Review（处理审查反馈）
   Skill：receiving-code-review
   触发：自动
   作用：逐条理解、验证、判断、接受或反驳，再修改

   ↓ 准备说完成 / 进入下一步 / commit / PR 前

10. Verification Before Completion（完成前验证）
    Skill：verification-before-completion
    触发：自动
    作用：必须运行验证命令，有证据后才能说完成

    ↓ 全部任务完成

11. Finishing a Development Branch（开发分支收尾）
    Skill：finishing-a-development-branch
    触发：自动为主
    作用：测试通过后，决定 merge、PR、保留、丢弃，并清理 worktree
```





## 实战案例： 用 Superpowers 构建用户认证系统

让我们通过一个完整的例子来体验 Superpowers 的工作流程。

假设你现在对 Claude Code 说：`我需要一个用户认证系统。`
如果直接使用 Claude Code，它可能会马上开始写代码。
但如果你下载并使用 Superpowers，它不会一上来就写代码，而是会按一套更稳的工程化流程来推进。



### 第一步：Brainstorming 澄清需求

* 你给 Claude Code 的提示词

  ```txt
  我需要开发一个用户认证系统。
  
  请使用 brainstorming。
  先不要写代码，先通过问答澄清真实需求、使用场景、功能边界和安全要求。
  每次只问一个最重要的问题。
  等需求清楚后，再给我 2-3 个可选方案，并推荐一个最适合当前项目的方案。
  ```

触发 Skill： `brainstorming`

触发方式：`自动触发为主，也可以手动触发`

* 生成产物

  ```txt
  澄清后的需求列表
  功能边界
  约束条件
  2-3 个设计方案
  推荐方案
  用户确认后的设计方向
  ```

  例如：

  ```txt
  确认后的需求：
  1. Web 应用用户认证
  2. 支持邮箱 + 密码注册
  3. 支持邮箱 + 密码登录
  4. 使用 JWT + Refresh Token
  5. 密码使用 bcrypt 加密
  6. 暂不做第三方登录
  7. 暂不做邮箱验证码
  8. 需要基础安全防护：密码不明文存储、登录失败返回通用错误
  ```

   

### 第二步：Design Document：生成设计文档

claude code 会让你确定上述需求，当你确认后，Claude Code 会自动帮你生成设计文档，
可能路径：`docs/superpowers/specs/2026-05-08-auth-system-design.md`



### 第三步： Using Git Worktrees：创建隔离工作区

你给 Claude Code 的提示词：

```txt
设计文档已经确认。

请使用 using-git-worktrees。
在开始写计划和修改代码之前，先检查当前是否已经在隔离 worktree 中。

要求：
1. 如果已经在 worktree 中，不要重复创建
2. 如果还没有，请先询问我是否要创建新的 worktree
3. 新 worktree 使用独立分支 feature/auth-system
4. 创建后进入新工作区
5. 先运行 pnpm install
6. 再运行 baseline 验证：pnpm type-check、pnpm test、pnpm build
7. baseline 通过后再继续
```



触发的 Skill：`using-git-worktrees`

触发方式：`条件触发 / 需要用户同意`

这个 skill 适合在设计确认后、真正改代码前使用。它会先检测当前是否已经在 linked worktree 中；如果已经在，就跳过创建。新版说明还强调：创建 worktree 前需要征得用户同意，不应隐式创建。



* **生成产物**

  ```TXT
  隔离工作区
  新分支
  baseline 验证结果
  ```

  

  例如：

  ```txt
  ../project-auth-system/
  feature/auth-system
  ```

  可能执行：

  ```bash
  git worktree add ../project-auth-system -b feature/auth-system
  cd ../project-auth-system
  pnpm install
  pnpm type-check
  pnpm test
  pnpm build
  ```

  输出结果：

  ```txt
  工作区：../project-auth-system
  分支：feature/auth-system
  
  Baseline 验证：
  - pnpm type-check：通过
  - pnpm test：通过
  - pnpm build：通过
  ```





### 第四步： Writing Plans：编写实现计划

你给 Claude Code 的提示词：

```txt
请使用 writing-plans。

根据已经确认的设计文档：
docs/superpowers/specs/2026-05-08-auth-system-design.md

生成用户认证系统的 implementation plan。

要求：
1. 不要直接写代码
2. 把任务拆成 2-5 分钟可以完成的小任务
3. 每个任务写清楚要修改哪些文件
4. 每个任务写清楚要新增哪些测试
5. 每个任务写清楚验证命令
6. 每个任务写清楚完成标准
7. 明确哪些内容不在本轮范围内
8. 最后让我选择使用 subagent-driven-development 还是 executing-plans 执行
```



触发 Skill：`writing-plans`

触发方式：`自动触发为主，也可以手动触发`



* **生成产物**

  `implementation plan`

  可能路径：`docs/superpowers/plans/2026-05-08-auth-system-plan.md`



### 第五步：执行计划

这一步是正式开发阶段。

这一步的流程：

```txt
第五步：执行 implementation plan
  ├─ 选择方式 A：subagent-driven-development
  ├─ 选择方式 B：executing-plans
  ├─ 每个编码任务内部：test-driven-development
  ├─ 遇到问题：systematic-debugging
  ├─ 任务完成后：requesting-code-review
  └─ 收到 review 后：receiving-code-review
```



#### 第五步 A：Subagent Development 子代理开发

适合任务较多、任务相对独立的情况。

你给 Claude Code 的提示词：

```txt
请使用 subagent-driven-development 执行这个 plan：

docs/superpowers/plans/2026-05-08-auth-system-plan.md

要求：
1. 每个任务启动一个 fresh subagent
2. 每个 subagent 只处理当前任务
3. 每个任务内部，如果涉及功能实现、bug 修复或行为变化，必须使用 test-driven-development
4. 也就是说，每个编码任务都要遵循 RED → GREEN → REFACTOR
5. 没有失败测试之前，不要写生产代码
6. 每个任务完成后做第一阶段 review：规格符合性审查
7. 再做第二阶段 review：代码质量审查
8. review 不通过就返回修复
9. 如果遇到测试失败、构建失败或异常行为，使用 systematic-debugging
10. 不要修改 plan 外的内容
11. 不要在任务之间频繁问我是否继续，除非遇到阻塞
12. 最后运行完整验证：pnpm type-check、pnpm test、pnpm build
```



触发 Skill：

```txt
subagent-driven-development
test-driven-development
systematic-debugging
requesting-code-review
receiving-code-review
```



触发方式：

```txt
subagent-driven-development：通常手动选择；进入后内部自动执行
test-driven-development：每个编码任务内部自动触发
systematic-debugging：遇到 bug、测试失败、构建失败时自动触发
requesting-code-review：每个任务完成后自动触发
receiving-code-review：收到 review 反馈后自动触发
```



#### 第五步 B：Executing Plans 顺序执行计划

如果你不想用子代理，也可以用 `executing-plans`。
这种方式就是 Claude Code 在当前会话里按 plan 顺序执行。

你给 Claude Code 的提示词：

```txt
请使用 executing-plans 执行这个 plan：

docs/superpowers/plans/2026-05-08-auth-system-plan.md

要求：
1. 先读取并审查 plan 是否完整
2. 按任务顺序执行
3. 不要跳过任务
4. 不要顺手修 plan 外的问题
5. 每个编码任务内部必须使用 test-driven-development
6. 也就是说，每个功能实现、bug 修复或行为变更都要遵循 RED → GREEN → REFACTOR
7. 每完成一个任务运行对应验证
8. 遇到 bug、测试失败或构建失败时，使用 systematic-debugging
9. 每个重要任务完成后，使用 requesting-code-review 请求代码审查
10. 收到 review 反馈后，使用 receiving-code-review 处理
11. 最后运行 pnpm type-check、pnpm test、pnpm build
```



触发 Skill：

```txt
executing-plans
test-driven-development
systematic-debugging
requesting-code-review
receiving-code-review
```



触发方式：

```txt
executing-plans：手动选择 / plan 推荐触发
test-driven-development：每个编码任务内部自动触发
systematic-debugging：遇到 bug、测试失败、构建失败时自动触发
requesting-code-review：任务完成后自动触发为主
receiving-code-review：收到 review 反馈后自动触发
```





### 第六步：Verification Before Completion 完成前验证

这一步不是再次开发，而是**交付前验收**。

当 Claude 准备说：

```txt
完成了
修好了
测试通过了
可以提交了
可以创建 PR 了
```

之前，必须触发 `verification-before-completion`。



### 第七步：Finishing Development Branch 开发分支收尾

功能通过验证后，还没有真正结束。

还需要处理：

```txt
是否 commit？
是否 push？
是否创建 PR？
是否合并？
是否保留 worktree？
是否清理分支？
```



你给 Claude Code 的提示词：

```txt
所有任务已经完成并通过验证。

请使用 finishing-a-development-branch 进行收尾。

要求：
1. 检查 git status
2. 总结本次修改
3. 确认是否需要 commit
4. 如果需要，生成合适的 conventional commit message
5. 如果需要 push，先确认当前分支
6. 给出后续选项：创建 PR、合并、保留分支、删除 worktree
7. 如果使用了 worktree，说明如何清理
```



触发 Skill：`finishing-a-development-branch`

触发方式：`自动触发为主，也可以手动触发`



* **生成产物**

  ```txt
  分支收尾报告
  commit message
  push / PR / merge / discard 选项
  worktree 清理方案
  ```





## 总结

正确的完整工作流总览

```TXT
1. Brainstorming：澄清需求
   Skill：brainstorming
   产物：需求列表、边界、方案、推荐方案

2. Design Document：生成设计文档
   Skill：brainstorming
   产物：design doc

3. Using Git Worktrees：创建隔离工作区
   Skill：using-git-worktrees
   产物：worktree、新分支、baseline 验证结果

4. Writing Plans：编写实现计划
   Skill：writing-plans
   产物：implementation plan

5. Execute Plan：执行计划
   选择 A：subagent-driven-development
   选择 B：executing-plans

   在第 5 步内部：
   - 每个编码任务使用 test-driven-development
   - 遇到问题使用 systematic-debugging
   - 每个任务完成后使用 requesting-code-review
   - 收到 review 反馈后使用 receiving-code-review

   产物：
   - 代码修改
   - 测试
   - TDD 记录
   - 调试记录
   - code review 报告
   - review 反馈处理结果

6. Verification Before Completion：完成前验证
   Skill：verification-before-completion
   产物：最终验证报告

7. Finishing Development Branch：分支收尾
   Skill：finishing-a-development-branch
   产物：commit / push / PR / merge / worktree 清理方案
```