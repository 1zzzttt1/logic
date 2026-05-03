<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeCategory, KnowledgeArticle } from '@/types'
import { stopWheelPropagationWhenScrollable } from '@/utils/scroll'

const props = defineProps<{
  categories: KnowledgeCategory[]
  expandedCategoryIds: string[]
  selectedCategory: string
  selectedArticle: KnowledgeArticle | null
  mode: 'desktop' | 'mobile'
}>()

const emit = defineEmits<{
  navigate: [categoryId: string, articleId: string]
  'toggle-category': [index: number]
}>()

interface NavItem {
  id: string
  name: string
  path: string
  active: boolean
}

interface SidebarGroup {
  id: string
  title: string
  expanded: boolean
  items: NavItem[]
}

const sidebarGroups = computed<SidebarGroup[]>(() => {
  return props.categories.map((category) => ({
    id: category.id,
    title: category.name,
    expanded: props.expandedCategoryIds.includes(category.id),
    items: category.articles.map((article) => ({
      id: article.id,
      name: article.title,
      path: `#${category.id}/${article.id}`,
      active:
        props.selectedCategory === category.id &&
        props.selectedArticle?.id === article.id,
    })),
  }))
})
</script>

<template>
  <!-- Desktop mode: full aside with header -->
  <aside
    v-if="mode === 'desktop'"
    class="desktop-sidebar-left"
    data-lenis-prevent
    @wheel="stopWheelPropagationWhenScrollable"
  >
    <div class="sidebar-header">
      <p class="sidebar-series">知识库</p>
      <h3 class="sidebar-title">教程目录</h3>
    </div>

    <nav
      class="sidebar-nav"
      data-lenis-prevent
      @wheel="stopWheelPropagationWhenScrollable"
    >
      <div v-for="(group, index) in sidebarGroups" :key="group.id" class="nav-group">
        <button
          class="group-header"
          type="button"
          @click="emit('toggle-category', index)"
        >
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
            @click.prevent="emit('navigate', group.id, item.id)"
          >
            {{ item.name }}
          </a>
        </div>
      </div>
    </nav>
  </aside>

  <!-- Mobile mode: just the nav content -->
  <nav v-else class="sidebar-nav">
    <div v-for="(group, index) in sidebarGroups" :key="group.id" class="nav-group">
      <button
        class="group-header"
        type="button"
        @click="emit('toggle-category', index)"
      >
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
          @click.prevent="emit('navigate', group.id, item.id)"
        >
          {{ item.name }}
        </a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* ---- desktop aside ---- */

.desktop-sidebar-left {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  position: fixed;
  top: 5rem;
  left: 0;
  bottom: 0;
  width: var(--left-width, 244px);
  max-width: 15.5rem;
  border-right: 1px solid #d9dadb;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  z-index: 1200;
  overflow-y: auto;
  overflow-x: hidden;
}

.desktop-sidebar-left::-webkit-scrollbar {
  width: 4px;
}

.desktop-sidebar-left::-webkit-scrollbar-track {
  background: transparent;
}

.desktop-sidebar-left::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.desktop-sidebar-left.collapsed {
  width: var(--left-collapsed-width, 56px);
  max-width: var(--left-collapsed-width, 56px);
  padding: 12px 8px;
}

html.dark .desktop-sidebar-left {
  background: var(--surface-dark, rgba(27, 39, 57, 0.68));
  border-color: rgba(166, 185, 212, 0.14);
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

html.dark .desktop-sidebar-left::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}

/* ---- sidebar header ---- */

.sidebar-header {
  flex-shrink: 0;
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

/* ---- sidebar nav ---- */

.sidebar-nav {
  flex: 1;
  min-height: 0;
  height: auto;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

html.dark .sidebar-nav {
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

html.dark .sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}

/* ---- nav groups ---- */

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

/* ---- group items ---- */

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

/* ---- nav items ---- */

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
</style>
