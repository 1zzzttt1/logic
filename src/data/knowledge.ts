import { parseFrontmatter } from '@/utils/frontmatter'

export interface KnowledgeArticle {
  id: string
  title: string
  description: string
  content: string
  category: string
  order: number
}

export interface KnowledgeCategory {
  id: string
  name: string
  articles: KnowledgeArticle[]
}

// 一级菜单配置（固定）
export const knowledgeCategories = [
  { id: 'ai-basics', name: 'AI基础' },
  { id: 'claude-code', name: 'Claude Code使用教程' },
  { id: 'build-with-claude-code', name: '使用claude code开发'},
  { id: 'ai-development', name: 'AI应用开发' },
  { id: 'agent-skills', name: 'agent Skills' },

]

// 动态加载各分类下的 MD 文件
const aiBasicsModules = import.meta.glob('/src/data/knowledge/ai-basics/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

const claudeCodeModules = import.meta.glob('/src/data/knowledge/claude-code/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

const aiDevelopmentModules = import.meta.glob('/src/data/knowledge/ai-development/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

const buildWithClaudeCodeModules = import.meta.glob('/src/data/knowledge/build-with-claude-code/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
  })

const agentSkillsModules = import.meta.glob('/src/data/knowledge/agent-skills/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
  })

// 转换 MD 文件为知识文章数组
function convertToArticles(modules: Record<string, unknown>, category: string): KnowledgeArticle[] {
  const articles = Object.entries(modules).map(([path, content]) => {
    const filename = path.split('/').pop()?.replace('.md', '') || ''
    const { metadata, content: markdownContent } = parseFrontmatter(content as string)

    return {
      id: filename,
      title: (metadata.title as string) || filename,
      description: (metadata.description as string) || '',
      content: markdownContent || '',
      category,
      order: Number(metadata.order) || 0
    }
  })

  return articles.sort((a, b) => a.order - b.order)
}

// 导出各分类的文章
export const aiBasicsArticles = convertToArticles(aiBasicsModules, 'ai-basics')
export const claudeCodeArticles = convertToArticles(claudeCodeModules, 'claude-code')
export const aiDevelopmentArticles = convertToArticles(aiDevelopmentModules, 'ai-development')
export const buildwithClaudeCodeArticles = convertToArticles(buildWithClaudeCodeModules, 'build-with-claude-code')
export const agentSkillsArticles = convertToArticles(agentSkillsModules, 'agent-skills')

// 导出完整的知识库数据
export const knowledgeData: KnowledgeCategory[] = [
  {
    id: 'ai-basics',
    name: 'AI基础',
    articles: aiBasicsArticles
  },
  {
    id: 'claude-code',
    name: 'Claude Code使用教程',
    articles: claudeCodeArticles
  },
  {
    id: 'agent-skills',
    name: 'Agent Skills',
    articles: agentSkillsArticles
  },
  {
    id: 'build-with-claude-code',
    name: '使用Claude Code开发',
    articles: buildwithClaudeCodeArticles
  },
  {
    id: 'ai-development',
    name: 'AI应用开发',
    articles: aiDevelopmentArticles
  },

]

// 根据分类获取文章
export function getArticlesByCategory(categoryId: string): KnowledgeArticle[] {
  const category = knowledgeData.find(c => c.id === categoryId)
  return category?.articles || []
}

// 根据 ID 获取文章
export function getArticleById(categoryId: string, articleId: string): KnowledgeArticle | undefined {
  const articles = getArticlesByCategory(categoryId)
  return articles.find(a => a.id === articleId)
}