<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { knowledgeData, getArticlesByCategory, loadKnowledgeContent } from '@/data/knowledge'
import type { KnowledgeArticleMeta } from '@/types'
import ImagePreview from '@/components/ImagePreview.vue'
import KnowledgeSidebar from '@/components/KnowledgeSidebar.vue'
import KnowledgeToc from '@/components/KnowledgeToc.vue'
import KnowledgeMobilePanels from '@/components/KnowledgeMobilePanels.vue'
import BackToTopButton from '@/components/BackToTopButton.vue'
import { renderMarkdown, generateToc, buildNestedToc } from '@/utils/markdown'
import type { TocItem } from '@/types'

const HEADER_HEIGHT = 80
const DESKTOP_BREAKPOINT = 948
const TOC_BREAKPOINT = 1200

const isSidebarCollapsed = ref(false)

const showMobileSidebar = ref(false)
const showMobileToc = ref(false)

const selectedCategory = ref('ai-basics')
const selectedArticleMeta = ref<KnowledgeArticleMeta | null>(null)
const articleContent = ref('')
const isContentLoading = ref(true)
const contentError = ref<string | null>(null)

const expandedCategoryIds = ref<string[]>([])

const isDesktopSidebarVisible = ref(false)
const isDesktopTocVisible = ref(false)

const showImagePreview = ref(false)
const previewImageSrc = ref('')

const updateResponsiveState = () => {
  if (typeof window === 'undefined') return

  isDesktopSidebarVisible.value = window.innerWidth >= DESKTOP_BREAKPOINT
  isDesktopTocVisible.value = window.innerWidth >= TOC_BREAKPOINT
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const sidebarNav = computed(() => {
  return {
    series: '知识库',
    groups: knowledgeData.map((category) => ({
      id: category.id,
      title: category.name,
      expanded: expandedCategoryIds.value.includes(category.id),
      items: category.articles.map((article) => ({
        id: article.id,
        name: article.title,
        path: `#${category.id}/${article.id}`,
        active:
          selectedCategory.value === category.id &&
          selectedArticleMeta.value?.id === article.id,
      })),
    })),
  }
})

const toggleGroup = (index: number) => {
  const category = knowledgeData[index]
  if (!category) return

  const categoryId = category.id
  const isExpanded = expandedCategoryIds.value.includes(categoryId)

  if (isExpanded) {
    expandedCategoryIds.value = expandedCategoryIds.value.filter((id) => id !== categoryId)
  } else {
    expandedCategoryIds.value = [...expandedCategoryIds.value, categoryId]
  }
}

let currentLoadId = 0

const loadContent = async (categoryId: string, articleId: string) => {
  const loadId = ++currentLoadId
  isContentLoading.value = true
  contentError.value = null
  articleContent.value = ''
  try {
    const content = await loadKnowledgeContent(categoryId, articleId)
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
  if (selectedArticleMeta.value) {
    loadContent(selectedCategory.value, selectedArticleMeta.value.id).catch(() => {})
  }
}

const selectArticle = async (categoryId: string, articleId: string) => {
  selectedCategory.value = categoryId

  if (!expandedCategoryIds.value.includes(categoryId)) {
    expandedCategoryIds.value = [...expandedCategoryIds.value, categoryId]
  }

  const articles = getArticlesByCategory(categoryId)
  selectedArticleMeta.value = articles.find((a) => a.id === articleId) || null

  if (selectedArticleMeta.value) {
    window.location.hash = `#/knowledge#${categoryId}/${articleId}`
  }

  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  })

  if (selectedArticleMeta.value) {
    await loadContent(categoryId, articleId)
  }
}

const handleNavClick = (path: string) => {
  const match = path.match(/^#(.+)\/(.+)$/)
  if (match && match[1] && match[2]) {
    selectArticle(match[1], match[2])
  }
}

const tocItems = ref<TocItem[]>([])

const scrollToAnchor = (id: string) => {
  const element = document.getElementById(id)
  if (!element) return

  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - HEADER_HEIGHT - 16

  const lenis = (window as any).__lenis
  if (lenis) {
    lenis.scrollTo(offsetPosition, {
      duration: 1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    })
  } else {
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })
  }

  showMobileSidebar.value = false
  showMobileToc.value = false
}

