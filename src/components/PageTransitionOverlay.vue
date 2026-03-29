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
      <path
        ref="pathRef"
        class="page-transition-overlay__path"
        vector-effect="non-scaling-stroke"
        d="M 0 0 h 0 c 0 50 0 50 0 100 H 0 V 0 Z"
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
   fill: var(--page-transition-fill);
  transition: fill 0.25s ease;
}

html.dark .page-transition-overlay__path {
  fill: #060d18;
}
</style>