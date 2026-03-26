<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  isKnowledgePage?: boolean
}>()

const router = useRouter()
const isDark = ref(false)
const showMobileMenu = ref(false)

const navItems = [
  { name: '首页', path: '/', active: true },
  { name: '知识库', path: '/knowledge', active: false },
  { name: '文章分享', path: '/articles', active: false },
  { name: '关于我', path: '/about', active: false }
]

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
    localStorage.setItem('logic-theme', 'dark')
  } else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
    localStorage.setItem('logic-theme', 'light')
  }
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

  if (initialTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  } else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }

  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <header class="topbar" :class="{ 'knowledge-style': isKnowledgePage }">
    <nav class="header-nav">
      <router-link to="/" class="brand-logo">Logic</router-link>

      <div class="desktop-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: router.currentRoute.value.path === item.path }"
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
          <span class="material-symbols-outlined">
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
  z-index: 20;
  padding: 26px 52px 0;
}

.topbar.knowledge-style {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem 3rem;
  background: rgba(247, 245, 241, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

html.dark .topbar.knowledge-style {
  background: rgba(247, 245, 241, 0.9);
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
  color: #111111;
  text-decoration: none;
  transition: color 0.25s ease;
}

html.dark .brand-logo {
  color: rgba(244, 246, 250, 0.94);
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
  color: #7A766F;
  text-decoration: none;
  transition: color 0.25s ease, opacity 0.25s ease;
}

.nav-link:hover {
  color: #111111;
}

html.dark .nav-link {
  color: #a6afbf;
}

html.dark .nav-link:hover {
  color: #f4f6fa;
}

.nav-link.active {
  color: #111111;
  font-weight: 700;
  border-bottom: 2px solid #5F6E8A;
  padding-bottom: 4px;
}

html.dark .nav-link.active {
  color: #f4f6fa;
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
  transition: all 0.28s ease;
  box-shadow: 0 6px 18px rgba(31, 31, 28, 0.06);
}

.topbar.knowledge-style .theme-toggle,
.topbar.knowledge-style .menu-toggle {
  background: transparent;
  border: none;
  box-shadow: none;
}

.theme-toggle:hover,
.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.9);
}

html.dark .theme-toggle,
html.dark .menu-toggle {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(13, 23, 38, 0.88);
  color: #f4f6fa;
  box-shadow: none;
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

html.dark .mobile-menu-panel {
  background: rgba(11, 20, 34, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
}

.mobile-nav-link {
  display: block;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 0.95rem;
  color: #1f1f1c;
  text-decoration: none;
  transition: background 0.2s ease;
}

html.dark .mobile-nav-link {
  color: #f4f6fa;
}

.mobile-nav-link:hover {
  background: rgba(214, 209, 201, 0.24);
}

html.dark .mobile-nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
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
