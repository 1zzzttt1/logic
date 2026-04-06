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

// 动态加载 MD 文件
const mdModules = import.meta.glob('/src/data/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

// 解析 frontmatter
function parseFrontmatter(content: string): { metadata: Record<string, unknown>; content: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { metadata: {}, content }
  }

  const yamlStr = match[1] || ''
  const markdown = match[2] || ''

  const metadata: Record<string, unknown> = {}
  if (yamlStr) {
    yamlStr.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':')
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim()
        // 解析数组
        if (value.startsWith('[') && value.endsWith(']')) {
          metadata[key.trim()] = value.slice(1, -1).split(',').map(s => s.trim())
        } else {
          metadata[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
      }
    })
  }

  return { metadata, content: markdown }
}

// 转换 MD 文件为文章数组
export const mdArticles = Object.entries(mdModules).map(([path, content]) => {
  const filename = path.split('/').pop()?.replace('.md', '') || ''
  const { metadata, content: markdownContent } = parseFrontmatter(content as string)

  return {
    id: filename,
    title: (metadata.title as string) || filename,
    summary: (metadata.summary as string) || '',
    content: markdownContent || '',
    sourceUrl: '',
    tags: (metadata.tags as string[]) || [],
    publishedAt: (metadata.publishedAt as string) || new Date().toISOString().split('T')[0] || '',
    createdAt: (metadata.publishedAt as string) || new Date().toISOString().split('T')[0] || '',
    updatedAt: (metadata.publishedAt as string) || new Date().toISOString().split('T')[0] || ''
  } as Article
})

export const articles: Article[] = [
  {
    id: 'claude-code-best-practices',
    title: 'Claude Code 最佳实践：如何高效使用 AI 编程助手',
    summary: '深入探讨 Claude Code 的核心使用策略，包括提示词技巧、工作流程优化和实际应用场景。',
    content: `## 为什么选择 Claude Code

Claude Code 不仅仅是一个代码补全工具，它是一个真正的编程伙伴。通过正确的使用方式，它可以极大地提升开发效率。

### 核心使用策略

1. **明确任务边界**：不要让 AI 做所有事情，而是让它做你最不想做的重复性工作
2. **保持上下文**：利用对话上下文，让 AI 理解你的代码库结构
3. **迭代式开发**：从小处着手，逐步扩展

### 实际案例

在使用 Claude Code 时，我发现了几个特别有效的场景：

- **代码审查**：让 AI 先审查代码，再进行人工复审
- **文档生成**：自动生成 API 文档和 README
- **bug 定位**：描述错误信息，让 AI 帮助定位问题

### 最佳实践总结

> 关键在于把 AI 当作一个经验丰富的同事，而不是一个黑盒子。

当你学会正确地与 AI 协作时，它将成为你最有价值的生产力工具。`,
    sourceUrl: 'https://example.com/claude-code-guide',
    sourceTitle: 'Claude Code 官方文档',
    sourceAuthor: 'Anthropic',
    tags: ['AI', 'Claude Code', '效率工具'],
    publishedAt: '2025-01-15',
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15'
  },
  {
    id: 'token-cost-analysis',
    title: '大语言模型 Token 成本分析：如何优化你的 API 支出',
    summary: '详细分析 Token 计算方式对 API 成本的影响，提供实用的成本优化策略。',
    content: `## Token 成本的基本概念

在使用 OpenAI、Anthropic 等大语言模型 API 时，费用通常按照 Token 数量计算。理解 Token 的工作原理对于控制成本至关重要。

### Token 计算规则

- **输入 Token**：包括系统提示、用户输入和对话历史
- **输出 Token**：模型生成的所有内容
- **计费方式**：通常是输入和输出 Token 分别计费

### 成本优化策略

1. **精简系统提示**：不必要的系统指令会浪费 Token
2. **使用缓存**：对于重复性请求，利用 API 提供的缓存功能
3. **选择合适的模型**：不是所有场景都需要最强大的模型

### 实际案例

假设你有一个客服聊天机器人：
- 每天处理 1000 个请求
- 平均每个请求 500 输入 Token，200 输出 Token
- 使用 GPT-4 的成本约为 $0.01/1K Token

通过优化，你可以将成本降低 50% 以上。`,
    sourceUrl: 'https://example.com/token-cost-guide',
    sourceTitle: 'LLM API 成本优化指南',
    tags: ['AI', '成本优化', 'LLM'],
    publishedAt: '2025-01-10',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-10'
  },
  {
    id: 'ai-agent-workflow',
    title: 'AI Agent 工作流设计：从理论到实践',
    summary: '探索 AI Agent 的设计模式和最佳实践，构建可靠的自动化工作流程。',
    content: `## 什么是 AI Agent

AI Agent 是能够自主执行任务的 AI 系统，它不仅能生成内容，还能根据环境反馈做出决策。

### 核心组件

一个典型的 AI Agent 包含：

1. **规划模块**：分解复杂任务为可执行的子任务
2. **执行模块**：调用工具执行具体操作
3. **评估模块**：验证执行结果是否符合预期
4. **反思模块**：从错误中学习并调整策略

### 设计模式

#### 1. ReAct 模式

结合推理（Reasoning）和行动（Acting），让 AI 在思考过程中调用工具。

#### 2. Reflexion 模式

通过自我反思来改进性能，适合需要迭代优化的任务。

### 实践建议

- 始终设置明确的退出条件
- 保留人类干预的接口
- 做好错误处理和日志记录

> 好的 AI Agent 设计不在于让它做更多的事，而在于让它更可靠地做事。`,
    sourceUrl: 'https://example.com/ai-agent-design',
    sourceTitle: 'AI Agent 设计模式',
    tags: ['AI', 'Agent', '工作流'],
    publishedAt: '2025-01-05',
    createdAt: '2025-01-05',
    updatedAt: '2025-01-05'
  }
]