let observer: IntersectionObserver | null = null

function flattenToc(toc: TocItem[]): TocItem[] {
  const result: TocItem[] = []

  const walk = (items: TocItem[]) => {
    for (const item of items) {
      result.push(item)

      if (item.children.length > 0) {
        walk(item.children)
      }
    }
  }

  walk(toc)
  return result
}

const setupObserver = () => {
  observer?.disconnect()

  if (articleContent.value) {
    const flatToc = generateToc(articleContent.value)
    tocItems.value = buildNestedToc(flatToc)
  } else {
    tocItems.value = []
  }

  const flatItems = flattenToc(tocItems.value)
  const ids = flatItems.map((item) => item.id)

  if (!ids.length) return

  observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      const activeId = visibleEntries.length > 0 ? visibleEntries[0]!.target.id : null
      if (!activeId) return

      const updateActive = (items: TocItem[]): TocItem[] => {
        return items.map((item) => ({
          ...item,
          active: item.id === activeId,
          children: updateActive(item.children),
        }))
      }

      tocItems.value = updateActive(tocItems.value)
    },
    {
      root: null,
      rootMargin: '-110px 0px -65% 0px',
      threshold: 0,
    }
  )

  ids.forEach((id) => {
    const el = document.getElementById(id)
    if (el) observer?.observe(el)
  })
}

const currentCategoryArticles = computed(() => {
  const category = knowledgeData.find((c) => c.id === selectedCategory.value)
  return category?.articles || []
})

const prevArticle = computed(() => {
  const articles = currentCategoryArticles.value
  if (!selectedArticleMeta.value || !articles.length) return null

  const prevArticles = articles.filter((a) => a.order < selectedArticleMeta.value!.order)
  return prevArticles.length ? prevArticles[prevArticles.length - 1] : null
})

const nextArticle = computed(() => {
  const articles = currentCategoryArticles.value
  if (!selectedArticleMeta.value || !articles.length) return null

  const nextArticles = articles.filter((a) => a.order > selectedArticleMeta.value!.order)
  return nextArticles.length ? nextArticles[0] : null
})

const goToPrevArticle = () => {
  if (prevArticle.value) {
    selectArticle(selectedCategory.value, prevArticle.value.id)
  }
}

const goToNextArticle = () => {
  if (nextArticle.value) {
    selectArticle(selectedCategory.value, nextArticle.value.id)
  }
}

const handleResize = () => {
  updateResponsiveState()

  if (window.innerWidth >= DESKTOP_BREAKPOINT) {
    showMobileSidebar.value = false
    showMobileToc.value = false
  }
}

const handleImageClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const img = target.closest('.markdown-image') as HTMLElement

  if (img && img.dataset.previewSrc) {
    previewImageSrc.value = img.dataset.previewSrc
    showImagePreview.value = true
  }
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageSrc.value = ''
}

