<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { mdArticles } from '../data/articles'

const router = useRouter()

// Sort articles by published date (newest first)
const sortedArticles = computed(() => {
  return [...mdArticles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() -
      new Date(a.publishedAt).getTime()
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
  <main class="articles-page">
    <header class="page-header">
      <p class="page-eyebrow">Articles</p>

      <h1 class="page-title">文章分享</h1>

      <p class="page-subtitle">
        记录和分享我看到的优秀内容，也沉淀一些值得反复阅读的思考。
      </p>
    </header>

    <section v-if="sortedArticles.length > 0" class="articles-list">
      <article
        v-for="article in sortedArticles"
        :key="article.id"
        class="article-card"
        tabindex="0"
        role="button"
        @click="goToDetail(article.id)"
        @keydown.enter="goToDetail(article.id)"
      >
        <div class="article-card-inner">
          <div class="article-meta">
            <time class="article-date">
              {{ formatDate(article.publishedAt) }}
            </time>

            <div class="article-tags" aria-label="文章标签">
              <span
                v-for="tag in article.tags"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="article-content">
            <h2 class="article-title">
              {{ article.title }}
            </h2>

            <p class="article-summary">
              {{ article.summary }}
            </p>
          </div>

          <div class="article-footer">
            <span class="read-more">阅读文章</span>
            <span class="read-arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </article>
    </section>

    <section v-else class="empty-state">
      <div class="empty-card">
        <p class="empty-title">暂无文章</p>
        <p class="empty-desc">新的内容正在整理中，敬请期待。</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
/*
  字体策略说明：
  1. 不依赖 Google Fonts，避免国内访问不稳定。
  2. 中文优先使用系统字体，加载快、兼容好。
  3. 文章卡片以阅读体验为主，避免过度装饰字体。
*/
.articles-page {
  --font-sans:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    'HarmonyOS Sans SC',
    'Source Han Sans SC',
    'Noto Sans CJK SC',
    Arial,
    sans-serif;

  --text-main: #24231f;
  --text-secondary: #68645d;
  --text-muted: #858078;
  --text-accent: #53627c;

  --card-bg: rgba(255, 255, 255, 0.82);
  --card-bg-soft: rgba(250, 247, 241, 0.72);
  --card-border: rgba(214, 209, 201, 0.68);
  --card-shadow: 0 1px 2px rgba(31, 31, 28, 0.04),
    0 10px 30px rgba(31, 31, 28, 0.06);

  width: min(100%, 52rem);
  min-height: calc(100vh - 80px);
  margin: 0 auto;
  padding: 7rem 1.25rem 4rem;
  font-family: var(--font-sans);
  color: var(--text-main);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html.dark .articles-page {
  --text-main: #f4f6fa;
  --text-secondary: #aab3c2;
  --text-muted: #8f9caf;
  --text-accent: #b9c9df;

  --card-bg: rgba(30, 45, 70, 0.72);
  --card-bg-soft: rgba(18, 28, 48, 0.62);
  --card-border: rgba(255, 255, 255, 0.08);
  --card-shadow: 0 1px 2px rgba(0, 0, 0, 0.18),
    0 14px 36px rgba(0, 0, 0, 0.22);
}

/* 页面头部 */
.page-header {
  max-width: 42rem;
  margin: 0 auto 3.5rem;
  text-align: center;
}

.page-eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #7c8aa6;
}

.page-title {
  margin: 0 0 0.9rem;
  font-size: clamp(2.2rem, 6vw, 3.35rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.045em;
  color: var(--text-main);
}

.page-subtitle {
  max-width: 34rem;
  margin: 0 auto;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.85;
  letter-spacing: 0.01em;
  color: var(--text-secondary);
}

/* 文章列表 */
.articles-list {
  display: grid;
  gap: 1.25rem;
}

/* 文章卡片 */
.article-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--card-border);
  border-radius: 1.25rem;
  background:
    linear-gradient(
      135deg,
      var(--card-bg),
      var(--card-bg-soft)
    );
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition:
    transform 0.28s ease,
    border-color 0.28s ease,
    box-shadow 0.28s ease,
    background 0.28s ease;
}

.article-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(
    180deg,
    rgba(95, 110, 138, 0.75),
    rgba(133, 160, 188, 0.35)
  );
  opacity: 0;
  transition: opacity 0.28s ease;
}

.article-card:focus-visible {
  outline: 3px solid rgba(95, 110, 138, 0.35);
  outline-offset: 4px;
}

.article-card-inner {
  position: relative;
  z-index: 1;
  padding: 1.5rem;
}

/* 元信息 */
.article-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
}

