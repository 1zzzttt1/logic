# Design: Blog 项目重构架构设计

## 1. 目标目录结构

```
src/
├── main.ts                              # 入口（修正 Lenis 全局赋值）
├── App.vue                              # 根组件（CSS 变量定义）
├── router/
│   └── index.ts                         # Hash 路由（清理未用导入）
├── types/                               # [新增] 共享类型
│   └── index.ts
├── constants/                           # [新增] 共享常量
│   └── index.ts
├── utils/                               # [新增] 纯函数工具
│   ├── scroll.ts                        # Lenis 访问 + 滚动到顶/锚点
│   ├── markdown.ts                      # 共享 marked renderer 工厂 + TOC 生成
│   └── frontmatter.ts                   # 统一 YAML frontmatter 解析
├── composables/
│   ├── usePageTransition.ts             # 页面切换动画（不变）
│   ├── useHomeReveal.ts                 # 首页预加载动画（不变）
│   ├── useHomeAnimate.ts                # 首页 Hero 动画（不变）
│   ├── homeRevealRuntime.ts             # 运行时状态协调（不变）
│   └── useScrollProgress.ts             # [新增] 滚动进度 + 返回顶部
├── stores/                              # Pinia stores（删除 counter.ts）
├── data/
│   ├── knowledge.ts                     # 知识库数据（重构：使用共享工具）
│   ├── articles.ts                      # 文章数据（重构：使用共享工具）
│   ├── author.ts                        # 作者信息（重构：导入共享类型）
│   ├── knowledge/                       # 知识库 Markdown 文件（不变）
│   │   ├── ai-basics/
│   │   ├── claude-code/
│   │   ├── build-with-claude-code/
│   │   ├── ai-development/
│   │   └── agent-skills/
│   └── articles/                        # 文章 Markdown 文件（不变）
├── views/
│   ├── HomeView.vue                     # （修正 await）
│   ├── KnowledgeView.vue                # （大幅重构：拆出子组件）
│   ├── ArticlesView.vue                 # （不变）
│   ├── ArticleDetailView.vue            # （重构：使用共享 markdown 工具 + 共享类型）
│   └── AboutView.vue                    # （清理死 CSS）
└── components/
    ├── AppHeader.vue                    # （清理未用导入）
    ├── PreloaderReveal.vue              # （不变）
    ├── PageTransitionOverlay.vue        # （修正 CSS 变量名）
    ├── ImagePreview.vue                 # （不变）
    ├── BackToTopButton.vue              # （重构：使用 useScrollProgress）
    ├── KnowledgeSidebar.vue             # [新增] 知识库侧边栏
    ├── KnowledgeToc.vue                 # [新增] 知识库页面导航
    └── KnowledgeMobilePanels.vue        # [新增] 移动端面板管理
```

## 2. 新增目录的设计理由

### 2.1 `src/types/index.ts`

当前项目没有共享类型文件。`KnowledgeArticle`、`KnowledgeCategory` 定义在 `knowledge.ts`，`Article` 定义在 `articles.ts`，`Author` 定义在 `author.ts`，`TocItem` 定义在 `KnowledgeView.vue` 的 script 中作为局部类型。

统一到 `src/types/index.ts` 后：
- 所有数据接口在一个文件中可见
- 避免循环引用（类型定义和实现分离）
- `TocItem` 可以被 `KnowledgeToc.vue` 和 `utils/markdown.ts` 共享

**包含的类型：**
```ts
KnowledgeArticle    // 知识文章（id, title, description, content, category, order）
KnowledgeCategory   // 知识分类（id, name, articles）
Article             // 博客文章（id, title, summary, content, sourceUrl, tags, publishedAt...）
Author              // 作者信息
TocItem             // 页面导航条目（name, id, level, active, children）
```

### 2.2 `src/constants/index.ts`

魔法数字分散是当前项目最明显的问题之一。断点值出现在 6 个不同位置（CSS media query 和 JS 判断各一套），修改时容易遗漏。

**包含的常量：**
| 常量 | 值 | 原始位置 |
|------|-----|----------|
| `BREAKPOINT_MOBILE` | 767 | AppHeader.vue CSS + JS |
| `BREAKPOINT_TABLET` | 948 | KnowledgeView.vue CSS + JS |
| `BREAKPOINT_DESKTOP` | 1200 | KnowledgeView.vue CSS + JS |
| `HEADER_HEIGHT` | 80 | KnowledgeView.vue |
| `SCROLL_SHOW_AT` | 120 | BackToTopButton.vue, KnowledgeView.vue |
| `SCROLL_IDLE_DELAY` | 420 | BackToTopButton.vue, KnowledgeView.vue |
| `SCROLL_OBSERVER_MARGIN` | `'-110px 0px -65% 0px'` | KnowledgeView.vue |
| `BACK_TO_TOP_RADIUS` | 24 | BackToTopButton.vue, KnowledgeView.vue |
| `DELAY_OBSERVER_SETUP` | 180 | KnowledgeView.vue |
| `MENU_CLOSE_DELAY` | 700 | AppHeader.vue |

### 2.3 `src/utils/` 目录

三个纯函数模块，不依赖 Vue 响应式系统。

