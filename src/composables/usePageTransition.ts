import { ref } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'

type NavigateOptions = {
  replace?: boolean
  onRouteChange?: () => void
  onAnimationStart?: () => void
  onAnimationComplete?: () => void
}

const PATHS = {
  step1: {
    unfilled: 'M 0 0 h 0 c 0 50 0 50 0 100 H 0 V 0 Z',
    inBetween: 'M 0 0 h 43 c -60 55 140 65 0 100 H 0 V 0 Z',
    filled: 'M 0 0 h 100 c 0 50 0 50 0 100 H 0 V 0 Z',
  },
  step2: {
    filled: 'M 100 0 H 0 c 0 50 0 50 0 100 h 100 V 50 Z',
    inBetween: 'M 100 0 H 50 c 28 43 4 81 0 100 h 50 V 0 Z',
    unfilled: 'M 100 0 H 100 c 0 50 0 50 0 100 h 0 V 0 Z',
  },
}

const isVisible = ref(false)
const isTransitioning = ref(false)
const pathEl = ref<SVGPathElement | null>(null)

export function usePageTransition() {
  const router = useRouter()

  function registerPath(el: SVGPathElement | null) {
    pathEl.value = el
  }

  async function navigateWithTransition(
    to: string,
    options: NavigateOptions = {},
  ) {
    if (typeof window === 'undefined') return false
    if (isTransitioning.value) return false
    if (window.location.pathname === to) return false

    const {
      replace = false,
      onRouteChange,
      onAnimationStart,
      onAnimationComplete,
    } = options

    const path = pathEl.value
    if (!path) {
      console.warn('[usePageTransition] overlay path not registered')
      return false
    }

    isTransitioning.value = true
    isVisible.value = true
    onAnimationStart?.()

    return new Promise<boolean>((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          isVisible.value = false
          isTransitioning.value = false
          onAnimationComplete?.()
          resolve(true)
        },
      })

      tl.set(path, {
        attr: { d: PATHS.step1.unfilled },
      })
        .to(
          path,
          {
            duration: 0.6,
            ease: 'power4.in',
            attr: { d: PATHS.step1.inBetween },
          },
          0,
        )
        .to(path, {
          duration: 0.2,
          ease: 'power1',
          attr: { d: PATHS.step1.filled },
          onComplete: async () => {
            if (replace) {
              await router.replace(to)
            } else {
              await router.push(to)
            }

            onRouteChange?.()
          },
        })
        .to({}, { duration: 0.75 })
        .set(path, {
          attr: { d: PATHS.step2.filled },
        })
        .to(path, {
          duration: 0.15,
          ease: 'sine.in',
          attr: { d: PATHS.step2.inBetween },
        })
        .to(path, {
          duration: 1,
          ease: 'power4.out',
          attr: { d: PATHS.step2.unfilled },
        })
    })
  }

  return {
    isVisible,
    isTransitioning,
    registerPath,
    navigateWithTransition,
  }
}