# Tasks: Blog 项目重构任务拆分

## 任务粒度约定

- 每个任务只做一件事，小到可以单独 commit
- 每个任务最多修改 1~3 个核心文件
- 每个任务完成后项目必须可正常 `pnpm dev` 运行
- 任务状态：`- [ ]` 待开始、`- [x]` 已完成

---

## Phase 1: 紧急 Bug 修复（6 个任务）

- [x] **Task 1.1: 修复 Lenis 全局实例缺失**

  - 文件：
    - `src/main.ts`
  - 目标：
    - 在 `new Lenis({...})` 之后添加 `;(window as any).__lenis = lenis`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 知识库页滚动到底 → 点击返回顶部按钮 → 播放 Lenis 平滑动画（非瞬间跳转）
    - 知识库页点击 TOC 锚点 → 平滑滚动到目标位置
  - 依赖：无

- [x] **Task 1.2: 修复页面过渡动画 CSS 变量名**

  - 文件：
    - `src/components/PageTransitionOverlay.vue`
  - 目标：
    - 将 4 处 `--page-transition-stop-N` 改为 `--page-transition-base-N`（N=1,2,3,4）
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 首页和知识库页之间切换 → SVG 过渡动画有可见渐变色（非透明/纯黑）
  - 依赖：无

- [x] **Task 1.3: 修复 agent-skills 分类 ID 拼写和 category 参数**

  - 文件：
    - `src/data/knowledge.ts`
  - 目标：
    - 第 117 行：`convertToArticles(agentSkillsModules, 'build-with-claude-code')` → `'agent-skills'`
    - 第 132 行：`id: 'agen-skills'` → `id: 'agent-skills'`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 知识库页侧边栏展开 "Agent Skills" → 显示 7 篇文章
    - 选中文章后 URL hash 正确（如 `#agent-skills/规范说明`）
  - 依赖：无

- [x] **Task 1.4: 修复文章 tags YAML 列表格式解析**

  - 文件：
    - `src/data/articles.ts`
  - 目标：
    - 增强 `parseFrontmatter`，在单行解析循环后新增 YAML 列表格式（`  - value`）的检测和处理
    - 确保两种 tags 格式都能正确解析：方括号 `[a, b]` 和破折号列表 `\n  - a\n  - b`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 打开 `/logic/#/articles` → 文章卡片显示 tags（"测试", "Hello World"）
    - 打开文章详情页 → tags 正常显示
  - 依赖：无

- [x] **Task 1.5: 修复知识库文章图片路径解析**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 在 `renderer.image` 中，对以 `./images/` 开头的相对路径，基于 BASE_PATH 或分类目录进行正确解析
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 打开 claude-code 分类 → "Claude Code 如何工作" → 图片正常显示
    - 点击图片 → ImagePreview 弹窗正常
  - 依赖：无

- [x] **Task 1.6: 修复 HomeView 中 navigateWithTransition 未 await**

  - 文件：
    - `src/views/HomeView.vue`
  - 目标：
    - 将 `goToKnowledge` 函数中 `navigateWithTransition('/knowledge')` 改为 `await navigateWithTransition('/knowledge')`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 首页点击 "学习 AI" 按钮 → 过渡动画完整播放 → 进入知识库页
    - 动画期间快速连点 3 次 → 只触发一次导航
  - 依赖：无

---

## Phase 2: 创建共享基础设施（5 个任务）

- [x] **Task 2.1: 创建共享类型文件**

  - 文件：
    - `src/types/index.ts`（新建）
  - 目标：
    - 新建文件，汇集以下类型定义（仅定义，不修改已有文件的导入）：
      - `KnowledgeArticle` — 来自 `data/knowledge.ts`
      - `KnowledgeCategory` — 来自 `data/knowledge.ts`
      - `Article` — 来自 `data/articles.ts`
      - `Author` — 来自 `data/author.ts`
      - `TocItem` — 来自 `views/KnowledgeView.vue`（当前为局部类型）
  - 验收标准：
    - `pnpm type-check` 通过（新文件自身无语法错误）
    - `pnpm build` 通过
  - 人工验证：无（新文件未被引用，不影响运行时行为）
  - 依赖：无

