<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { usePageTransition } from '@/composables/usePageTransition'

const pathRef = ref<SVGPathElement | null>(null)
const { isVisible, registerPath } = usePageTransition()

onMounted(() => {
  registerPath(pathRef.value)
})

onBeforeUnmount(() => {
  registerPath(null)
})

watch(pathRef, (el) => {
  registerPath(el)
})
</script>

<template>
  <div
    class="page-transition-overlay"
    :class="{ 'is-active': isVisible }"
    aria-hidden="true"
  >
    <svg
      class="page-transition-overlay__svg"
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="pageTransitionGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            class="page-transition-overlay__stop page-transition-overlay__stop--1"
          />
          <stop
            offset="30%"
            class="page-transition-overlay__stop page-transition-overlay__stop--2"
          />
          <stop
            offset="65%"
            class="page-transition-overlay__stop page-transition-overlay__stop--3"
          />
          <stop
            offset="100%"
            class="page-transition-overlay__stop page-transition-overlay__stop--4"
          />
        </linearGradient>
      </defs>

      <path
        ref="pathRef"
        class="page-transition-overlay__path"
        vector-effect="non-scaling-stroke"
        d="M 0 0 h 0 c 0 50 0 50 0 100 H 0 V 0 Z"
        fill="url(#pageTransitionGradient)"
      />
    </svg>
  </div>
</template>

<style scoped>
.page-transition-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
}

.page-transition-overlay.is-active {
  opacity: 1;
  visibility: visible;
}

.page-transition-overlay__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.page-transition-overlay__path {
  transition: opacity 0.25s ease;
}

.page-transition-overlay__stop {
  transition: stop-color 0.25s ease, stop-opacity 0.25s ease;
}

.page-transition-overlay__stop--1 {
  stop-color: var(--page-transition-stop-1);
  stop-opacity: 1;
}

.page-transition-overlay__stop--2 {
  stop-color: var(--page-transition-stop-2);
  stop-opacity: 1;
}

.page-transition-overlay__stop--3 {
  stop-color: var(--page-transition-stop-3);
  stop-opacity: 1;
}

.page-transition-overlay__stop--4 {
  stop-color: var(--page-transition-stop-4);
  stop-opacity: 1;
}
</style>