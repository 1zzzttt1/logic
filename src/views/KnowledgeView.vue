<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { knowledgeData, getArticlesByCategory, type KnowledgeArticle } from '@/data/knowledge'

// 侧边栏展开/收起状态
const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 移动端菜单抽屉状态
const showMobileMenu = ref(false)

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

// 当前选中的分类和文章
const selectedCategory = ref('ai-basics')
const selectedArticle = ref<KnowledgeArticle | null>(null)

// 动态加载的侧边栏导航数据
const sidebarNav = computed(() => {
  return {
    series: '知识库',
    groups: knowledgeData.map((category) => ({
      title: category.name,
      expanded: category.id === selectedCategory.value,
      items: category.articles.map((article) => ({
        name: article.title,
        path: `#${category.id}/${article.id}`,
        active:
          selectedCategory.value === category.id &&
          selectedArticle.value?.id === article.id
      }))
    }))
  }
})

// 切换分组展开/收起
const toggleGroup = (index: number) => {
  const category = knowledgeData[index]
  if (category) {
    selectedCategory.value = category.id
    if (category.articles.length > 0) {
      selectedArticle.value = category.articles[0] || null
    } else {
      selectedArticle.value = null
    }
  }
}

// 选择文章
const selectArticle = (categoryId: string, articleId: string) => {
  selectedCategory.value = categoryId
  const articles = getArticlesByCategory(categoryId)
  const article = articles.find((a) => a.id === articleId)
  selectedArticle.value = article || null

  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  })
}

// 从路径解析分类和文章 ID
const handleNavClick = (path: string) => {
  const match = path.match(/^#(.+)\/(.+)$/)
  if (match && match[1] && match[2]) {
    selectArticle(match[1], match[2])
  }
  closeMobileMenu()
}

// 从 Markdown 内容生成 TOC
function generateToc(content: string): { name: string; id: string; active: boolean }[] {
  const toc: { name: string; id: string; active: boolean }[] = []
  const headings = content.match(/^#{2,3}\s+(.+)$/gm) || []

  headings.forEach((heading, index) => {
    const text = heading.replace(/^#{2,3}\s+/, '')
    const id = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    toc.push({ name: text, id, active: index === 0 })
  })

  return toc
}

// 简单的 Markdown 转 HTML
const renderMarkdown = (content: string): string => {
  if (!content) return ''

  let html = content

  html = html.replace(/^### (.*$)/gim, (_match, p1) => {
    const id = p1
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h3 class="section-title" id="${id}">${p1}</h3>`
  })

  html = html.replace(/^## (.*$)/gim, (_match, p1) => {
    const id = p1
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h2 class="section-title" id="${id}">${p1}</h2>`
  })

  html = html.replace(/^# (.*$)/gim, '<h1 class="section-title">$1</h1>')
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

// TOC 数据
const tocItems = ref<{ name: string; id: string; active: boolean }[]>([])

// 滚动到锚点
const scrollToAnchor = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    const headerOffset = 80
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }

  closeMobileMenu()
}

// 滚动监听 - 使用 Intersection Observer 精确检测
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  observer?.disconnect()

  if (selectedArticle.value?.content) {
    const newToc = generateToc(selectedArticle.value.content)
    if (newToc.length > 0) {
      tocItems.value = newToc
    } else {
      tocItems.value = []
    }
  } else {
    tocItems.value = []
  }

  const sectionIds = tocItems.value.map((item) => item.id).filter(Boolean)
  if (sectionIds.length === 0) return

  observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      if (visibleEntries.length > 0) {
        const firstEntry = visibleEntries[0]
        const activeId = firstEntry?.target.id

        tocItems.value = tocItems.value.map((item) => ({
          ...item,
          active: item.id === activeId
        }))
      }
    },
    {
      root: null,
      rootMargin: '-80px 0px -80% 0px',
      threshold: 0
    }
  )

  sectionIds.forEach((id) => {
    const element = document.getElementById(id)
    if (element) observer?.observe(element)
  })
}

const handleScroll = () => {
  // 由 IntersectionObserver 处理
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  const firstCategory = knowledgeData[0]
  if (firstCategory && firstCategory.articles.length > 0 && firstCategory.articles[0]) {
    selectedCategory.value = firstCategory.id
    selectedArticle.value = firstCategory.articles[0]
  }

  setTimeout(setupObserver, 100)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  observer?.disconnect()
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})

watch(selectedArticle, () => {
  nextTick(() => {
    setTimeout(setupObserver, 200)
  })
})

