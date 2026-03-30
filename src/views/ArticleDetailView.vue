<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { mdArticles } from '../data/articles'
import BackToTopButton from '@/components/BackToTopButton.vue'

const route = useRoute()
const router = useRouter()

const article = computed(() => {
  const id = route.params.id as string
  return mdArticles.find(a => a.id === id)
})

const renderedContent = computed(() => {
  if (!article.value) return ''
  return marked(article.value.content)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const goBack = () => {
  router.push('/articles')
}

const openSource = () => {
  if (article.value?.sourceUrl) {
    window.open(article.value.sourceUrl, '_blank')
  }
}

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<template>
  <div class="article-detail-page">
    <div v-if="article" class="article-container">
      <nav class="breadcrumb">
        <router-link to="/articles" class="back-link">
          <span class="material-symbols-outlined">arrow_back</span>
          <span>返回列表</span>
        </router-link>
      </nav>

      <header class="article-header">
        <div class="article-meta">
          <time class="article-date">{{ formatDate(article.publishedAt) }}</time>
          <div class="article-tags">
            <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>

        <h1 class="article-title">{{ article.title }}</h1>
        <p class="article-summary">{{ article.summary }}</p>
      </header>

      <article class="article-content" v-html="renderedContent"></article>
    </div>

    <div v-else class="not-found">
      <h1>文章未找到</h1>
      <p>抱歉，您访问的文章不存在。</p>
      <router-link to="/articles" class="back-btn">返回文章列表</router-link>
    </div>
  </div>

  <BackToTopButton />
</template>

<style scoped>
.article-detail-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 48rem;
  min-height: calc(100vh - 80px);
  margin: 0 auto;
  padding: 7rem 1.5rem 4rem;
}

.article-container {
  width: 100%;
  min-width: 0;
}

.breadcrumb {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #7A766F;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

html.dark .back-link {
  color: #a6afbf;
}

.back-link:hover {
  color: #5F6E8A;
}

html.dark .back-link:hover {
  color: #f4f6fa;
}

.back-link .material-symbols-outlined {
  font-size: 18px;
}

.article-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(214, 209, 201, 0.5);
}

html.dark .article-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.article-date {
  font-family: 'Work Sans', sans-serif;
  font-size: 0.875rem;
  color: #7A766F;
}

html.dark .article-date {
  color: #a6afbf;
}

.article-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  font-family: 'Work Sans', sans-serif;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: rgba(95, 110, 138, 0.1);
  color: #5F6E8A;
  border-radius: 9999px;
}

html.dark .tag {
  background: rgba(95, 110, 138, 0.2);
  color: #a6b9d4;
}

.article-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 2rem;
  font-weight: 900;
  color: #1F1F1C;
  line-height: 1.3;
  margin-bottom: 1rem;
  word-break: break-word;
}

html.dark .article-title {
  color: #f4f6fa;
}

.article-summary {
  font-size: 1.125rem;
  color: #6a6863;
  line-height: 1.6;
  word-break: break-word;
}

html.dark .article-summary {
  color: #a6afbf;
}

.article-content {
  width: 100%;
  min-width: 0;
  font-family: 'Work Sans', sans-serif;
  color: #1F1F1C;
  line-height: 1.8;
  overflow-wrap: anywhere;
  word-break: break-word;
}

html.dark .article-content {
  color: #e0e4ea;
}

.article-content :deep(*) {
  box-sizing: border-box;
  max-width: 100%;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4),
.article-content :deep(h5),
.article-content :deep(h6) {
  scroll-margin-top: 100px;
  word-break: break-word;
}

