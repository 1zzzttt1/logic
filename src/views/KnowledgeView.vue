<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { knowledgeData, getArticlesByCategory, type KnowledgeArticle } from '@/data/knowledge'

const HEADER_HEIGHT = 80
const DESKTOP_BREAKPOINT = 948
const TOC_BREAKPOINT = 1200

const isSidebarCollapsed = ref(false)
const showMobileMenu = ref(false)

const selectedCategory = ref('ai-basics')
const selectedArticle = ref<KnowledgeArticle | null>(null)

/**
 * 单独控制一级菜单展开状态
 * 这样“是否展开”和“当前选中文章属于哪个分类”就解耦了
 */
const expandedCategoryIds = ref<string[]>([])

const isDesktopSidebarVisible = ref(false)
const isDesktopTocVisible = ref(false)

const updateResponsiveState = () => {
  if (typeof window === 'undefined') return
  isDesktopSidebarVisible.value = window.innerWidth >= DESKTOP_BREAKPOINT
  isDesktopTocVisible.value = window.innerWidth >= TOC_BREAKPOINT
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const openMobileMenu = () => {
  showMobileMenu.value = true
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
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
          selectedArticle.value?.id === article.id
      }))
    }))
  }
})

/**
 * 点击一级菜单：
 * 只负责展开 / 收起，不再直接跳转文章
 */
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

/**
 * 点击二级菜单：
 * 才真正进入文章
 */
const selectArticle = (categoryId: string, articleId: string) => {
  selectedCategory.value = categoryId

  // 进入文章时，自动保证所属一级菜单展开
  if (!expandedCategoryIds.value.includes(categoryId)) {
    expandedCategoryIds.value = [...expandedCategoryIds.value, categoryId]
  }

  const articles = getArticlesByCategory(categoryId)
  selectedArticle.value = articles.find((a) => a.id === articleId) || null

  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  })
}

const handleNavClick = (path: string) => {
  const match = path.match(/^#(.+)\/(.+)$/)
  if (match && match[1] && match[2]) {
    selectArticle(match[1], match[2])
  }
  closeMobileMenu()
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateToc(content: string): { name: string; id: string; active: boolean }[] {
  const toc: { name: string; id: string; active: boolean }[] = []
  const headings = content.match(/^#{1,3}\s+(.+)$/gm) || []

  headings.forEach((heading, index) => {
    const text = heading.replace(/^#{1,3}\s+/, '').trim()
    const id = slugifyHeading(text)
    if (!id) return

    toc.push({
      name: text,
      id,
      active: index === 0
    })
  })

  return toc
}

const tocItems = ref<{ name: string; id: string; active: boolean }[]>([])

const scrollToAnchor = (id: string) => {
  const element = document.getElementById(id)
  if (!element) return

  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - HEADER_HEIGHT - 16

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  })

  closeMobileMenu()
}

let observer: IntersectionObserver | null = null

const setupObserver = () => {
  observer?.disconnect()

  if (selectedArticle.value?.content) {
    tocItems.value = generateToc(selectedArticle.value.content)
  } else {
    tocItems.value = []
  }

  const ids = tocItems.value.map((item) => item.id)
  if (!ids.length) return

  observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      if (!visibleEntries.length) return

      const activeId = visibleEntries[0]?.target.id
      tocItems.value = tocItems.value.map((item) => ({
        ...item,
        active: item.id === activeId
      }))
    },
    {
      root: null,
      rootMargin: '-110px 0px -65% 0px',
      threshold: 0
    }
  )

  ids.forEach((id) => {
    const el = document.getElementById(id)
    if (el) observer?.observe(el)
  })
}

const renderMarkdown = (content: string): string => {
  if (!content) return ''

  let html = content

  html = html.replace(/^### (.*$)/gim, (_match, p1) => {
    const id = slugifyHeading(p1)
    return `<h3 class="section-title" id="${id}">${p1}</h3>`
  })

  html = html.replace(/^## (.*$)/gim, (_match, p1) => {
    const id = slugifyHeading(p1)
    return `<h2 class="section-title" id="${id}">${p1}</h2>`
  })

  html = html.replace(/^# (.*$)/gim, (_match, p1) => {
    const id = slugifyHeading(p1)
    return `<h1 class="section-title" id="${id}">${p1}</h1>`
  })

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  html = html.replace(/^- (.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
  html = html.replace(/^> (.*$)/gim, '<blockquote class="expert-tip"><p>$1</p></blockquote>')

  html = html.replace(/\n\n/g, '</p><p class="section-text">')
  html = html.replace(/\n/g, '<br>')
  html = '<p class="section-text">' + html + '</p>'
  html = html.replace(/<p class="section-text"><\/p>/g, '')

  return html
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
    setTimeout(setupObserver, 180)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  observer?.disconnect()
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})