onMounted(async () => {
  updateResponsiveState()

  window.addEventListener('resize', handleResize)

  const firstCategory = knowledgeData[0]

  if (firstCategory?.articles?.[0]) {
    selectedCategory.value = firstCategory.id
    selectedArticleMeta.value = firstCategory.articles[0]
    expandedCategoryIds.value = [firstCategory.id]

    // Load content for initial article — watch(articleContent) handles observer setup
    await loadContent(firstCategory.id, firstCategory.articles[0].id)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  observer?.disconnect()
})

watch(articleContent, () => {
  nextTick(() => {
    setTimeout(() => {
      setupObserver()
    }, 180)
  })
})
</script>

<template>
  <div class="knowledge-page" :class="{ collapsed: isSidebarCollapsed }">
    <Teleport to="body">
      <KnowledgeSidebar
        v-if="isDesktopSidebarVisible && !isSidebarCollapsed"
        mode="desktop"
        :categories="knowledgeData"
        :expanded-category-ids="expandedCategoryIds"
        :selected-category="selectedCategory"
        :selected-article="selectedArticleMeta"
        @navigate="(catId: string, artId: string) => handleNavClick(`#${catId}/${artId}`)"
        @toggle-category="toggleGroup"
      />
    </Teleport>

    <Teleport to="body">
      <KnowledgeToc
        v-if="isDesktopTocVisible && tocItems.length > 0"
        mode="desktop"
        :items="tocItems"
        @navigate="scrollToAnchor"
      />
    </Teleport>

    <KnowledgeMobilePanels
      :show-sidebar="showMobileSidebar"
      :show-toc="showMobileToc"
      @close-sidebar="showMobileSidebar = false"
      @close-toc="showMobileToc = false"
    >
      <template #sidebar>
        <KnowledgeSidebar
          mode="mobile"
          :categories="knowledgeData"
          :expanded-category-ids="expandedCategoryIds"
          :selected-category="selectedCategory"
          :selected-article="selectedArticleMeta"
          @navigate="(catId: string, artId: string) => { selectArticle(catId, artId); showMobileSidebar = false }"
          @toggle-category="toggleGroup"
        />
      </template>

      <template #toc>
        <KnowledgeToc
          mode="mobile"
          :items="tocItems"
          @navigate="scrollToAnchor"
        />
      </template>
    </KnowledgeMobilePanels>

    <main class="main-content">
      <Teleport to=".page-content">
        <div v-if="!isDesktopSidebarVisible" class="mobile-top-nav">
          <button
            class="mobile-top-nav__btn mobile-top-nav__btn--left"
            type="button"
            @click="showMobileToc = false; showMobileSidebar = true"
          >
            <svg
              class="local-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M4 6.5h16M4 12h16M4 17.5h16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <span>教程目录</span>
          </button>

          <button
            class="mobile-top-nav__btn mobile-top-nav__btn--right"
            type="button"
            :disabled="tocItems.length === 0"
            @click="showMobileSidebar = false; showMobileToc = true"
          >
            <span>页面导航</span>
            <svg
              class="local-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M8.5 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </Teleport>

      <header class="article-header">
        <nav class="breadcrumb">
          <span>知识库</span>
          <svg
            class="breadcrumb-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ knowledgeData.find((c) => c.id === selectedCategory)?.name || '' }}</span>
        </nav>

        <h1 class="article-title">
          {{ selectedArticleMeta?.title || '' }}
        </h1>

        <p class="article-summary">
          {{ selectedArticleMeta?.description || '' }}
        </p>
      </header>

      <article class="article-body">
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
          <svg class="error-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15v-2h4v2zm0-4V7h4v6z" fill="currentColor"/>
          </svg>
          <p class="error-message">加载失败</p>
          <p class="error-detail">{{ contentError }}</p>
          <button class="error-retry-btn" @click="retryLoadContent">重试</button>
        </div>

        <div
          v-else-if="selectedArticleMeta && articleContent"
          class="markdown-content"
          v-html="renderMarkdown(articleContent, `/logic/knowledge/${selectedCategory}/`)"
          @click="handleImageClick"
        ></div>

        <div v-else class="empty-content">
          <p>请从左侧菜单选择文章</p>
        </div>
      </article>

      <footer class="article-footer">
        <a
          v-if="prevArticle"
          href="#"
          class="nav-prev"
          @click.prevent="goToPrevArticle"
        >
          <span class="nav-label">上一章</span>
          <div class="nav-link-text">
            <svg
              class="local-icon nav-link-icon"
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
            <span>{{ prevArticle.title }}</span>
          </div>
        </a>

        <div v-else></div>

        <a
          v-if="nextArticle"
          href="#"
          class="nav-next"
          @click.prevent="goToNextArticle"
        >
          <span class="nav-label">下一章</span>
          <div class="nav-link-text">
            <span>{{ nextArticle.title }}</span>
            <svg
              class="local-icon nav-link-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M5 12h14m0 0-7-7m7 7-7 7"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </a>
      </footer>
    </main>

    <BackToTopButton
      :size="60"
      :mobile-size="54"
      :desktop-wide-size="58"
      right="2rem"
      bottom="4.5rem"
      mobile-right="1.4rem"
      mobile-bottom="5rem"
      desktop-wide-right="16rem"
      desktop-wide-bottom="5rem"
    />

    <ImagePreview
      :show="showImagePreview"
      :src="previewImageSrc"
      @close="closeImagePreview"
    />
  </div>
</template>

<style scoped>
.knowledge-page {
  --header-offset: 80px;
  --left-width: 244px;
  --left-collapsed-width: 56px;
  --right-width: 232px;
  --content-max: 800px;
  --gutter-left: 46px;
  --gutter-right: 52px;

  --font-sans:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "Noto Sans CJK SC",
    "Source Han Sans SC",
    Arial,
    sans-serif;

  --font-serif:
    "Songti SC",
    "STSong",
    "Noto Serif CJK SC",
    "Source Han Serif SC",
    "SimSun",
    serif;

  --font-mono:
    "SFMono-Regular",
    "Cascadia Code",
    "Consolas",
    "Liberation Mono",
    "Menlo",
    monospace;

  --text-main: #25282e;
  --text-soft: #626873;
  --text-muted: #8a909a;
  --text-heading: #22252b;
  --text-accent: #4d5f7d;

  --surface: rgba(255, 255, 255, 0.74);
  --surface-strong: rgba(255, 255, 255, 0.9);
  --surface-soft: rgba(246, 247, 249, 0.72);
  --border-soft: rgba(92, 103, 122, 0.13);
  --shadow-soft: 0 14px 36px rgba(30, 39, 54, 0.055);

  min-height: 100vh;
  position: relative;
  overflow: visible;
  font-family: var(--font-sans);
  color: var(--text-main);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

html.dark .knowledge-page {
  --text-main: #d8deea;
  --text-soft: #aeb8c8;
  --text-muted: #8794a8;
  --text-heading: #f2f5fb;
  --text-accent: #c6d6ef;

  --surface: rgba(22, 32, 48, 0.66);
  --surface-strong: rgba(26, 38, 57, 0.88);
  --surface-soft: rgba(30, 45, 68, 0.54);
  --border-soft: rgba(174, 190, 216, 0.14);
  --shadow-soft: none;
}

.local-icon {
  width: 1.12em;
  height: 1.12em;
  display: inline-block;
  flex-shrink: 0;
  color: currentColor;
  vertical-align: -0.14em;
}

.breadcrumb-icon {
  width: 13px;
  height: 13px;
  color: currentColor;
  flex-shrink: 0;
}

.main-content {
  width: min(100%, var(--content-max));
  margin: 0 auto;
  box-sizing: border-box;
  overflow: visible;
}

@media (min-width: 948px) {
  .main-content {
    width: auto;
    max-width: var(--content-max);
    margin-left: calc(var(--left-width) + var(--gutter-left));
    margin-right: 40px;
    transition: margin-left 0.28s ease;
    padding-top: 5.4rem;
  }

  .knowledge-page.collapsed .main-content {
    margin-left: calc(var(--left-collapsed-width) + 28px);
  }
}

@media (min-width: 1200px) {
  .main-content {
    margin-left: calc(var(--left-width) + var(--gutter-left));
    margin-right: calc(var(--right-width) + var(--gutter-right));
  }

  .knowledge-page.collapsed .main-content {
    margin-left: calc(var(--left-collapsed-width) + 28px);
  }
}

.article-header {
  margin-bottom: 34px;
  padding-bottom: 26px;
  border-bottom: 1px solid var(--border-soft);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
  margin-bottom: 12px;
  letter-spacing: 0.02em;
}

.article-title {
  font-family: var(--font-serif);
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.22;
  font-weight: 800;
  color: var(--text-heading);
  margin: 0 0 14px;
  max-width: 13em;
  letter-spacing: -0.015em;
}

.article-summary {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.78;
  color: var(--text-soft);
  max-width: 43rem;
  margin: 0;
}

.article-body {
  color: var(--text-main);
}

.sidebar-nav,
.toc-nav {
  flex: 1;
  min-height: 0;
  height: auto;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

.sidebar-nav::-webkit-scrollbar,
.toc-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track,
.toc-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb,
.toc-nav::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}

html.dark .sidebar-nav,
html.dark .toc-nav {
  scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
}

html.dark .sidebar-nav::-webkit-scrollbar-thumb,
html.dark .toc-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-group {
  margin-bottom: 2px;
}

.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  text-align: left;
}

.group-header:hover {
  background: rgba(95, 110, 138, 0.07);
}

html.dark .group-header:hover {
  background: rgba(166, 185, 212, 0.11);
}

.group-title {
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 1.45;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--text-muted);
}

