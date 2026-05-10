import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from '../src/utils/frontmatter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const articlesMetaPath = path.resolve(rootDir, 'src/data/articles-meta.ts')
const articlesDir = path.resolve(rootDir, 'src/data/articles')

// Helper: extract JSON value from generated TS file
function extractJsonValue(content: string): unknown {
  // Match `const varName: Type = <json>` — greedy to capture full JSON
  const match = content.match(/=\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*$/)
  if (!match) {
    throw new Error('Could not extract JSON value from generated file')
  }
  return JSON.parse(match[1]!)
}

describe('articles-data', () => {
  let articlesMeta: Record<string, unknown>[]

  before(() => {
    const content = fs.readFileSync(articlesMetaPath, 'utf-8')
    articlesMeta = extractJsonValue(content) as Record<string, unknown>[]
  })

  it('should have exactly 4 articles', () => {
    assert.strictEqual(articlesMeta.length, 4, 'articlesMeta should have 4 articles')
  })

  it('should contain all expected article IDs', () => {
    const expectedIds = [
      'hello',
      'claude-code-best-practices',
      'token-cost-analysis',
      'ai-agent-workflow',
    ]
    const ids = articlesMeta.map((a) => a.id as string)

    for (const id of expectedIds) {
      assert.ok(ids.includes(id), `Should contain article: ${id}`)
    }
  })

  it('should have correct metadata fields for all articles without content', () => {
    for (const article of articlesMeta) {
      assert.ok(typeof article.id === 'string', `${article.id}: id should be string`)
      assert.ok(typeof article.title === 'string', `${article.id}: title should be string`)
      assert.ok(typeof article.summary === 'string', `${article.id}: summary should be string`)
      assert.ok(Array.isArray(article.tags), `${article.id}: tags should be array`)
      assert.ok(typeof article.publishedAt === 'string', `${article.id}: publishedAt should be string`)
      // Must NOT have content field
      assert.strictEqual(
        (article as Record<string, unknown>).content,
        undefined,
        `${article.id}: metadata should not contain content field`,
      )
    }
  })

  it('should be sorted by publishedAt descending', () => {
    for (let i = 1; i < articlesMeta.length; i++) {
      const prev = articlesMeta[i - 1]!
      const curr = articlesMeta[i]!
      const prevDate = prev.publishedAt as string
      const currDate = curr.publishedAt as string
      if (prevDate && currDate) {
        assert.ok(
          prevDate >= currDate,
          `Not sorted: ${prev.id} (${prevDate}) before ${curr.id} (${currDate})`,
        )
      }
    }
  })

  it('should have a .md file for every metadata entry', () => {
    const mdFiles = fs
      .readdirSync(articlesDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))

    assert.strictEqual(
      mdFiles.length,
      articlesMeta.length,
      'Number of .md files should match number of metadata entries',
    )

    for (const article of articlesMeta) {
      assert.ok(mdFiles.includes(article.id as string), `No .md file found for: ${article.id}`)
    }
  })

  it('should parse .md files with correct frontmatter matching metadata', () => {
    for (const expected of articlesMeta) {
      const filePath = path.join(articlesDir, `${expected.id}.md`)
      assert.ok(fs.existsSync(filePath), `${expected.id}.md should exist`)

      const rawContent = fs.readFileSync(filePath, 'utf-8')
      const { metadata, content } = parseFrontmatter(rawContent)

      assert.strictEqual(
        metadata.title,
        expected.title,
        `${expected.id}: frontmatter title should match metadata`,
      )
      assert.ok(
        content.trim().length > 0,
        `${expected.id}: body content extracted from frontmatter should not be empty`,
      )
    }
  })

  it('should extract body content without frontmatter markers from .md files', () => {
    for (const expected of articlesMeta) {
      const filePath = path.join(articlesDir, `${expected.id}.md`)
      const rawContent = fs.readFileSync(filePath, 'utf-8')
      const { content } = parseFrontmatter(rawContent)

      // Body must not contain the frontmatter YAML block
      assert.ok(!content.startsWith('---'), `${expected.id}: body should not start with frontmatter`)
      assert.ok(content.length > 0, `${expected.id}: body should not be empty`)

      // Body length should be less than raw content (frontmatter was stripped)
      assert.ok(
        content.length < rawContent.length,
        `${expected.id}: body should be shorter than raw content (frontmatter stripped)`,
      )

      // Body should contain substantive content (at least 100 characters of meaningful markdown)
      assert.ok(
        content.trim().length > 100,
        `${expected.id}: body should contain substantive markdown content`,
      )
    }
  })
})
