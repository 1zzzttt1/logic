<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  isKnowledgePage?: boolean
}>()

const router = useRouter()
const isDark = ref(false)
const showMobileMenu = ref(false)

const navItems = [
  { name: '首页', path: '/' },
  { name: '知识库', path: '/knowledge' },
  { name: '文章分享', path: '/articles' },
  { name: '关于我', path: '/about' }
]

const brandLogoStyle = computed(() => {
  if (isDark.value) {
    return {
      color: '#ffffff',
      textShadow:
        '0 1px 2px rgba(0, 0, 0, 0.22), 0 0 14px rgba(173, 216, 255, 0.10)'
    }
  }

  return {
    color: '#111111',
    textShadow: 'none'
  }
})

const getNavLinkStyle = (path: string) => {
  const isActive = router.currentRoute.value.path === path

  if (isDark.value) {
    if (isActive) {
      return {
        color: '#ffffff',
        textShadow:
          '0 1px 2px rgba(0, 0, 0, 0.28), 0 0 14px rgba(173, 216, 255, 0.14)',
        borderBottom: '2px solid rgba(196, 222, 255, 0.92)',
        paddingBottom: '4px',
        fontWeight: '700',
        opacity: '1'
      }
    }

    return {
      color: '#dbe7f5',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.18)',
      opacity: '0.94'
    }
  }

  if (isActive) {
    return {
      color: '#111111',
      textShadow: 'none',
      borderBottom: '2px solid #5F6E8A',
      paddingBottom: '4px',
      fontWeight: '700',
      opacity: '1'
    }
  }

  return {
    color: '#4f5b70',
    textShadow: 'none',
    opacity: '0.94'
  }
}

/**
 * 手机端展开菜单：始终固定使用 light 配色
 * 不再跟随 isDark 切换
 */
const getMobileNavLinkStyle = (path: string) => {
  const isActive = router.currentRoute.value.path === path

  if (isActive) {
    return {
      color: '#111111',
      fontWeight: '700',
      background: 'rgba(95, 110, 138, 0.10)',
      opacity: '1'
    }
  }

  return {
    color: '#3d4658',
    opacity: '0.94'
  }
}

const applyTheme = (dark: boolean) => {
  isDark.value = dark

  if (dark) {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
    localStorage.setItem('logic-theme', 'dark')
  } else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
    localStorage.setItem('logic-theme', 'light')
  }
}

const animateToggleButton = (button: HTMLElement) => {
  button.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(0.88)' },
      { transform: 'scale(1.06)' },
      { transform: 'scale(1)' }
    ],
    {
      duration: 520,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
    }
  )
}

const triggerPulse = (button: HTMLElement) => {
  button.classList.remove('pulse')
  void button.offsetWidth
  button.classList.add('pulse')

  window.setTimeout(() => {
    button.classList.remove('pulse')
  }, 720)
}

const toggleTheme = async (e: MouseEvent) => {
  const nextDark = !isDark.value
  const button = e.currentTarget as HTMLElement | null

  if (!button) {
    applyTheme(nextDark)
    return
  }

  animateToggleButton(button)
  triggerPulse(button)

  const rect = button.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const doc = document as Document & {
    startViewTransition?: (
      callback: () => Promise<void> | void
    ) => {
      ready: Promise<void>
      finished: Promise<void>
      updateCallbackDone?: Promise<void>
      skipTransition?: () => void
    }
  }

  if (!doc.startViewTransition) {
    applyTheme(nextDark)
    return
  }

  const startViewTransition = doc.startViewTransition.bind(document)

  const transition = startViewTransition(async () => {
    applyTheme(nextDark)
    await nextTick()
  })

  await transition.ready

  document.documentElement.animate(
    [
      {
        opacity: 1,
        filter: 'blur(0px)'
      },
      {
        opacity: 0.9,
        filter: 'blur(2px)'
      }
    ],
    {
      duration: 260,
      easing: 'ease-out',
      pseudoElement: '::view-transition-old(root)'
    }
  )

  document.documentElement.animate(
    [
      {
        clipPath: `circle(18px at ${x}px ${y}px)`,
        filter: 'brightness(1.08) saturate(1.08) blur(6px)',
        opacity: 0.92
      },
      {
        clipPath: `circle(${endRadius * 0.55}px at ${x}px ${y}px)`,
        filter: 'brightness(1.03) saturate(1.03) blur(2px)',
        opacity: 1
      },
      {
        clipPath: `circle(${endRadius}px at ${x}px ${y}px)`,
        filter: 'brightness(1) saturate(1) blur(0px)',
        opacity: 1
      }
    ],
    {
      duration: 820,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      pseudoElement: '::view-transition-new(root)'
    }
  )
}

