<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  Teleport,
} from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { usePageTransition } from '@/composables/usePageTransition'
import type { ComponentPublicInstance } from 'vue'

gsap.registerPlugin(SplitText)

defineProps<{
  isKnowledgePage?: boolean
}>()

const router = useRouter()
const { navigateWithTransition, isTransitioning } = usePageTransition()

const isDark = ref(false)
const isMenuOpen = ref(false)
const isAnimating = ref(false)
const isMobile = ref(false)

const navTogglerRef = ref<HTMLButtonElement | null>(null)
const navItemsRef = ref<HTMLElement | null>(null)
const navBgRefs = ref<HTMLElement[]>([])

let menuTl: gsap.core.Timeline | null = null
let splitInstance: SplitText | null = null
let scrollTop = 0

const navItems = [
  { name: '首页', path: '/' },
  { name: '知识库', path: '/knowledge' },
  { name: '文章分享', path: '/articles' },
  { name: '关于我', path: '/about' },
]

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/' },
  { name: 'LinkedIn', href: 'https://linkedin.com/' },
]

const legalLinks = [
  { name: 'Cookie Policy', href: '#' },
  { name: 'Accessibility', href: '#' },
  { name: 'Data Rights', href: '#' },
]

const secondaryLinks = [
  { name: 'Playground', href: '#' },
  { name: 'Build Something', href: '#' },
  { name: 'Profile', href: '#' },
]

const brandLogoStyle = computed(() => {
  if (isDark.value) {
    return {
      color: '#f7fbff',
      textShadow:
        '0 1px 2px rgba(0, 0, 0, 0.22), 0 0 14px rgba(173, 216, 255, 0.10)',
    }
  }

  return {
    color: '#2f3950',
    textShadow: 'none',
  }
})

const getNavLinkStyle = (path: string) => {
  const isActive = router.currentRoute.value.path === path

  if (isDark.value) {
    if (isActive) {
      return {
        color: '#f7fbff',
        textShadow:
          '0 1px 2px rgba(0, 0, 0, 0.28), 0 0 14px rgba(173, 216, 255, 0.14)',
        borderBottom: '2px solid rgba(214, 229, 247, 0.92)',
        paddingBottom: '4px',
        fontWeight: '700',
        opacity: '1',
      }
    }

    return {
      color: '#d7e3f2',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.18)',
      opacity: '0.94',
    }
  }

  if (isActive) {
    return {
      color: '#2f3950',
      textShadow: 'none',
      borderBottom: '2px solid #7f8ca5',
      paddingBottom: '4px',
      fontWeight: '700',
      opacity: '1',
    }
  }

  return {
    color: '#5f6e8a',
    textShadow: 'none',
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
  const x = e.clientX || rect.left + rect.width / 2
  const y = e.clientY || rect.top + rect.height / 2

  const endRadius =
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ) * 1.2

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
    [{ opacity: 1 }, { opacity: 1 }],
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

const setNavBgRef = (
  el: Element | ComponentPublicInstance | null,
  index: number,
) => {
  if (!(el instanceof HTMLElement)) return
  navBgRefs.value[index] = el
}

const lockPageScroll = () => {
  scrollTop = window.scrollY || window.pageYOffset || 0

  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollTop}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
  document.body.style.touchAction = 'none'
}

const unlockPageScroll = () => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  document.body.style.touchAction = ''

  window.scrollTo(0, scrollTop)
}

const resetMenuState = () => {
  navTogglerRef.value?.classList.remove('open')
  isMenuOpen.value = false
  isAnimating.value = false
  unlockPageScroll()

  if (menuTl) {
    menuTl.pause(0)
  }

  if (navBgRefs.value.length) {
    gsap.set(navBgRefs.value, {
      scaleY: 0,
      transformOrigin: 'top',
    })
  }

  if (navItemsRef.value) {
    gsap.set(navItemsRef.value, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
    })
  }

  gsap.set(
    [
      '.overlay-menu .nav-socials .line',
      '.overlay-menu .nav-legal .line',
      '.overlay-menu .nav-primary-links .line',
      '.overlay-menu .nav-secondary-links .line',
    ],
    {
      y: '100%',
    },
  )
}

