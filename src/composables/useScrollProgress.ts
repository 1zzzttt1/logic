import { ref, computed, onMounted, onUnmounted } from 'vue'
import { SCROLL_SHOW_AT, SCROLL_IDLE_DELAY, BACK_TO_TOP_RADIUS } from '@/constants'
import { scrollToTop as scrollToTopUtil } from '@/utils/scroll'

export interface UseScrollProgressOptions {
  showAt?: number
  idleDelay?: number
}

export function useScrollProgress(options?: UseScrollProgressOptions) {
  const showAt = options?.showAt ?? SCROLL_SHOW_AT
  const idleDelay = options?.idleDelay ?? SCROLL_IDLE_DELAY

  const scrollProgress = ref(0)
  const showBackToTop = ref(false)
  const showBackToTopArrow = ref(false)

  let scrollIdleTimer: number | null = null
  let scrollRafId: number | null = null

  const progressRadius = BACK_TO_TOP_RADIUS
  const progressCircumference = 2 * Math.PI * progressRadius

  const progressDashOffset = computed(() => {
    return progressCircumference * (1 - scrollProgress.value / 100)
  })

  function updateScrollProgress() {
    const scrollTop = window.scrollY || window.pageYOffset || 0
    const doc = document.documentElement
    const scrollHeight = doc.scrollHeight
    const clientHeight = window.innerHeight
    const maxScroll = Math.max(scrollHeight - clientHeight, 0)

    const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0
    scrollProgress.value = Math.round(progress * 100)

    showBackToTop.value = scrollTop > showAt

    if (!showBackToTop.value) {
      showBackToTopArrow.value = false
    }
  }

  function handleScrollProgress() {
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
      }, idleDelay)
    })
  }

  function scrollToTop() {
    scrollToTopUtil()
  }

  function clearScrollUiTimers() {
    if (scrollIdleTimer !== null) {
      window.clearTimeout(scrollIdleTimer)
      scrollIdleTimer = null
    }

    if (scrollRafId !== null) {
      cancelAnimationFrame(scrollRafId)
      scrollRafId = null
    }
  }

  onMounted(() => {
    updateScrollProgress()
    window.addEventListener('scroll', handleScrollProgress, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScrollProgress)
    clearScrollUiTimers()
  })

  return {
    scrollProgress,
    showBackToTop,
    showBackToTopArrow,
    progressRadius,
    progressCircumference,
    progressDashOffset,
    updateScrollProgress,
    scrollToTop,
    clearScrollUiTimers,
  }
}
