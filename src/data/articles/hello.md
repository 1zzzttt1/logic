---
title: Hello World - 测试文章
publishedAt: 2025-03-26
tags:
  - 测试
  - Hello World
---

# Hello World

这是从 MD 文件动态加载的测试内容。

## 特点

- 动态加载 MD 文件
- 使用 Vite 的 import.meta.glob
- 支持 frontmatter 元数据

## 代码示例

```typescript
const mdFiles = import.meta.glob('/src/data/articles/*.md', {
  as: 'raw',
  eager: true
})
```

## 总结

这是一个成功的测试！
