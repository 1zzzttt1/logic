<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useHomeReveal } from '@/composables/useHomeReveal'
import PreloaderReveal from './components/PreloaderReveal.vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'

const route = useRoute()
const isKnowledgePage = computed(() => route.path === '/knowledge')

const showPreloader = ref(true)
const { playHomeReveal } = useHomeReveal()

onMounted(async () => {
  await nextTick()

  await playHomeReveal(() => {
    showPreloader.value = false
  })
})
</script>

<template>
  <PreloaderReveal :visible="showPreloader" />

  <div class="site-shell" :class="{ 'knowledge-bg': isKnowledgePage }">
    <div class="ambient-overlay"></div>
    <AppHeader :isKnowledgePage="isKnowledgePage" />
    <div class="page-content">
      <router-view />
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&family=Manrope:wght@300;400;600;800&family=Work+Sans:wght@300;400;500;600&family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root) {
  z-index: 0;
}

::view-transition-new(root) {
  z-index: 1;
}

:root {
  color-scheme: light;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --base-100: #181717;
  --base-200: #292725;
  --base-300: #f5f5f5;
}

html.dark {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(107, 123, 152, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 123, 152, 0.5);
}

html.dark ::-webkit-scrollbar-thumb {
  background: rgba(166, 185, 220, 0.2);
}

html.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(166, 185, 220, 0.4);
}

html,
body {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

body {
  font-family: 'Manrope', 'Noto Sans SC', sans-serif;
  color: #1f1f1c;
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
  transition: background 0.45s ease, color 0.35s ease;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.knowledge-bg body {
  background: #F7F5F1 !important;
}

html.dark body .site-shell {
  color: #f4f6fa;
  background:
    linear-gradient(
      90deg,
      transparent 0%,
      transparent 18%,
      rgba(255, 255, 255, 0.018) 18%,
      rgba(255, 255, 255, 0.018) 22%,
      transparent 22%,
      transparent 40%,
      rgba(255, 255, 255, 0.018) 40%,
      rgba(255, 255, 255, 0.018) 44%,
      transparent 44%,
      transparent 62%,
      rgba(255, 255, 255, 0.018) 62%,
      rgba(255, 255, 255, 0.018) 66%,
      transparent 66%,
      transparent 100%
    ),
    radial-gradient(
      circle at 50% 30%,
      rgba(30, 70, 150, 0.18) 0%,
      rgba(15, 43, 96, 0.14) 16%,
      rgba(6, 13, 24, 0) 44%
    ),
    radial-gradient(
      ellipse at center,
      rgba(9, 30, 68, 0.38) 0%,
      rgba(7, 17, 32, 0.22) 34%,
      rgba(6, 13, 24, 0) 62%
    ),
    linear-gradient(
      180deg,
      #1b2739 0%,
      #0f1b2d 18%,
      #091321 42%,
      #060d18 72%,
      #040912 100%
    );
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
}

.knowledge-bg html.dark body {
  background: #F7F5F1 !important;
}

.site-shell {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  background:
    radial-gradient(
      circle at 50% 38%,
      rgba(232, 240, 239, 0.92) 0%,
      rgba(232, 240, 239, 0.72) 22%,
      rgba(247, 245, 241, 0) 52%
    ),
    linear-gradient(
      180deg,
      #f7f5f1 0%,
      #eef3f2 48%,
      #e8f0ef 100%
    );
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ambient-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.ambient-overlay::before,
.ambient-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
}

.ambient-overlay::before {
  background:
    radial-gradient(
      circle at 50% 32%,
      rgba(116, 145, 196, 0.14) 0%,
      rgba(116, 145, 196, 0.08) 16%,
      transparent 42%
    );
  opacity: 0;
  transition: opacity 0.35s ease;
}

.ambient-overlay::after {
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.015) 0%,
      rgba(255, 255, 255, 0) 20%,
      rgba(0, 0, 0, 0.18) 100%
    );
  opacity: 0;
  transition: opacity 0.35s ease;
}

html.dark .ambient-overlay::before,
html.dark .ambient-overlay::after {
  opacity: 1;
}

.knowledge-bg .ambient-overlay {
  display: none;
}

::selection {
  background: rgba(107, 123, 152, 0.2);
}

/* Mobile styles */
@media (max-width: 767px) {
  html,
  body {
    height: 100%;
    overflow: hidden;
  }

  body {
    background-attachment: scroll;
  }

  .site-shell {
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .page-content {
    flex: 1;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  html.light body {
    color: #1f1f1c;
    background:
      radial-gradient(
        circle at 50% 24%,
        rgba(232, 240, 239, 0.92) 0%,
        rgba(232, 240, 239, 0.72) 22%,
        rgba(247, 245, 241, 0) 52%
      ),
      linear-gradient(
        180deg,
        #f7f5f1 0%,
        #eef3f2 48%,
        #e8f0ef 100%
      );
    background-repeat: no-repeat;
    background-size: cover;
  }

  .knowledge-bg html.light body {
    background: #F7F5F1 !important;
  }

  html.dark body {
    color: #f4f6fa;
    background:
      linear-gradient(
        90deg,
        transparent 0%,
        transparent 18%,
        rgba(255, 255, 255, 0.018) 18%,
        rgba(255, 255, 255, 0.018) 22%,
        transparent 22%,
        transparent 40%,
        rgba(255, 255, 255, 0.018) 40%,
        rgba(255, 255, 255, 0.018) 44%,
        transparent 44%,
        transparent 62%,
        rgba(255, 255, 255, 0.018) 62%,
        rgba(255, 255, 255, 0.018) 66%,
        transparent 66%,
        transparent 100%
      ),
      radial-gradient(
        circle at 50% 22%,
        rgba(30, 70, 150, 0.18) 0%,
        rgba(15, 43, 96, 0.14) 16%,
        rgba(6, 13, 24, 0) 44%
      ),
      radial-gradient(
        ellipse at center,
        rgba(9, 30, 68, 0.38) 0%,
        rgba(7, 17, 32, 0.22) 34%,
        rgba(6, 13, 24, 0) 62%
      ),
      linear-gradient(
        180deg,
        #1b2739 0%,
        #0f1b2d 18%,
        #091321 42%,
        #060d18 72%,
        #040912 100%
      );
    background-repeat: no-repeat;
    background-size: cover;
  }

  .knowledge-bg html.dark body {
    background: #F7F5F1 !important;
  }
}
</style>