const setupMenuAnimation = async () => {
  await nextTick()

  if (!navItemsRef.value || navBgRefs.value.length === 0) return

  splitInstance?.revert()

  splitInstance = SplitText.create('.overlay-menu a', {
    type: 'lines',
    mask: 'lines',
    linesClass: 'line',
  })

  gsap.set(navBgRefs.value, {
    scaleY: 0,
    transformOrigin: 'top',
  })

  gsap.set(navItemsRef.value, {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
  })

  gsap.set(
    [
      '.overlay-menu .nav-socials .line',
      '.overlay-menu .nav-legal .line',
      '.overlay-menu .nav-primary-links .line',
      '.overlay-menu .nav-secondary-links .line',
    ],
    {
      y: '100%',
    },
  )

  menuTl?.kill()
  menuTl = gsap.timeline({
    paused: true,
    onComplete: () => {
      isAnimating.value = false
    },
    onReverseComplete: () => {
      gsap.set(
        [
          '.overlay-menu .nav-socials .line',
          '.overlay-menu .nav-legal .line',
          '.overlay-menu .nav-primary-links .line',
          '.overlay-menu .nav-secondary-links .line',
        ],
        { y: '100%' },
      )
      isAnimating.value = false
      isMenuOpen.value = false
      unlockPageScroll()
    },
  })

  menuTl.to(navBgRefs.value, {
    scaleY: 1,
    duration: 0.75,
    stagger: 0.1,
    ease: 'power3.inOut',
  })

  menuTl.to(
    navItemsRef.value,
    {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.75,
      ease: 'power3.inOut',
    },
    '-=0.6',
  )
}

const animateLinksIn = () => {
  const groups = [
    '.overlay-menu .nav-socials .line, .overlay-menu .nav-legal .line',
    '.overlay-menu .nav-primary-links .line',
    '.overlay-menu .nav-secondary-links .line',
  ]

  groups.forEach((selector) => {
    gsap.fromTo(
      selector,
      { y: '100%' },
      {
        y: '0%',
        duration: 0.75,
        stagger: 0.05,
        ease: 'power3.out',
        delay: 0.85,
      },
    )
  })
}

const openMenu = async () => {
  if (!menuTl || isAnimating.value || !isMobile.value) return

  isAnimating.value = true
  isMenuOpen.value = true
  lockPageScroll()

  await nextTick()

  navTogglerRef.value?.classList.add('open')
  menuTl.play(0)
  animateLinksIn()
}

const closeMenu = () => {
  if (!menuTl || isAnimating.value) return

  isAnimating.value = true
  navTogglerRef.value?.classList.remove('open')
  menuTl.reverse()
}

const toggleMenu = async (e: Event) => {
  e.stopPropagation()

  if (!isMobile.value || isAnimating.value) return

  if (isMenuOpen.value) {
    closeMenu()
  } else {
    await openMenu()
  }
}

const handleDocumentClick = (e: Event) => {
  if (!isMobile.value) return

  const target = e.target as HTMLElement
  if (
    isMenuOpen.value &&
    !target.closest('.overlay-menu') &&
    !target.closest('.menu-toggle')
  ) {
    closeMenu()
  }
}

const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isMenuOpen.value && !isAnimating.value) {
    closeMenu()
  }
}

const updateViewportState = () => {
  const nextIsMobile = window.innerWidth <= 767
  const wasMobile = isMobile.value

  isMobile.value = nextIsMobile

  if (wasMobile && !nextIsMobile) {
    resetMenuState()
  }
}

const handleNavigate = async (path: string) => {
  if (isTransitioning.value) return

  if (isMobile.value && isMenuOpen.value && !isAnimating.value) {
    closeMenu()
    await new Promise((resolve) => setTimeout(resolve, 700))
  }

  await navigateWithTransition(path)
}

