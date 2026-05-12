// 不含正文 —— 侧边栏 / 列表用
export interface KnowledgeArticleMeta {
  id: string
  title: string
  description: string
  category: string
  order: number
}


// 知识库分类
export interface KnowledgeCategory {
  id: string
  name: string
  articles: KnowledgeArticleMeta[]
}

// 不含正文 —— 文章列表用
export interface ArticleMeta {
  id: string
  title: string
  summary: string
  sourceUrl: string
  sourceTitle: string
  sourceAuthor?: string
  tags: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
}

// 含正文 —— 文章详情用
export interface Article extends ArticleMeta {
  content: string
}

// 作者信息
export interface Author {
  name: string
  avatar?: string
  bio: string
  email?: string
  github?: string
  twitter?: string
  location?: string
}

// 目录项
export interface TocItem {
  name: string
  id: string
  level: number
  active: boolean
  children: TocItem[]
}
