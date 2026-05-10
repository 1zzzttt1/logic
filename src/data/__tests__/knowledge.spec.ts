import { describe, it, expect } from 'vitest'
import {
  knowledgeData,
  knowledgeCategories,
  getArticlesByCategory,
  getArticleById,
  loadKnowledgeContent
} from '@/data/knowledge'

describe('knowledgeData', () => {
  it('should contain articles without content field', () => {
    for (const category of knowledgeData) {
      for (const article of category.articles) {
        // Verify no content field in metadata-level articles
        expect(article).not.toHaveProperty('content')
      }
    }
  })

  it('should include all categories from knowledgeCategories', () => {
    const dataIds = knowledgeData.map((c) => c.id)
    for (const cat of knowledgeCategories) {
      expect(dataIds).toContain(cat.id)
    }
  })

  it('should have correct category name mapping', () => {
    for (const category of knowledgeData) {
      const meta = knowledgeCategories.find((c) => c.id === category.id)
      expect(meta).toBeDefined()
      expect(category.name).toBe(meta!.name)
    }
  })

  it('should return empty articles for empty category (ai-basics)', () => {
    const aiBasics = knowledgeData.find((c) => c.id === 'ai-basics')
    expect(aiBasics).toBeDefined()
    expect(aiBasics!.articles).toEqual([])
  })

  it('should contain articles for non-empty categories', () => {
    for (const category of knowledgeData) {
      if (category.id !== 'ai-basics') {
        expect(category.articles.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('getArticlesByCategory', () => {
  it('should return articles as KnowledgeArticleMeta without content', () => {
    const articles = getArticlesByCategory('agent-skills')
    expect(articles.length).toBeGreaterThan(0)
    for (const article of articles) {
      expect(article).not.toHaveProperty('content')
      expect(typeof article.id).toBe('string')
      expect(typeof article.title).toBe('string')
      expect(typeof article.description).toBe('string')
      expect(article.category).toBe('agent-skills')
      expect(typeof article.order).toBe('number')
    }
  })

  it('should return empty array for non-existent category', () => {
    const articles = getArticlesByCategory('non-existent-category')
    expect(articles).toEqual([])
  })

  it('should return empty array for empty category', () => {
    const articles = getArticlesByCategory('ai-basics')
    expect(articles).toEqual([])
  })

  it('should sort articles by order', () => {
    const articles = getArticlesByCategory('agent-skills')
    for (let i = 1; i < articles.length; i++) {
      expect(articles[i]!.order).toBeGreaterThanOrEqual(articles[i - 1]!.order)
    }
  })
})

describe('getArticleById', () => {
  it('should return article meta without content for valid id', () => {
    const article = getArticleById('agent-skills', 'Skills是什么')
    expect(article).toBeDefined()
    expect(article).not.toHaveProperty('content')
    expect(article!.id).toBe('Skills是什么')
    expect(typeof article!.title).toBe('string')
    expect(article!.category).toBe('agent-skills')
  })

  it('should return undefined for non-existent id', () => {
    const article = getArticleById('agent-skills', 'non-existent-article')
    expect(article).toBeUndefined()
  })

  it('should return undefined for non-existent category', () => {
    const article = getArticleById('non-existent', 'Skills是什么')
    expect(article).toBeUndefined()
  })
})

describe('loadKnowledgeContent', () => {
  it('should return non-empty string for valid article', async () => {
    const content = await loadKnowledgeContent('agent-skills', 'Skills是什么')
    expect(typeof content).toBe('string')
    expect(content.length).toBeGreaterThan(0)
  })

  it('should return parsed content (without frontmatter) for valid article', async () => {
    const content = await loadKnowledgeContent('agent-skills', 'Skills是什么')
    // Content should NOT start with frontmatter marker
    expect(content.startsWith('---')).toBe(false)
  })

  it('should throw for non-existent article', async () => {
    await expect(
      loadKnowledgeContent('agent-skills', 'non-existent-article')
    ).rejects.toThrow()
  })

  it('should throw for non-existent category', async () => {
    await expect(
      loadKnowledgeContent('non-existent', 'Skills是什么')
    ).rejects.toThrow()
  })
})