onMounted(async () => {
  const savedTheme = localStorage.getItem('logic-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')

  applyTheme(initialTheme === 'dark')
  updateViewportState()
  await setupMenuAnimation()

  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEsc)
  window.addEventListener('resize', updateViewportState)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEsc)
  window.removeEventListener('resize', updateViewportState)
  unlockPageScroll()
  menuTl?.kill()
  splitInstance?.revert()
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
          v-if="isMobile"
          ref="navTogglerRef"
          class="menu-toggle nav-toggler mobile-only"
          @click="toggleMenu"
          :aria-label="isMenuOpen ? '关闭菜单' : '打开菜单'"
          :title="isMenuOpen ? '关闭菜单' : '打开菜单'"
        >
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  </header>

  <Teleport to="body">
    <div
      class="nav-content overlay-menu"
      :class="{ active: isMenuOpen && isMobile }"
      :aria-hidden="!(isMenuOpen && isMobile)"
    >
      <div class="nav-bg" :ref="(el) => setNavBgRef(el, 0)"></div>
      <div class="nav-bg" :ref="(el) => setNavBgRef(el, 1)"></div>
      <div class="nav-bg" :ref="(el) => setNavBgRef(el, 2)"></div>
      <div class="nav-bg" :ref="(el) => setNavBgRef(el, 3)"></div>

      <div ref="navItemsRef" class="nav-items">
        <div class="nav-items-col">
          <div class="nav-socials">
            <a
              v-for="item in socialLinks"
              :key="item.name"
              :href="item.href"
              target="_blank"
              rel="noreferrer"
            >
              {{ item.name }}
            </a>
          </div>

          <div class="nav-legal">
            <a
              v-for="item in legalLinks"
              :key="item.name"
              :href="item.href"
            >
              {{ item.name }}
            </a>
          </div>
        </div>

        <div class="nav-items-col">
          <div class="nav-primary-links">
            <a
              v-for="item in navItems"
              :key="item.path"
              :href="item.path"
              @click.prevent="handleNavigate(item.path)"
            >
              {{ item.name }}
            </a>
          </div>

          <div class="nav-secondary-links">
            <a
              v-for="item in secondaryLinks"
              :key="item.name"
              :href="item.href"
            >
              {{ item.name }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2010;
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
  z-index: 30;
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
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(160, 177, 205, 0.34);
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: #5f6e8a;
  cursor: pointer;
  transition:
    background 0.28s ease,
    border-color 0.28s ease,
    color 0.28s ease,
    box-shadow 0.28s ease,
    opacity 0.2s ease,
    transform 0.28s ease;
  box-shadow: 0 10px 30px rgba(143, 164, 191, 0.12);
}

.theme-toggle {
  display: inline-flex;
  position: relative;
  overflow: visible;
  will-change: transform;
}

.menu-toggle {
  display: none;
}

.theme-toggle:hover,
.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.88);
  transform: translateY(-1px);
}

:global(html.dark) .theme-toggle,
:global(html.dark) .menu-toggle {
  border: 1px solid rgba(188, 203, 225, 0.12);
  background: rgba(34, 49, 68, 0.78);
  color: #eef5ff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
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

.nav-toggler {
  background: none;
  position: relative;
  flex-direction: column;
  gap: 5px;
  padding: 0;
}

.nav-toggler span {
  display: block;
  width: 22px;
  height: 2px;
  border-radius: 999px;
  background-color: currentColor;
  transition: all 0.4s ease;
}

.nav-toggler.open span:first-child {
  transform: translateY(3.5px) rotate(45deg) scaleX(0.82);
}

.nav-toggler.open span:nth-child(2) {
  transform: translateY(-3.5px) rotate(-45deg) scaleX(0.82);
}

.nav-content {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 11;
}

.nav-content.active {
  pointer-events: auto;
  overscroll-behavior: none;
}

.nav-bg {
  position: absolute;
  inset: 0;
  transform: scaleY(0);
  transform-origin: top;
  will-change: transform;
}

.nav-bg:nth-child(1) {
  background: var(--menu-bg-1);
}

.nav-bg:nth-child(2) {
  background: var(--menu-bg-2);
}

.nav-bg:nth-child(3) {
  background: var(--menu-bg-3);
}

.nav-bg:nth-child(4) {
  background: var(--menu-bg-4);
}

.nav-items {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  display: flex;
  gap: 4rem;
  padding: 8rem 4rem 3rem;
  background:
    radial-gradient(
      circle at 18% 18%,
      var(--menu-panel-glow) 0%,
      transparent 40%
    ),
    radial-gradient(
      circle at 82% 82%,
      var(--menu-panel-shadow) 0%,
      transparent 42%
    ),
    linear-gradient(
      135deg,
      var(--menu-panel-bg-top) 0%,
      var(--menu-panel-bg) 45%,
      var(--menu-panel-bg-bottom) 100%
    );
  clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%);
  will-change: clip-path;
  overscroll-behavior: none;
}

