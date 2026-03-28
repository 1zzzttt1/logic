<script setup lang="ts">
import { onMounted, onActivated, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useHomeReveal } from '@/composables/useHomeReveal'
import { hasHomeRevealPlayedInRuntime } from '@/composables/homeRevealRuntime'

const router = useRouter()
const { playHomeReveal } = useHomeReveal()

const showPreloader = ref(false)

const goToKnowledge = () => {
  router.push('/knowledge')
}

function syncPreloaderVisibility() {
  showPreloader.value = !hasHomeRevealPlayedInRuntime()
}

async function startRevealIfNeeded() {
  syncPreloaderVisibility()

  if (!showPreloader.value) return

  await nextTick()

  await playHomeReveal(() => {
    showPreloader.value = false
  })
}

onMounted(async () => {
  await startRevealIfNeeded()
})

onActivated(async () => {
  await startRevealIfNeeded()
})
</script>

<template>
  <template v-if="showPreloader">
    <div class="preloader-progress">
      <div class="preloader-progress-bar"></div>
      <div class="preloader-logo">
        <h1>Logic</h1>
      </div>
    </div>

    <div class="preloader-mask"></div>

    <div class="preloader-content">
      <div class="preloader-footer">
        <p>Spaces unfold in light and shadow...</p>
      </div>
    </div>
  </template>

  <main class="hero-wrap">
    <div class="hero-content">
      <div class="light-streak"></div>

      <h1 class="hero-title">
        探索AI
        <div>理解未来</div>
      </h1>

      <p class="hero-subtitle">
        以清晰的认知，
        走进智能时代。
      </p>

      <button class="cta-btn" @click="goToKnowledge">
        <span>学 习 AI</span>
        <span class="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  </main>
</template>

<style scoped>
.preloader-progress,
.preloader-mask,
.preloader-content {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100svh;
  pointer-events: none;
}

.preloader-progress {
  background-color: var(--base-200);
  z-index: 14;
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
  will-change: transform;
  transform-origin: left;
}

.preloader-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
  mix-blend-mode: difference;
  z-index: 15;
}

.preloader-logo h1 {
  position: relative;
  color: var(--base-300);
  font-size: 3rem;
  font-weight: 500;
  line-height: 14;
}

.preloader-mask {
  background-color: var(--base-100);
  -webkit-mask: linear-gradient(var(--base-300), var(--base-300)),
    url("@/assets/mask.svg") center/50% no-repeat;
  -webkit-mask-composite: subtract;
  mask: linear-gradient(var(--base-300), var(--base-300)),
    url("@/assets/mask.svg") center/50% no-repeat;
  mask-composite: subtract;
  will-change: transform;
  z-index: 14;
}

.preloader-content {
  z-index: 15;
}

.preloader-footer {
  position: absolute;
  bottom: 4rem;
  left: 50%;
  transform: translate(-50%);
  width: 30%;
  text-align: center;
}

.preloader-footer p {
  color: var(--base-300);
  opacity: 0.5;
}

.line,
.char {
  position: relative;
  padding-bottom: 0.2em;
  margin-bottom: -0.2em;
  will-change: transform;
}

.hero-wrap {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
}

.hero-content {
  width: 100%;
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
  font-family: 'Noto Serif SC', serif;
  font-weight: 900;
  letter-spacing: 0.5em;
  line-height: 1.2;
  text-align: center;
  color: #1f1f1c;
  margin-bottom: 1.7rem;
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
  transition: all 0.28s ease;
  margin: 0 auto;
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
}

@media (min-width: 768px) {
  .hero-wrap {
    min-height: calc(100vh - 106px);
    padding: 4rem 2rem 6rem;
    justify-content: center;
    align-items: center;
  }

  .hero-content {
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
    flex: 1 1 auto;
    min-height: 0;
    padding: 14px 20px calc(var(--safe-bottom) + 20px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: stretch;
    text-align: left;
  }

  .hero-content {
    width: 100%;
    max-width: none;
  }

  .light-streak {
    width: 76px;
    margin: 0 0 1.75rem 0;
  }

  .hero-title {
    font-size: clamp(3.5rem, 8vw, 6rem);
    margin-bottom: 18px;
    letter-spacing: 0.08em;
    line-height: 1.1;
    text-align: left;
    color: #181816;
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
    display: flex;
    width: min(220px, 68%);
    margin: 0 auto;
    min-width: 0;
    height: 68px;
    border-radius: 9999px;
    font-size: 1rem;
  }
}
</style>