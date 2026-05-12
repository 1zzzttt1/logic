# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

- **名称**: logic
- **类型**: AI 知识博客 (Vue 3 单页应用)
- **基础路径**: `/logic/` (hash 路由)

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 (组合式 API) | ^3.5.29 |
| 构建工具 | Vite | ^7.3.1 |
| 语言 | TypeScript | ~5.9.3 |
| 路由 | Vue Router | ^5.0.3 |
| 状态管理 | Pinia | ^3.0.4 |
| Markdown 渲染 | marked | ^17.0.5 |
| 滚动平滑 | Lenis | ^1.3.21 |
| 动画 | GSAP | ^3.14.2 |

Node.js 要求: `^20.19.0` 或 `>=22.12.0`

## 构建与运行

```bash
pnpm install        # 安装依赖
pnpm dev            # 启动开发服务器
pnpm build          # 完整构建（类型检查 + vite build，通过 npm-run-all2 串联）
pnpm preview        # 预览生产构建
pnpm type-check     # 运行 vue-tsc 类型检查
pnpm lint           # 运行 ESLint + oxlint 并自动修复 (run-s lint:oxlint lint:eslint)
pnpm format         # 使用 Prettier 格式化 src/ 下代码
```

路径别名 `@` 指向 `./src`（vite.config.ts 中配置）。

Vite base 为 `/logic/`，开发服务器启动后访问 `http://localhost:5173/logic/`。

## 架构

### 路由

使用 hash 路由 (`createWebHashHistory`)，全部路由均为懒加载。

| 路径 | 名称 | 组件 | 用途 |
|------|------|------|------|
| `/` | home | HomeView | 首页，含预加载动画 |
| `/knowledge` | knowledge | KnowledgeView | 知识库，含双栏/三栏响应式布局 |
| `/articles` | articles | ArticlesView | 文章列表 |
| `/articles/:id` | article-detail | ArticleDetailView | 文章详情 |
| `/about` | about | AboutView | 关于页面 |

### 内容系统

知识文章以 Markdown 文件存储在 `src/data/knowledge/{category}/*.md`，通过 `import.meta.glob` + `?raw` 加载为字符串，解析 YAML frontmatter。

**Frontmatter 支持的字段**（手写解析器，非 YAML 库）:
- `title: string` — 文章标题
- `description: string` — 描述
- `order: number` — 排序（数字，越小越靠前）

Article 类型的 frontmatter 还支持 `tags: [tag1, tag2]`（方括号数组格式）、`publishedAt: string`、`summary: string`。

**注意**: `parseFrontmatter` 函数已统一到 `src/utils/frontmatter.ts`，`knowledge.ts` 和 `articles.ts` 均导入该共享版本。

### 知识库分类体系

在 `src/data/knowledge.ts` 的 `knowledgeCategories` 数组中定义分类（固定列表），每个分类对应 `src/data/knowledge/{category-id}/` 目录下的 `.md` 文件。添加新分类需要：
1. 创建对应目录并放入 `.md` 文件
2. 在 `knowledgeCategories` 中注册
3. 添加对应的 `import.meta.glob` 和 `convertToArticles` 调用
4. 在 `knowledgeData` 中组装

### 页面动画系统

**首页预加载**: `App.vue` → `useHomeReveal` → `PreloaderReveal` 组件。预加载动画播放完毕后隐藏 preloader 并显示页面。

**页面切换**: `usePageTransition` composable 通过 GSAP 操作 SVG clip-path 实现过场动画。使用模式：
```ts
const { navigateWithTransition, registerPath } = usePageTransition()
// 在 PageTransitionOverlay 组件中注册 SVG path
// 导航时调用 navigateWithTransition(to, options) 替代 router.push
```

**Lenis 平滑滚动**: 在 `main.ts` 中全局初始化并挂载到 `window.__lenis`。通过 `utils/scroll.ts` 的 `getLenis()` 类型安全获取实例，`scrollToTop()` 和 `scrollToAnchor()` 封装了 Lenis 优先、原生 fallback 逻辑。

### 知识库页面布局

`KnowledgeView.vue` 是项目最复杂的组件，实现三栏响应式布局：

| 断点 | 布局 |
|------|------|
| < 948px | 单栏 + 悬浮按钮触发移动端抽屉面板（左侧目录、右侧 TOC） |
| 948–1199px | 左侧固定侧边栏（可折叠）+ 主内容 |
| >= 1200px | 左侧侧边栏 + 主内容 + 右侧 TOC |

