<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useHeroTitleReveal } from '@/composables/useHomeAnimate'
import { useHomeRevealRuntime } from '@/composables/homeRevealRuntime'
import { usePageTransition } from '@/composables/usePageTransition'

const { playHeroTitleReveal, cleanup } = useHeroTitleReveal()
const { heroGateReady, preloaderPlayedInRuntime } = useHomeRevealRuntime()
const { navigateWithTransition, isTransitioning } = usePageTransition()

const goToKnowledge = async () => {
  if (isTransitioning.value) return
  await navigateWithTransition('/knowledge')
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
        <span class="cta-text">学习 AI</span>

        <span class="cta-arrow" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            focusable="false"
          >
            <path
              d="M5 12H19M13 6L19 12L13 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
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

  /*
    中文页面推荐优先使用系统中文字体。
    这样国内用户不依赖 Google Font，也能稳定显示。
  */
  font-family:
    'Noto Sans SC',
    'Source Han Sans SC',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    '微软雅黑',
    Arial,
    sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
  margin: 0 0 1.55rem;

  /*
    标题可以用宋体/思源宋体，视觉更有中文气质。
    如果用户电脑没有这些字体，会自动回退到系统中文字体。
  */
  font-family:
    'Noto Serif SC',
    'Source Han Serif SC',
    'Songti SC',
    'STSong',
    'SimSun',
    '宋体',
    serif;

  font-weight: 800;
  letter-spacing: 0.18em;
  line-height: 1.16;
  text-align: center;
  color: #1f1f1c;
  flex-shrink: 0;
}

html.dark .hero-title {
  color: #f4f6fa;
}

.hero-subtitle {
  text-align: center;
  font-family:
    'Noto Sans SC',
    'Source Han Sans SC',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    '微软雅黑',
    Arial,
    sans-serif;
  font-size: 1.12rem;
  max-width: 680px;
  margin: 0 auto 2.7rem;
  color: #6a6863;
  font-weight: 400;
  line-height: 1.82;
  letter-spacing: 0.04em;
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
  min-width: 210px;
  height: 56px;
  padding: 0 2rem;
  border-radius: 9999px;
  cursor: pointer;
  border: none;
  background: #111111;
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
  margin: 0 auto;
  will-change: transform;
  transition:
    box-shadow 0.22s ease,
    opacity 0.2s ease;
  flex-shrink: 0;

  font-family:
    'Noto Sans SC',
    'Source Han Sans SC',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    '微软雅黑',
    Arial,
    sans-serif;
  font-size: 0.98rem;
  font-weight: 700;
}

.cta-text {
  display: inline-block;
  letter-spacing: 0.08em;
  line-height: 1;
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

.cta-arrow {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cta-arrow svg {
  width: 22px;
  height: 22px;
  display: block;
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
    font-size: clamp(4rem, 6vw, 5.5rem);
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
    font-size: clamp(3rem, 11vw, 4.6rem);
    margin: 0 0 18px;
    letter-spacing: 0.08em;
    line-height: 1.08;
    color: #181816;
    text-align: left;
  }

  html.dark .hero-title {
    color: #f4f6fa;
  }

  .hero-subtitle {
    font-size: 1rem;
    max-width: 270px;
    margin: 0 0 1.5rem;
    text-align: left;
    font-weight: 400;
    line-height: 1.78;
    letter-spacing: 0.03em;
    color: #5e5c57;
  }

  html.dark .hero-subtitle {
    color: #a6afbf;
  }

  .cta-btn {
    width: min(220px, 68%);
    min-width: 0;
    height: 62px;
    margin: 0 auto;
    align-self: center;
    font-size: 0.98rem;
  }

  .cta-arrow {
    width: 21px;
    height: 21px;
  }

  .cta-arrow svg {
    width: 21px;
    height: 21px;
  }
}
</style>