.article-content :deep(h2) {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #475671;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

html.dark .article-content :deep(h2) {
  color: #a6b9d4;
}

.article-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #475671;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

html.dark .article-content :deep(h3) {
  color: #c4cde0;
}

.article-content :deep(p) {
  margin-bottom: 1.25rem;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.article-content :deep(li) {
  margin-bottom: 0.5rem;
}

.article-content :deep(blockquote) {
  max-width: 100%;
  overflow: hidden;
  background: rgba(95, 110, 138, 0.08);
  border-left: 4px solid #5F6E8A;
  padding: 1.25rem;
  margin: 1.5rem 0;
  border-radius: 0 0.5rem 0.5rem 0;
}

html.dark .article-content :deep(blockquote) {
  background: rgba(95, 110, 138, 0.15);
}

.article-content :deep(blockquote p) {
  margin: 0;
  font-style: italic;
  color: #605E5A;
}

html.dark .article-content :deep(blockquote p) {
  color: #a6afbf;
}

/* 行内 code */
.article-content :deep(code:not(pre code)) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.92em;
  padding: 0.15em 0.4em;
  border-radius: 0.35rem;
  background: rgba(95, 110, 138, 0.12);
  color: #3f4d66;
  word-break: break-word;
}

html.dark .article-content :deep(code:not(pre code)) {
  background: rgba(95, 110, 138, 0.22);
  color: #d8e2f3;
}

/* 代码块容器 */
.article-content :deep(pre) {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  margin: 1.5rem 0;
  padding: 1rem 1rem;
  border-radius: 0.875rem;
  background: #f3f5f8;
  border: 1px solid rgba(95, 110, 138, 0.12);
  line-height: 1.65;
}

html.dark .article-content :deep(pre) {
  background: rgba(18, 22, 30, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 代码块内部 code */
.article-content :deep(pre code) {
  display: block;
  min-width: max-content;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9rem;
  color: inherit;
  background: transparent;
  padding: 0;
  border-radius: 0;
}

/* 表格 */
.article-content :deep(table) {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.article-content :deep(thead),
.article-content :deep(tbody),
.article-content :deep(tr) {
  width: 100%;
}

.article-content :deep(th),
.article-content :deep(td) {
  border: 1px solid rgba(95, 110, 138, 0.18);
  padding: 0.75rem 0.875rem;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
}

html.dark .article-content :deep(th),
html.dark .article-content :deep(td) {
  border-color: rgba(255, 255, 255, 0.1);
}

/* 图片 */
.article-content :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1.5rem auto;
  border-radius: 0.75rem;
}

/* 链接 */
.article-content :deep(a) {
  color: #5F6E8A;
  text-decoration: underline;
  text-underline-offset: 0.14em;
  word-break: break-word;
}

html.dark .article-content :deep(a) {
  color: #a6b9d4;
}

.article-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(214, 209, 201, 0.5);
}

html.dark .article-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.source-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #111111;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

html.dark .source-link-btn {
  background: #ffffff;
  color: #111111;
}

.source-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

html.dark .source-link-btn:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.source-link-btn .material-symbols-outlined {
  font-size: 18px;
}

.not-found {
  text-align: center;
  padding: 4rem 0;
}

.not-found h1 {
  font-family: 'Noto Serif SC', serif;
  font-size: 2rem;
  color: #1F1F1C;
  margin-bottom: 1rem;
}

html.dark .not-found h1 {
  color: #f4f6fa;
}

.not-found p {
  color: #7A766F;
  margin-bottom: 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #5F6E8A;
  color: #ffffff;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #475671;
}

@media (min-width: 768px) {
  .article-detail-page {
    padding: 7rem 2rem 5rem;
  }

  .article-title {
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  .article-detail-page {
    width: 100%;
    max-width: 100%;
    padding: 6.5rem 1rem 2rem;
  }

  .article-header {
    margin-bottom: 2.25rem;
    padding-bottom: 1.5rem;
  }

  .article-title {
    font-size: 1.65rem;
    line-height: 1.35;
  }

  .article-summary {
    font-size: 1rem;
  }

  .article-content {
    font-size: 0.98rem;
    line-height: 1.75;
  }

  .article-content :deep(h2) {
    font-size: 1.3rem;
    margin-top: 2rem;
  }

  .article-content :deep(h3) {
    font-size: 1.12rem;
    margin-top: 1.5rem;
  }

  .article-content :deep(ul),
  .article-content :deep(ol) {
    padding-left: 1.2rem;
  }

  .article-content :deep(blockquote) {
    padding: 1rem;
  }

  .article-content :deep(pre) {
    margin: 1.25rem 0;
    padding: 0.875rem 0.875rem;
    border-radius: 0.75rem;
  }

  .article-content :deep(pre code) {
    font-size: 0.82rem;
  }

  .article-content :deep(table) {
    font-size: 0.875rem;
  }
}
</style>