- [x] **Task 2.2: 创建共享常量文件**

  - 文件：
    - `src/constants/index.ts`（新建）
  - 目标：
    - 新建文件，导出以下 `const`：
      - `BREAKPOINT_MOBILE = 767`
      - `BREAKPOINT_TABLET = 948`
      - `BREAKPOINT_DESKTOP = 1200`
      - `HEADER_HEIGHT = 80`
      - `SCROLL_SHOW_AT = 120`
      - `SCROLL_IDLE_DELAY = 420`
      - `SCROLL_OBSERVER_MARGIN = '-110px 0px -65% 0px'`
      - `BACK_TO_TOP_RADIUS = 24`
      - `DELAY_OBSERVER_SETUP = 180`
      - `MENU_CLOSE_DELAY = 700`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：无
  - 依赖：无

- [x] **Task 2.3: 创建共享滚动工具**

  - 文件：
    - `src/utils/scroll.ts`（新建）
  - 目标：
    - 新建文件，导出 4 个纯函数：
      - `getLenis()` — 类型安全获取 Lenis 实例
      - `scrollToTop(options?)` — Lenis 优先，fallback 到原生
      - `scrollToAnchor(element, offset?, duration?)` — 滚动到指定元素
      - `stopWheelPropagationWhenScrollable(e)` — 阻止嵌套滚动容器事件冒泡
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：无
  - 依赖：无

- [x] **Task 2.4: 创建共享 Markdown 渲染工具**

  - 文件：
    - `src/utils/markdown.ts`（新建）
  - 目标：
    - 新建文件，从 `KnowledgeView.vue` 提取并导出：
      - `slugifyHeading(text: string): string`
      - `createKnowledgeRenderer(basePath: string): marked.Renderer`（工厂函数）
      - `generateToc(content: string): TocItem[]`
      - `buildNestedToc(flatToc: TocItem[]): TocItem[]`
      - `renderMarkdown(content: string, basePath?: string): string`（便捷函数）
    - 提取时不做任何逻辑修改，保持与原有实现完全一致
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 代码对比确认提取的函数与原实现逻辑一致
  - 依赖：Task 2.1（需要 TocItem 类型）

- [x] **Task 2.5: 创建统一 Frontmatter 解析工具**

  - 文件：
    - `src/utils/frontmatter.ts`（新建）
  - 目标：
    - 新建文件，导出：
      - `parseFrontmatter(content: string)` — 合并 knowledge.ts 和 articles.ts 两个版本的优点：
        - `\r\n` 换行符处理（来自 knowledge.ts 版）
        - `order` 字段 `parseInt` 处理（来自 knowledge.ts 版）
        - YAML 列表格式 tags 支持（新增）
        - 方括号格式 tags 支持（来自 articles.ts 版）
      - `parseTags(value: unknown): string[]` — 统一处理两种 tags 格式
  - 验收标准：
    - `pnpm type-check` 通过
    - 方括号格式 `[a, b]` → 解析为 `['a', 'b']`
    - YAML 列表格式 `\n  - 测试\n  - Hello` → 解析为 `['测试', 'Hello']`
    - `order` 字段 → 正确转为 number
    - `\r\n` → 正确处理
  - 人工验证：无
  - 依赖：无

---

## Phase 3: 消除重复代码（7 个任务）

- [x] **Task 3.1: 重构 knowledge.ts 使用共享 frontmatter**

  - 文件：
    - `src/data/knowledge.ts`
  - 目标：
    - 删除本地 `parseFrontmatter` 函数定义
    - 导入 `parseFrontmatter` from `@/utils/frontmatter`
    - 确认所有 `convertToArticles` 调用行为不变
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 知识库页面所有 5 个分类和 16 篇文章正常加载
  - 依赖：Task 2.5, Task 2.1

- [x] **Task 3.2: 重构 articles.ts 使用共享工具**

  - 文件：
    - `src/data/articles.ts`
  - 目标：
    - 删除本地 `parseFrontmatter` 函数定义
    - 导入 `parseFrontmatter` from `@/utils/frontmatter`
    - 导入 `Article` 类型 from `@/types`（替换本地定义）
    - 删除本地 `Article` 接口定义
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 文章列表页正常显示 5 篇文章（2 篇 MD + 3 篇硬编码）
    - 文章详情页正常渲染
  - 依赖：Task 2.5, Task 2.1

