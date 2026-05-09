# 按需加载 Markdown 内容 — 设计文档

日期：2026-05-09
状态：已确认

## 问题

`knowledge.ts` 和 `articles.ts` 使用 `import.meta.glob` 加载 `.md` 文件时设置了 `eager: true`，
所有文章在编译时被完整嵌入到 JS 输出中。每新增一篇文章，JS bundle 就多一份完整正文，
首屏体积随内容线性膨胀。

## 目标

将 `eager: true` 改为 `eager: false`，文章正文按需动态 import，每篇独立成一个 chunk。
同时保证侧边栏和列表页的元数据（标题、描述、标签等）同步可用。

## 方案

方案 A：构建脚本生成静态元数据清单 + lazy glob 按需加载正文。

### 架构

```
构建时                                    运行时

scripts/generate-metadata.ts
  ├─ 扫描 src/data/knowledge/**/*.md      侧边栏/列表 (eager, ~几KB)
  ├─ 扫描 src/data/articles/*.md    ──→  knowledge-meta.ts
  ├─ 解析 frontmatter                     articles-meta.ts
  └─ 生成元数据 .ts 文件
                                        文章正文 (lazy, 独立 chunk)
src/data/**/*.md  ──lazy glob──→        loadXxxContent(id) → Promise<string>
```

## 详细设计

### 1. 元数据生成脚本 `scripts/generate-metadata.ts`

- 新建 Node.js 脚本，构建前运行
- 遍历 `src/data/knowledge/{5个分类}/*.md`，逐文件读取、调用现有 `parseFrontmatter` 解析，丢弃正文
- 遍历 `src/data/articles/*.md`，同上
- 生成两个文件：
  - `src/data/knowledge-meta.ts`：按分类组织的元数据（title、description、order，不含 content）
  - `src/data/articles-meta.ts`：文章列表元数据（title、summary、tags、publishedAt 等，不含 content）
- 脚本通过 `package.json` 的 `prebuild` / `predev` 钩子集成

### 2. 类型拆分 `src/types/index.ts`

```ts
// 不含正文 —— 侧边栏 / 列表用
export interface KnowledgeArticleMeta {
  id: string; title: string; description: string; category: string; order: number
}

// 含正文 —— 文章渲染用
export interface KnowledgeArticle extends KnowledgeArticleMeta {
  content: string
}

// 不含正文 —— 文章列表用
export interface ArticleMeta {
  id: string; title: string; summary: string
  sourceUrl: string; sourceTitle: string; sourceAuthor?: string
  tags: string[]; publishedAt: string; createdAt: string; updatedAt: string
}

// 含正文 —— 文章详情用
export interface Article extends ArticleMeta {
  content: string
}
```

`KnowledgeCategory.articles` 类型同步改为 `KnowledgeArticleMeta[]`。

### 3. 数据模块 `src/data/knowledge.ts`

- 删除 5 个 `eager: true` glob
- 导入生成的 `knowledgeMeta`
- 新增唯一 lazy glob：`import.meta.glob('/src/data/knowledge/**/*.md', { eager: false })`
- `knowledgeData` 从元数据组装，不含正文
- 导出 `loadKnowledgeContent(category: string, id: string): Promise<string>` 按需加载正文
- `getArticlesByCategory` / `getArticleById` 返回 `KnowledgeArticleMeta`

### 4. 数据模块 `src/data/articles.ts`

- 删除 `eager: true` glob
- 导入生成的 `articlesMeta`
- 3 篇硬编码内联文章抽出为独立 `.md` 文件
- 新增 lazy glob：`import.meta.glob('/src/data/articles/*.md', { eager: false })`
- `mdArticles` 导出纯 `ArticleMeta[]`
- 导出 `loadArticleContent(id: string): Promise<string>` 按需加载正文

### 5. 视图 `KnowledgeView.vue`

- `selectedArticle` 拆为 `selectedArticleMeta`（同步）+ `articleContent`（异步）
- 选中文章时立即设置 meta，异步加载正文
- 标题、描述从 meta 读取（始终立即可用）
- 正文区域：加载中显示骨架屏，完成后渲染 markdown
- TOC 在 `articleContent` 变化后重新生成
- 前一章/后一章导航使用 meta 数据

### 6. 视图 `ArticleDetailView.vue`

- 文章元数据从 `mdArticles`（ArticleMeta[]）查找，同步可用
- 用 `watch(route.params.id, { immediate: true })` 异步加载正文
- 路由切换时立即显示新 meta，正文区域显示骨架屏
- 加载完成后渲染，加载失败显示简短错误提示
- 404 逻辑不变

### 7. 视图 `ArticlesView.vue`

- 基本不改动 —— 列表页只用 `title/summary/tags/publishedAt`，都在 `ArticleMeta` 中

### 8. 构建集成 `package.json`

```json
{
  "scripts": {
    "generate-meta": "npx tsx scripts/generate-metadata.ts",
    "prebuild": "npm run generate-meta",
    "predev": "npm run generate-meta"
  }
}
```

### 加载状态 UI

- 正文加载中：模拟文章排版的骨架屏（灰色块模拟标题、段落、图片）
- 加载失败：居中显示简短错误提示文字

## 改动文件清单

| 操作 | 文件 |
|------|------|
| 新建 | `scripts/generate-metadata.ts` |
| 新建 | `src/data/knowledge-meta.ts`（生成） |
| 新建 | `src/data/articles-meta.ts`（生成） |
| 新建 | `src/data/articles/*.md`（3 篇内联文章抽出） |
| 修改 | `src/types/index.ts` |
| 修改 | `src/data/knowledge.ts` |
| 修改 | `src/data/articles.ts` |
| 修改 | `src/views/KnowledgeView.vue` |
| 修改 | `src/views/ArticleDetailView.vue` |
| 修改 | `package.json` |