// 当前分类下的所有文章（按 order 排序）
const currentCategoryArticles = computed(() => {
  const category = knowledgeData.find((c) => c.id === selectedCategory.value)
  return category?.articles || []
})

// 上一章
const prevArticle = computed(() => {
  const articles = currentCategoryArticles.value
  if (!selectedArticle.value || articles.length === 0) return null
  const prevArticles = articles.filter((a) => a.order < selectedArticle.value!.order)
  return prevArticles.length > 0 ? prevArticles[prevArticles.length - 1] : null
})

// 下一章
const nextArticle = computed(() => {
  const articles = currentCategoryArticles.value
  if (!selectedArticle.value || articles.length === 0) return null
  const nextArticles = articles.filter((a) => a.order > selectedArticle.value!.order)
  return nextArticles.length > 0 ? nextArticles[0] : null
})

// 跳转上一章
const goToPrevArticle = () => {
  if (prevArticle.value) {
    selectArticle(selectedCategory.value, prevArticle.value.id)
  }
}

// 跳转下一章
const goToNextArticle = () => {
  if (nextArticle.value) {
    selectArticle(selectedCategory.value, nextArticle.value.id)
  }
}
</script>

<template>
  <div class="knowledge-page" :class="{ collapsed: isSidebarCollapsed }">
    <Teleport to="body">
      <!-- 移动端菜单抽屉 -->
      <div
        class="mobile-menu-overlay"
        :class="{ active: showMobileMenu }"
        @click="closeMobileMenu"
      >
        <div class="mobile-menu-drawer" @click.stop>
          <div class="mobile-menu-header">
            <h3 class="sidebar-title">教程目录</h3>
            <button class="mobile-menu-close" @click="closeMobileMenu">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
          </div>

          <nav class="sidebar-nav">
            <div
              v-for="(group, index) in sidebarNav.groups"
              :key="group.title"
              class="nav-group"
            >
              <div class="group-header" @click="toggleGroup(index)">
                <span class="group-title">{{ group.title }}</span>
                <span
                  class="material-symbols-outlined group-toggle-icon"
                  :class="{ expanded: group.expanded }"
                >
                  expand_more
                </span>
              </div>

              <div class="group-items" :class="{ collapsed: !group.expanded }">
                <a
                  v-for="item in group.items"
                  :key="item.name"
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
        </div>
      </div>

      <!-- 移动端悬浮按钮 -->
      <button
        v-show="!showMobileMenu"
        class="mobile-menu-fab"
        type="button"
        @click="openMobileMenu"
      >
        <span>目录</span>
      </button>
    </Teleport>

    <div class="knowledge-content">
      <!-- 左侧教程目录 -->
      <aside class="sidebar-left" :class="{ collapsed: isSidebarCollapsed }">
        <button
          class="collapse-btn"
          @click="toggleSidebar"
          :title="isSidebarCollapsed ? '展开菜单' : '收起菜单'"
        >
          <span class="material-symbols-outlined">
            {{ isSidebarCollapsed ? 'chevron_right' : 'chevron_left' }}
          </span>
        </button>

        <template v-if="!isSidebarCollapsed">
          <div class="sidebar-header">
            <h3 class="sidebar-title">教程目录</h3>
            <p class="sidebar-series">{{ sidebarNav.series }}</p>
          </div>

          <nav class="sidebar-nav">
            <div v-for="(group, index) in sidebarNav.groups" :key="group.title" class="nav-group">
              <div class="group-header" @click="toggleGroup(index)">
                <span class="group-title">{{ group.title }}</span>
                <span
                  class="material-symbols-outlined group-toggle-icon"
                  :class="{ expanded: group.expanded }"
                >
                  expand_more
                </span>
              </div>

              <div class="group-items" :class="{ collapsed: !group.expanded }">
                <a
                  v-for="item in group.items"
                  :key="item.name"
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

      <!-- 中间正文区 -->
      <main class="main-content">
        <header class="article-header">
          <nav class="breadcrumb">
            <span>知识库</span>
            <span>/</span>
            <span>{{ knowledgeData.find((c) => c.id === selectedCategory)?.name || '' }}</span>
            <span>/</span>
            <span class="current">{{ selectedArticle?.title || '' }}</span>
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

          <a v-if="nextArticle" href="#" class="nav-next" @click.prevent="goToNextArticle">
            <span class="nav-label">下一章</span>
            <div class="nav-link-text">
              <span>{{ nextArticle.title }}</span>
              <span class="material-symbols-outlined">arrow_forward</span>
            </div>
          </a>
        </footer>
      </main>

      <!-- 右侧 TOC -->
      <aside class="sidebar-right">
        <h4 class="toc-title">本章目录</h4>
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
    </div>
  </div>
