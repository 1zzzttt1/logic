<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const lockScroll = () => {
  document.documentElement.classList.add('preloader-lock')
  document.body.classList.add('preloader-lock')
}

const unlockScroll = () => {
  document.documentElement.classList.remove('preloader-lock')
  document.body.classList.remove('preloader-lock')
}

onMounted(() => {
  if (props.visible) lockScroll()
})

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      lockScroll()
    } else {
      unlockScroll()
    }
  },
)

onUnmounted(() => {
  unlockScroll()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="preloader-root" aria-hidden="true">
      <div class="preloader-progress">
        <div class="preloader-progress-bar"></div>

        <div class="preloader-logo">
          <h1>Logic</h1>
        </div>
      </div>

      <div class="preloader-mask"></div>

      <div class="preloader-content">
        <div class="preloader-footer">
          <p>清晰，从这里开始</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
:global(html.preloader-lock),
:global(body.preloader-lock) {
  overflow: hidden !important;
  height: 100%;
}

.preloader-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 999999;
}

.preloader-progress,
.preloader-mask,
.preloader-content {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.preloader-progress {
  background-color: var(--base-200);
  will-change: opacity;
}

.preloader-progress-bar {
  position: absolute;
  top: 0;
  left: 50%;
  width: 55%;
  height: 100%;
  background-color: var(--base-300);
  transform: translateX(-50%) scaleX(0);
  transform-origin: left center;
  will-change: transform;
}

.preloader-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  transform: translate(-50%, -50%);
  text-align: center;
  mix-blend-mode: difference;
  z-index: 2;
}

.preloader-logo h1 {
  position: relative;
  margin: 0;
  color: var(--base-300);
  font-size: 4.5rem;
  font-weight: 500;
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;
}

.preloader-mask {
  background-color: var(--base-100);
  -webkit-mask:
    linear-gradient(var(--base-300), var(--base-300)),
    url('@/assets/mask.svg') center / 50% no-repeat;
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(var(--base-300), var(--base-300)),
    url('@/assets/mask.svg') center / 50% no-repeat;
  mask-composite: exclude;
  will-change: transform, opacity;
  z-index: 1;
}

.preloader-content {
  z-index: 2;
}

.preloader-footer {
  position: absolute;
  left: 50%;
  bottom: 4rem;
  width: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.preloader-footer p {
  margin: 0;
  font-size: 1.5rem;
  color: var(--base-300);
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;
}

.line,
.char {
  position: relative;
  padding-bottom: 0.2em;
  margin-bottom: -0.2em;
  will-change: transform;
}

@media (max-width: 767px) {
  .preloader-logo h1 {
    font-size: 2rem;
  }

  .preloader-footer p {
    font-size: 1rem;
  }
}
</style>