.nav-items-col:nth-child(1) {
  flex: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
}

.nav-items-col:nth-child(2) {
  flex: 4;
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}

.nav-items a {
  display: inline-block;
  width: fit-content;
  text-decoration: none;
  color: var(--menu-text-primary);
  line-height: 1.08;
  margin-bottom: 0.7rem;
  overflow: hidden;
  text-shadow: var(--menu-line-shadow);
  position: relative;
  padding-bottom: 0.18em;
  transition:
    color 0.25s ease,
    opacity 0.25s ease,
    transform 0.25s ease;
}

.nav-items a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0.02em;
  width: 100%;
  height: 1px;
  background: currentColor;
  opacity: 0.62;
  transform: scaleX(1);
  transform-origin: left center;
  pointer-events: none;
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.nav-items a:hover {
  opacity: 1;
}

.nav-items a:hover::after {
  opacity: 1;
  transform: scaleX(1);
}

.nav-socials {
  display: flex;
  flex-direction: column;
}

.nav-socials a {
  font-size: 1.1rem;
  color: var(--menu-text-secondary);
}

.nav-legal a {
  font-size: 0.9rem;
  color: var(--menu-text-soft);
}

.nav-primary-links {
  display: flex;
  flex-direction: column;
  margin-bottom: -5rem;
}

.nav-primary-links a {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(2.2rem, 5vw, 4rem);
  letter-spacing: -0.03em;
  color: var(--menu-text-primary);
}

.nav-primary-links a::after {
  height: 2px;
  opacity: 0.72;
}

.nav-secondary-links a {
  font-size: 1.15rem;
  color: var(--menu-text-secondary);
}

.nav-content :deep(.line) {
  position: relative;
  will-change: transform;
  transform: translateY(100%);
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
    padding: calc(var(--safe-top) + 18px) 20px 0;
  }

  .topbar.knowledge-style {
    padding: calc(var(--safe-top) + 18px) 20px;
  }

  .desktop-nav {
    display: none !important;
  }

  .brand-logo {
    font-size: 1.9rem;
  }

  .theme-toggle,
  .menu-toggle {
    width: 52px;
    height: 52px;
  }

  .menu-toggle.mobile-only {
    display: inline-flex;
  }

  .nav-items {
    flex-direction: column;
    justify-content: center;
    height: 100svh;
    padding: calc(var(--safe-top) + 6.5rem) 1.5rem 2rem;
    overflow: hidden;
  }

  .nav-items-col:nth-child(1),
  .nav-items-col:nth-child(2) {
    flex: none;
  }

  .nav-legal,
  .nav-secondary-links {
    display: none;
  }

  .nav-primary-links a {
    font-size: clamp(2rem, 10vw, 3rem);
  }

  .nav-socials a {
    font-size: 1rem;
  }
}

@media (min-width: 768px) {
  .menu-toggle.mobile-only {
    display: none !important;
  }

  .nav-content {
    pointer-events: none !important;
  }
}
</style>