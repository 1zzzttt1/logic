// 自动去除引号
function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, '')
}

// 统一处理两种 tags 格式
export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((s) => stripQuotes(String(s ?? '').trim())).filter(Boolean)
  }
  return []
}

// 解析 YAML frontmatter
export function parseFrontmatter(content: string): {
  metadata: Record<string, unknown>
  content: string
} {
  // 先统一换行符
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { metadata: {}, content }
  }

  const yamlStr = match[1] || ''
  const markdown = match[2] || ''

  const metadata: Record<string, unknown> = {}
  if (yamlStr) {
    // 单行解析：key: value
    yamlStr.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':')
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim()
        const keyTrimmed = key.trim()

        // 方括号数组格式：[a, b]
        if (value.startsWith('[') && value.endsWith(']')) {
          metadata[keyTrimmed] = value
            .slice(1, -1)
            .split(',')
            .map((s) => stripQuotes(s.trim()))
        } else if (keyTrimmed === 'order') {
          // order 字段特殊处理，确保转为数字
          metadata[keyTrimmed] = parseInt(value, 10)
        } else {
          metadata[keyTrimmed] = stripQuotes(value)
        }
      }
    })

    // 处理 YAML 列表格式（多行破折号列表）
    // 例如: tags:\n  - value1\n  - value2
    const listKeyRe = /^(\w+):\s*$/gm
    let lm: RegExpExecArray | null
    while ((lm = listKeyRe.exec(yamlStr)) !== null) {
      const key = lm[1]!
      const afterKey = yamlStr.substring(lm.index + lm[0].length)
      const items: string[] = []
      const lines = afterKey.split('\n')
      for (const listLine of lines) {
        const m = listLine.match(/^\s+-\s+(.+)/)
        if (m) {
          items.push(stripQuotes(m[1]!.trim()))
        } else if (listLine.trim() !== '' && !listLine.startsWith(' ')) {
          break
        }
      }
      if (items.length > 0) {
        metadata[key] = items
      }
    }
  }

  return { metadata, content: markdown }
}
