import { describe, it, expect } from 'vitest'
import { parseFrontmatter, parseTags } from '../frontmatter'

describe('parseFrontmatter', () => {
  it('should parse standard frontmatter', () => {
    const result = parseFrontmatter('---\ntitle: Hello\norder: 1\n---\n\nBody content')
    expect(result.metadata.title).toBe('Hello')
    expect(result.metadata.order).toBe(1)
    expect(result.content).toBe('\nBody content')
  })

  // R-7: 结尾无换行的 ---
  it('should handle frontmatter ending with --- without trailing newline (file end)', () => {
    const content = '---\ntitle: Hello\norder: 5\n---'
    const result = parseFrontmatter(content)
    expect(result.metadata.title).toBe('Hello')
    expect(result.metadata.order).toBe(5)
  })

  it('should handle frontmatter with --- at end of input', () => {
    const content = '---\ntitle: Test\n---\n\nBody here'
    const result = parseFrontmatter(content)
    expect(result.metadata.title).toBe('Test')
  })

  // R-8: order 字段 NaN 处理
  it('should handle non-numeric order value gracefully', () => {
    const result = parseFrontmatter('---\ntitle: Test\norder: abc\n---\n\nBody')
    expect(result.metadata.title).toBe('Test')
    // order should not be NaN — should be a valid number or undefined
    const order = result.metadata.order
    if (typeof order === 'number') {
      expect(Number.isNaN(order)).toBe(false)
    }
  })

  it('should handle empty order value', () => {
    const result = parseFrontmatter('---\ntitle: Test\norder: \n---\n\nBody')
    const order = result.metadata.order
    if (typeof order === 'number') {
      expect(Number.isNaN(order)).toBe(false)
    }
  })

  it('should handle float order value (rounds to int)', () => {
    const result = parseFrontmatter('---\ntitle: Test\norder: 3.5\n---\n\nBody')
    // parseInt("3.5") = 3 — acceptable behavior
    expect(result.metadata.order).toBe(3)
  })

  // R-10: YAML 列表键含连字符
  it('should parse list items with hyphenated key names', () => {
    const content = '---\ntitle: Test\nmy-tags:\n  - tag1\n  - tag2\n---\n\nBody'
    const result = parseFrontmatter(content)
    expect(result.metadata['my-tags']).toEqual(['tag1', 'tag2'])
  })

  it('should parse list items with underscore key names', () => {
    const content = '---\ntitle: Test\nsub_items:\n  - a\n  - b\n---\n\nBody'
    const result = parseFrontmatter(content)
    expect(result.metadata['sub_items']).toEqual(['a', 'b'])
  })

  // 无 frontmatter 的内容
  it('should return empty metadata for content without frontmatter', () => {
    const result = parseFrontmatter('Just plain text')
    expect(result.metadata).toEqual({})
    expect(result.content).toBe('Just plain text')
  })

  // stripQuotes 边界情况
  it('should strip surrounding double quotes from values', () => {
    const result = parseFrontmatter('---\ntitle: "Hello World"\n---\n\nBody')
    expect(result.metadata.title).toBe('Hello World')
  })

  it('should strip surrounding single quotes from values', () => {
    const result = parseFrontmatter("---\ntitle: 'Hello World'\n---\n\nBody")
    expect(result.metadata.title).toBe('Hello World')
  })

  it('should handle content with unmatched internal quotes', () => {
    const result = parseFrontmatter('---\ntitle: He said "hello"\n---\n\nBody')
    // Internal quotes inside a value should be preserved
    expect(result.metadata.title).toBe('He said "hello"')
  })
})

describe('parseTags', () => {
  it('should parse array tags', () => {
    expect(parseTags(['tag1', 'tag2'])).toEqual(['tag1', 'tag2'])
  })

  it('should strip quotes from tags', () => {
    expect(parseTags(['"tag1"', "'tag2'"])).toEqual(['tag1', 'tag2'])
  })

  it('should return empty array for non-array input', () => {
    expect(parseTags('not an array')).toEqual([])
  })
})