watch(selectedArticle, () => {
  nextTick(() => {
    setTimeout(setupObserver, 180)
  })
})
</script>

<template>
  <div class="knowledge-page" :class="{ collapsed: isSidebarCollapsed }">
    <Teleport to="body">
      <aside
        v-if="isDesktopSidebarVisible"
        class="desktop-sidebar-left"
        :class="{ collapsed: isSidebarCollapsed }"
      >
       

        <template v-if="!isSidebarCollapsed">
          <div class="sidebar-header">
            <p class="sidebar-series">知识库</p>
            <h3 class="sidebar-title">教程目录</h3>
          </div>

          <nav class="sidebar-nav">
            <div v-for="(group, index) in sidebarNav.groups" :key="group.id" class="nav-group">
              <button class="group-header" type="button" @click="toggleGroup(index)">
                <span class="group-title">{{ group.title }}</span>
                <span
                  class="material-symbols-outlined group-toggle-icon"
                  :class="{ expanded: group.expanded }"
                >
                  expand_more
                </span>
              </button>

              <div class="group-items" :class="{ collapsed: !group.expanded }">
                <a
                  v-for="item in group.items"
                  :key="item.id"
                  :href="item.path"
                  class="nav-item"
                  :class="{ active: item.active }"
                  @click.prevent="handleNavClick(item.path)"
                >
                  {{ item.name }}
                </a>
              </div>
            </div>
          </nav>
        </template>
      </aside>
    </Teleport>

    <Teleport to="body">
      <aside
        v-if="isDesktopTocVisible && tocItems.length > 0"
        class="desktop-sidebar-right"
      >
        <div class="toc-head">
          <h4 class="toc-title">页面导航</h4>
        </div>

        <nav class="toc-nav">
          <a
            v-for="item in tocItems"
            :key="item.id"
            :href="'#' + item.id"
            class="toc-item"
            :class="{ active: item.active }"
            @click.prevent="scrollToAnchor(item.id)"
          >
            {{ item.name }}
          </a>
        </nav>
      </aside>
    </Teleport>

    <Teleport to="body">
      <div
        class="mobile-menu-overlay"
        :class="{ active: showMobileMenu }"
        @click="closeMobileMenu"
      >
        <div class="mobile-menu-drawer" @click.stop>
          <div class="mobile-menu-header">
            <div>
              <p class="sidebar-series">知识库</p>
              <h3 class="sidebar-title">教程目录</h3>
            </div>
            <button class="mobile-menu-close" type="button" @click="closeMobileMenu">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
          </div>

          <nav class="sidebar-nav">
            <div
              v-for="(group, index) in sidebarNav.groups"
              :key="group.id"
              class="nav-group"
            >
              <button class="group-header" type="button" @click="toggleGroup(index)">
                <span class="group-title">{{ group.title }}</span>
                <span
                  class="material-symbols-outlined group-toggle-icon"
                  :class="{ expanded: group.expanded }"
                >
                  expand_more
                </span>
              </button>

              <div class="group-items" :class="{ collapsed: !group.expanded }">
                <a
                  v-for="item in group.items"
                  :key="item.id"
                  :href="item.path"
                  class="nav-item"
                  :class="{ active: item.active }"
                  @click.prevent="handleNavClick(item.path)"
                >
                  {{ item.name }}
                </a>
              </div>
            </div>
          </nav>

          <div v-if="tocItems.length > 0" class="mobile-toc">
            <div class="toc-head">
              <p class="toc-kicker">On this page</p>
              <h4 class="toc-title">本章目录</h4>
            </div>

            <nav class="toc-nav">
              <a
                v-for="item in tocItems"
                :key="item.id"
                :href="'#' + item.id"
                class="toc-item"
                :class="{ active: item.active }"
                @click.prevent="scrollToAnchor(item.id)"
              >
                {{ item.name }}
              </a>
            </nav>
          </div>
        </div>
      </div>

      <button
        v-show="!showMobileMenu && !isDesktopSidebarVisible"
        class="mobile-menu-fab"
        type="button"
        @click="openMobileMenu"
      >
        <span>目录</span>
      </button>
    </Teleport>

    <main class="main-content">
      <header class="article-header">
        <nav class="breadcrumb">
          <span>知识库</span>
          <span>/</span>
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
        <div class="article-hero">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuACt5DzmuKmB7orWdqxYZ19-aOnV1mAKRqrfTCkWy9lU5FFhisLITW9MZwbULVt5D8_n_3Nv7bDq8HdlTO9cGWTYxF2nZ_P5ra7JVUgnXjvwkq6y4AYzZ-ru8vL0zncKqeYm435wjXkc724Jl6194zopiDi8tN13DRqB_G5tRoTGKLtys5yZlU8joG6OmcvGuNUcUKIy_MdNTqkVumZFM9Cj-wMxg6SObx19QjH6sOVT3W5Z0u0fV_L6JaCifBHd0b-5oi70ZyOsSo"
            alt="Abstract digital visualization"
          />
        </div>

        <div
          v-if="selectedArticle"
          class="markdown-content"
          v-html="renderMarkdown(selectedArticle.content)"
        ></div>

        <div v-else class="empty-content">
          <p>请从左侧菜单选择文章</p>
        </div>
      </article>

      <footer class="article-footer">
        <a v-if="prevArticle" href="#" class="nav-prev" @click.prevent="goToPrevArticle">
          <span class="nav-label">上一章</span>
          <div class="nav-link-text">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>{{ prevArticle.title }}</span>
          </div>
        </a>

        <div v-else></div>

        <a v-if="nextArticle" href="#" class="nav-next" @click.prevent="goToNextArticle">
          <span class="nav-label">下一章</span>
          <div class="nav-link-text">
            <span>{{ nextArticle.title }}</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          </div>
        </a>
      </footer>
    </main>
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