</template>

<style scoped>
.knowledge-page {
  min-height: 100vh;
  position: relative;
}

/* 主内容区 */
.knowledge-content {
  display: flex;
  min-height: 100vh;
  padding-top: 6rem;
}

@media (min-width: 768px) {
  .knowledge-content {
    padding-top: 5rem;
  }
}

.sidebar-left {
  display: none;
  flex-direction: column;
  width: 18rem;
  height: calc(100vh - 5rem);
  position: fixed;
  left: 0;
  top: 5rem;
  background: transparent;
  border-right: 1px solid rgba(214, 209, 201, 0.5);
  padding: 1.5rem;
  overflow-y: auto;
  transition: width 0.3s ease, padding 0.3s ease;
}

html.dark .sidebar-left {
  border-right-color: rgba(214, 209, 201, 0.3);
}

.sidebar-left.collapsed {
  width: 3rem;
  padding: 1rem 0.5rem;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2rem;
  background: transparent;
  border: none;
  color: #7A766F;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

html.dark .collapse-btn {
  color: #a6afbf;
}

.collapse-btn:hover {
  background: rgba(95, 110, 138, 0.1);
}

html.dark .collapse-btn:hover {
  background: rgba(95, 110, 138, 0.2);
}

.collapse-btn .material-symbols-outlined {
  font-size: 20px;
}

@media (min-width: 768px) {
  .sidebar-left {
    display: flex;
  }
}

.sidebar-header {
  margin-bottom: 2rem;
}

.sidebar-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #475671;
  margin-bottom: 0.25rem;
}

.sidebar-series {
  font-family: 'Work Sans', sans-serif;
  font-size: 0.75rem;
  color: #605E5A;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-group {
  margin-bottom: 0.5rem;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.2s ease;
}

.group-header:hover {
  background: rgba(95, 110, 138, 0.08);
}

html.dark .group-header:hover {
  background: rgba(95, 110, 138, 0.15);
}

.group-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6a6863;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

html.dark .group-title {
  color: #a6afbf;
}

.group-toggle-icon {
  font-size: 18px;
  color: #7A766F;
  transition: transform 0.2s ease;
}

html.dark .group-toggle-icon {
  color: #a6afbf;
}

.group-toggle-icon.expanded {
  transform: rotate(180deg);
}

.group-items {
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.2s ease;
}

.group-items.collapsed {
  max-height: 0;
  opacity: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.75rem;
  font-family: 'Work Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #7A766F;
  text-decoration: none;
  border-radius: 0 0.5rem 0.5rem 0;
  transition: all 0.2s ease;
}

html.dark .nav-item {
  color: #a6afbf;
}

.nav-item:hover {
  background: #F4F1EB;
  transform: translateX(4px);
}

html.dark .nav-item:hover {
  background: rgba(95, 110, 138, 0.15);
}

.nav-item.active {
  font-weight: 600;
  color: #7A766F;
  border-left: 2px solid #5F6E8A;
  padding-left: 0.625rem;
  background: #F4F1EB;
}

html.dark .nav-item.active {
  color: #f4f6fa;
  border-left-color: #a6b9d4;
  background: rgba(95, 110, 138, 0.2);
}

/* 中间正文区 */
.main-content {
  flex: 1;
  padding: 3rem 2rem;
  max-width: 56rem;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .main-content {
    padding: 3rem 2rem;
    margin-left: 18rem;
    transition: margin-left 0.3s ease;
  }

  .knowledge-page.collapsed .main-content {
    margin-left: 3rem;
  }
}

@media (min-width: 1024px) {
  .main-content {
    padding: 3rem 4rem;
    margin-right: 16rem;
  }
}

.article-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(197, 198, 206, 0.15);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Work Sans', sans-serif;
  font-size: 0.75rem;
  color: #605E5A;
  margin-bottom: 1.5rem;
  letter-spacing: 0.05em;
}

html.dark .breadcrumb {
  color: #a6afbf;
}

.breadcrumb .current {
  color: #5F6E8A;
  font-weight: 500;
}

html.dark .breadcrumb .current {
  color: #a6b9d4;
}

