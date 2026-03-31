<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { knowledgeData, getArticlesByCategory, type KnowledgeArticle } from '@/data/knowledge'
import ImagePreview from '@/components/ImagePreview.vue'

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

const scrollProgress = ref(0)
const showBackToTop = ref(false)
const showBackToTopArrow = ref(false)

const showImagePreview = ref(false)
const previewImageSrc = ref('')

let scrollIdleTimer: number | null = null
let scrollRafId: number | null = null

const progressRadius = 24
const progressCircumference = 2 * Math.PI * progressRadius

const progressDashOffset = computed(() => {
  return progressCircumference * (1 - scrollProgress.value / 100)
})

const updateResponsiveState = () => {
  if (typeof window === 'undefined') return
  isDesktopSidebarVisible.value = window.innerWidth >= DESKTOP_BREAKPOINT
  isDesktopTocVisible.value = window.innerWidth >= TOC_BREAKPOINT
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const lockBodyScroll = () => {
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
}

const unlockBodyScroll = () => {
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
}

const openMobileSidebar = () => {
  showMobileToc.value = false
  showMobileSidebar.value = true
  lockBodyScroll()
}

const closeMobileSidebar = () => {
  showMobileSidebar.value = false
  if (!showMobileToc.value) {
    unlockBodyScroll()
  }
}

const openMobileToc = () => {
  showMobileSidebar.value = false
  showMobileToc.value = true
  lockBodyScroll()
}

const closeMobileToc = () => {
  showMobileToc.value = false
  if (!showMobileSidebar.value) {
    unlockBodyScroll()
  }
}

const closeAllMobilePanels = () => {
  showMobileSidebar.value = false
  showMobileToc.value = false
  unlockBodyScroll()
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
  closeAllMobilePanels()
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

type TocItem = {
  name: string
  id: string
  level: number
  active: boolean
  children: TocItem[]
}

function generateToc(content: string): TocItem[] {
  const toc: TocItem[] = []
  // 匹配 # ## ### 并捕获层级
  const headingRegex = /^(#{1,3})\s+(.+)$/gm
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1]!.length // 1, 2, or 3
    const text = match[2]!.trim()
    const id = slugifyHeading(text)
    if (!id) continue

    toc.push({
      name: text,
      id,
      level,
      active: false,
      children: [],
    })
  }

  return toc
}

// 将扁平 TOC 构建为嵌套结构
function buildNestedToc(flatToc: TocItem[]): TocItem[] {
  const result: TocItem[] = []
  const stack: TocItem[] = []

  for (const item of flatToc) {
    // 创建新 item
    const newItem: TocItem = { ...item, children: [] }

    // 找到正确的父级
    while (stack.length > 0 && stack[stack.length - 1]!.level >= item.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      // 一级标题，直接添加到结果
      result.push(newItem)
    } else {
      // 添加到父级的 children
      stack[stack.length - 1]!.children.push(newItem)
    }

    stack.push(newItem)
  }

  return result
}

const tocItems = ref<TocItem[]>([])

const scrollToAnchor = (id: string) => {
  const element = document.getElementById(id)
  if (!element) return

  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - HEADER_HEIGHT - 16

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  })

  closeAllMobilePanels()
}

const updateScrollProgress = () => {
  const scrollTop = window.scrollY || window.pageYOffset || 0
  const doc = document.documentElement
  const scrollHeight = doc.scrollHeight
  const clientHeight = window.innerHeight
  const maxScroll = Math.max(scrollHeight - clientHeight, 0)

  const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0
  scrollProgress.value = Math.round(progress * 100)

  showBackToTop.value = scrollTop > 120

  if (!showBackToTop.value) {
    showBackToTopArrow.value = false
  }
}

const handleScrollProgress = () => {
  if (scrollRafId !== null) {
    cancelAnimationFrame(scrollRafId)
  }

  scrollRafId = window.requestAnimationFrame(() => {
    updateScrollProgress()

    if (!showBackToTop.value) return

    showBackToTopArrow.value = false

    if (scrollIdleTimer !== null) {
      window.clearTimeout(scrollIdleTimer)
    }

    scrollIdleTimer = window.setTimeout(() => {
      showBackToTopArrow.value = true
    }, 420)
  })
}