const toggleMobileMenu = (e: Event) => {
  e.stopPropagation()
  showMobileMenu.value = !showMobileMenu.value
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const handleDocumentClick = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target.closest('.mobile-menu-panel') && !target.closest('.menu-toggle')) {
    showMobileMenu.value = false
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('logic-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')

  applyTheme(initialTheme === 'dark')

  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <header class="topbar" :class="{ 'knowledge-style': isKnowledgePage }">
    <nav class="header-nav">
      <router-link
        to="/"
        class="brand-logo"
        :style="brandLogoStyle"
      >
        Logic
      </router-link>

      <div class="desktop-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :style="getNavLinkStyle(item.path)"
        >
          {{ item.name }}
        </router-link>
      </div>

      <div class="header-actions">
        <button
          class="theme-toggle"
          :class="{ 'dark-mode': isDark }"
          @click="toggleTheme"
          :aria-label="isDark ? '切换亮色模式' : '切换暗色模式'"
          :title="isDark ? '切换亮色模式' : '切换暗色模式'"
        >
          <span class="material-symbols-outlined theme-icon">
            {{ isDark ? 'dark_mode' : 'light_mode' }}
          </span>
        </button>

        <button
          class="menu-toggle"
          @click="toggleMobileMenu"
          aria-label="打开菜单"
          title="打开菜单"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div class="mobile-menu-panel" :class="{ show: showMobileMenu }">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="mobile-nav-link"
          :style="getMobileNavLinkStyle(item.path)"
          @click="closeMobileMenu"
        >
          {{ item.name }}
        </router-link>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.topbar {
  position: relative;
  z-index: 10;
  padding: 26px 52px 0;
}

.topbar.knowledge-style {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem 3rem;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.brand-logo {
  font-family: 'Noto Serif SC', serif;
  font-style: italic;
  letter-spacing: -0.03em;
  font-size: 2.15rem;
  text-decoration: none;
  transition:
    color 0.25s ease,
    text-shadow 0.25s ease,
    opacity 0.25s ease;
}

.desktop-nav {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.nav-link {
  position: relative;
  font-family: 'Noto Serif SC', serif;
  font-size: 0.9375rem;
  text-decoration: none;
  transition:
    color 0.25s ease,
    opacity 0.25s ease,
    text-shadow 0.25s ease,
    border-color 0.25s ease;
}

.nav-link:hover {
  opacity: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.theme-toggle,
.menu-toggle {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d6d1c9;
  background: rgba(255, 255, 255, 0.72);
  color: #5F6E8A;
  cursor: pointer;
  transition:
    background 0.28s ease,
    border-color 0.28s ease,
    color 0.28s ease,
    box-shadow 0.28s ease,
    transform 0.28s ease;
  box-shadow: 0 6px 18px rgba(31, 31, 28, 0.06);
}

.theme-toggle {
  position: relative;
  overflow: visible;
}

.theme-toggle:hover,
.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

:global(html.dark) .theme-toggle,
:global(html.dark) .menu-toggle {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(13, 23, 38, 0.88);
  color: #f4f6fa;
  box-shadow: none;
}

.theme-icon {
  font-size: 20px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease,
    color 0.3s ease;
  will-change: transform;
}

.theme-toggle.dark-mode .theme-icon {
  transform: rotate(180deg);
}

.theme-toggle::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: inherit;
  background: radial-gradient(
    circle,
    rgba(95, 110, 138, 0.22) 0%,
    rgba(95, 110, 138, 0.12) 35%,
    rgba(95, 110, 138, 0) 72%
  );
  opacity: 0;
  transform: scale(0.7);
  pointer-events: none;
}

.theme-toggle.pulse::after {
  animation: themePulse 720ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes themePulse {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

.material-symbols-outlined {
  font-size: 20px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.menu-toggle .material-symbols-outlined {
  font-size: 28px;
}

/* 手机端展开菜单：始终固定为 light 风格 */
.mobile-menu-panel {
  position: absolute;
  top: 70px;
  right: 0;
  width: 184px;
  padding: 10px;
  border-radius: 22px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px);
  transition: all 0.26s ease;
  display: block;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(214, 209, 201, 0.86);
  box-shadow: 0 12px 30px rgba(31, 31, 28, 0.08);
}

.mobile-menu-panel.show {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.mobile-nav-link {
  display: block;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 0.95rem;
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease,
    text-shadow 0.2s ease;
}

.mobile-nav-link:hover {
  background: rgba(214, 209, 201, 0.24);
}

/* Mobile styles */
@media (max-width: 767px) {
  .topbar {
    flex: 0 0 auto;
    padding: calc(var(--safe-top) + 18px) 20px 0;
  }

  .topbar.knowledge-style {
    padding: calc(var(--safe-top) + 18px) 20px;
  }

  .desktop-nav {
    display: none !important;
  }

  .menu-toggle {
    display: flex !important;
  }

  .brand-logo {
    font-size: 1.9rem;
  }

  .theme-toggle,
  .menu-toggle {
    width: 52px;
    height: 52px;
  }

  .mobile-menu-panel {
    top: calc(var(--safe-top) + 82px);
    right: 20px;
  }
}

/* Desktop styles */
@media (min-width: 768px) {
  .menu-toggle,
  .mobile-menu-panel {
    display: none !important;
  }
}
</style>