.group-toggle-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.group-toggle-icon.expanded {
  transform: rotate(180deg);
}

.group-items {
  overflow: hidden;
  transition:
    max-height 0.3s ease,
    opacity 0.2s ease;
  max-height: 1200px;
  opacity: 1;
}

.group-items.collapsed {
  max-height: 0;
  opacity: 0;
}

.nav-item {
  display: block;
  padding: 8px 10px 8px 14px;
  border-radius: 0 12px 12px 0;
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.58;
  color: var(--text-soft);
  text-decoration: none;
  word-break: break-word;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.nav-item:hover {
  background: rgba(95, 110, 138, 0.08);
  transform: translateX(3px);
}

.nav-item.active {
  color: var(--text-accent);
  font-weight: 700;
  background: rgba(95, 110, 138, 0.1);
  border-left: 2px solid var(--text-accent);
  padding-left: 12px;
}

html.dark .nav-item:hover {
  background: rgba(166, 185, 212, 0.12);
}

html.dark .nav-item.active {
  background: rgba(166, 185, 212, 0.16);
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.toc-item {
  position: relative;
  display: block;
  padding: 7px 12px 7px 14px;
  border-radius: 10px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-soft);
  text-decoration: none;
  word-break: break-word;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.toc-item:hover {
  background: rgba(95, 110, 138, 0.08);
  transform: translateX(3px);
}

.toc-item.active {
  color: var(--text-accent);
  font-weight: 700;
  background: rgba(95, 110, 138, 0.1);
}

.toc-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 15px;
  transform: translateY(-50%);
  background: var(--text-accent);
  border-radius: 999px;
}

.toc-item--h1 {
  font-weight: 700;
  font-size: 14px;
}

.toc-item--h2,
.toc-item--child {
  padding-left: 24px;
  font-weight: 500;
  font-size: 13px;
}

.toc-item--h3,
.toc-item--grandchild {
  padding-left: 36px;
  font-weight: 400;
  font-size: 12px;
  color: var(--text-muted);
}

html.dark .toc-item:hover {
  background: rgba(166, 185, 212, 0.12);
}

html.dark .toc-item.active {
  background: rgba(166, 185, 212, 0.16);
}

/* Markdown 阅读区 */
.markdown-content {
  font-family: var(--font-sans);
  font-size: 16.5px;
  line-height: 1.86;
  color: var(--text-main);
  letter-spacing: 0.005em;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  font-family: var(--font-serif);
  color: var(--text-heading);
  letter-spacing: -0.01em;
}

.markdown-content :deep(h1) {
  font-size: clamp(26px, 3vw, 34px);
  line-height: 1.3;
  font-weight: 800;
  margin: 0 0 22px;
  scroll-margin-top: 108px;
}

.markdown-content :deep(h2) {
  position: relative;
  font-size: clamp(22px, 2.4vw, 27px);
  line-height: 1.38;
  font-weight: 800;
  margin: 42px 0 16px;
  padding-top: 2px;
  scroll-margin-top: 108px;
}

.markdown-content :deep(h2)::before {
  content: '';
  display: block;
  width: 28px;
  height: 3px;
  margin-bottom: 11px;
  border-radius: 999px;
  background: var(--text-accent);
  opacity: 0.7;
}

.markdown-content :deep(h3) {
  font-size: clamp(18px, 2vw, 21px);
  line-height: 1.45;
  font-weight: 800;
  margin: 30px 0 11px;
  scroll-margin-top: 108px;
}

.markdown-content :deep(h4) {
  font-family: var(--font-sans);
  font-size: 17px;
  line-height: 1.5;
  font-weight: 800;
  color: var(--text-heading);
  margin: 24px 0 8px;
  scroll-margin-top: 108px;
}

.markdown-content :deep(p) {
  margin: 0 0 16px;
  font-size: 16.5px;
  line-height: 1.86;
  color: var(--text-main);
}

.markdown-content :deep(p + p) {
  margin-top: 2px;
}

/* 列表基础间距 */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.45em;
  margin: 14px 0 20px;
}

