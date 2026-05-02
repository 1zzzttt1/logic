# Requirements: Blog 项目全面重构

## 1. 重构目标

对 `logic`（Vue 3 AI 知识博客）进行全架构重构，提升以下四个维度的质量：

| 维度 | 目标 |
|------|------|
| **可维护性** | 消除重复代码、统一工具函数、降低单文件复杂度 |
| **可扩展性** | 新增加知识分类/文章类型无需修改多处，基础设施可复用 |
| **可协作性** | 明确的目录结构、共享类型、集中常量，新开发者可快速上手 |
| **可持续性** | 修复所有已知 bug，代码质量达到类型安全、无冗余状态 |

## 2. 当前问题清单

### 2.1 关键 Bug（影响用户可见功能）

| ID | 问题 | 影响 |
|----|------|------|
| B1 | `window.__lenis` 从未赋值 | 程序化滚动完全失效，`scrollToTop`/`scrollToAnchor` 回退到无动画的 `window.scrollTo` |
| B2 | CSS 变量名不匹配 (`--page-transition-stop-*` vs `--page-transition-base-*`) | 页面切换过渡动画的 SVG 渐变颜色失效 |
| B3 | `knowledge.ts` 中 `agen-skills` 拼写错误 + agentSkillsArticles 的 category 参数传错 | Agent Skills 分类无法通过 ID 正常查找，文章的 `category` 字段存储错误值 |
| B4 | 文章 `.md` 文件的 YAML 列表格式 tags 无法解析 | Article 页面的标签始终为空 |
| B5 | `claudecode如何工作.md` 中图片使用相对路径引用 | 知识库文章中的图片可能加载失败 |
| B6 | `HomeView.vue` 中 `navigateWithTransition` 未 await | 快速点击时过渡动画状态可能错乱 |

### 2.2 架构问题

| ID | 问题 | 影响 |
|----|------|------|
| A1 | `parseFrontmatter` 在 `knowledge.ts` 和 `articles.ts` 中重复实现 | 修改解析逻辑需同步两处，容易遗漏 |
| A2 | 滚动进度逻辑在 `BackToTopButton.vue` 和 `KnowledgeView.vue` 中重复实现 | 修改滚动行为需同步两处 |
| A3 | `KnowledgeView.vue` 单文件 2062 行 | 职责过多：侧边栏、TOC、markdown 渲染、滚动跟踪、移动端面板、图片预览、前后章导航 |
| A4 | 侧边栏和 TOC 模板各出现两次（桌面端 + 移动端） | 修改导航结构需同步多处 |
| A5 | 无共享类型文件 | 类型分散在 4 个文件中，`TocItem` 等局部类型无法跨文件引用 |
| A6 | 无共享常量 | 断点、动画时长、滚动阈值等魔法数字分散在 6+ 个文件中 |

### 2.3 代码质量问题

| ID | 问题 | 影响 |
|----|------|------|
| Q1 | 死代码：`stores/counter.ts` 从未被引用 | 增加编译负担，误导新开发者 |
| Q2 | 死代码：`pages/home.html`、`pages/knowledge.html` 为设计稿非项目文件 | 污染项目根目录 |
| Q3 | 死代码：`router/index.ts` 未用导入 `createWebHistory` | 混淆 |
| Q4 | 死代码：`AboutView.vue` 中 `.avatar-*` CSS 从未使用 | 混淆 |
| Q5 | `KnowledgeView.vue` 和 `ArticleDetailView.vue` 各自独立渲染 markdown | 渲染行为不一致 |
| Q6 | `buildwithClaudeCodeArticles` 变量命名大小写不一致 | 容易写错 |
| Q7 | `BackToTopButton.vue` 中按钮模板 Teleport/非 Teleport 分支重复 90+ 行 | 维护负担 |

### 2.4 已知但本次不做（后续迭代）

| ID | 问题 | 原因 |
|----|------|------|
| QF1 | `KnowledgeView.vue` 中过多 `any` 类型（marked token 参数） | marked 库的 token 类型定义复杂，全面改造影响面大 |
| QF2 | `marked.parse()` 无错误处理 | 需设计统一的错误边界组件，需单独设计 |
| QF3 | `description` 字段语义不统一（agent-skills 用作"阅读时间"，ai-basics 用作内容描述） | 涉及 16 个 md 文件的内容修改，属于内容治理而非代码重构 |

## 3. 非目标（本次不做）

- 不改变路由结构（hash 路由不变）
- 不改变暗色模式的实现方式
- 不改变内容文件的格式（仍然用 Markdown + YAML frontmatter）
- 不引入新的第三方依赖
- 不改变 CI/CD 部署流程
- 不改变 Vue 3 组合式 API 的使用方式

## 4. 约束

- 每个 Phase 完成后项目必须可正常 `pnpm dev` 运行
- 每个 Phase 完成后必须通过 `pnpm type-check` + `pnpm build`
- 禁止跳过 Phase 直接做后面的工作
- 每个任务必须小到可以单独 commit
