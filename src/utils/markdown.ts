import { marked } from 'marked'
import type { TocItem } from '@/types'

// 生成标题锚点 ID
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// 从 markdown 内容提取平铺的 TOC 列表
export function generateToc(content: string): TocItem[] {
  if (!content) return []

  const tokens = marked.lexer(content)
  const toc: TocItem[] = []

  const walkTokens = (items: any[]) => {
    for (const token of items) {
      if (token.type === 'heading' && token.depth >= 1 && token.depth <= 3) {
        const text = String(token.text || '').trim()
        const id = slugifyHeading(text)

        if (!text || !id) continue

        toc.push({
          name: text,
          id,
          level: token.depth,
          active: false,
          children: [],
        })
      }

      // 某些 token 可能带有嵌套 token，递归处理
      if (Array.isArray(token.tokens)) {
        walkTokens(token.tokens)
      }
    }
  }

  walkTokens(tokens)
  return toc
}

// 将平铺 TOC 转为嵌套树结构
export function buildNestedToc(flatToc: TocItem[]): TocItem[] {
  const result: TocItem[] = []
  const stack: TocItem[] = []

  for (const item of flatToc) {
    const newItem: TocItem = { ...item, children: [] }

    while (stack.length > 0 && stack[stack.length - 1]!.level >= item.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      result.push(newItem)
    } else {
      stack[stack.length - 1]!.children.push(newItem)
    }

    stack.push(newItem)
  }

  return result
}

// 工厂函数：基于指定 basePath 创建 marked Renderer
export function createKnowledgeRenderer(basePath: string) {
  const renderer = new marked.Renderer()

  renderer.heading = (token: any) => {
    const text = String(token?.text ?? '')
    const depth = Number(token?.depth ?? 1)
    const id = slugifyHeading(text)
    return `<h${depth} class="section-title" id="${id}">${text}</h${depth}>`
  }

  renderer.link = (token: any) => {
    const href = String(token?.href ?? '')
    const text = String(token?.text ?? href)
    const isExternal = /^https?:\/\//.test(href)
    const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
    const icon = isExternal ? '<span class="external-link-icon">↗</span>' : ''
    return `<a href="${href}"${target}>${text}${icon}</a>`
  }

  renderer.image = (token: any) => {
    const href = String(token?.href ?? '')
    const text = String(token?.text ?? '')
    let normalizedSrc = ''

    if (/^https?:\/\//.test(href) || href.startsWith('/logic/')) {
      normalizedSrc = href
    } else if (href.startsWith('/')) {
      normalizedSrc = basePath + href.slice(1)
    } else if (href.startsWith('./images/')) {
      normalizedSrc = basePath + href.slice(2)
    } else {
      normalizedSrc = basePath + href.replace(/^\.\//, '')
    }

    return `<img src="${normalizedSrc}" alt="${text}" class="markdown-image" data-preview-src="${normalizedSrc}" />`
  }

  renderer.codespan = (token: any) => {
    const text = String(token?.text ?? '')
    return `<code class="inline-code">${text}</code>`
  }

  renderer.code = (token: any) => {
    const text = String(token?.text ?? '')
    const lang = String(token?.lang ?? '')
    const languageClass = lang ? ` language-${lang}` : ''
    return `<pre class="code-block"><code class="${languageClass}">${text}</code></pre>`
  }

  renderer.table = function (token: any) {
    const parseInline = (cell: any) => {
      if (cell?.tokens && Array.isArray(cell.tokens)) {
        return this.parser.parseInline(cell.tokens)
      }
      return String(cell?.text ?? '')
    }

    const headerHtml = Array.isArray(token?.header)
      ? token.header.map((cell: any) => `<th>${parseInline(cell)}</th>`).join('')
      : ''

    const bodyHtml = Array.isArray(token?.rows)
      ? token.rows
          .map((row: any[]) => {
            const tds = Array.isArray(row)
              ? row.map((cell: any) => `<td>${parseInline(cell)}</td>`).join('')
              : ''
            return `<tr>${tds}</tr>`
          })
          .join('')
      : ''

    return `
      <div class="table-wrap">
        <table class="markdown-table">
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    `
  }

  return renderer
}

// 便捷函数：渲染 markdown 为 HTML（使用默认 basePath）
export function renderMarkdown(content: string, basePath = '/logic/'): string {
  if (!content) return ''

  const renderer = createKnowledgeRenderer(basePath)

  return marked.parse(content, {
    gfm: true,
    breaks: false,
    renderer,
  }) as string
}