#### `utils/scroll.ts`
封装 Lenis 访问和滚动操作，替代当前项目中散落的 `(window as any).__lenis` 模式。

```
getLenis()          → Lenis | null     // 类型安全获取，内部处理 window.__lenis
scrollToTop(opts?)  → void             // Lenis 优先，原生滚动 fallback
scrollToAnchor(el, offset?) → void     // 滚动到指定元素
stopWheelPropagation(e) → void         // 阻止嵌套滚动区域的 wheel 事件冒泡
```

#### `utils/markdown.ts`
提取 markdown 渲染相关的纯函数。解决 KnowledgeView.vue 和 ArticleDetailView.vue 各自使用不同 marked 配置的问题。

```
slugifyHeading(text)             → string
createKnowledgeRenderer(basePath) → marked.Renderer  // 返回配置好的自定义 renderer
generateToc(content)             → TocItem[]          // flat TOC
buildNestedToc(flatToc)          → TocItem[]          // nested TOC（含 children）
renderMarkdown(content, basePath) → string            // 便捷函数：parse + render
```

#### `utils/frontmatter.ts`
合并当前 `knowledge.ts` 和 `articles.ts` 中重复的 frontmatter 解析器。

需要处理两种 tags 格式：
```yaml
# 方括号格式（当前 articles.ts 只支持这个）
tags: [AI, Claude Code]

# YAML 列表格式（文章 .md 文件实际使用的格式）
tags:
  - 测试
  - Hello World
```

```
parseFrontmatter(content: string) → { metadata: Record<string, unknown>; content: string }
parseTags(value: unknown)         → string[]   // 统一处理两种 tags 格式
```

## 3. KnowledgeView.vue 拆分方案

### 拆分前（2062 行）

```
KnowledgeView.vue
├── <script> ~580 行（状态、逻辑、渲染、滚动跟踪）
├── <template> ~352 行（桌面侧边栏、桌面 TOC、移动面板 x2、主内容、返回顶部）
└── <style> ~1130 行（全部 CSS）
```

### 拆分后（目标 ~700 行）

```
KnowledgeView.vue        # 主控组件
├── <script> ~150 行     # 文章选择、分类切换、响应式状态、intersectionObserver
├── <template> ~150 行   # 文章头部、正文、前后导航、图片预览
└── <style> ~400 行      # 文章样式、响应式布局

KnowledgeSidebar.vue     # 侧边栏组件
├── <script> ~30 行      # emits, props
├── <template> ~60 行    # 统一模板（桌面端 + 移动端复用）
└── <style> ~180 行      # 侧边栏样式

KnowledgeToc.vue         # TOC 组件
├── <script> ~15 行      # emits, props
├── <template> ~40 行
└── <style> ~100 行

KnowledgeMobilePanels.vue # 移动端面板管理
├── <script> ~40 行      # 面板开关逻辑
├── <template> ~25 行    # overlay + 占位
└── <style> ~130 行
```

### 组件通信设计

```
KnowledgeView.vue (父组件)
  │
  ├── props ──→ KnowledgeSidebar.vue
  │   { categories, expandedIds, selectedCategory, selectedArticle }
  │   @navigate → selectArticle()
  │   @toggle-category → toggleGroup()
  │
  ├── props ──→ KnowledgeToc.vue
  │   { tocItems, visible }
  │   @navigate → scrollToAnchor()
  │
  ├── props ──→ KnowledgeMobilePanels.vue
  │   { showSidebar, showToc, showTocButton }
  │   @open-sidebar → openMobileSidebar()
  │   @open-toc → openMobileToc()
  │   @close → closeAllMobilePanels()
  │
  └── 内部使用 useScrollProgress() composable
```

## 4. 数据流变化

### 变更前

```
HomeView ──→ usePageTransition.navigate() (未 await)
KnowledgeView ──→ 内联滚动逻辑、内联 markdown 渲染、内联 parseFrontmatter
BackToTopButton ──→ 内联滚动逻辑
ArticleDetailView ──→ 独立 marked() 调用（无自定义 renderer）
```

### 变更后

```
HomeView ──→ await usePageTransition.navigate()
KnowledgeView ──→ useScrollProgress() + utils/markdown + utils/scroll
BackToTopButton ──→ useScrollProgress()
ArticleDetailView ──→ utils/markdown（共享 renderer）
knowledge.ts ──→ utils/frontmatter
articles.ts ──→ utils/frontmatter
```

## 5. 风险点

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| KnowledgeView 拆分导致组件通信复杂 | 中 | 每个子组件先独立开发和测试，确保 API 干净再集成 |
| `useScrollProgress` 同时在两处使用，行为不一致 | 低 | 先从 KnowledgeView 提取并验证，再替换 BackToTopButton |
| YAML 列表解析器的兼容性 | 低 | 只处理 `  - value` 格式（两个空格缩进），不处理复杂 YAML |
| CSS 拆分后样式作用域问题 | 中 | 子组件使用 scoped，穿透样式保留在 KnowledgeView.vue 的 `:deep()` 中 |
| marked 库 API 变化 | 低 | 不升级 marked 版本，仅提取现有调用逻辑 |