.main-content {
  width: min(100%, var(--content-max));
  margin: 0 auto;
  padding: calc(var(--header-offset) + 40px) 24px 72px;
  box-sizing: border-box;
  overflow: visible;
}

@media (min-width: 948px) {
  .main-content {
    width: auto;
    max-width: var(--content-max);
    margin-left: calc(var(--left-width) + var(--gutter-left));
    margin-right: 40px;
    padding: calc(var(--header-offset) + 40px) 24px 72px;
    transition: margin-left 0.28s ease;
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

.article-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 8.6;
  overflow: hidden;
  border-radius: 18px;
  margin-bottom: 52px;
  box-shadow:
    0 10px 30px rgba(31, 31, 28, 0.06),
    0 2px 8px rgba(31, 31, 28, 0.04);
}

.article-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.desktop-sidebar-left {
  position: fixed;
  top: 5rem;
  min-width: 15.5rem;
  height: 100svh;
  border-right: 1px solid #d9dadb;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-sizing: border-box;
  z-index: 1200;
}

.desktop-sidebar-left.collapsed {
  width: var(--left-collapsed-width);
  padding: 12px 8px;
}

html.dark .desktop-sidebar-left {
  background: var(--surface-dark);
  border-color: rgba(166, 185, 212, 0.14);
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 34px;
  border: none;
  background: transparent;
  border-radius: 10px;
  color: #7d786f;
  cursor: pointer;
  margin-bottom: 14px;
  transition: background 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: rgba(95, 110, 138, 0.08);
}

html.dark .collapse-btn {
  color: #a6afbf;
}

html.dark .collapse-btn:hover {
  background: rgba(95, 110, 138, 0.18);
}

.collapse-btn .material-symbols-outlined {
  font-size: 20px;
}

.sidebar-header {
  margin-bottom: 22px;
  padding: 0 8px;
}

.sidebar-series {
  font-family: 'Work Sans', sans-serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a8378;
  margin: 0 0 6px;
}

.sidebar-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 700;
  color: #475671;
  margin: 0;
}

html.dark .sidebar-series {
  color: #92a0b3;
}