.article-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: #1F1F1C;
  line-height: 1.2;
  margin-bottom: 1rem;
}

html.dark .article-title {
  color: #f4f6fa;
}

@media (min-width: 768px) {
  .article-title {
    font-size: 3rem;
  }
}

.article-summary {
  font-family: 'Work Sans', sans-serif;
  font-size: 1.125rem;
  color: #605E5A;
  line-height: 1.6;
  max-width: 42rem;
}

html.dark .article-summary {
  color: #a6afbf;
}

/* 文章正文 */
.article-body {
  font-family: 'Work Sans', sans-serif;
  color: #1F1F1C;
}

html.dark .article-body {
  color: #e0e4ea;
}

.article-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 0.5rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.article-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.875rem;
  font-weight: 700;
  color: #475671;
  margin-bottom: 1.5rem;
}

html.dark .section-title {
  color: #a6b9d4;
}

.section-text {
  line-height: 1.7;
  margin-bottom: 1.5rem;
  color: #44474D;
  font-size: 1rem;
}

html.dark .section-text {
  color: #c4cde0;
}

/* 专家提示卡片 */
.expert-tip {
  background: #FFFFFF;
  padding: 2rem;
  border-radius: 0.5rem;
  border-left: 4px solid #5F6E8A;
  margin: 2.5rem 0;
}

html.dark .expert-tip {
  background: rgba(30, 45, 70, 0.5);
}

.tip-title {
  font-weight: 700;
  color: #475671;
  margin-bottom: 0.5rem;
}

html.dark .tip-title {
  color: #a6b9d4;
}

.tip-text {
  font-size: 0.875rem;
  font-style: italic;
  color: #44474D;
  line-height: 1.6;
}

html.dark .tip-text {
  color: #a6afbf;
}

/* 步骤列表 */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.step-number {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #475671;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

html.dark .step-number {
  background: #a6b9d4;
  color: #1b2739;
}

.step-text {
  color: #44474D;
  line-height: 1.6;
}

html.dark .step-text {
  color: #c4cde0;
}

/* 信息卡片 */
.info-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 1.5rem;
}

@media (min-width: 768px) {
  .info-cards {
    grid-template-columns: 1fr 1fr;
  }
}

.info-card {
  padding: 1.5rem;
  background: rgba(228, 226, 222, 0.3);
  border-radius: 0.5rem;
}

html.dark .info-card {
  background: rgba(30, 45, 70, 0.4);
}

.card-title {
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #475671;
}

html.dark .card-title {
  color: #a6b9d4;
}

.card-text {
  font-size: 0.875rem;
  color: #605E5A;
  line-height: 1.6;
}

html.dark .card-text {
  color: #a6afbf;
}

/* 底部导航 */
.article-footer {
  margin-top: 5rem;
  padding-top: 2.5rem;
  border-top: 1px solid rgba(197, 198, 206, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

html.dark .article-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.nav-prev,
.nav-next {
  text-decoration: none;
  transition: transform 0.2s ease;
}

.nav-prev:hover,
.nav-next:hover {
  transform: translateX(4px);
}

.nav-next {
  text-align: right;
}

.nav-label {
  display: block;
  font-family: 'Work Sans', sans-serif;
  font-size: 0.75rem;
  color: #605E5A;
  margin-bottom: 0.25rem;
  letter-spacing: 0.1em;
}
.nav-prev .nav-label {
  text-align: right;
}

.nav-next .nav-label {
  text-align: left;
}




.nav-link-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #475671;
}

.nav-next .nav-link-text {
  justify-content: flex-end;
}

.nav-link-text .material-symbols-outlined {
  font-size: 16px;
}

/* 右侧 TOC */
.sidebar-right {
  display: none;
  flex-direction: column;
  width: 16rem;
  height: calc(100vh - 5rem);
  position: fixed;
  right: 0;
  top: 5rem;
  padding: 2rem 1rem;
  background: transparent;
  border-left: 1px solid rgba(214, 209, 201, 0.5);
}

html.dark .sidebar-right {
  border-left-color: rgba(214, 209, 201, 0.3);
}

@media (min-width: 1024px) {
  .sidebar-right {
    display: flex;
  }
}

.toc-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toc-item {
  position: relative;
  font-family: 'Work Sans', sans-serif;
  font-size: 0.875rem;
  color: #7A766F;
  text-decoration: none;
  padding-left: 1rem;
  transition: all 0.2s ease;
}

html.dark .toc-item {
  color: #a6afbf;
}

.toc-item:hover {
  background: #F4F1EB;
  transform: translateX(4px);
}

html.dark .toc-item:hover {
  background: rgba(95, 110, 138, 0.15);
}

.toc-item.active {
  color: #475671;
  font-weight: 600;
}

html.dark .toc-item.active {
  color: #a6b9d4;
}

.toc-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 1rem;
  background: #5F6E8A;
  border-radius: 999px;
}