/* 列表项本身不要上下都加 margin，否则嵌套列表容易忽大忽小 */
.markdown-content :deep(li) {
  margin-top: 20px;
  padding-left: 4px;
  font-size: 16.5px;
  line-height: 1.82;
  color: var(--text-main);
}

.markdown-content :deep(li:last-child) {
  margin-bottom: -10px;
  padding-left: 4px;
  font-size: 16.5px;
  line-height: 1.82;
  color: var(--text-main);
}

/* 同级列表项之间的距离 */
.markdown-content :deep(li + li) {
  margin-top: 8px;
}

/* li 内部的段落归零，避免 Markdown 生成的 p 把列表撑乱 */
.markdown-content :deep(li > p) {
  margin: 0;
}

/* li 里有多个段落时，第二段开始再拉开 */
.markdown-content :deep(li > p + p) {
  margin-top: 8px;
}



/* 嵌套列表略微紧凑，避免越嵌套越松散 */
.markdown-content :deep(li li) {
  line-height: 1.75;
}

.markdown-content :deep(li li + li) {
  margin-top: 6px;
}

/* 段落后接列表，给一点过渡距离 */
.markdown-content :deep(p + ul),
.markdown-content :deep(p + ol) {
  margin-top: 10px;
}

/* 列表后接段落，给一点呼吸感 */
.markdown-content :deep(ul + p),
.markdown-content :deep(ol + p) {
  margin-top: 18px;
}

