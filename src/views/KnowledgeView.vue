<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { knowledgeData, getArticlesByCategory, type KnowledgeArticle } from '@/data/knowledge'
import { useScrollProgress } from '@/composables/useScrollProgress'
import ImagePreview from '@/components/ImagePreview.vue'
import KnowledgeSidebar from '@/components/KnowledgeSidebar.vue'
import KnowledgeToc from '@/components/KnowledgeToc.vue'
import KnowledgeMobilePanels from '@/components/KnowledgeMobilePanels.vue'
import { renderMarkdown, generateToc, buildNestedToc } from '@/utils/markdown'
import type { TocItem } from '@/types'

const HEADER_HEIGHT = 80
const DESKTOP_BREAKPOINT = 948
const TOC_BREAKPOINT = 1200

const isSidebarCollapsed = ref(false)

const showMobileSidebar = ref(false)
const showMobileToc = ref(false)

const selectedCategory = ref('ai-basics')
const selectedArticle = ref<KnowledgeArticle | null>(null)

const expandedCategoryIds = ref<string[]>([])

const isDesktopSidebarVisible = ref(false)
const isDesktopTocVisible = ref(false)

const showImagePreview = ref(false)
const previewImageSrc = ref('')

const {
  scrollProgress,
  showBackToTop,
  showBackToTopArrow,
  progressRadius,
  progressCircumference,
  progressDashOffset,
  updateScrollProgress,
  scrollToTop,
  clearScrollUiTimers,
} = useScrollProgress()

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
          selectedArticle.value?.id === article.id,
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

const selectArticle = (categoryId: string, articleId: string) => {
  selectedCategory.value = categoryId

  if (!expandedCategoryIds.value.includes(categoryId)) {
    expandedCategoryIds.value = [...expandedCategoryIds.value, categoryId]
  }

  const articles = getArticlesByCategory(categoryId)
  selectedArticle.value = articles.find((a) => a.id === articleId) || null

  if (selectedArticle.value) {
    window.location.hash = `#/knowledge#${categoryId}/${articleId}`
  }

  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    updateScrollProgress()
  })
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

  if (selectedArticle.value?.content) {
    const flatToc = generateToc(selectedArticle.value.content)
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
  if (!selectedArticle.value || !articles.length) return null

  const prevArticles = articles.filter((a) => a.order < selectedArticle.value!.order)
  return prevArticles.length ? prevArticles[prevArticles.length - 1] : null
})