**目录导航**: 分类 → 文章二级结构，支持展开/折叠。通过 `expandedCategoryIds` 控制。
**TOC**: 从 markdown 内容解析 h1-h3 生成，IntersectionObserver 跟踪当前位置高亮。
**前后章导航**: 按 `order` 字段在当前分类内排序，自动生成上一章/下一章链接。

### 暗色模式

通过给 `html` 元素添加/移除 `dark` 类触发。所有颜色变量在 `App.vue` 的 `:root` / `html.dark` 中定义，组件通过 CSS 变量引用。

### 共享常量

所有魔法数字集中在 `src/constants/index.ts`，包括断点、页头高度、滚动参数、按钮尺寸等。组件和 composable 从该文件导入所需常量。

### Markdown 渲染

共享渲染器位于 `src/utils/markdown.ts`，导出：

| 函数 | 用途 |
|------|------|
| `slugifyHeading(text)` | 生成标题锚点 ID |
| `generateToc(content)` | 从 markdown 提取平铺 TOC |
| `buildNestedToc(flatToc)` | 平铺 TOC → 嵌套树 |
| `createKnowledgeRenderer(basePath)` | 工厂函数，创建带图片路径/外链处理的 marked Renderer |
| `renderMarkdown(content, basePath?)` | 便捷函数，一步渲染 markdown → HTML |

KnowledgeView 和 ArticleDetailView 均通过 `renderMarkdown` 渲染内容。

### 组件目录

```
src/
├── views/            # 页面组件
├── components/       # UI 组件
│   ├── AppHeader.vue                 # 顶部导航
│   ├── PreloaderReveal.vue           # 首页预加载动画
│   ├── PageTransitionOverlay.vue     # 页面切换过渡动画（SVG clip-path）
│   ├── ImagePreview.vue              # 图片点击放大预览
│   ├── BackToTopButton.vue           # 返回顶部按钮（环形进度条）
│   ├── KnowledgeSidebar.vue          # 知识库侧边栏（桌面/移动端）
│   ├── KnowledgeToc.vue              # 知识库 TOC 目录（桌面/移动端）
│   └── KnowledgeMobilePanels.vue     # 移动端抽屉面板容器
├── composables/      # 组合式函数
│   ├── useHomeReveal.ts       # 首页动画编排
│   ├── usePageTransition.ts   # 页面切换过渡（GSAP）
│   └── useScrollProgress.ts   # 滚动进度追踪（返回顶部按钮复用）
├── data/
│   ├── knowledge/   # 按分类组织的 Markdown 知识文章
│   ├── articles/    # Markdown 文章（articles 页面用）
│   ├── knowledge.ts # 知识库数据加载和类型
│   ├── articles.ts  # 文章数据和类型
│   └── author.ts    # 作者信息
├── types/           # 共享 TypeScript 类型
│   └── index.ts     # KnowledgeArticle, KnowledgeCategory, Article, Author, TocItem
├── constants/       # 共享常量
│   └── index.ts     # 断点、尺寸、滚动参数等魔法数字
├── utils/           # 工具函数
│   ├── frontmatter.ts  # YAML frontmatter 解析
│   ├── markdown.ts     # Markdown 渲染（marked 封装）
│   └── scroll.ts       # Lenis 滚动封装（getLenis/scrollToTop/scrollToAnchor）
└── router/          # Vue Router 配置
```

## 代码规范

- 使用 `<script setup lang="ts">` 组合式 API
- 样式使用 `scoped` + CSS 变量，暗色模式通过 `html.dark` 选择器适配
- 穿透 markdown 内容使用 `:deep()` 选择器
- 组件 props 和 composable 返回值使用显式类型

## Git 工作流

- 提交风格：祈使语气 ("add X", "fix Y")
- CI：push 到 main 分支触发 GitHub Actions 部署到 GitHub Pages（`.github/workflows/deploy.yml`）
- 部署使用 pnpm 10 + Node 20，产物为 `./dist` 目录

## 进行中的工作

正在执行代码质量修复计划，详见 `.claude/plans/recursive-stargazing-wall.md`。
进度通过项目记忆（`.claude/projects/C--Users-zym-Desktop-logic/memory/`）跟踪。
每轮启动前请读取 MEMORY.md 和计划文件获取当前状态。