.markdown-content :deep(li::marker) {
  color: var(--text-accent);
  font-weight: 700;
}

.markdown-content :deep(strong) {
  font-weight: 800;
  color: var(--text-accent);
}

.markdown-content :deep(a) {
  color: var(--text-accent);
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}

.markdown-content :deep(a:hover) {
  text-decoration-thickness: 2px;
}

.markdown-content :deep(hr) {
  height: 1px;
  border: 0;
  margin: 34px 0;
  background: var(--border-soft);
}

.markdown-content :deep(.markdown-image) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 24px auto;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 14px 38px rgba(26, 35, 52, 0.1);
}

html.dark .markdown-content :deep(.markdown-image) {
  box-shadow: none;
}

.markdown-content :deep(blockquote) {
  margin: 8px 0;
  padding: 12px 20px 12px 19px;
  border-radius: 16px;
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
  border-left: 4px solid var(--text-accent);
  box-shadow: var(--shadow-soft);
}

.markdown-content :deep(blockquote p) {
  margin: 0;
  color: var(--text-soft);
  font-size: 15.5px;
  line-height: 1.78;
}

.empty-content {
  padding: 32px;
  text-align: center;
  border-radius: 18px;
  background: var(--surface-soft);
  color: var(--text-soft);
}

.markdown-content :deep(.code-block) {
  background: #1f2430;
  border-radius: 14px;
  padding: 16px 18px;
  margin: 20px 0;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13.5px;
  line-height: 1.68;
  box-shadow: 0 14px 34px rgba(20, 27, 39, 0.14);
}

.markdown-content :deep(.code-block code) {
  color: #e4e9f2;
  font-family: var(--font-mono);
}

.markdown-content :deep(.inline-code) {
  background: rgba(95, 110, 138, 0.11);
  padding: 2px 6px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.88em;
  color: #b54866;
}

html.dark .markdown-content :deep(.inline-code) {
  background: rgba(166, 185, 212, 0.14);
  color: #f0a8bb;
}

.markdown-content :deep(.table-wrap) {
  width: 100%;
  overflow-x: auto;
  margin: 22px 0;
  border-radius: 14px;
  border: 1px solid var(--border-soft);
  background: var(--surface-strong);
  box-shadow: var(--shadow-soft);
  -webkit-overflow-scrolling: touch;
}