- [x] **Task 3.3: 创建 useScrollProgress composable**

  - 文件：
    - `src/composables/useScrollProgress.ts`（新建）
  - 目标：
    - 新建文件，提取 BackToTopButton.vue 和 KnowledgeView.vue 中共同逻辑：
      - 响应式状态：`scrollProgress`、`showBackToTop`、`showBackToTopArrow`（ref）
      - 计算属性：`progressRadius`、`progressCircumference`、`progressDashOffset`
      - 方法：`updateScrollProgress()`、`handleScrollProgress()`、`scrollToTop()`、`clearScrollUiTimers()`
      - 接受 options：`{ showAt?, idleDelay? }`
      - `onMounted` 绑定 scroll 事件，`onUnmounted` 解绑
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：无（新文件未被引用）
  - 依赖：Task 2.2, Task 2.3

- [x] **Task 3.4: 重构 BackToTopButton 使用 useScrollProgress**

  - 文件：
    - `src/components/BackToTopButton.vue`
  - 目标：
    - 导入并使用 `useScrollProgress`
    - 删除文件内的 `updateScrollProgress`、`handleScrollProgress`、`scrollToTop`、`clearScrollUiTimers` 方法
    - 删除本地 ref（`scrollProgress`、`showBackToTop`、`showBackToTopArrow`）
    - 删除 `progressRadius`、`progressCircumference` 的本地计算
    - 模板中的引用切换到 composable 提供的数据
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - ArticleDetailView 页面滚动 → 环形进度条正确 → 按钮出现/消失 → 点击返回顶部正常
    - 停止滚动后箭头出现
  - 依赖：Task 3.3

- [x] **Task 3.5: 重构 KnowledgeView 使用 useScrollProgress**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 导入并使用 `useScrollProgress` 替换内联滚动逻辑（第 247-313 行）
    - 删除重复的 ref 定义和方法
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 知识库页返回顶部按钮行为与 Task 3.4 验证结果完全一致
  - 依赖：Task 3.4

- [x] **Task 3.6: 简化 BackToTopButton 模板重复**

  - 文件：
    - `src/components/BackToTopButton.vue`
  - 目标：
    - 合并 Teleport / 非 Teleport 分支的重复按钮模板（第 145-238 行）
    - 使用 `<template v-if>` + `<Teleport>` 条件包裹，消除 ~90 行重复代码
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - ArticleDetailView（Teleport 模式）→ 返回顶部按钮正常
    - 知识库页（非 Teleport 模式）→ 返回顶部按钮正常
  - 依赖：Task 3.4

- [x] **Task 3.7: 重构 ArticleDetailView 使用共享 Markdown 工具**

  - 文件：
    - `src/views/ArticleDetailView.vue`
  - 目标：
    - 导入 `renderMarkdown` from `@/utils/markdown`
    - 将直接调用 `marked(article.value.content)` 替换为 `renderMarkdown(article.value.content)`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - ArticleDetailView markdown 渲染正常（标题、链接、代码块、列表）
    - 与重构前对照无差异
  - 依赖：Task 2.4

---

## Phase 4: 拆分 KnowledgeView.vue（11 个任务）

### 4.1 新建子组件（不修改已有代码，3 个任务）

- [x] **Task 4.1: 创建 KnowledgeSidebar 组件**

  - 文件：
    - `src/components/KnowledgeSidebar.vue`（新建）
  - 目标：
    - 新建独立组件，统合桌面端和移动端侧边栏模板
    - Props: `categories: KnowledgeCategory[]`、`expandedCategoryIds: string[]`、`selectedCategory: string`、`selectedArticle: KnowledgeArticle | null`、`mode: 'desktop' | 'mobile'`
    - Emits: `navigate(categoryId: string, articleId: string)`、`toggle-category(index: number)`
    - 从 KnowledgeView.vue 复制相关 `<style>` 并改为 scoped
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：无（新文件未被引用）
  - 依赖：Task 2.1（需要 KnowledgeCategory、KnowledgeArticle 类型）

- [x] **Task 4.2: 创建 KnowledgeToc 组件**

  - 文件：
    - `src/components/KnowledgeToc.vue`（新建）
  - 目标：
    - 新建独立组件，统合桌面端和移动端 TOC 模板
    - Props: `items: TocItem[]`、`mode: 'desktop' | 'mobile'`
    - Emits: `navigate(anchorId: string)`
    - 从 KnowledgeView.vue 复制相关 `<style>` 并改为 scoped
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：无（新文件未被引用）
  - 依赖：Task 2.1（需要 TocItem 类型）

