<script setup lang="ts">
import type { TocItem } from '@/types'
import { stopWheelPropagationWhenScrollable } from '@/utils/scroll'

defineProps<{
  items: TocItem[]
  mode: 'desktop' | 'mobile'
}>()

const emit = defineEmits<{
  navigate: [anchorId: string]
}>()
</script>

<template>
  <!-- Desktop mode: full aside with toc-head -->
  <aside
    v-if="mode === 'desktop'"
    class="desktop-sidebar-right"
    data-lenis-prevent
    @wheel="stopWheelPropagationWhenScrollable"
  >
    <div class="toc-head">
      <h4 class="toc-title">页面导航</h4>
    </div>

    <nav
      class="toc-nav"
      data-lenis-prevent
      @wheel="stopWheelPropagationWhenScrollable"
    >
      <template v-for="item in items" :key="item.id">
        <a
          :href="'#' + item.id"
          class="toc-item"
          :class="{
            active: item.active,
            'toc-item--h1': item.level === 1,
            'toc-item--h2': item.level === 2,
            'toc-item--h3': item.level === 3,
          }"
          @click.prevent="emit('navigate', item.id)"
        >
          {{ item.name }}
        </a>

        <template v-for="child in item.children" :key="child.id">
          <a
            :href="'#' + child.id"
            class="toc-item toc-item--child"
            :class="{
              active: child.active,
              'toc-item--h2': child.level === 2,
              'toc-item--h3': child.level === 3,
            }"
            @click.prevent="emit('navigate', child.id)"
          >
            {{ child.name }}
          </a>

          <template v-for="grandchild in child.children" :key="grandchild.id">
            <a
              :href="'#' + grandchild.id"
              class="toc-item toc-item--child toc-item--grandchild"
              :class="{
                active: grandchild.active,
                'toc-item--h3': grandchild.level === 3,
              }"
              @click.prevent="emit('navigate', grandchild.id)"
            >
              {{ grandchild.name }}
            </a>
          </template>
        </template>
      </template>
    </nav>
  </aside>

  <!-- Mobile mode: just the nav (parent KnowledgeMobilePanels provides header) -->
  <nav v-else class="toc-nav">
    <template v-for="item in items" :key="item.id">
      <a
        :href="'#' + item.id"
        class="toc-item"
        :class="{
          active: item.active,
          'toc-item--h1': item.level === 1,
          'toc-item--h2': item.level === 2,
          'toc-item--h3': item.level === 3,
        }"
        @click.prevent="emit('navigate', item.id)"
      >
        {{ item.name }}
      </a>

      <template v-for="child in item.children" :key="child.id">
        <a
          :href="'#' + child.id"
          class="toc-item toc-item--child"
          :class="{
            active: child.active,
            'toc-item--h2': child.level === 2,
            'toc-item--h3': child.level === 3,
          }"
          @click.prevent="emit('navigate', child.id)"
        >
          {{ child.name }}
        </a>

        <template v-for="grandchild in child.children" :key="grandchild.id">
          <a
            :href="'#' + grandchild.id"
            class="toc-item toc-item--child toc-item--grandchild"
            :class="{
              active: grandchild.active,
              'toc-item--h3': grandchild.level === 3,
            }"
            @click.prevent="emit('navigate', grandchild.id)"
          >
            {{ grandchild.name }}
          </a>
        </template>
      </template>
    </template>
  </nav>
</template>

<style scoped>
/* ---- desktop aside ---- */

.desktop-sidebar-right {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  position: fixed;
  right: 0;
  top: 5rem;
  bottom: 0;
  width: var(--right-width, 232px);
  max-width: 14rem;
  border-left: 1px solid rgba(186, 184, 184, 0.42);
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  z-index: 10;
  overflow-y: auto;
  overflow-x: hidden;
}

.desktop-sidebar-right::-webkit-scrollbar {
  width: 4px;
}

.desktop-sidebar-right::-webkit-scrollbar-track {
  background: transparent;
}

.desktop-sidebar-right::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

html.dark .desktop-sidebar-right {
  border-color: rgba(166, 185, 212, 0.14);
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

html.dark .desktop-sidebar-right::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}

/* ---- toc head ---- */

.toc-head {
  flex-shrink: 0;
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

/* ---- toc nav ---- */

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ---- toc items ---- */

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

html.dark .toc-item--h2,
html.dark .toc-item--child {
  color: #a9b6c8;
}

html.dark .toc-item--h3,
html.dark .toc-item--grandchild {
  color: #8a96a8;
}
</style>
