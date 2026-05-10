# Tasks: 按需加载 Markdown 内容

> 父文档：[2026-05-09-lazy-markdown-loading-design.md](./2026-05-09-lazy-markdown-loading-design.md)

## 执行顺序

Phase 1（可并行） → Phase 2（依赖 Phase 1） → Phase 3（依赖 Phase 2） → Phase 4（收尾）

---

### Phase 1: 基础设施

- [x] **Task 1: 更新 `package.json` build scripts**
  - 新增 `"generate-meta": "jiti scripts/generate-metadata.ts"`
  - 新增 `"prebuild": "pnpm run generate-meta"`
  - 新增 `"predev": "pnpm run generate-meta"`
  - scripts 目录需存在，不存在则创建

- [x] **Task 2: 创建 `scripts/generate-metadata.ts`**
  - 复用 `src/utils/frontmatter.ts` 的 `parseFrontmatter`
  - 扫描 `src/data/knowledge/{分类}/*.md`，解析 frontmatter 提取 title/description/order/category
  - 扫描 `src/data/articles/*.md`，解析 frontmatter 提取 title/summary/tags/publishedAt 等
  - 生成 `src/data/knowledge-meta.ts` 和 `src/data/articles-meta.ts`
  - 元数据按 order 排序
  - 包含 9 个 node:test 测试

- [x] **Task 3: 拆分类型 `src/types/index.ts`**
  - 新增 `KnowledgeArticleMeta`（不含 content）
  - `KnowledgeArticle` 改为 `extends KnowledgeArticleMeta`（加 content）
  - 新增 `ArticleMeta`（不含 content）
  - `Article` 改为 `extends ArticleMeta`（加 content）
  - `KnowledgeCategory.articles` 类型改为 `KnowledgeArticleMeta[]`

- [x] **Task 4: 运行脚本生成元数据文件**
  - 执行 `pnpm run generate-meta`
  - 验证生成的两个文件语法正确、类型检查通过
  - 9/9 测试通过

---

### Phase 2: 数据层

- [ ] **Task 5: 抽出 3 篇内联文章为 `.md` 文件**
  - 在 `src/data/articles/` 下创建 3 个 .md 文件：
    - `claude-code-best-practices.md`
    - `token-cost-analysis.md`
    - `ai-agent-workflow.md`
  - 每个文件包含正确的 YAML frontmatter（title、summary、tags、publishedAt、sourceUrl 等）
  - 确保正文中不含可能被误解析为 `---` 的内容

- [ ] **Task 6: 改造 `src/data/knowledge.ts`**
  - 删除 5 个 `eager: true` glob
  - 导入 `knowledgeMeta`（生成的元数据）
  - 新增 lazy glob：`import.meta.glob('/src/data/knowledge/**/*.md', { query: '?raw', import: 'default', eager: false })`
  - `knowledgeData` 从元数据组装（不含 content）
  - 新增并导出 `loadKnowledgeContent(category: string, id: string): Promise<string>`
  - `getArticlesByCategory` / `getArticleById` 返回 `KnowledgeArticleMeta`

- [ ] **Task 7: 改造 `src/data/articles.ts`**
  - 删除 `eager: true` glob
  - 导入 `articlesMeta`（生成的元数据）
  - 删除 3 篇硬编码内联文章的 content 字符串
  - 新增 lazy glob：`import.meta.glob('/src/data/articles/*.md', { query: '?raw', import: 'default', eager: false })`
  - `mdArticles` 导出 `ArticleMeta[]`
  - 新增并导出 `loadArticleContent(id: string): Promise<string>`

---

### Phase 3: 视图层

- [ ] **Task 8: 改造 `KnowledgeView.vue`**
  - `selectedArticle` 拆为 `selectedArticleMeta`（同步 ref）+ `articleContent`（异步 ref）
  - 新增 `isContentLoading: ref<boolean>`
  - `selectArticle()` 改为 async：立即设置 meta → 异步加载 content
  - 模板：标题/描述/面包屑从 `selectedArticleMeta` 读取
  - 正文区域：加载中显示骨架屏，加载完成渲染 markdown，失败显示错误提示
  - TOC 在 `articleContent` 变化后通过 watch 重新生成
  - 骨架屏样式：模拟文章排版（标题块 + 段落块 + 图片块）

- [ ] **Task 9: 改造 `ArticleDetailView.vue`**
  - 元数据从 `mdArticles`（`ArticleMeta[]`）同步查找
  - 新增 `articleContent: ref<string>` + `isContentLoading: ref<boolean>`
  - `watch(route.params.id, { immediate: true })` 异步加载正文
  - 模板：标题/标签/日期从 meta 读取（路由切换时立即更新）
  - 正文区域：同 KnowledgeView 的骨架屏 + 错误处理
  - 404 逻辑不变

---

### Phase 4: 验证

- [ ] **Task 10: 运行 `pnpm build` 验证构建**
  - 确认构建成功
  - 检查 dist 产物：每篇 .md 文章应生成为独立 chunk
  - 确认主 bundle 体积显著减小

- [ ] **Task 11: 运行 `pnpm dev` 验证开发流程**
  - 确认 `predev` 钩子正常执行（生成元数据）
  - 确认知识库页面：点击文章正常加载正文
  - 确认文章列表/详情页正常
  - 确认骨架屏和错误提示正常显示