const nextArticle = computed(() => {
  const articles = currentCategoryArticles.value
  if (!selectedArticle.value || !articles.length) return null

  const nextArticles = articles.filter((a) => a.order > selectedArticle.value!.order)
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
  updateScrollProgress()

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

onMounted(() => {
  updateResponsiveState()

  window.addEventListener('resize', handleResize)

  const firstCategory = knowledgeData[0]

  if (firstCategory?.articles?.[0]) {
    selectedCategory.value = firstCategory.id
    selectedArticle.value = firstCategory.articles[0]
    expandedCategoryIds.value = [firstCategory.id]
  }

  nextTick(() => {
    setTimeout(() => {
      setupObserver()
      updateScrollProgress()
    }, 180)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  observer?.disconnect()
  clearScrollUiTimers()
})

watch(selectedArticle, () => {
  nextTick(() => {
    setTimeout(() => {
      setupObserver()
      updateScrollProgress()
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
        :selected-article="selectedArticle"
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
          :selected-article="selectedArticle"
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
          {{ selectedArticle?.title || '' }}
        </h1>

        <p class="article-summary">
          {{ selectedArticle?.description || '' }}
        </p>
      </header>

      <article class="article-body">
        <div
          v-if="selectedArticle"
          class="markdown-content"
          v-html="renderMarkdown(selectedArticle.content)"
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

    <Teleport to="body">
      <button
        v-show="showBackToTop"
        class="back-to-top-btn back-to-top-ring"
        type="button"
        aria-label="返回顶部"
        @click="scrollToTop"
      >
        <span class="back-to-top-ring__inner">
          <svg
            class="back-to-top-ring__svg"
            viewBox="0 0 56 56"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              class="back-to-top-ring__track"
              cx="28"
              cy="28"
              :r="progressRadius"
            />
            <circle
              class="back-to-top-ring__progress"
              cx="28"
              cy="28"
              :r="progressRadius"
              :stroke-dasharray="progressCircumference"
              :stroke-dashoffset="progressDashOffset"
            />
          </svg>

          <span
            v-if="!showBackToTopArrow"
            class="back-to-top-ring__label"
          >
            {{ scrollProgress }}%
          </span>

          <span
            v-else
            class="back-to-top-ring__icon"
            aria-hidden="true"
          >
            <svg
              class="local-icon back-to-top-local-icon"
              viewBox="0 0 24 24"
              focusable="false"
              aria-hidden="true"
            >
              <path
                d="M12 19V5m0 0-7 7m7-7 7 7"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </span>
      </button>
    </Teleport>

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
  --content-max: 860px;
  --gutter-left: 44px;
  --gutter-right: 52px;
  --surface-light: rgba(253, 252, 251, 0.72);
  --surface-dark: rgba(27, 39, 57, 0.68);

  min-height: 100vh;
  position: relative;
  overflow: visible;
}

.local-icon {
  width: 1.15em;
  height: 1.15em;
  display: inline-block;
  flex-shrink: 0;
  color: currentColor;
  vertical-align: -0.15em;
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
    padding-top: 6rem;
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
  margin-bottom: 52px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-family: 'Work Sans', sans-serif;
  font-size: 12px;
  color: #7f7a72;
  margin-bottom: 18px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

html.dark .breadcrumb {
  color: #9aa4b5;
}

.article-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 40px;
  line-height: 1.16;
  font-weight: 900;
  color: #1f1f1c;
  margin: 0 0 18px;
  max-width: 13em;
}

html.dark .article-title {
  color: #f4f6fa;
}

@media (min-width: 948px) {
  .article-title {
    font-size: 52px;
  }
}

.article-summary {
  font-family: 'Work Sans', sans-serif;
  font-size: 18px;
  line-height: 1.8;
  color: #68645d;
  max-width: 42rem;
  margin: 0;
}

html.dark .article-summary {
  color: #afbacb;
}

.article-body {
  color: #1f1f1c;
}

html.dark .article-body {
  color: #e0e4ea;
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
  border-radius: 2px;
}

html.dark .sidebar-nav,
html.dark .toc-nav {
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

html.dark .sidebar-nav::-webkit-scrollbar-thumb,
html.dark .toc-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-group {
  margin-bottom: 4px;
}

.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
}

.group-header:hover {
  background: rgba(95, 110, 138, 0.06);
}

html.dark .group-header:hover {
  background: rgba(95, 110, 138, 0.14);
}

.group-title {
  font-size: 11px;
  line-height: 1.35;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7a746a;
}

html.dark .group-title {
  color: #9eacc0;
}

.group-toggle-icon {
  width: 18px;
  height: 18px;
  color: #868076;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.group-toggle-icon.expanded {
  transform: rotate(180deg);
}

html.dark .group-toggle-icon {
  color: #9eacc0;
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
  padding: 9px 10px 9px 14px;
  border-radius: 0 10px 10px 0;
  font-family: 'Work Sans', sans-serif;
  font-size: 14px;
  line-height: 1.55;
  color: #736d64;
  text-decoration: none;
  word-break: break-word;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.nav-item:hover {
  background: rgba(244, 241, 235, 0.9);
  transform: translateX(3px);
}

.nav-item.active {
  color: #465774;
  font-weight: 600;
  background: rgba(244, 241, 235, 0.95);
  border-left: 2px solid #5f6e8a;
  padding-left: 12px;
}

html.dark .nav-item {
  color: #afbacb;
}

html.dark .nav-item:hover {
  background: rgba(95, 110, 138, 0.14);
}

html.dark .nav-item.active {
  color: #d7e2f1;
  background: rgba(95, 110, 138, 0.18);
  border-left-color: #a6b9d4;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toc-item {
  position: relative;
  display: block;
  padding: 8px 12px 8px 14px;
  border-radius: 10px;
  font-family: 'Work Sans', sans-serif;
  font-size: 13px;
  line-height: 1.55;
  color: #7c776e;
  text-decoration: none;
  word-break: break-word;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.toc-item:hover {
  background: rgba(244, 241, 235, 0.72);
  transform: translateX(3px);
}

.toc-item.active {
  color: #465774;
  font-weight: 600;
  background: rgba(244, 241, 235, 0.78);
}

.toc-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 14px;
  transform: translateY(-50%);
  background: #5f6e8a;
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
}

html.dark .toc-item--h2,
html.dark .toc-item--child {
  color: #a9b6c8;
}

html.dark .toc-item--h3,
html.dark .toc-item--grandchild {
  color: #8a96a8;
}

html.dark .toc-item {
  color: #a9b6c8;
}

html.dark .toc-item:hover {
  background: rgba(95, 110, 138, 0.12);
}

html.dark .toc-item.active {
  color: #d7e2f1;
  background: rgba(95, 110, 138, 0.16);
}

html.dark .toc-item.active::before {
  background: #a6b9d4;
}

.markdown-content {
  font-family: 'Work Sans', sans-serif;
}

.markdown-content :deep(h1) {
  font-family: 'Noto Serif SC', serif;
  font-size: 38px;
  line-height: 1.2;
  font-weight: 700;
  color: #475671;
  margin: 0 0 24px;
  padding-left: 0;
  scroll-margin-top: 108px;
}

.markdown-content :deep(h2) {
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
  color: #475671;
  margin: 48px 0 18px;
  padding-left: 0;
  scroll-margin-top: 108px;
}

.markdown-content :deep(h3) {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  line-height: 1.4;
  font-weight: 700;
  color: #475671;
  margin: 32px 0 14px;
  padding-left: 0;
  scroll-margin-top: 108px;
}

.markdown-content :deep(p) {
  margin: 0 0 18px;
  font-size: 16px;
  line-height: 1.95;
  color: #45484e;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 24px;
}

.markdown-content :deep(li) {
  font-size: 16px;
  line-height: 1.9;
  color: #45484e;
}

.markdown-content :deep(strong) {
  font-weight: 700;
  color: #465774;
}

.markdown-content :deep(.markdown-image) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1rem auto;
  border-radius: 8px;
  cursor: pointer;
}

.markdown-content :deep(blockquote) {
  margin: 28px 0;
  padding: 24px 24px 24px 22px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border-left: 4px solid #5f6e8a;
  box-shadow: 0 6px 24px rgba(31, 31, 28, 0.04);
}

.markdown-content :deep(blockquote p) {
  margin: 0;
  font-style: italic;
}

html.dark .markdown-content :deep(h1),
html.dark .markdown-content :deep(h2),
html.dark .markdown-content :deep(h3) {
  color: #c2d0e4;
}

html.dark .markdown-content :deep(p),
html.dark .markdown-content :deep(li) {
  color: #c4cde0;
}

html.dark .markdown-content :deep(strong) {
  color: #d7e2f1;
}

html.dark .markdown-content :deep(blockquote) {
  background: rgba(30, 45, 70, 0.42);
  box-shadow: none;
}

.article-footer {
  margin-top: 84px;
  padding-top: 34px;
  padding-bottom: 1rem;
  border-top: 1px solid rgba(197, 198, 206, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.nav-prev,
.nav-next {
  max-width: 44%;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.nav-prev:hover,
.nav-next:hover {
  transform: translateX(3px);
}

.nav-next {
  margin-left: auto;
  text-align: right;
}

.nav-label {
  display: block;
  margin-bottom: 6px;
  font-family: 'Work Sans', sans-serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a8378;
}

.nav-link-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475671;
  font-weight: 700;
  line-height: 1.55;
  word-break: break-word;
}

.nav-next .nav-link-text {
  justify-content: flex-end;
}

.nav-link-icon {
  width: 16px;
  height: 16px;
}

html.dark .nav-label {
  color: #9aa4b5;
}

html.dark .nav-link-text {
  color: #d7e2f1;
}

.mobile-top-nav {
  display: none;
}

.back-to-top-btn {
  position: fixed;
  right: 2rem;
  bottom: 4.5rem;
  width: 64px;
  height: 64px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 2300;
  transition:
    transform 0.24s ease,
    opacity 0.24s ease;
}

.back-to-top-btn:hover {
  transform: translateY(-2px) scale(1.03);
}

.back-to-top-btn:active {
  transform: scale(0.98);
}

.back-to-top-ring__inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
}

.back-to-top-ring__svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  overflow: visible;
}

.back-to-top-ring__track,
.back-to-top-ring__progress {
  fill: none;
  stroke-width: 3;
}

.back-to-top-ring__track {
  stroke: rgba(0, 0, 0, 0.12);
}

.back-to-top-ring__progress {
  stroke: #4b4b47;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.18s linear;
}

.back-to-top-ring__label,
.back-to-top-ring__icon {
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4b4b47;
}

.back-to-top-ring__label {
  font-family: 'Work Sans', sans-serif;
  font-size: 14px;
  line-height: 1;
  font-weight: 600;
}

.back-to-top-ring__icon {
  width: 100%;
  height: 100%;
}

.back-to-top-local-icon {
  width: 20px;
  height: 20px;
}

html.dark .back-to-top-ring__track {
  stroke: rgba(255, 255, 255, 0.16);
}

html.dark .back-to-top-ring__progress {
  stroke: rgba(255, 255, 255, 0.82);
}

html.dark .back-to-top-ring__label,
html.dark .back-to-top-ring__icon {
  color: rgba(255, 255, 255, 0.9);
}

.empty-content {
  padding: 32px;
  text-align: center;
}

.markdown-content :deep(.code-block) {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.markdown-content :deep(.code-block code) {
  color: #d4d4d4;
}

.markdown-content :deep(.inline-code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  color: #e83e8c;
}

.markdown-content :deep(.table-wrap) {
  width: 100%;
  overflow-x: auto;
  margin: 24px 0;
  border-radius: 14px;
  border: 1px solid rgba(95, 110, 138, 0.14);
  background: rgba(255, 255, 255, 0.78);
  -webkit-overflow-scrolling: touch;
}

.markdown-content :deep(.markdown-table) {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 15px;
  line-height: 1.7;
  color: #45484e;
}

.markdown-content :deep(.markdown-table thead tr) {
  background: rgba(95, 110, 138, 0.08);
}

.markdown-content :deep(.markdown-table th),
.markdown-content :deep(.markdown-table td) {
  padding: 14px 16px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid rgba(95, 110, 138, 0.12);
}

.markdown-content :deep(.markdown-table th) {
  font-weight: 700;
  color: #465774;
  white-space: nowrap;
}

.markdown-content :deep(.markdown-table tbody tr:last-child td) {
  border-bottom: none;
}

.markdown-content :deep(.markdown-table tbody tr:nth-child(even)) {
  background: rgba(95, 110, 138, 0.03);
}

html.dark .markdown-content :deep(.table-wrap) {
  background: rgba(27, 39, 57, 0.72);
  border-color: rgba(166, 185, 212, 0.14);
}

html.dark .markdown-content :deep(.markdown-table) {
  color: #c4cde0;
}

html.dark .markdown-content :deep(.markdown-table thead tr) {
  background: rgba(166, 185, 212, 0.1);
}

html.dark .markdown-content :deep(.markdown-table th) {
  color: #d7e2f1;
}

html.dark .markdown-content :deep(.markdown-table th),
html.dark .markdown-content :deep(.markdown-table td) {
  border-bottom-color: rgba(166, 185, 212, 0.12);
}

html.dark .markdown-content :deep(.markdown-table tbody tr:nth-child(even)) {
  background: rgba(166, 185, 212, 0.04);
}

@media (max-width: 947px) {
  .knowledge-page {
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
    margin-bottom: 28px;
    background: rgba(247, 245, 241, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(165, 162, 156, 0.5);
    border-bottom: 1px solid rgba(214, 209, 201, 0.5);
  }

  html.dark .mobile-top-nav {
    background: rgba(20, 30, 45, 0.88);
    border-top-color: rgba(166, 185, 212, 0.12);
    border-bottom-color: rgba(166, 185, 212, 0.14);
  }

  .mobile-top-nav__btn {
    height: 48px;
    padding: 0 16px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6f6a62;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .mobile-top-nav__btn--left {
    justify-content: flex-start;
    border-right: 1px solid rgba(214, 209, 201, 0.5);
  }

  .mobile-top-nav__btn--right {
    justify-content: flex-end;
  }

  .mobile-top-nav__btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  html.dark .mobile-top-nav__btn {
    color: #c0cadb;
  }

  html.dark .mobile-top-nav__btn--left {
    border-right-color: rgba(166, 185, 212, 0.14);
  }

  .article-header,
  .article-body,
  .article-footer {
    padding-left: 24px;
    padding-right: 24px;
    padding-bottom: 24px;
  }

  .article-header {
    margin-top: 0;
    margin-bottom: 36px;
  }

  .article-title {
    font-size: 28px;
    line-height: 1.22;
    max-width: none;
  }

  .article-summary {
    font-size: 16px;
    line-height: 1.8;
  }

  .article-footer {
    margin-top: 56px;
    gap: 14px;
  }

  .nav-prev,
  .nav-next {
    max-width: 48%;
  }

  .back-to-top-btn {
    right: 2rem;
    bottom: 5rem;
    width: 58px;
    height: 58px;
  }

  .back-to-top-ring__label {
    font-size: 12px;
  }

  .back-to-top-local-icon {
    width: 18px;
    height: 18px;
  }

  .markdown-content :deep(.markdown-table) {
    min-width: 520px;
    font-size: 14px;
  }

  .markdown-content :deep(.markdown-table th),
  .markdown-content :deep(.markdown-table td) {
    padding: 12px 14px;
  }
}

@media (min-width: 1200px) {
  .back-to-top-btn {
    right: 16rem;
    bottom: 5rem;
    width: 58px;
    height: 58px;
  }
}
</style>