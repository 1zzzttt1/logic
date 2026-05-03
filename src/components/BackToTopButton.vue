<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useScrollProgress } from '@/composables/useScrollProgress'

interface Props {
  showAt?: number
  idleDelay?: number
  right?: string
  bottom?: string
  mobileRight?: string
  mobileBottom?: string
  desktopWideRight?: string
  desktopWideBottom?: string
  size?: number
  mobileSize?: number
  desktopWideSize?: number
  zIndex?: number
  useTeleport?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAt: 120,
  idleDelay: 420,
  right: '2rem',
  bottom: '4.5rem',
  mobileRight: '2rem',
  mobileBottom: '5rem',
  desktopWideRight: '16rem',
  desktopWideBottom: '5rem',
  size: 64,
  mobileSize: 58,
  desktopWideSize: 58,
  zIndex: 2300,
  useTeleport: true,
})

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
} = useScrollProgress({ showAt: props.showAt, idleDelay: props.idleDelay })

const cssVars = computed(() => ({
  '--back-top-right': props.right,
  '--back-top-bottom': props.bottom,
  '--back-top-mobile-right': props.mobileRight,
  '--back-top-mobile-bottom': props.mobileBottom,
  '--back-top-desktop-wide-right': props.desktopWideRight,
  '--back-top-desktop-wide-bottom': props.desktopWideBottom,
  '--back-top-size': `${props.size}px`,
  '--back-top-mobile-size': `${props.mobileSize}px`,
  '--back-top-desktop-wide-size': `${props.desktopWideSize}px`,
  '--back-top-z-index': String(props.zIndex),
}))

onMounted(() => {
  window.addEventListener('resize', updateScrollProgress)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollProgress)
})
</script>

<template>
  <Teleport v-if="useTeleport" to="body">
    <button
      v-show="showBackToTop"
      class="back-to-top-btn back-to-top-ring"
      :style="cssVars"
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

  <button
    v-else
    v-show="showBackToTop"
    class="back-to-top-btn back-to-top-ring"
    :style="cssVars"
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
</template>

<style scoped>
.back-to-top-btn {
  position: fixed;
  right: var(--back-top-right);
  bottom: var(--back-top-bottom);
  width: var(--back-top-size);
  height: var(--back-top-size);
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: var(--back-top-z-index);
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

:global(html.dark) .back-to-top-ring__track {
  stroke: rgba(255, 255, 255, 0.16);
}

:global(html.dark) .back-to-top-ring__progress {
  stroke: rgba(255, 255, 255, 0.82);
}

:global(html.dark) .back-to-top-ring__label,
:global(html.dark) .back-to-top-ring__icon {
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 947px) {
  .back-to-top-btn {
    right: var(--back-top-mobile-right);
    bottom: var(--back-top-mobile-bottom);
    width: var(--back-top-mobile-size);
    height: var(--back-top-mobile-size);
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
    right: var(--back-top-desktop-wide-right);
    bottom: var(--back-top-desktop-wide-bottom);
    width: var(--back-top-desktop-wide-size);
    height: var(--back-top-desktop-wide-size);
  }
}
</style>