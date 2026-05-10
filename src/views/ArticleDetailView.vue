<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderMarkdown } from '@/utils/markdown'
import { mdArticles, loadArticleContent } from '../data/articles'
import BackToTopButton from '@/components/BackToTopButton.vue'
import ImagePreview from '@/components/ImagePreview.vue'

const route = useRoute()
const router = useRouter()

const showImagePreview = ref(false)
const previewImageSrc = ref('')

const articleContent = ref('')
const isContentLoading = ref(true)
const contentError = ref<string | null>(null)

const article = computed(() => {
  const id = route.params.id as string
  return mdArticles.find((a) => a.id === id)
})

const normalizeImageUrl = (url: string) => {
  if (!url) return url

  // 网络图片，不处理
  if (/^(https?:)?\/\//.test(url)) {
    return url
  }

  // base64 图片，不处理
  if (url.startsWith('data:')) {
    return url
  }

  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`

  // base: '/logic/' -> 'logic'
  const baseName = normalizedBase.replace(/^\/|\/$/g, '')

  // 已经是 /logic/images/...，不要重复加 /logic
  if (baseName && url.startsWith(`/${baseName}/`)) {
    return url
  }

  // /images/... -> /logic/images/...
  if (url.startsWith('/')) {
    return `${normalizedBase.replace(/\/$/, '')}${url}`
  }

  // 相对路径不处理
  return url
}

const normalizeMarkdownImages = (html: string) => {
  if (!html) return html

  return html.replace(/<img\b([^>]*?)>/g, (imgTag: string) => {
    const srcMatch = imgTag.match(/\ssrc=(["'])(.*?)\1/)

    if (!srcMatch) {
      return imgTag
    }

    const rawSrc = srcMatch[2] ?? ''

    if (!rawSrc) {
      return imgTag
    }

    const normalizedSrc = normalizeImageUrl(rawSrc)

    let nextImgTag = imgTag.replace(
      /\ssrc=(["'])(.*?)\1/,
      ` src="${normalizedSrc}"`
    )

    // 添加 markdown-image class，兼容图片点击预览
    const classMatch = nextImgTag.match(/\sclass=(["'])(.*?)\1/)

    if (!classMatch) {
      nextImgTag = nextImgTag.replace('<img', '<img class="markdown-image"')
    } else {
      const quote = classMatch[1] ?? '"'
      const className = classMatch[2] ?? ''

      if (!className.split(/\s+/).includes('markdown-image')) {
        nextImgTag = nextImgTag.replace(
          /\sclass=(["'])(.*?)\1/,
          ` class=${quote}${className} markdown-image${quote}`
        )
      }
    }

    // 添加 data-preview-src，给 ImagePreview 用
    if (!/\sdata-preview-src=/.test(nextImgTag)) {
      nextImgTag = nextImgTag.replace(
        '<img',
        `<img data-preview-src="${normalizedSrc}"`
      )
    } else {
      nextImgTag = nextImgTag.replace(
        /\sdata-preview-src=(["'])(.*?)\1/,
        ` data-preview-src="${normalizedSrc}"`
      )
    }

    return nextImgTag
  })
}

const renderedContent = computed(() => {
  if (!articleContent.value) return ''

  const html = renderMarkdown(articleContent.value)
  return normalizeMarkdownImages(html)
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
    window.open(article.value.sourceUrl, '_blank', 'noopener,noreferrer')
  }
}

let currentLoadId = 0

const loadContent = async (id: string) => {
  const loadId = ++currentLoadId
  isContentLoading.value = true
  contentError.value = null
  articleContent.value = ''

  try {
    const content = await loadArticleContent(id)
    if (loadId !== currentLoadId) return // Stale response
    articleContent.value = content
  } catch (e) {
    if (loadId !== currentLoadId) return
    contentError.value = (e as Error).message
  } finally {
    if (loadId === currentLoadId) {
      isContentLoading.value = false
    }
  }
}

const retryLoadContent = () => {
  const id = route.params.id as string
  if (id) {
    loadContent(id).catch(() => {})
  }
}

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      window.scrollTo(0, 0)
      await loadContent(newId as string)
    }
  },
  { immediate: true },
)

const handleImageClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const img = target.closest('.markdown-image') as HTMLElement | null

  if (img?.dataset.previewSrc) {
    previewImageSrc.value = img.dataset.previewSrc
    showImagePreview.value = true
  }
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageSrc.value = ''
}

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<template>
  <div class="article-detail-page">
    <div class="article-bg article-bg--one"></div>
    <div class="article-bg article-bg--two"></div>

    <div v-if="article" class="article-shell">
      <nav class="breadcrumb" aria-label="文章导航">
        <button class="back-link" type="button" @click="goBack">
          <svg
            class="local-icon back-link__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M19 12H5m0 0 7-7M5 12l7 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="back-link__text">返回列表</span>
        </button>
      </nav>

      <main class="article-card">
        <header class="article-header">
          <div class="article-eyebrow">
            <time class="article-date">{{ formatDate(article.publishedAt) }}</time>

            <span
              v-if="article.tags.length"
              class="article-dot"
              aria-hidden="true"
            ></span>

            <div class="article-tags" aria-label="文章标签">
              <span v-for="tag in article.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>

          <h1 class="article-title">{{ article.title }}</h1>
          <p class="article-summary">{{ article.summary }}</p>
        </header>

        <div v-if="isContentLoading" class="skeleton-content">
          <div class="skeleton-block skeleton-block--title"></div>
          <div class="skeleton-block"></div>
          <div class="skeleton-block"></div>
          <div class="skeleton-block skeleton-block--short"></div>
          <div class="skeleton-block"></div>
          <div class="skeleton-block skeleton-block--image"></div>
          <div class="skeleton-block skeleton-block--medium"></div>
        </div>

        <div v-else-if="contentError" class="error-content">
          <svg
            class="error-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15v-2h4v2zm0-4V7h4v6z"
              fill="currentColor"
            />
          </svg>
          <p class="error-message">加载失败</p>
          <p class="error-detail">{{ contentError }}</p>
          <button class="error-retry-btn" type="button" @click="retryLoadContent">重试</button>
        </div>

        <article
          v-else
          class="article-content"
          v-html="renderedContent"
          @click="handleImageClick"
        ></article>

        <footer v-if="article.sourceUrl" class="article-footer">
          <button class="source-link-btn" type="button" @click="openSource">
            <span class="source-link-btn__text">查看原文</span>
            <svg
              class="local-icon source-link-btn__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M7 17L17 7m0 0H9m8 0v8"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </footer>
      </main>
    </div>

    <div v-else class="not-found">
      <div class="not-found__card">
        <p class="not-found__label">404</p>
        <h1>文章未找到</h1>
        <p>抱歉，您访问的文章不存在，可能已经被移动或删除。</p>

        <button class="back-btn" type="button" @click="goBack">
          <svg
            class="local-icon back-btn__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M19 12H5m0 0 7-7M5 12l7 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="back-btn__text">返回文章列表</span>
        </button>
      </div>
    </div>
  </div>

  <BackToTopButton />

  <ImagePreview
    :show="showImagePreview"
    :src="previewImageSrc"
    @close="closeImagePreview"
  />
</template>

<style scoped>
.article-detail-page {
  --font-reading:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    'Noto Sans CJK SC',
    'Source Han Sans SC',
    Arial,
    sans-serif;

  --font-title:
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    'Noto Sans CJK SC',
    'Source Han Sans SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Arial,
    sans-serif;

  --font-code:
    'SFMono-Regular',
    Consolas,
    'Liberation Mono',
    Menlo,
    Monaco,
    'Courier New',
    monospace;

  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: 100%;
  min-height: calc(100vh - 80px);
  padding: 6rem 1.25rem 4rem;
  overflow: hidden;
  font-family: var(--font-reading);
}

.article-bg {
  position: fixed;
  z-index: -1;
  pointer-events: none;
  border-radius: 999px;
  opacity: 0.42;
  filter: blur(14px);
}

.article-bg--one {
  top: 7rem;
  left: max(-12rem, -12vw);
  width: 25rem;
  height: 25rem;
  background: radial-gradient(circle, rgba(95, 110, 138, 0.13), transparent 68%);
}

.article-bg--two {
  right: max(-14rem, -12vw);
  bottom: 3rem;
  width: 28rem;
  height: 28rem;
  background: radial-gradient(circle, rgba(216, 240, 236, 0.34), transparent 70%);
}

html.dark .article-bg--one {
  background: radial-gradient(circle, rgba(96, 130, 184, 0.16), transparent 68%);
}

html.dark .article-bg--two {
  background: radial-gradient(circle, rgba(45, 75, 120, 0.26), transparent 70%);
}

.article-shell {
  width: min(100%, 50rem);
  margin: 0 auto;
}

.local-icon {
  display: inline-block;
  flex-shrink: 0;
  color: currentColor;
}

.breadcrumb {
  width: min(100%, 43rem);
  margin: 0 auto 0.7rem;
}

.back-link {
  appearance: none;
  border: 1px solid rgba(95, 110, 138, 0.16);
  background: rgba(255, 255, 255, 0.72);
  color: #5f6e8a;
  text-decoration: none;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 0.38rem;
  min-height: 2.38rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  box-sizing: border-box;

  font-family: var(--font-reading);
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1;

  cursor: pointer;
  backdrop-filter: blur(14px);
  box-shadow:
    0 10px 24px rgba(31, 31, 28, 0.055),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.back-link:hover {
  color: #ffffff;
  background: #5f6e8a;
  border-color: #5f6e8a;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(95, 110, 138, 0.2);
}

.back-link:active {
  transform: translateY(0);
  box-shadow: 0 6px 16px rgba(95, 110, 138, 0.16);
}

.back-link:focus-visible {
  outline: 3px solid rgba(95, 110, 138, 0.28);
  outline-offset: 3px;
}

.back-link__icon {
  width: 0.98rem;
  height: 0.98rem;
  display: block;
  transition: transform 0.2s ease;
}

.back-link__text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.back-link:hover .back-link__icon {
  transform: translateX(-2px);
}

html.dark .back-link {
  color: #d7e2f1;
  background: rgba(22, 32, 48, 0.72);
  border-color: rgba(166, 185, 212, 0.16);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

html.dark .back-link:hover {
  color: #142033;
  background: #d7e2f1;
  border-color: #d7e2f1;
  box-shadow: 0 12px 26px rgba(166, 185, 212, 0.16);
}

.article-card {
  width: min(100%, 43rem);
  margin: 0 auto;
  padding: 2.35rem 2.65rem 2.75rem;
  border: 1px solid rgba(214, 209, 201, 0.52);
  border-radius: 1.6rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.96)),
    rgba(255, 255, 255, 0.86);
  box-shadow:
    0 20px 64px rgba(31, 31, 28, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
}

html.dark .article-card {
  border-color: rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(24, 34, 50, 0.84), rgba(17, 24, 36, 0.95)),
    rgba(18, 24, 36, 0.9);
  box-shadow:
    0 20px 64px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.article-header {
  margin-bottom: 1.85rem;
  padding-bottom: 1.45rem;
  border-bottom: 1px solid rgba(214, 209, 201, 0.58);
}

html.dark .article-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.article-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.58rem;
  flex-wrap: wrap;
  margin-bottom: 0.78rem;
}

.article-date {
  font-family: var(--font-reading);
  font-size: 0.81rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #7a766f;
}

html.dark .article-date {
  color: #a6afbf;
}

.article-dot {
  width: 0.26rem;
  height: 0.26rem;
  border-radius: 999px;
  background: rgba(95, 110, 138, 0.42);
}

html.dark .article-dot {
  background: rgba(166, 185, 212, 0.45);
}

.article-tags {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  min-height: 1.56rem;
  padding: 0 0.58rem;
  border: 1px solid rgba(95, 110, 138, 0.12);
  border-radius: 999px;
  background: rgba(95, 110, 138, 0.08);
  color: #5f6e8a;

  font-family: var(--font-reading);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1;
}

html.dark .tag {
  border-color: rgba(166, 185, 212, 0.16);
  background: rgba(95, 110, 138, 0.18);
  color: #b7c7df;
}

.article-title {
  max-width: 13em;
  margin: 0 0 0.58rem;
  color: #1f1f1c;

  font-family: var(--font-title);
  font-size: clamp(1.88rem, 4.2vw, 2.65rem);
  font-weight: 750;
  line-height: 1.23;
  letter-spacing: -0.035em;
  word-break: break-word;
}

html.dark .article-title {
  color: #f4f6fa;
}

.article-summary {
  max-width: 39rem;
  margin: 0;
  color: #68645d;

  font-family: var(--font-reading);
  font-size: 1rem;
  line-height: 1.68;
  word-break: break-word;
}

html.dark .article-summary {
  color: #aeb7c8;
}

.article-content {
  width: 100%;
  min-width: 0;
  color: #242421;

  font-family: var(--font-reading);
  font-size: 1rem;
  line-height: 1.78;
  letter-spacing: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

html.dark .article-content {
  color: #e4e8ef;
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
  font-family: var(--font-title);
}

.article-content :deep(h1) {
  margin: 1.7rem 0 0.65rem;
  color: #26334a;
  font-size: 1.65rem;
  font-weight: 750;
  line-height: 1.32;
  letter-spacing: -0.025em;
}

.article-content :deep(h2) {
  position: relative;
  margin: 1.55rem 0 0.55rem;
  color: #36445d;

  font-size: 1.34rem;
  font-weight: 750;
  line-height: 1.38;
  letter-spacing: -0.02em;
}

.article-content :deep(h2:first-child) {
  margin-top: 0;
}

.article-content :deep(h2::before) {
  content: '';
  display: block;
  width: 1.75rem;
  height: 0.16rem;
  margin-bottom: 0.45rem;
  border-radius: 999px;
  background: #5f6e8a;
}

html.dark .article-content :deep(h1),
html.dark .article-content :deep(h2) {
  color: #d6e0f0;
}

html.dark .article-content :deep(h2::before) {
  background: #a6b9d4;
}

.article-content :deep(h3) {
  margin: 1.18rem 0 0.42rem;
  color: #475671;

  font-size: 1.13rem;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: -0.01em;
}

.article-content :deep(h3:first-child) {
  margin-top: 0;
}

html.dark .article-content :deep(h3) {
  color: #c7d3e7;
}

.article-content :deep(h4) {
  margin: 1rem 0 0.35rem;
  color: #4f5e76;

  font-size: 1.04rem;
  font-weight: 700;
  line-height: 1.45;
}

html.dark .article-content :deep(h4) {
  color: #c0ccdf;
}

.article-content :deep(h5),
.article-content :deep(h6) {
  margin: 0.9rem 0 0.32rem;
  color: #4f5e76;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.45;
}

html.dark .article-content :deep(h5),
html.dark .article-content :deep(h6) {
  color: #c0ccdf;
}

.article-content :deep(p) {
  margin: 0 0 0.68rem;
}

.article-content :deep(p:last-child) {
  margin-bottom: 0;
}

.article-content :deep(h1 + p),
.article-content :deep(h2 + p),
.article-content :deep(h3 + p),
.article-content :deep(h4 + p),
.article-content :deep(h5 + p),
.article-content :deep(h6 + p) {
  margin-top: 0;
}

.article-content :deep(strong) {
  color: #171714;
  font-weight: 700;
}

html.dark .article-content :deep(strong) {
  color: #ffffff;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin: 0 0 0.78rem;
  padding-left: 1.35rem;
}

.article-content :deep(li) {
  margin-bottom: 0.28rem;
  padding-left: 0.08rem;
}

.article-content :deep(li:last-child) {
  margin-bottom: 0;
}

.article-content :deep(li::marker) {
  color: #5f6e8a;
  font-weight: 700;
}

html.dark .article-content :deep(li::marker) {
  color: #a6b9d4;
}

.article-content :deep(blockquote) {
  position: relative;
  max-width: 100%;
  margin: 1rem 0;
  padding: 0.9rem 1rem 0.9rem 1.18rem;
  overflow: hidden;
  border: 1px solid rgba(95, 110, 138, 0.13);
  border-left: 0;
  border-radius: 0.9rem;
  background:
    linear-gradient(90deg, rgba(95, 110, 138, 0.12), transparent 3rem),
    rgba(95, 110, 138, 0.06);
}

.article-content :deep(blockquote::before) {
  content: '';
  position: absolute;
  inset: 0.75rem auto 0.75rem 0;
  width: 0.22rem;
  border-radius: 999px;
  background: #5f6e8a;
}

html.dark .article-content :deep(blockquote) {
  border-color: rgba(166, 185, 212, 0.14);
  background:
    linear-gradient(90deg, rgba(166, 185, 212, 0.15), transparent 3rem),
    rgba(95, 110, 138, 0.13);
}

html.dark .article-content :deep(blockquote::before) {
  background: #a6b9d4;
}

.article-content :deep(blockquote p) {
  margin: 0;
  color: #56534f;
  font-style: normal;
  line-height: 1.7;
}

html.dark .article-content :deep(blockquote p) {
  color: #b6bfcd;
}

.article-content :deep(code:not(pre code)) {
  padding: 0.14em 0.36em;
  border: 1px solid rgba(95, 110, 138, 0.12);
  border-radius: 0.36rem;
  background: rgba(95, 110, 138, 0.1);
  color: #36445d;

  font-family: var(--font-code);
  font-size: 0.9em;
  word-break: break-word;
}

html.dark .article-content :deep(code:not(pre code)) {
  border-color: rgba(166, 185, 212, 0.14);
  background: rgba(95, 110, 138, 0.22);
  color: #d8e2f3;
}

.article-content :deep(pre) {
  width: 100%;
  max-width: 100%;
  margin: 1rem 0;
  padding: 0.88rem 0.95rem;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid rgba(95, 110, 138, 0.12);
  border-radius: 0.9rem;
  background: #f4f6f8;
  line-height: 1.62;
  -webkit-overflow-scrolling: touch;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.74);
}

html.dark .article-content :deep(pre) {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(13, 18, 28, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.article-content :deep(pre code) {
  display: block;
  min-width: max-content;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;

  font-family: var(--font-code);
  font-size: 0.86rem;
  line-height: 1.62;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.article-content :deep(table) {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 1rem 0;
  overflow-x: auto;
  border-collapse: collapse;
  -webkit-overflow-scrolling: touch;
}

.article-content :deep(th),
.article-content :deep(td) {
  min-width: 8rem;
  padding: 0.68rem 0.78rem;
  border: 1px solid rgba(95, 110, 138, 0.16);
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
}

.article-content :deep(th) {
  background: rgba(95, 110, 138, 0.07);
  color: #38465d;
  font-weight: 700;
}

html.dark .article-content :deep(th),
html.dark .article-content :deep(td) {
  border-color: rgba(255, 255, 255, 0.1);
}

html.dark .article-content :deep(th) {
  background: rgba(166, 185, 212, 0.09);
  color: #d6e0f0;
}

.article-content :deep(img),
.article-content :deep(.markdown-image) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1rem auto;
  border-radius: 0.9rem;
  box-shadow: 0 14px 36px rgba(31, 31, 28, 0.1);
}

html.dark .article-content :deep(img),
html.dark .article-content :deep(.markdown-image) {
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
}

.article-content :deep(.markdown-image) {
  cursor: zoom-in;
}

.article-content :deep(a) {
  color: #475671;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.2em;
  word-break: break-word;
  transition:
    color 0.2s ease,
    text-decoration-color 0.2s ease;
}

.article-content :deep(a:hover) {
  color: #1f1f1c;
  text-decoration-color: rgba(31, 31, 28, 0.9);
}

html.dark .article-content :deep(a) {
  color: #b7c7df;
}

html.dark .article-content :deep(a:hover) {
  color: #ffffff;
  text-decoration-color: rgba(255, 255, 255, 0.8);
}

.article-content :deep(hr) {
  height: 1px;
  margin: 1.45rem 0;
  border: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(95, 110, 138, 0.24),
    transparent
  );
}

html.dark .article-content :deep(hr) {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(166, 185, 212, 0.2),
    transparent
  );
}

.article-footer {
  margin-top: 2rem;
  padding-top: 1.35rem;
  border-top: 1px solid rgba(214, 209, 201, 0.58);
}

html.dark .article-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.source-link-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.48rem;
  min-height: 2.58rem;
  padding: 0 1.15rem;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  background: #111111;
  color: #ffffff;

  font-family: var(--font-reading);
  font-size: 0.91rem;
  font-weight: 600;
  line-height: 1;

  cursor: pointer;
  box-shadow: 0 12px 24px rgba(17, 17, 17, 0.13);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.source-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(17, 17, 17, 0.18);
}

.source-link-btn:active {
  transform: translateY(0);
}

.source-link-btn:focus-visible {
  outline: 3px solid rgba(95, 110, 138, 0.28);
  outline-offset: 3px;
}

.source-link-btn__text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.source-link-btn__icon {
  width: 1rem;
  height: 1rem;
  display: block;
}

html.dark .source-link-btn {
  border-color: rgba(255, 255, 255, 0.08);
  background: #f4f6fa;
  color: #111827;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.32);
}

.not-found {
  width: min(100%, 36rem);
  margin: 0 auto;
  padding: 4rem 0;
}

.not-found__card {
  padding: 2.55rem 1.75rem;
  border: 1px solid rgba(214, 209, 201, 0.5);
  border-radius: 1.6rem;
  background: rgba(255, 255, 255, 0.86);
  text-align: center;
  box-shadow:
    0 20px 64px rgba(31, 31, 28, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
}

html.dark .not-found__card {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(18, 24, 36, 0.9);
  box-shadow:
    0 20px 64px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.not-found__label {
  margin: 0 0 0.55rem;
  color: #5f6e8a;
  font-family: var(--font-reading);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.16em;
}

html.dark .not-found__label {
  color: #a6b9d4;
}

.not-found h1 {
  margin: 0 0 0.75rem;
  color: #1f1f1c;

  font-family: var(--font-title);
  font-size: 1.85rem;
  font-weight: 750;
  line-height: 1.25;
}

html.dark .not-found h1 {
  color: #f4f6fa;
}

.not-found p {
  max-width: 25rem;
  margin: 0 auto 1.55rem;
  color: #7a766f;
  line-height: 1.72;
}

html.dark .not-found p {
  color: #a6afbf;
}

.back-btn {
  appearance: none;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.48rem;
  min-height: 2.58rem;
  padding: 0 1.2rem;
  border-radius: 999px;
  background: #5f6e8a;
  color: #ffffff;
  text-decoration: none;

  font-family: var(--font-reading);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1;

  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.back-btn:hover {
  background: #475671;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(95, 110, 138, 0.22);
}

.back-btn:focus-visible {
  outline: 3px solid rgba(95, 110, 138, 0.28);
  outline-offset: 3px;
}

.back-btn__icon {
  width: 1rem;
  height: 1rem;
  display: block;
}

.back-btn__text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Skeleton loading animation */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-content {
  padding: 4px 0 20px;
}

.skeleton-block {
  height: 18px;
  margin-bottom: 15px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(246, 247, 249, 0.72) 25%,
    rgba(166, 185, 212, 0.12) 50%,
    rgba(246, 247, 249, 0.72) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

html.dark .skeleton-block {
  background: linear-gradient(
    90deg,
    rgba(30, 45, 68, 0.54) 25%,
    rgba(166, 185, 212, 0.1) 50%,
    rgba(30, 45, 68, 0.54) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.skeleton-block--title {
  height: 28px;
  width: 55%;
  margin-bottom: 26px;
}

.skeleton-block--short {
  width: 38%;
}

.skeleton-block--medium {
  width: 65%;
}

.skeleton-block--image {
  height: 140px;
  width: 100%;
  border-radius: 14px;
}

/* Error state */
.error-content {
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #e35050;
  margin-bottom: 8px;
}

html.dark .error-icon {
  color: #f07070;
}

.error-message {
  font-family: var(--font-reading);
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1c;
  margin: 0;
}

html.dark .error-message {
  color: #f4f6fa;
}

.error-detail {
  font-family: var(--font-reading);
  font-size: 14px;
  color: #7a766f;
  margin: 0 0 12px;
  max-width: 400px;
  word-break: break-word;
}

html.dark .error-detail {
  color: #a6afbf;
}

.error-retry-btn {
  padding: 10px 28px;
  border: 1px solid rgba(214, 209, 201, 0.52);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  color: #5f6e8a;
  font-family: var(--font-reading);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.error-retry-btn:hover {
  background: #5f6e8a;
  color: #ffffff;
  border-color: #5f6e8a;
}

html.dark .error-retry-btn {
  border-color: rgba(166, 185, 212, 0.16);
  background: rgba(22, 32, 48, 0.72);
  color: #d7e2f1;
}

html.dark .error-retry-btn:hover {
  background: #d7e2f1;
  color: #142033;
  border-color: #d7e2f1;
}

@media (max-width: 768px) {
  .article-detail-page {
    padding: 5.75rem 1rem 3rem;
  }

  .article-shell,
  .breadcrumb,
  .article-card {
    width: 100%;
  }

  .breadcrumb {
    margin-bottom: 0.65rem;
  }

  .back-link {
    min-height: 2.32rem;
    padding: 0 0.82rem;
    font-size: 0.82rem;
  }

  .article-card {
    padding: 1.55rem 1.12rem 1.85rem;
    border-radius: 1.25rem;
  }

  .article-header {
    margin-bottom: 1.55rem;
    padding-bottom: 1.2rem;
  }

  .article-eyebrow {
    gap: 0.5rem;
    margin-bottom: 0.68rem;
  }

  .article-dot {
    display: none;
  }

  .article-title {
    max-width: 100%;
    margin-bottom: 0.5rem;
    font-size: clamp(1.58rem, 7.8vw, 2.05rem);
    line-height: 1.24;
    letter-spacing: -0.03em;
  }

  .article-summary {
    font-size: 0.96rem;
    line-height: 1.62;
  }

  .article-content {
    font-size: 0.96rem;
    line-height: 1.72;
  }

  .article-content :deep(h1) {
    margin-top: 1.35rem;
    margin-bottom: 0.5rem;
    font-size: 1.45rem;
  }

  .article-content :deep(h2) {
    margin-top: 1.25rem;
    margin-bottom: 0.42rem;
    font-size: 1.22rem;
  }

  .article-content :deep(h2::before) {
    width: 1.55rem;
    margin-bottom: 0.38rem;
  }

  .article-content :deep(h3) {
    margin-top: 0.95rem;
    margin-bottom: 0.32rem;
    font-size: 1.08rem;
  }

  .article-content :deep(h4),
  .article-content :deep(h5),
  .article-content :deep(h6) {
    margin-top: 0.85rem;
    margin-bottom: 0.28rem;
  }

  .article-content :deep(p) {
    margin-bottom: 0.62rem;
  }

  .article-content :deep(ul),
  .article-content :deep(ol) {
    margin-bottom: 0.68rem;
    padding-left: 1.2rem;
  }

  .article-content :deep(blockquote) {
    margin: 0.88rem 0;
    padding: 0.82rem 0.92rem 0.82rem 1.05rem;
    border-radius: 0.82rem;
  }

  .article-content :deep(pre) {
    margin: 0.88rem 0;
    padding: 0.82rem 0.86rem;
    border-radius: 0.8rem;
  }

  .article-content :deep(pre code) {
    font-size: 0.8rem;
  }

  .article-content :deep(table) {
    margin: 0.88rem 0;
    font-size: 0.85rem;
  }

  .article-content :deep(th),
  .article-content :deep(td) {
    padding: 0.62rem 0.72rem;
  }

  .article-content :deep(img),
  .article-content :deep(.markdown-image) {
    margin: 0.95rem auto;
    border-radius: 0.82rem;
  }

  .article-footer {
    margin-top: 1.65rem;
    padding-top: 1.15rem;
  }

  .source-link-btn {
    width: 100%;
  }

  .not-found {
    padding: 3rem 0;
  }

  .not-found__card {
    padding: 2.15rem 1.15rem;
    border-radius: 1.25rem;
  }

  .skeleton-content {
    padding: 2px 0 16px;
  }

  .skeleton-block {
    height: 16px;
    margin-bottom: 12px;
  }

  .skeleton-block--title {
    height: 24px;
    margin-bottom: 20px;
  }

  .skeleton-block--image {
    height: 110px;
  }

  .error-content {
    padding: 36px 20px;
  }
}

@media (max-width: 420px) {
  .article-detail-page {
    padding-inline: 0.85rem;
  }

  .article-card {
    padding: 1.35rem 0.95rem 1.7rem;
  }

  .tag {
    min-height: 1.5rem;
    padding: 0 0.52rem;
  }

  .article-content {
    font-size: 0.95rem;
  }
}
</style>