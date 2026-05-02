// 知识库文章
export interface KnowledgeArticle {
  id: string
  title: string
  description: string
  content: string
  category: string
  order: number
}

// 知识库分类
export interface KnowledgeCategory {
  id: string
  name: string
  articles: KnowledgeArticle[]
}

// 博客文章
export interface Article {
  id: string
  title: string
  summary: string
  content: string
  sourceUrl: string
  sourceTitle: string
  sourceAuthor?: string
  tags: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
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
