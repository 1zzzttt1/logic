<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  src: string
}>()

const emit = defineEmits<{
  close: []
}>()

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

const lockScroll = () => {
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeydown)
}

const unlockScroll = () => {
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
}

// 打开图片预览时锁定页面滚动，关闭时恢复滚动
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      lockScroll()
    } else {
      unlockScroll()
    }
  }
)

onUnmounted(() => {
  unlockScroll()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="image-preview-overlay"
        @click="handleBackdropClick"
      >
        <button
          class="preview-close-btn"
          type="button"
          aria-label="关闭预览"
          @click.stop="emit('close')"
        >
          <svg
            class="preview-close-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <div class="preview-image-container" @click.stop>
          <img :src="src" class="preview-image" alt="图片预览" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.image-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
  padding: 24px;
  box-sizing: border-box;
}

.preview-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.preview-close-btn:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.35);
  outline-offset: 3px;
}

.preview-close-icon {
  width: 28px;
  height: 28px;
  display: block;
  color: currentColor;
  flex-shrink: 0;
}

.preview-image-container {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>