const scrollToTop = () => {
  const lenis = (window as any).__lenis

  if (lenis) {
    lenis.scrollTo(0, {
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    })
    return
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const clearScrollUiTimers = () => {
  if (scrollIdleTimer !== null) {
    window.clearTimeout(scrollIdleTimer)
    scrollIdleTimer = null
  }

  if (scrollRafId !== null) {
    cancelAnimationFrame(scrollRafId)
    scrollRafId = null
  }
}

let observer: IntersectionObserver | null = null

// 扁平化嵌套 TOC 用于观察和渲染
function flattenToc(toc: TocItem[]): TocItem[] {
  const result: TocItem[] = []
  const stack = [...toc]
  while (stack.length > 0) {
    const item = stack.pop()!
    result.push(item)
    if (item.children.length > 0) {
      stack.push(...item.children)
    }
  }
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

  // 扁平化用于观察
  const flatItems = flattenToc(tocItems.value)
  const ids = flatItems.map((item) => item.id)
  if (!ids.length) return

  observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      // 找到当前可见的第一个标题
      const activeId = visibleEntries.length > 0 ? visibleEntries[0]!.target.id : null

      if (!activeId) return

      // 只标记当前标题为 active，不传播给父级
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

const renderMarkdown = (content: string): string => {
  if (!content) return ''

  const BASE_PATH = '/logic/'

  let html = content

  html = html.replace(/^###\s+(.*$)/gim, (_match, p1) => {
    const id = slugifyHeading(p1)
    return `<h3 class="section-title" id="${id}">${p1}</h3>`
  })

  html = html.replace(/^##\s+(.*$)/gim, (_match, p1) => {
    const id = slugifyHeading(p1)
    return `<h2 class="section-title" id="${id}">${p1}</h2>`
  })

  html = html.replace(/^#\s+(.*$)/gim, (_match, p1) => {
    const id = slugifyHeading(p1)
    return `<h1 class="section-title" id="${id}">${p1}</h1>`
  })

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    let normalizedSrc: string
    if (src.startsWith('http') || src.startsWith('/logic/')) {
      normalizedSrc = src
    } else if (src.startsWith('/')) {
      normalizedSrc = BASE_PATH + src.slice(1)
    } else {
      normalizedSrc = BASE_PATH + src.replace(/^\.\//, '')
    }
    return `<img src="${normalizedSrc}" alt="${alt}" class="markdown-image" data-preview-src="${normalizedSrc}" />`
  })

  // 链接处理
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    const isExternal = url.startsWith('http')
    const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
    const icon = isExternal ? '<span class="external-link-icon">↗</span>' : ''
    return `<a href="${url}"${target}>${text}${icon}</a>`
  })

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // 先提取标题和引用块，避免被后续列表处理干扰
  html = html.replace(/<h([1-3]) class="section-title" id="([^"]*)">([\s\S]*?)<\/h\1>/g, '___HEADING___$1|$2|$3___END___')
  html = html.replace(/<blockquote([\s\S]*?)>([\s\S]*?)<\/blockquote>/g, '___BLOCKQUOTE___$1$2___END_BLOCKQUOTE___')

  // 列表处理 - 使用更严格的匹配，排除空行后以 - 或 * 开头的行
  html = html.replace(/(?<=\n)- (.*$)/gim, '<li>$1</li>')
  html = html.replace(/(?<=\n)\* (?![#])(.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')

  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
  html = html.replace(/^> (.*$)/gim, '<blockquote class="expert-tip"><p>$1</p></blockquote>')

  html = html.replace(/\n\n/g, '</p><p class="section-text">')
  html = html.replace(/\n/g, '<br>')
  html = '<p class="section-text">' + html + '</p>'
  html = html.replace(/<p class="section-text"><\/p>/g, '')

  // 还原标题元素
  html = html.replace(/___HEADING___(\d+)\|([^|]*)\|([\s\S]*?)___END___/g, '<h$1 class="section-title" id="$2">$3</h$1>')
  html = html.replace(/___BLOCKQUOTE___(.*?)___END_BLOCKQUOTE___/g, '<blockquote$1>$2</blockquote>')

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
  updateScrollProgress()

  if (window.innerWidth >= DESKTOP_BREAKPOINT) {
    closeAllMobilePanels()
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
  updateScrollProgress()

  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScrollProgress, { passive: true })

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
  window.removeEventListener('scroll', handleScrollProgress)
  observer?.disconnect()
  unlockBodyScroll()
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
          <template v-for="item in tocItems" :key="item.id">
            <a
              :href="'#' + item.id"
              class="toc-item"
              :class="{ active: item.active, 'toc-item--h1': item.level === 1, 'toc-item--h2': item.level === 2, 'toc-item--h3': item.level === 3 }"
              @click.prevent="scrollToAnchor(item.id)"
            >
              {{ item.name }}
            </a>
            <template v-for="child in item.children" :key="child.id">
              <a
                :href="'#' + child.id"
                class="toc-item toc-item--child"
                :class="{ active: child.active, 'toc-item--h2': child.level === 2, 'toc-item--h3': child.level === 3 }"
                @click.prevent="scrollToAnchor(child.id)"
              >
                {{ child.name }}
              </a>
              <template v-for="grandchild in child.children" :key="grandchild.id">
                <a
                  :href="'#' + grandchild.id"
                  class="toc-item toc-item--child toc-item--grandchild"
                  :class="{ active: grandchild.active, 'toc-item--h3': grandchild.level === 3 }"
                  @click.prevent="scrollToAnchor(grandchild.id)"
                >
                  {{ grandchild.name }}
                </a>
              </template>
            </template>
          </template>
        </nav>
      </aside>
    </Teleport>

    <Teleport to="body">
      <div
        class="mobile-panel-overlay"
        :class="{ active: showMobileSidebar }"
        @click="closeMobileSidebar"
      >
        <div class="mobile-panel-drawer mobile-panel-drawer--left" @click.stop>
          <div class="mobile-panel-header">
            <h3 class="mobile-panel-title">教程目录</h3>
            <button class="mobile-panel-close" type="button" @click="closeMobileSidebar">
              <span class="material-symbols-outlined">close</span>
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
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        class="mobile-panel-overlay"
        :class="{ active: showMobileToc }"
        @click="closeMobileToc"
      >
        <div class="mobile-panel-drawer mobile-panel-drawer--right" @click.stop>
          <div class="mobile-panel-header">
            <h3 class="mobile-panel-title">页面导航</h3>
            <button class="mobile-panel-close" type="button" @click="closeMobileToc">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav class="toc-nav mobile-toc-nav">
            <template v-for="item in tocItems" :key="item.id">
              <a
                :href="'#' + item.id"
                class="toc-item"
                :class="{ active: item.active, 'toc-item--h1': item.level === 1, 'toc-item--h2': item.level === 2, 'toc-item--h3': item.level === 3 }"
                @click.prevent="scrollToAnchor(item.id)"
              >
                {{ item.name }}
              </a>
              <template v-for="child in item.children" :key="child.id">
                <a
                  :href="'#' + child.id"
                  class="toc-item toc-item--child"
                  :class="{ active: child.active, 'toc-item--h2': child.level === 2, 'toc-item--h3': child.level === 3 }"
                  @click.prevent="scrollToAnchor(child.id)"
                >
                  {{ child.name }}
                </a>
                <template v-for="grandchild in child.children" :key="grandchild.id">
                  <a
                    :href="'#' + grandchild.id"
                    class="toc-item toc-item--child toc-item--grandchild"
                    :class="{ active: grandchild.active, 'toc-item--h3': grandchild.level === 3 }"
                    @click.prevent="scrollToAnchor(grandchild.id)"
                  >
                    {{ grandchild.name }}
                  </a>
                </template>
              </template>
            </template>
          </nav>
        </div>
      </div>
    </Teleport>

    <main class="main-content">
      <Teleport to=".page-content">
        <div v-if="!isDesktopSidebarVisible" class="mobile-top-nav">
          <button
            class="mobile-top-nav__btn mobile-top-nav__btn--left"
            type="button"
            @click="openMobileSidebar"
          >
            <span class="material-symbols-outlined">menu</span>
            <span>教程目录</span>
          </button>

          <button
            class="mobile-top-nav__btn mobile-top-nav__btn--right"
            type="button"
            @click="openMobileToc"
            :disabled="tocItems.length === 0"
          >
            <span>页面导航</span>
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </Teleport>

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
          class="material-symbols-outlined back-to-top-ring__icon"
        >
          arrow_upward
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

html.dark .desktop-sidebar-right {
  border-color: rgba(166, 185, 212, 0.14);
}

.toc-head {
  margin-bottom: 14px;
  padding-left: 2px;
}

.toc-title {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  font-weight: 700;
  color: #4a5a76;
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

/* 一级标题 */
.toc-item--h1 {
  font-weight: 700;
  font-size: 14px;
}

/* 二级标题 - 缩进 */
.toc-item--h2,
.toc-item--child {
  padding-left: 24px;
  font-weight: 500;
  font-size: 13px;
}

/* 三级标题 - 进一步缩进 */
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

.mobile-top-nav {
  display: none;
}

.mobile-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 24, 0.26);
  z-index: 2200;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.26s ease, visibility 0.26s ease;
}

.mobile-panel-overlay.active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.mobile-panel-drawer {
  position: absolute;
  top: 0;
  width: min(86vw, 23rem);
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  padding: calc(88px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px));
  background: rgba(253, 252, 251, 0.98);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.12);
  transition: transform 0.28s ease;
}

html.dark .mobile-panel-drawer {
  background: rgba(27, 39, 57, 0.98);
}

.mobile-panel-drawer--left {
  left: 0;
  transform: translateX(-100%);
}

.mobile-panel-overlay.active .mobile-panel-drawer--left {
  transform: translateX(0);
}

.mobile-panel-drawer--right {
  right: 0;
  transform: translateX(100%);
}

.mobile-panel-overlay.active .mobile-panel-drawer--right {
  transform: translateX(0);
}

.mobile-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(214, 209, 201, 0.5);
}

html.dark .mobile-panel-header {
  border-bottom-color: rgba(166, 185, 212, 0.14);
}

.mobile-panel-title {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 700;
  color: #475671;
}

html.dark .mobile-panel-title {
  color: #d7e2f1;
}

.mobile-panel-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #7a766f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

html.dark .mobile-panel-close {
  color: #a6afbf;
}

.mobile-toc-nav {
  gap: 10px;
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
  font-size: 20px;
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

  .back-to-top-ring__icon {
    font-size: 18px;
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


.empty-content {
  padding: 32px;
  text-align: center;
}
</style>