html.dark .sidebar-title {
  color: #c3d0e3;
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
  font-size: 18px;
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
  transition: max-height 0.3s ease, opacity 0.2s ease;
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

.desktop-sidebar-right {
  position: fixed;
  right: 0;
  top: 5rem;
  min-width: 14rem;
  height: 100vh;
  overflow-y: auto;
  padding: 16px 14px;
  box-sizing: border-box;
  z-index: 10;
  border-left: 1px solid rgba(186, 184, 184, 0.42);
 
}

html.dark .desktop-sidebar-right{
  border-color: rgba(166, 185, 212, 0.14);
}


.toc-head {
  margin-bottom: 14px;
  padding-left: 2px;
}

.toc-kicker {
  margin: 0 0 4px;
  font-family: 'Work Sans', sans-serif;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #928c82;
}

.toc-title {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  font-weight: 700;
  color: #4a5a76;
}

html.dark .toc-kicker {
  color: #93a1b6;
}

html.dark .toc-title {
  color: #c2d0e4;
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
  font-size: 32px;
  line-height: 1.22;
  font-weight: 700;
  color: #475671;
  margin: 0 0 24px;
  scroll-margin-top: 108px;
}

.markdown-content :deep(h2) {
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  line-height: 1.34;
  font-weight: 700;
  color: #475671;
  margin: 52px 0 18px;
  scroll-margin-top: 108px;
}

.markdown-content :deep(h3) {
  font-family: 'Noto Serif SC', serif;
  font-size: 22px;
  line-height: 1.42;
  font-weight: 700;
  color: #475671;
  margin: 36px 0 14px;
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
  margin: 0 0 26px;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin-bottom: 8px;
  font-size: 16px;
  line-height: 1.9;
  color: #45484e;
}

.markdown-content :deep(strong) {
  font-weight: 700;
  color: #465774;
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

.nav-link-text .material-symbols-outlined {
  font-size: 16px;
  flex-shrink: 0;
}

html.dark .nav-label {
  color: #9aa4b5;
}

html.dark .nav-link-text {
  color: #d7e2f1;
}

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 24, 0.42);
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.28s ease, visibility 0.28s ease;
}

.mobile-menu-overlay.active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.mobile-menu-drawer {
  position: absolute;
  top: 0;
  left: 0;
  width: min(84vw, 21rem);
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  background: rgba(253, 252, 251, 0.96);
  box-shadow: 12px 0 32px rgba(0, 0, 0, 0.12);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  padding-top: 7rem;
}

.mobile-menu-overlay.active .mobile-menu-drawer {
  transform: translateX(0);
}

html.dark .mobile-menu-drawer {
  background: rgba(27, 39, 57, 0.98);
}

.mobile-menu-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(214, 209, 201, 0.5);
}

html.dark .mobile-menu-header {
  border-bottom-color: rgba(214, 209, 201, 0.2);
}

.mobile-menu-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #7a766f;
  cursor: pointer;
}

html.dark .mobile-menu-close {
  color: #a6afbf;
}

.mobile-toc {
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid rgba(214, 209, 201, 0.5);
}

html.dark .mobile-toc {
  border-top-color: rgba(214, 209, 201, 0.2);
}

.mobile-menu-fab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  right: 20px;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  min-width: 74px;
  height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: #5f6e8a;
  color: #fff;
  box-shadow: 0 12px 28px rgba(31, 31, 28, 0.16);
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease, background 0.2s ease;
}

.mobile-menu-fab:hover {
  transform: translateY(-2px);
  background: #475671;
}

.mobile-menu-fab span {
  font-size: 14px;
  font-weight: 600;
}

html.dark .mobile-menu-fab {
  background: #a6b9d4;
  color: #1b2739;
}

@media (min-width: 948px) {
  .mobile-menu-fab {
    display: none;
  }
}

.empty-content {
  padding: 32px;
  text-align: center;
  color: #68645d;
}

html.dark .empty-content {
  color: #a6afbf;
}

.desktop-sidebar-left::-webkit-scrollbar,
.desktop-sidebar-right::-webkit-scrollbar,
.mobile-menu-drawer::-webkit-scrollbar {
  width: 4px;
}

.desktop-sidebar-left::-webkit-scrollbar-track,
.desktop-sidebar-right::-webkit-scrollbar-track,
.mobile-menu-drawer::-webkit-scrollbar-track {
  background: transparent;
}

.desktop-sidebar-left::-webkit-scrollbar-thumb,
.desktop-sidebar-right::-webkit-scrollbar-thumb,
.mobile-menu-drawer::-webkit-scrollbar-thumb {
  background: #d8d2c8;
  border-radius: 999px;
}

html.dark .desktop-sidebar-left::-webkit-scrollbar-thumb,
html.dark .desktop-sidebar-right::-webkit-scrollbar-thumb,
html.dark .mobile-menu-drawer::-webkit-scrollbar-thumb {
  background: rgba(166, 185, 212, 0.34);
}
</style>