.markdown-content :deep(.markdown-table) {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--text-main);
}

.markdown-content :deep(.markdown-table thead tr) {
  background: rgba(95, 110, 138, 0.08);
}

.markdown-content :deep(.markdown-table th),
.markdown-content :deep(.markdown-table td) {
  padding: 12px 14px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--border-soft);
}

.markdown-content :deep(.markdown-table th) {
  font-weight: 800;
  color: var(--text-accent);
  white-space: nowrap;
}

.markdown-content :deep(.markdown-table tbody tr:last-child td) {
  border-bottom: none;
}

.markdown-content :deep(.markdown-table tbody tr:nth-child(even)) {
  background: rgba(95, 110, 138, 0.035);
}

html.dark .markdown-content :deep(.markdown-table thead tr) {
  background: rgba(166, 185, 212, 0.1);
}

html.dark .markdown-content :deep(.markdown-table tbody tr:nth-child(even)) {
  background: rgba(166, 185, 212, 0.045);
}

/* 底部上一篇 / 下一篇：轻量导航样式 */
.article-footer {
  margin-top: 56px;
  padding-top: 22px;
  padding-bottom: 1rem;
  border-top: 1px solid var(--border-soft);
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 18px;
}

.nav-prev,
.nav-next {
  max-width: 48%;
  min-height: 64px;
  padding: 10px 12px;
  border-radius: 13px;
  border: 1px solid transparent;
  background: transparent;
  text-decoration: none;
  box-shadow: none;
  opacity: 0.86;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.nav-prev:hover,
.nav-next:hover {
  opacity: 1;
  transform: translateY(-1px);
  border-color: var(--border-soft);
  background: rgba(95, 110, 138, 0.045);
}

html.dark .nav-prev:hover,
html.dark .nav-next:hover {
  background: rgba(166, 185, 212, 0.075);
}

.nav-prev:active,
.nav-next:active {
  transform: translateY(0);
}

.nav-next {
  margin-left: auto;
  text-align: right;
}

.nav-label {
  display: block;
  margin-bottom: 4px;
  font-family: var(--font-sans);
  font-size: 11px;
  line-height: 1.4;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

.nav-link-text {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-soft);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.55;
  word-break: break-word;
  transition: color 0.2s ease;
}

.nav-prev:hover .nav-link-text,
.nav-next:hover .nav-link-text {
  color: var(--text-accent);
}

.nav-next .nav-link-text {
  justify-content: flex-end;
}

.nav-link-icon {
  width: 14px;
  height: 14px;
  opacity: 0.72;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.nav-prev:hover .nav-link-icon,
.nav-next:hover .nav-link-icon {
  opacity: 1;
}

.nav-prev:hover .nav-link-icon {
  transform: translateX(-2px);
}

.nav-next:hover .nav-link-icon {
  transform: translateX(2px);
}

.mobile-top-nav {
  display: none;
}

@media (max-width: 947px) {
  .knowledge-page {
    --content-max: 100%;
    overflow: visible;
  }

  .main-content {
    width: 100%;
    overflow: visible;
    padding-top: 5rem;
  }

  .mobile-top-nav {
    position: sticky;
    top: 5rem;
    z-index: 2010;
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    margin-bottom: 24px;
    background: rgba(247, 248, 250, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(165, 172, 186, 0.35);
    border-bottom: 1px solid rgba(165, 172, 186, 0.35);
  }

  html.dark .mobile-top-nav {
    background: rgba(20, 30, 45, 0.9);
    border-top-color: rgba(166, 185, 212, 0.12);
    border-bottom-color: rgba(166, 185, 212, 0.14);
  }

  .mobile-top-nav__btn {
    height: 46px;
    padding: 0 16px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-soft);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .mobile-top-nav__btn--left {
    justify-content: flex-start;
    border-right: 1px solid rgba(165, 172, 186, 0.35);
  }

  .mobile-top-nav__btn--right {
    justify-content: flex-end;
  }

  .mobile-top-nav__btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  html.dark .mobile-top-nav__btn--left {
    border-right-color: rgba(166, 185, 212, 0.14);
  }

  .article-header,
  .article-body,
  .article-footer {
    padding-left: 22px;
    padding-right: 22px;
  }

  .article-header {
    margin-top: 0;
    margin-bottom: 28px;
    padding-bottom: 22px;
  }

  .breadcrumb {
    font-size: 12px;
    margin-bottom: 10px;
  }

  .article-title {
    font-size: 28px;
    line-height: 1.25;
    max-width: none;
    margin-bottom: 12px;
  }

  .article-summary {
    font-size: 15.5px;
    line-height: 1.75;
  }

  .markdown-content {
    font-size: 16px;
    line-height: 1.82;
  }

  .markdown-content :deep(h1) {
    font-size: 25px;
    line-height: 1.32;
    margin-bottom: 18px;
  }

  .markdown-content :deep(h2) {
    font-size: 22px;
    line-height: 1.38;
    margin: 36px 0 14px;
  }

  .markdown-content :deep(h2)::before {
    width: 26px;
    height: 3px;
    margin-bottom: 10px;
  }

  .markdown-content :deep(h3) {
    font-size: 19px;
    line-height: 1.45;
    margin: 28px 0 10px;
  }

  .markdown-content :deep(h4) {
    font-size: 16.5px;
    margin: 22px 0 8px;
  }

  .markdown-content :deep(p),
  .markdown-content :deep(li) {
    font-size: 16px;
    line-height: 1.82;
  }

  .markdown-content :deep(p) {
    margin-bottom: 15px;
  }

  .markdown-content :deep(ul),
  .markdown-content :deep(ol) {
    padding-left: 1.35em;
    margin: 12px 0 18px;
  }

  .markdown-content :deep(li + li) {
    margin-top: 7px;
  }

  .markdown-content :deep(li > ul),
  .markdown-content :deep(li > ol) {
    margin-top: 7px;
    margin-bottom: 3px;
  }

  .markdown-content :deep(li li + li) {
    margin-top: 5px;
  }

  .markdown-content :deep(blockquote) {
    margin: 10px 0;
    padding: 12px 17px;
    border-radius: 15px;
  }

  .markdown-content :deep(.code-block) {
    margin: 18px 0;
    padding: 15px;
    border-radius: 13px;
    font-size: 13px;
  }

  .article-footer {
    margin-top: 42px;
    padding-top: 20px;
    padding-bottom: 24px;
    gap: 12px;
  }

  .nav-prev,
  .nav-next {
    max-width: 50%;
    min-height: auto;
    padding: 11px 10px;
    border-radius: 13px;
  }

  .nav-label {
    font-size: 10.5px;
  }

  .nav-link-text {
    font-size: 13.5px;
    line-height: 1.5;
  }

  .nav-link-icon {
    width: 13px;
    height: 13px;
  }

  .markdown-content :deep(.table-wrap) {
    margin: 20px 0;
    border-radius: 13px;
  }

  .markdown-content :deep(.markdown-table) {
    min-width: 520px;
    font-size: 14px;
  }

  .markdown-content :deep(.markdown-table th),
  .markdown-content :deep(.markdown-table td) {
    padding: 11px 13px;
  }
}

@media (max-width: 560px) {
  .article-header,
  .article-body,
  .article-footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .article-title {
    font-size: 26px;
  }

  .article-footer {
    display: grid;
    grid-template-columns: 1fr;
  }

  .nav-prev,
  .nav-next {
    max-width: none;
    width: 100%;
  }

  .nav-next {
    margin-left: 0;
  }
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
    var(--surface-soft) 25%,
    rgba(166, 185, 212, 0.12) 50%,
    var(--surface-soft) 75%
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
  border-radius: 18px;
  background: var(--surface-soft);
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
  font-family: var(--font-sans);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0;
}

.error-detail {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 12px;
  max-width: 400px;
  word-break: break-word;
}

.error-retry-btn {
  padding: 10px 28px;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-soft);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.error-retry-btn:hover {
  background: var(--surface-strong);
  color: var(--text-accent);
}
</style>