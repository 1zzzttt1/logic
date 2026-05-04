<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = defineProps<{
  showSidebar: boolean
  showToc: boolean
}>()

const emit = defineEmits<{
  'close-sidebar': []
  'close-toc': []
}>()

const lockBodyScroll = () => {
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
}

const unlockBodyScroll = () => {
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
}

watch(
  () => props.showSidebar || props.showToc,
  (shouldLock) => {
    if (shouldLock) {
      lockBodyScroll()
    } else {
      unlockBodyScroll()
    }
  },
)

onUnmounted(() => {
  unlockBodyScroll()
})
</script>

<template>
  <Teleport to="body">
    <!-- Sidebar panel (left drawer) -->
    <div
      class="mobile-panel-overlay"
      :class="{ active: showSidebar }"
      @click="emit('close-sidebar')"
    >
      <div class="mobile-panel-drawer mobile-panel-drawer--left" @click.stop>
        <div class="mobile-panel-header">
          <h3 class="mobile-panel-title">教程目录</h3>
          <button
            class="mobile-panel-close"
            type="button"
            @click="emit('close-sidebar')"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <slot name="sidebar" />
      </div>
    </div>

    <!-- TOC panel (right drawer) -->
    <div
      class="mobile-panel-overlay"
      :class="{ active: showToc }"
      @click="emit('close-toc')"
    >
      <div class="mobile-panel-drawer mobile-panel-drawer--right" @click.stop>
        <div class="mobile-panel-header">
          <h3 class="mobile-panel-title">页面导航</h3>
          <button
            class="mobile-panel-close"
            type="button"
            @click="emit('close-toc')"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <slot name="toc" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ---- overlay ---- */

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

/* ---- drawer ---- */

.mobile-panel-drawer {
  position: absolute;
  top: 0;
  width: min(86vw, 23rem);
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  padding: calc(88px + env(safe-area-inset-top, 0px)) 16px
    calc(24px + env(safe-area-inset-bottom, 0px));
  background: rgba(253, 252, 251, 0.98);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.12);
  transition: transform 0.28s ease;
  scrollbar-width: thin;
  scrollbar-color: rgba(95, 110, 138, 0.45) transparent;
}

.mobile-panel-drawer::-webkit-scrollbar {
  width: 4px;
}

.mobile-panel-drawer::-webkit-scrollbar-track {
  background: transparent;
}

.mobile-panel-drawer::-webkit-scrollbar-thumb {
  background: rgba(95, 110, 138, 0.42);
  border-radius: 999px;
}

.mobile-panel-drawer::-webkit-scrollbar-thumb:hover {
  background: rgba(95, 110, 138, 0.6);
}

html.dark .mobile-panel-drawer {
  background: rgba(27, 39, 57, 0.98);
  scrollbar-color: rgba(166, 185, 212, 0.42) transparent;
}

html.dark .mobile-panel-drawer::-webkit-scrollbar-thumb {
  background: rgba(166, 185, 212, 0.38);
}

html.dark .mobile-panel-drawer::-webkit-scrollbar-thumb:hover {
  background: rgba(166, 185, 212, 0.56);
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

/* ---- panel header ---- */

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
</style>