- [x] **Task 4.3: 创建 KnowledgeMobilePanels 组件**

  - 文件：
    - `src/components/KnowledgeMobilePanels.vue`（新建）
  - 目标：
    - 新建组件，管理移动端面板 overlay + drawer 容器
    - 提供 Slots: `sidebar` 和 `toc`（由父组件注入 KnowledgeSidebar、KnowledgeToc）
    - Props: `showSidebar: boolean`、`showToc: boolean`
    - Emits: `close-sidebar`、`close-toc`
    - 包含 `lockBodyScroll`/`unlockBodyScroll` 逻辑（从 KnowledgeView.vue 提取）
    - 从 KnowledgeView.vue 复制 overlay/drawer 相关 `<style>` 并改为 scoped
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：无（新文件未被引用）
  - 依赖：Task 4.1, Task 4.2

### 4.2 集成桌面端侧边栏（替换模板，分批操作，2 个任务）

- [x] **Task 4.4a: 在 KnowledgeView 中使用 KnowledgeSidebar（桌面端）**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 在 `<script setup>` 中导入 `KnowledgeSidebar`
    - 在模板中：将旧的桌面端侧边栏 `<aside class="desktop-sidebar-left">` 内的模板代码注释掉
    - 在 `<Teleport to="body">` 内添加 `<KnowledgeSidebar mode="desktop" ...>` 组件标签
    - 绑定 props 和 events（`@navigate` → `handleNavClick`，`@toggle-category` → `toggleGroup`）
    - 旧代码直接删除
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 桌面宽度 (>948px) 知识库页 → 左侧侧边栏显示正常，5 个分类可见
    - 分类展开/折叠正常
    - 点击文章导航正常
    - 当前文章高亮正确
  - 依赖：Task 4.1

- [x] **Task 4.4b: 删除 KnowledgeView 中旧的桌面端侧边栏代码**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 删除 Task 4.4a 中注释掉的旧桌面端侧边栏 HTML 代码
    - 删除不再需要的 `<Teleport>` 内的注释块
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 桌面端侧边栏功能与 Task 4.4a 完全一致
  - 依赖：Task 4.4a

### 4.3 集成桌面端 TOC（2 个任务）

- [x] **Task 4.5a: 在 KnowledgeView 中使用 KnowledgeToc（桌面端）**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 在 `<script setup>` 中导入 `KnowledgeToc`
    - 在模板中：将旧的桌面端 TOC `<aside class="desktop-sidebar-right">` 内的模板代码注释掉
    - 在 `<Teleport to="body">` 内添加 `<KnowledgeToc mode="desktop" ...>` 组件标签
    - 绑定 props（`:items="tocItems"`）和 events（`@navigate` → `scrollToAnchor`）
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 桌面大屏 (>1200px) 知识库页 → 右侧 TOC 显示文章标题
    - 点击 TOC 项 → 平滑滚动到对应标题
    - 滚动页面时 TOC 当前项高亮跟踪正常
    - 缩小窗口到 <1200px → TOC 消失
  - 依赖：Task 4.2, Task 4.4b

- [x] **Task 4.5b: 删除 KnowledgeView 中旧的桌面端 TOC 代码**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 删除 Task 4.5a 中注释掉的旧桌面端 TOC HTML 代码
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 桌面端 TOC 功能与 Task 4.5a 完全一致
  - 依赖：Task 4.5a

### 4.4 集成移动端面板（3 个任务）

- [x] **Task 4.6a: 在 KnowledgeView 中使用 KnowledgeMobilePanels（侧边栏抽屉）**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 在 `<script setup>` 中导入 `KnowledgeMobilePanels`、`KnowledgeSidebar`（mobile mode）
    - 在模板中：将旧的移动端侧边栏面板（第 697-742 行）注释掉
    - 添加 `<KnowledgeMobilePanels>` 组件，在其 `sidebar` slot 中放入 `<KnowledgeSidebar mode="mobile" ...>`
    - 绑定 props 和 events
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 移动宽度 (<948px) → 顶部显示 "教程目录""页面导航" 按钮
    - 点击 "教程目录" → 左侧滑入面板，分类和文章正常显示
    - 面板内点击文章 → 面板关闭，主内容切换
  - 依赖：Task 4.3, Task 4.4b

- [x] **Task 4.6b: 在 KnowledgeView 中使用 KnowledgeMobilePanels（TOC 抽屉）**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 在模板中：将旧的移动端 TOC 面板（第 744-804 行）注释掉
    - 在 `<KnowledgeMobilePanels>` 的 `toc` slot 中放入 `<KnowledgeToc mode="mobile" ...>`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 移动宽度 → 点击 "页面导航" → 右侧滑入 TOC 面板
    - 点击 TOC 项 → 面板关闭，页面滚动到目标位置
    - 打开面板时背景锁定滚动，关闭后恢复
    - 两边面板互斥（打开侧边栏时点 TOC，侧边栏关闭 TOC 打开）
  - 依赖：Task 4.6a

