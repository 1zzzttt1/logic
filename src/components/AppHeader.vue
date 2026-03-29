<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { usePageTransition } from '@/composables/usePageTransition'

defineProps<{
  isKnowledgePage?: boolean
}>()

const router = useRouter()
const { navigateWithTransition, isTransitioning } = usePageTransition()

const isDark = ref(false)
const showMobileMenu = ref(false)

const navItems = [
  { name: '首页', path: '/' },
  { name: '知识库', path: '/knowledge' },
  { name: '文章分享', path: '/articles' },
  { name: '关于我', path: '/about' },
]

const brandLogoStyle = computed(() => {
  if (isDark.value) {
    return {
      color: '#ffffff',
      textShadow:
        '0 1px 2px rgba(0, 0, 0, 0.22), 0 0 14px rgba(173, 216, 255, 0.10)',
    }
  }

  return {
    color: '#111111',
    textShadow: 'none',
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
        opacity: '1',
      }
    }

    return {
      color: '#dbe7f5',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.18)',
      opacity: '0.94',
    }
  }

  if (isActive) {
    return {
      color: '#111111',
      textShadow: 'none',
      borderBottom: '2px solid #5F6E8A',
      paddingBottom: '4px',
      fontWeight: '700',
      opacity: '1',
    }
  }

  return {
    color: '#4f5b70',
    textShadow: 'none',
    opacity: '0.94',
  }
}

const getMobileNavLinkStyle = (path: string) => {
  const isActive = router.currentRoute.value.path === path

  if (isActive) {
    return {
      color: '#111111',
      fontWeight: '700',
      background: 'rgba(95, 110, 138, 0.10)',
      opacity: '1',
    }
  }

  return {
    color: '#3d4658',
    opacity: '0.94',
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
      { transform: 'scale(0.92)' },
      { transform: 'scale(1.02)' },
      { transform: 'scale(1)' },
    ],
    {
      duration: 320,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  )
}

const toggleTheme = async (e: MouseEvent) => {
  const nextDark = !isDark.value
  const button = e.currentTarget as HTMLElement | null

  if (!button) {
    applyTheme(nextDark)
    return
  }

  animateToggleButton(button)

  const rect = button.getBoundingClientRect()

  // 优先使用真实点击点，主观上会比纯几何中心更准
  const x = e.clientX || rect.left + rect.width / 2
  const y = e.clientY || rect.top + rect.height / 2

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )  * 1.2

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

  const transition = doc.startViewTransition(async () => {
    applyTheme(nextDark)
    await nextTick()
  })

  await transition.ready

  document.documentElement.animate(
    [
      { opacity: 1 },
      { opacity: 1 },
    ],
    {
      duration: 420,
      easing: 'linear',
      pseudoElement: '::view-transition-old(root)',
    },
  )

  document.documentElement.animate(
    [
      {
        clipPath: `circle(0px at ${x}px ${y}px)`,
        opacity: 1,
      },
      {
        clipPath: `circle(${endRadius}px at ${x}px ${y}px)`,
        opacity: 1,
      },
    ],
    {
      duration: 560,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      pseudoElement: '::view-transition-new(root)',
    },
  )

  await transition.finished
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
    closeMobileMenu()
  }
}

const handleNavigate = async (path: string) => {
  if (isTransitioning.value) return

  closeMobileMenu()
  await navigateWithTransition(path)
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
      <a
        href="/"
        class="brand-logo"
        :style="brandLogoStyle"
        @click.prevent="handleNavigate('/')"
      >
        Logic
      </a>

      <div class="desktop-nav">
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="item.path"
          class="nav-link"
          :style="getNavLinkStyle(item.path)"
          @click.prevent="handleNavigate(item.path)"
        >
          {{ item.name }}
        </a>
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
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="item.path"
          class="mobile-nav-link"
          :style="getMobileNavLinkStyle(item.path)"
          @click.prevent="handleNavigate(item.path)"
        >
          {{ item.name }}
        </a>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.topbar {
  position: relative;
  z-index: 12;
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
    opacity 0.2s ease;
  box-shadow: 0 6px 18px rgba(31, 31, 28, 0.06);
}

.theme-toggle:disabled,
.menu-toggle:disabled {
  opacity: 0.7;
  cursor: default;
}

.theme-toggle {
  position: relative;
  overflow: visible;
  will-change: transform;
}

.theme-toggle:hover,
.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.9);
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

.material-symbols-outlined {
  font-size: 20px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.menu-toggle .material-symbols-outlined {
  font-size: 28px;
}

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

:global(::view-transition-old(root)),
:global(::view-transition-new(root)) {
  animation: none;
  mix-blend-mode: normal;
}

:global(::view-transition-image-pair(root)) {
  isolation: auto;
}

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

@media (min-width: 768px) {
  .menu-toggle,
  .mobile-menu-panel {
    display: none !important;
  }
}
</style>