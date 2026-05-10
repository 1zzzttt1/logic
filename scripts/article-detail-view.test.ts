import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const articlesMetaPath = path.resolve(rootDir, 'src/data/articles-meta.ts')
const articlesDir = path.resolve(rootDir, 'src/data/articles')

// Helper: extract JSON value from generated TS file
function extractConstValue(content: string, constName: string): unknown {
  const regex = new RegExp(
    `export const ${constName}\\s*:\\s*[^=]+=\\s*(\\{[\\s\\S]*\\}|\\[[\\s\\S]*\\])`,
  )
  const match = content.match(regex)
  if (!match) throw new Error(`Could not extract ${constName}`)
  return JSON.parse(match[1]!)
}

describe('article-detail-view data contract', () => {
  let articlesMeta: Record<string, unknown>[]

  before(async () => {
    // Regenerate metadata fresh
    await import('./generate-metadata.ts')

    const content = fs.readFileSync(articlesMetaPath, 'utf-8')
    articlesMeta = extractConstValue(content, 'articlesMeta') as Record<string, unknown>[]
  })

  it('articlesMeta should be a non-empty array', () => {
    assert.ok(Array.isArray(articlesMeta), 'articlesMeta should be an array')
    assert.ok(articlesMeta.length > 0, 'articlesMeta should not be empty')
  })

  it('articles should have all required Meta fields (no content)', () => {
    const requiredFields = ['id', 'title', 'summary', 'tags', 'publishedAt', 'sourceUrl', 'sourceTitle', 'createdAt', 'updatedAt']

    for (const article of articlesMeta) {
      for (const field of requiredFields) {
        assert.ok(
          field in article,
          `${article.id}: missing required field "${field}"`,
        )
      }

      // Must NOT have content field
      assert.strictEqual(
        (article as Record<string, unknown>).content,
        undefined,
        `${article.id}: metadata should not contain content field`,
      )
    }
  })

  it('id should be a non-empty string', () => {
    for (const article of articlesMeta) {
      assert.ok(typeof article.id === 'string', `id should be string`)
      assert.ok((article.id as string).length > 0, `id should not be empty`)
    }
  })

  it('title should be a non-empty string', () => {
    for (const article of articlesMeta) {
      assert.ok(typeof article.title === 'string', `${article.id}: title should be string`)
      assert.ok((article.title as string).trim().length > 0, `${article.id}: title should not be empty`)
    }
  })

  it('tags should be an array of strings', () => {
    for (const article of articlesMeta) {
      const tags = article.tags as unknown[]
      assert.ok(Array.isArray(tags), `${article.id}: tags should be array`)
      assert.ok(tags.length > 0, `${article.id}: tags should not be empty`)
      for (const tag of tags) {
        assert.ok(typeof tag === 'string', `${article.id}: tag should be string, got ${typeof tag}`)
      }
    }
  })

  it('publishedAt should be a valid date string (YYYY-MM-DD format)', () => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    for (const article of articlesMeta) {
      const publishedAt = article.publishedAt as string
      assert.ok(
        datePattern.test(publishedAt),
        `${article.id}: publishedAt "${publishedAt}" should match YYYY-MM-DD format`,
      )
      const date = new Date(publishedAt)
      assert.ok(
        !isNaN(date.getTime()),
        `${article.id}: publishedAt "${publishedAt}" is not a valid date`,
      )
    }
  })

  it('sourceUrl should be a string', () => {
    for (const article of articlesMeta) {
      assert.ok(
        typeof article.sourceUrl === 'string',
        `${article.id}: sourceUrl should be string`,
      )
    }
  })

  it('sourceTitle should be a string', () => {
    for (const article of articlesMeta) {
      assert.ok(
        typeof article.sourceTitle === 'string',
        `${article.id}: sourceTitle should be string`,
      )
    }
  })

  it('should be sorted by publishedAt descending', () => {
    for (let i = 1; i < articlesMeta.length; i++) {
      const prev = articlesMeta[i - 1]!
      const curr = articlesMeta[i]!
      const prevDate = prev.publishedAt as string
      const currDate = curr.publishedAt as string
      assert.ok(
        prevDate >= currDate,
        `Not sorted: ${prev.id} (${prevDate}) before ${curr.id} (${currDate})`,
      )
    }
  })

  it('every metadata entry should have a corresponding .md file', () => {
    const mdFiles = fs
      .readdirSync(articlesDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))

    for (const article of articlesMeta) {
      assert.ok(
        mdFiles.includes(article.id as string),
        `No .md file found for article: ${article.id}`,
      )
    }
  })
})