- [x] **Task 4.6c: 删除 KnowledgeView 中旧的移动端面板代码和方法**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 删除 Task 4.6a、4.6b 中注释掉的旧移动端面板 HTML
    - 删除已移入子组件的方法：`lockBodyScroll`、`unlockBodyScroll`、`closeAllMobilePanels`
    - 删除不再需要的 mobile panel 相关 ref 和函数（`showMobileSidebar`、`showMobileToc`、`openMobileSidebar`、`closeMobileSidebar`、`openMobileToc`、`closeMobileToc`）
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 移动端面板功能与 Task 4.6b 完全一致
    - 删除的方法在项目中无其他引用
  - 依赖：Task 4.6b

### 4.5 集成共享 Markdown 渲染（2 个任务）

- [x] **Task 4.7a: 引入共享 Markdown 工具（并存，不删旧代码）**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 导入 `renderMarkdown`、`generateToc`、`buildNestedToc` from `@/utils/markdown`
    - 在渲染路径中添加新旧输出对比（`console.assert` 检查一致性）
    - 暂时使用旧渲染输出，不修改模板 `v-html` 绑定
    - 不删除旧实现代码
    - 不修改 `marked` 导入
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 遍历 5 个分类各选 2 篇文章 → 页面正常渲染
    - 浏览器控制台无 assert 失败（新旧输出一致）
  - 依赖：Task 2.4, Task 4.6c

- [x] **Task 4.7b: 切换为共享 Markdown 工具（删除旧代码）**

  - 文件：
    - `src/views/KnowledgeView.vue`
  - 目标：
    - 模板中的 `v-html` 绑定切换到共享 `renderMarkdown` 的输出
    - 删除文件内旧的：`slugifyHeading`、`generateToc`、`buildNestedToc`、`renderMarkdown`、自定义 renderer 构建代码
    - 移除并存模式的 `console.assert`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 标题 ID 正确，锚点跳转工作
    - 外链有 `target="_blank"` + ↗ 图标
    - 图片路径正确，点击可放大
    - 代码块有深色背景，行内代码有高亮
    - 表格有圆角边框、斑马纹、小屏可横向滚动
    - blockquote 有左侧蓝色竖线 + 背景阴影
    - TOC 生成正确
    - 前后章导航正常
  - 依赖：Task 4.7a

---

## Phase 5: 清理死代码（5 个任务）

- [x] **Task 5.1: 删除未使用的 Pinia store**

  - 文件：
    - `src/stores/counter.ts`（删除）
  - 目标：
    - 删除文件（已全局搜索确认 `useCounterStore` 无任何引用）
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：无
  - 依赖：无

- [x] **Task 5.2: 删除设计稿文件**

  - 文件：
    - `pages/home.html`（删除）
    - `pages/knowledge.html`（删除）
    - `pages/` 目录（删除，如果变空）
  - 目标：
    - 删除项目根目录下的非项目文件（设计稿）
  - 验收标准：
    - `pnpm build` 通过
  - 人工验证：无
  - 依赖：无

- [x] **Task 5.3: 清理 router 未用导入**

  - 文件：
    - `src/router/index.ts`
  - 目标：
    - 删除 import 中未使用的 `createWebHistory`
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 所有 5 个路由正常加载
  - 依赖：无

- [x] **Task 5.4: 清理 AppHeader 未用导入和 AboutView 死 CSS**

  - 文件：
    - `src/components/AppHeader.vue`
    - `src/views/AboutView.vue`
  - 目标：
    - AppHeader：删除 import 中未使用的 `Teleport`（Vue 3.3+ 内置组件无需导入）
    - AboutView：删除 `.avatar-section`、`.avatar-wrapper`、`.avatar`、`.avatar-placeholder` CSS 规则
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - AppHeader 页头导航和 `<Teleport>` 功能正常
    - About 页面正常渲染，无样式异常
  - 依赖：无

