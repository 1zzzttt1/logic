<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { mdArticles } from '../data/articles'

const router = useRouter()

// Sort articles by published date (newest first)
const sortedArticles = computed(() => {
  return [...mdArticles].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const goToDetail = (id: string) => {
  router.push(`/articles/${id}`)
}
</script>

<template>
  <div class="articles-page">
    <div class="page-header">
      <h1 class="page-title">文章分享</h1>
      <p class="page-subtitle">记录和分享我看到的优秀内容</p>
    </div>

    <div class="articles-list">
      <article
        v-for="article in sortedArticles"
        :key="article.id"
        class="article-card"
        @click="goToDetail(article.id)"
      >
        <div class="article-meta">
          <time class="article-date">{{ formatDate(article.publishedAt) }}</time>
          <div class="article-tags">
            <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>

        <h2 class="article-title">{{ article.title }}</h2>
        <p class="article-summary">{{ article.summary }}</p>

        <div class="article-source">
          <span class="material-symbols-outlined">link</span>
          <span>来源：{{ article.sourceTitle }}</span>
        </div>
      </article>
    </div>

    <div v-if="sortedArticles.length === 0" class="empty-state">
      <p>暂无文章，敬请期待...</p>
    </div>
  </div>
</template>

<style scoped>
.articles-page {
  min-height: calc(100vh - 80px);
  padding: 3rem 1.5rem;
  max-width: 48rem;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 4rem;
}

.page-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: #1F1F1C;
  margin-bottom: 0.75rem;
}

html.dark .page-title {
  color: #f4f6fa;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6a6863;
}

html.dark .page-subtitle {
  color: #a6afbf;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.article-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(214, 209, 201, 0.5);
  border-radius: 1rem;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.28s ease;
}

html.dark .article-card {
  background: rgba(30, 45, 70, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  border-color: rgba(95, 110, 138, 0.3);
}

html.dark .article-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #1F1F1C;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

html.dark .article-title {
  color: #f4f6fa;
}

.article-summary {
  font-size: 1rem;
  color: #6a6863;
  line-height: 1.6;
  margin-bottom: 1rem;
}

html.dark .article-summary {
  color: #a6afbf;
}

.article-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7A766F;
}

html.dark .article-source {
  color: #7A766F;
}

.article-source .material-symbols-outlined {
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #7A766F;
}

@media (min-width: 768px) {
  .articles-page {
    padding: 4rem 2rem;
  }

  .page-title {
    font-size: 3rem;
  }

  .article-card {
    padding: 2.5rem;
  }
}
</style>
