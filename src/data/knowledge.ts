import { parseFrontmatter } from '@/utils/frontmatter'
import { knowledgeMeta } from '@/data/knowledge-meta'
import type { KnowledgeArticleMeta, KnowledgeCategory } from '@/types'

// 向后兼容：KnowledgeView.vue 导入 type KnowledgeArticle，实际指向无 content 的元数据类型
// TODO: Task 8 会将 KnowledgeView.vue 中的导入改为 KnowledgeArticleMeta
export type KnowledgeArticle = KnowledgeArticleMeta

// 分类配置（固定列表）
export const knowledgeCategories = [
  { id: 'ai-basics', name: 'AI基础' },
  { id: 'claude-code', name: 'Claude Code使用教程' },
  { id: 'build-with-claude-code', name: '使用claude code开发' },
  { id: 'ai-development', name: 'AI应用开发' },
  { id: 'agent-skills', name: 'agent Skills' },
]

// Lazy glob：仅在调用 loadKnowledgeContent 时加载对应文件
const knowledgeModules = import.meta.glob('/src/data/knowledge/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: false,
}) as Record<string, () => Promise<string>>

// 从元数据组装知识库数据（不含 content）
export const knowledgeData: KnowledgeCategory[] = knowledgeCategories.map((cat) => ({
  id: cat.id,
  name: cat.name,
  articles: knowledgeMeta[cat.id] || [],
}))

// 根据分类获取文章元数据列表
export function getArticlesByCategory(categoryId: string): KnowledgeArticleMeta[] {
  const category = knowledgeData.find((c) => c.id === categoryId)
  return category?.articles || []
}

// 根据 ID 获取文章元数据
export function getArticleById(
  categoryId: string,
  articleId: string,
): KnowledgeArticleMeta | undefined {
  const articles = getArticlesByCategory(categoryId)
  return articles.find((a) => a.id === articleId)
}

// 惰性加载文章正文
export async function loadKnowledgeContent(
  category: string,
  id: string,
): Promise<string> {
  const key = `/src/data/knowledge/${category}/${id}.md`
  const loader = knowledgeModules[key]
  if (!loader) {
    throw new Error(`Article not found: ${category}/${id}`)
  }
  const rawContent: string = await loader()
  const { content } = parseFrontmatter(rawContent)
  return content
}
