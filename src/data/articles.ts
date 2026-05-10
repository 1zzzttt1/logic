import type { ArticleMeta } from '@/types'
import { parseFrontmatter } from '@/utils/frontmatter'
import { articlesMeta } from '@/data/articles-meta'

// 导出元数据（不含 content），向后兼容
export const mdArticles: ArticleMeta[] = articlesMeta

// Lazy glob：仅在调用 loadArticleContent 时加载对应文件
const articleModules = import.meta.glob('/src/data/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: false,
}) as Record<string, () => Promise<string>>

// 惰性加载文章正文
export async function loadArticleContent(id: string): Promise<string> {
  const key = `/src/data/articles/${id}.md`
  const loader = articleModules[key]
  if (!loader) {
    throw new Error(`Article not found: ${id}`)
  }
  const rawContent: string = await loader()
  const { content } = parseFrontmatter(rawContent)
  return content
}