/* 滚动条 */
.sidebar-left::-webkit-scrollbar,
.sidebar-right::-webkit-scrollbar,
.mobile-menu-drawer::-webkit-scrollbar {
  width: 4px;
}

.sidebar-left::-webkit-scrollbar-track,
.sidebar-right::-webkit-scrollbar-track,
.mobile-menu-drawer::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-left::-webkit-scrollbar-thumb,
.sidebar-right::-webkit-scrollbar-thumb,
.mobile-menu-drawer::-webkit-scrollbar-thumb {
  background: #DDD7CC;
  border-radius: 10px;
}

/* 移动端菜单抽屉 */
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
  width: min(82vw, 20rem);
  height: 100dvh;
  background: #FDFCFB;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
  box-shadow: 12px 0 32px rgba(0, 0, 0, 0.12);
}

html.dark .mobile-menu-drawer {
  background: #1b2739;
  box-shadow: 12px 0 32px rgba(0, 0, 0, 0.35);
}

.mobile-menu-overlay.active .mobile-menu-drawer {
  transform: translateX(0);
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(214, 209, 201, 0.5);
}

html.dark .mobile-menu-header {
  border-bottom-color: rgba(214, 209, 201, 0.3);
}

.mobile-menu-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: none;
  color: #7A766F;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.mobile-menu-close:hover {
  background: rgba(95, 110, 138, 0.1);
}

html.dark .mobile-menu-close {
  color: #a6afbf;
}

html.dark .mobile-menu-close:hover {
  background: rgba(95, 110, 138, 0.2);
}

/* 移动端悬浮目录按钮 */
.mobile-menu-fab {
  display: none;
  position: fixed;
  right: 2rem;
  bottom: 5rem;
  min-width: 4.5rem;
  height: 3rem;
  padding: 0 1.25rem;
  border: none;
  border-radius: 999px;
  background: #5F6E8A;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  z-index: 2100;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.mobile-menu-fab:hover {
  transform: translateY(-2px);
  background: #475671;
}

.mobile-menu-fab:active {
  transform: scale(0.96);
}

.mobile-menu-fab span {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
}

html.dark .mobile-menu-fab {
  background: #a6b9d4;
  color: #1b2739;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

html.dark .mobile-menu-fab:hover {
  background: #8fa4be;
}

@media (max-width: 767px) {
  .mobile-menu-fab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

/* Markdown 内容样式 */
.markdown-content {
  font-family: 'Work Sans', sans-serif;
}

.markdown-content :deep(h1) {
  font-family: 'Noto Serif SC', serif;
  font-size: 2rem;
  font-weight: 700;
  color: #475671;
  margin-bottom: 1.5rem;
}

html.dark .markdown-content :deep(h1) {
  color: #a6b9d4;
}

.markdown-content :deep(h2) {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #475671;
  margin-bottom: 1rem;
  margin-top: 2rem;
}

html.dark .markdown-content :deep(h2) {
  color: #a6b9d4;
}

.markdown-content :deep(h3) {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #475671;
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
}

html.dark .markdown-content :deep(h3) {
  color: #a6b9d4;
}

.markdown-content :deep(p) {
  line-height: 1.7;
  margin-bottom: 1rem;
  color: #44474D;
}

html.dark .markdown-content :deep(p) {
  color: #c4cde0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  line-height: 1.6;
  margin-bottom: 0.5rem;
  color: #44474D;
}

html.dark .markdown-content :deep(li) {
  color: #c4cde0;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #475671;
}

.markdown-content :deep(blockquote) {
  background: #FFFFFF;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border-left: 4px solid #5F6E8A;
  margin: 1.5rem 0;
}

html.dark .markdown-content :deep(blockquote) {
  background: rgba(30, 45, 70, 0.5);
}

.markdown-content :deep(blockquote p) {
  margin: 0;
  font-style: italic;
}

/* 空内容样式 */
.empty-content {
  padding: 2rem;
  text-align: center;
  color: #605E5A;
}

html.dark .empty-content {
  color: #a6afbf;
}
</style>