.article-date {
  flex: 0 0 auto;
  padding-top: 0.18rem;
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.01em;
  color: var(--text-muted);
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  background: rgba(95, 110, 138, 0.09);
  color: var(--text-accent);
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

html.dark .tag {
  background: rgba(166, 185, 212, 0.12);
}

/* 正文 */
.article-content {
  max-width: 42rem;
}

.article-title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.26rem, 3.2vw, 1.58rem);
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: -0.025em;
  color: var(--text-main);
}

.article-summary {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 0.98rem;
  font-weight: 400;
  line-height: 1.9;
  letter-spacing: 0.01em;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 底部阅读提示 */
.article-footer {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 1.35rem;
  color: var(--text-accent);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  justify-content: flex-end;
}

.read-arrow {
  display: inline-flex;
  transform: translateX(0);
  transition: transform 0.24s ease;
}

/* 空状态 */
.empty-state {
  padding: 1rem 0 4rem;
}

.empty-card {
  border: 1px dashed rgba(122, 118, 111, 0.35);
  border-radius: 1.25rem;
  padding: 3rem 1.5rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.45);
}

html.dark .empty-card {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(30, 45, 70, 0.35);
}

.empty-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
}

.empty-desc {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

/* 只在支持 hover 的设备上启用悬浮动效 */
@media (hover: hover) and (pointer: fine) {
  .article-card:hover {
    transform: translateY(-4px);
    border-color: rgba(95, 110, 138, 0.32);
    box-shadow:
      0 8px 18px rgba(31, 31, 28, 0.08),
      0 20px 48px rgba(31, 31, 28, 0.12);
  }

  .article-card:hover::before {
    opacity: 1;
  }

  .article-card:hover .read-arrow {
    transform: translateX(4px);
  }

  html.dark .article-card:hover {
    border-color: rgba(166, 185, 212, 0.22);
    box-shadow:
      0 8px 18px rgba(0, 0, 0, 0.25),
      0 20px 48px rgba(0, 0, 0, 0.35);
  }
}

/* 平板及以上 */
@media (min-width: 768px) {
  .articles-page {
    padding: 7.5rem 2rem 5rem;
  }

  .page-header {
    margin-bottom: 4rem;
  }

  .articles-list {
    gap: 1.5rem;
  }

  .article-card-inner {
    padding: 2rem;
  }
}

/* 手机端 */
@media (max-width: 640px) {
  .articles-page {
    padding: 6rem 1rem 3.5rem;
  }

  .page-header {
    margin-bottom: 2.5rem;
    text-align: left;
  }

  .page-title {
    letter-spacing: -0.035em;
  }

  .page-subtitle {
    max-width: none;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.8;
  }

  .article-card {
    border-radius: 1.1rem;
  }

  .article-card-inner {
    padding: 1.25rem;
  }

  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }

  .article-date {
    font-size: 0.8rem;
  }

  .article-tags {
    justify-content: flex-start;
  }

  .tag {
    min-height: 1.65rem;
    padding: 0.24rem 0.62rem;
    font-size: 0.72rem;
  }

  .article-title {
    margin-bottom: 0.65rem;
    font-size: 1.22rem;
    line-height: 1.48;
    letter-spacing: -0.018em;
  }

  .article-summary {
    font-size: 0.95rem;
    line-height: 1.85;
    -webkit-line-clamp: 3;
  }

  .article-footer {
    margin-top: 1.15rem;
    font-size: 0.88rem;
  }
}
</style>