- [x] **Task 5.5: 修复 buildwithClaudeCodeArticles 命名大小写**

  - 文件：
    - `src/data/knowledge.ts`
  - 目标：
    - 将变量名 `buildwithClaudeCodeArticles` 改为 `buildWithClaudeCodeArticles`
    - 同步更新该变量的所有引用处（`knowledgeData` 数组中）
  - 验收标准：
    - `pnpm type-check` 通过
    - `pnpm build` 通过
  - 人工验证：
    - 知识库页 build-with-claude-code 分类正常加载
  - 依赖：无

---

## Phase 6: 更新文档（1 个任务）

- [x] **Task 6.1: 更新 CLAUDE.md**

  - 文件：
    - `CLAUDE.md`
  - 目标：
    - 更新目录结构：新增 `src/types/`、`src/constants/`、`src/utils/`
    - 更新组件列表：新增 `KnowledgeSidebar`、`KnowledgeToc`、`KnowledgeMobilePanels`
    - 更新 Composable 列表：新增 `useScrollProgress`
    - 更新内容系统说明：`parseFrontmatter` 已统一到 `utils/frontmatter.ts`，移除"需同步两处"提示
    - 更新 Lenis 集成说明：通过 `utils/scroll.ts` 的 `getLenis()` 访问
    - 新增常量章节：所有魔法数字集中在 `src/constants/index.ts`
    - 新增 Markdown 渲染章节：共享渲染器在 `utils/markdown.ts`
    - 删除对不存在文件的引用（DESIGN.md / DESIGN_knowledge.md）
  - 验收标准：
    - CLAUDE.md 描述与实际代码结构完全一致
    - 所有文件路径可验证存在
  - 人工验证：
    - 逐条对照项目实际目录结构验证 CLAUDE.md 内容
  - 依赖：Task 1.1 ~ Task 5.5 全部完成

---

## 任务依赖图

```
Phase 1 (全部独立，可并行)
  Task 1.1 ─┐
  Task 1.2  │
  Task 1.3  ├── 无依赖
  Task 1.4  │
  Task 1.5  │
  Task 1.6 ─┘

Phase 2
  Task 2.1 ─── 无依赖
  Task 2.2 ─── 无依赖
  Task 2.3 ─── 无依赖
  Task 2.4 ─── [依赖 Task 2.1]
  Task 2.5 ─── 无依赖

Phase 3
  Task 3.1 ─── [依赖 Task 2.5, Task 2.1]
  Task 3.2 ─── [依赖 Task 2.5, Task 2.1] (可与 Task 3.1 并行)
  Task 3.3 ─── [依赖 Task 2.2, Task 2.3]
  Task 3.4 ─── [依赖 Task 3.3]
  Task 3.5 ─── [依赖 Task 3.4]
  Task 3.6 ─── [依赖 Task 3.4]
  Task 3.7 ─── [依赖 Task 2.4]

Phase 4
  新建组件:
  Task 4.1 ─── [依赖 Task 2.1]
  Task 4.2 ─── [依赖 Task 2.1]
  Task 4.3 ─── [依赖 Task 4.1, Task 4.2]

  桌面侧边栏:
  Task 4.4a ── [依赖 Task 4.1]
  Task 4.4b ── [依赖 Task 4.4a]

  桌面 TOC:
  Task 4.5a ── [依赖 Task 4.2, Task 4.4b]
  Task 4.5b ── [依赖 Task 4.5a]

  移动端面板:
  Task 4.6a ── [依赖 Task 4.3, Task 4.4b]
  Task 4.6b ── [依赖 Task 4.6a]
  Task 4.6c ── [依赖 Task 4.6b]

  Markdown:
  Task 4.7a ── [依赖 Task 2.4, Task 4.6c]
  Task 4.7b ── [依赖 Task 4.7a]

Phase 5 (全部独立，可并行)
  Task 5.1 ─┐
  Task 5.2  │
  Task 5.3 ├── 无依赖
  Task 5.4  │
  Task 5.5 ─┘

Phase 6
  Task 6.1 ─── [依赖 Task 1.1 ~ Task 5.5 全部]
```

## 统计

| Phase | 任务数 | 新增文件 | 修改文件 | 删除文件 |
|-------|--------|---------|---------|---------|
| Phase 1 | 6 | 0 | 5 | 0 |
| Phase 2 | 5 | 5 | 0 | 0 |
| Phase 3 | 7 | 1 | 5 | 0 |
| Phase 4 | 11 | 3 | 1 | 0 |
| Phase 5 | 5 | 0 | 3 | 3 |
| Phase 6 | 1 | 0 | 1 | 0 |
| **合计** | **35** | **9** | **15** | **3** |
