<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useHeroTitleReveal } from '@/composables/useHomeAnimate'
import { useHomeRevealRuntime } from '@/composables/homeRevealRuntime'
import { usePageTransition } from '@/composables/usePageTransition'

const { playHeroTitleReveal, cleanup } = useHeroTitleReveal()
const { heroGateReady, preloaderPlayedInRuntime } = useHomeRevealRuntime()
const { navigateWithTransition, isTransitioning } = usePageTransition()

const goToKnowledge = () => {
  if (isTransitioning.value) return
  navigateWithTransition('/knowledge')
}

const isDesktop = () => window.innerWidth >= 768

const lockPageScroll = () => {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.documentElement.style.width = '100%'
  document.body.style.width = '100%'
  document.documentElement.style.height = '100%'
  document.body.style.height = '100%'
  document.body.style.margin = '0'
  document.body.style.overscrollBehavior = 'none'
}

const unlockPageScroll = () => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  document.documentElement.style.width = ''
  document.body.style.width = ''
  document.documentElement.style.height = ''
  document.body.style.height = ''
  document.body.style.margin = ''
  document.body.style.overscrollBehavior = ''
}

const syncScrollMode = () => {
  if (isDesktop()) {
    lockPageScroll()
  } else {
    unlockPageScroll()
  }
}

let stopWatch: (() => void) | null = null

onMounted(async () => {
  syncScrollMode()
  window.addEventListener('resize', syncScrollMode)

  if (preloaderPlayedInRuntime.value) {
    await playHeroTitleReveal()
    return
  }

  stopWatch = watch(
    () => heroGateReady.value,
    async (ready) => {
      if (ready) {
        await playHeroTitleReveal()
      }
    },
    { immediate: true },
  )
})

onBeforeUnmount(() => {
  stopWatch?.()
  stopWatch = null
  cleanup()
  window.removeEventListener('resize', syncScrollMode)
  unlockPageScroll()
})
</script>

<template>
  <main class="hero-wrap">
    <div class="hero-content hero-content--masked">
      <div class="light-streak"></div>

      <h1 class="hero-title">
        探索AI <br>
        理解未来
      </h1>

      <p class="hero-subtitle">
        以清晰的认知，
        走进智能时代。
      </p>

      <button
        class="cta-btn"
        :disabled="isTransitioning"
        @click="goToKnowledge"
      >
        <span>学 习 AI</span>
        <span class="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  </main>
</template>

<style scoped>
.hero-wrap {
  position: fixed;
  inset: 0;
  z-index: 10;
  width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.hero-content {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.hero-content--masked {
  opacity: 0;
  visibility: hidden;
}

.hero-content--masked .hero-title,
.hero-content--masked .hero-subtitle,
.hero-content--masked .cta-btn {
  opacity: 0;
}

.light-streak {
  width: 150px;
  height: 1px;
  margin: 0 auto 3rem;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(107, 123, 152, 0.36),
    transparent
  );
  opacity: 0.55;
  flex-shrink: 0;
}

html.dark .light-streak {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(166, 185, 220, 0.16),
    transparent
  );
}

.hero-title {
  margin: 0 0 1.7rem;
  font-family: 'Noto Serif SC', serif;
  font-weight: 900;
  letter-spacing: 0.5em;
  line-height: 1.2;
  text-align: center;
  color: #1f1f1c;
  flex-shrink: 0;
}

html.dark .hero-title {
  color: #f4f6fa;
}

.hero-subtitle {
  text-align: center;
  font-size: 1.2rem;
  max-width: 680px;
  margin: 0 auto 2.8rem;
  color: #6a6863;
  font-weight: 300;
  line-height: 1.65;
  flex-shrink: 0;
}

html.dark .hero-subtitle {
  color: #a6afbf;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 220px;
  height: 58px;
  padding: 0 2rem;
  border-radius: 9999px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  background: #111111;
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
  margin: 0 auto;
  will-change: transform;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.cta-btn:disabled {
  cursor: default;
  opacity: 0.8;
}

html.dark .cta-btn {
  background: #ffffff;
  color: #0b1020;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
}

html.dark .cta-btn:hover {
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.42);
}

.cta-btn:active {
  transform: translateY(0);
}

.material-symbols-outlined {
  font-size: 24px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .hero-wrap {
    justify-content: center;
    align-items: center;
    padding: 106px 2rem 3rem;
  }

  .hero-content {
    max-width: min(100%, 980px);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-title {
    font-size: clamp(4rem, 6vw, 5.6rem);
  }
}

@media (max-width: 767px) {
  .hero-wrap {
    height: 100svh;
    min-height: 100svh;
    max-height: 100svh;
    padding: calc(var(--safe-top) + 84px) 20px calc(var(--safe-bottom) + 20px);
    justify-content: flex-end;
    align-items: stretch;
    text-align: left;
    overflow: hidden;
  }

  .hero-content {
    width: 100%;
    max-width: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 0;
  }

  .light-streak {
    width: 76px;
    margin: 0 0 1.75rem 0;
  }

  .hero-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: clamp(3rem, 8vw, 4.8rem);
    margin: 0 0 18px;
    letter-spacing: 0.08em;
    line-height: 1.05;
    color: #181816;
    text-align: left;
  }

  html.dark .hero-title {
    color: #f4f6fa;
  }

  .hero-subtitle {
    font-size: 0.98rem;
    max-width: 250px;
    margin: 0 0 1.5rem;
    text-align: left;
    font-weight: 400;
    color: #5e5c57;
  }

  html.dark .hero-subtitle {
    color: #a6afbf;
  }

  .cta-btn {
    width: min(220px, 68%);
    min-width: 0;
    height: 68px;
    margin: 0 auto;
    align-self: center;
    font-size: 1rem;
  }
}
</style>