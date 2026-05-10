import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Helper: extract exported const value from generated TS file
function extractConstValue(content: string, constName: string): unknown {
  // Match from `= ` to the matching closing brace/bracket at end of file (no semicolon needed)
  const regex = new RegExp(
    `export const ${constName}\\s*:\\s*[^=]+=\\s*(\\{[\\s\\S]*\\}|\\[[\\s\\S]*\\])`,
  )
  const match = content.match(regex)
  if (!match) throw new Error(`Could not extract ${constName}`)
  return JSON.parse(match[1]!)
}

const knowledgeMetaPath = path.resolve(rootDir, 'src/data/knowledge-meta.ts')

describe('knowledge-view data contract', () => {
  let knowledgeMeta: Record<string, Array<Record<string, unknown>>>

  before(async () => {
    // Regenerate metadata fresh
    await import('./generate-metadata.ts')

    const metaContent = fs.readFileSync(knowledgeMetaPath, 'utf-8')
    knowledgeMeta = extractConstValue(metaContent, 'knowledgeMeta') as Record<
      string,
      Array<Record<string, unknown>>
    >
  })

  it('knowledgeMeta should be a non-empty record', () => {
    assert.ok(typeof knowledgeMeta === 'object', 'knowledgeMeta should be an object')
    const catCount = Object.keys(knowledgeMeta).length
    assert.ok(catCount > 0, `should have at least one category, got ${catCount}`)
  })

  it('articles should only have meta fields (no content)', () => {
    for (const [cat, articles] of Object.entries(knowledgeMeta)) {
      assert.ok(Array.isArray(articles), `${cat}: articles should be an array`)
      for (const article of articles) {
        assert.ok(typeof article.id === 'string', `${cat}/${article.id}: id should be string`)
        assert.ok(typeof article.title === 'string', `${cat}/${article.id}: title should be string`)
        assert.ok(
          typeof article.description === 'string',
          `${cat}/${article.id}: description should be string`,
        )
        assert.ok(
          typeof article.category === 'string',
          `${cat}/${article.id}: category should be string`,
        )
        assert.ok(typeof article.order === 'number', `${cat}/${article.id}: order should be number`)
        // Must NOT have content
        assert.strictEqual(
          article.content,
          undefined,
          `${cat}/${article.id}: should not have content field`,
        )
      }
    }
  })

  it('articles should be sorted by order within each category', () => {
    for (const [cat, articles] of Object.entries(knowledgeMeta)) {
      for (let i = 1; i < articles.length; i++) {
        const prev = articles[i - 1]!
        const curr = articles[i]!
        assert.ok(
          curr.order >= prev.order,
          `${cat}: not sorted by order at index ${i} (${prev.id}:${prev.order} > ${curr.id}:${curr.order})`,
        )
      }
    }
  })

  it('each article should have valid category reference', () => {
    for (const [cat, articles] of Object.entries(knowledgeMeta)) {
      for (const article of articles) {
        assert.strictEqual(
          article.category,
          cat,
          `${article.id}: category should be "${cat}", got "${article.category}"`,
        )
      }
    }
  })

  it('article titles should be non-empty', () => {
    for (const [cat, articles] of Object.entries(knowledgeMeta)) {
      for (const article of articles) {
        assert.ok(
          typeof article.title === 'string' && (article.title as string).trim().length > 0,
          `${cat}/${article.id}: title should not be empty`,
        )
      }
    }
  })

  it('all article IDs should be unique within each category', () => {
    for (const [cat, articles] of Object.entries(knowledgeMeta)) {
      const ids = articles.map((a) => a.id as string)
      const uniqueIds = new Set(ids)
      assert.strictEqual(
        ids.length,
        uniqueIds.size,
        `${cat}: duplicate article IDs found (${ids.length} articles, ${uniqueIds.size} unique)`,
      )
    }
  })
})
