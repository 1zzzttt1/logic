import { nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import {
  useHomeRevealRuntime,
  markPreloaderPlayedInRuntime,
  setHeroGateReady,
} from './homeRevealRuntime'

gsap.registerPlugin(SplitText)

type SplitType = 'chars' | 'lines'

interface SplitElementItem {
  key: string
  selector: string
  type: SplitType
}

type SplitMap = Record<string, SplitText>

export function useHomeReveal() {
  const splits: SplitMap = {}
  let tl: gsap.core.Timeline | null = null
  let heroGateOpened = false

  const { preloaderPlayedInRuntime } = useHomeRevealRuntime()

  function createSplitTexts(elements: SplitElementItem[]) {
    elements.forEach(({ key, selector, type }) => {
      const target = document.querySelector(selector)
      if (!target) return

      const config: {
        type: SplitType
        mask: SplitType
        charsClass?: string
        linesClass?: string
      } = {
        type,
        mask: type,
      }

      if (type === 'chars') config.charsClass = 'char'
      if (type === 'lines') config.linesClass = 'line'

      splits[key] = SplitText.create(selector, config)
    })

    return splits
  }

  function getSiteShell() {
    return document.querySelector('.site-shell')
  }

  function hidePreloaderInstantly() {
    gsap.set('.preloader-progress', {
      opacity: 0,
      display: 'none',
      pointerEvents: 'none',
    })

    gsap.set('.preloader-mask', {
      opacity: 0,
      display: 'none',
      pointerEvents: 'none',
    })

    gsap.set('.preloader-content', {
      opacity: 0,
      display: 'none',
      pointerEvents: 'none',
    })
  }

  function openHeroGateOnce() {
    if (heroGateOpened) return
    heroGateOpened = true
    setHeroGateReady(true)
  }

  function setInitialStates() {
    const siteShell = getSiteShell()

    if (siteShell) {
      gsap.set(siteShell, {
        scale: 0,
        transformOrigin: '50% 50%',
        willChange: 'transform',
      })
    }

    if (splits.logoChars?.chars?.length) {
      gsap.set(splits.logoChars.chars, { x: '100%' })
    }

    const verticalTargets = [...(splits.footerLines?.lines ?? [])]

    if (verticalTargets.length) {
      gsap.set(verticalTargets, { y: '100%' })
    }

    gsap.set('.preloader-progress-bar', {
      scaleX: 0,
      transformOrigin: 'left center',
    })

    gsap.set('.preloader-progress', {
      opacity: 1,
      display: 'block',
    })

    gsap.set('.preloader-mask', {
      scale: 1,
      opacity: 1,
      display: 'block',
    })

    gsap.set('.preloader-content', {
      opacity: 1,
      display: 'block',
    })
  }

  function animateProgress(duration = 3) {
    const progressTl = gsap.timeline()
    const counterSteps = 5
    let currentProgress = 0

    for (let i = 0; i < counterSteps; i++) {
      const finalStep = i === counterSteps - 1
      const targetProgress = finalStep
        ? 1
        : Math.min(currentProgress + Math.random() * 0.3 + 0.1, 0.9)

      currentProgress = targetProgress

      progressTl.to('.preloader-progress-bar', {
        scaleX: targetProgress,
        duration: duration / counterSteps,
        ease: 'power2.out',
      })
    }

    return progressTl
  }

  async function playHomeReveal(onFinished?: () => void) {
    await nextTick()
    await document.fonts.ready

    heroGateOpened = false

    // 当前 runtime 已经播过 preloader
    // 直接隐藏遮罩并立刻放行 hero
    if (preloaderPlayedInRuntime.value) {
      const siteShell = getSiteShell()

      hidePreloaderInstantly()

      if (siteShell) {
        gsap.set(siteShell, {
          scale: 1,
          clearProps: 'willChange',
        })
      }

      openHeroGateOnce()
      onFinished?.()
      return
    }

    // 首次进入时先关门，等遮罩后半段再放 hero
    setHeroGateReady(false)

    const splitElements: SplitElementItem[] = [
      { key: 'logoChars', selector: '.preloader-logo h1', type: 'chars' },
      { key: 'footerLines', selector: '.preloader-footer p', type: 'lines' },
    ]

    createSplitTexts(splitElements)
    setInitialStates()

    tl?.kill()

    tl = gsap.timeline({
      delay: 0.5,
      defaults: {
        ease: 'power4.inOut',
      },
      onComplete: () => {
        const siteShell = getSiteShell()

        if (siteShell) {
          gsap.set(siteShell, {
            clearProps: 'willChange',
          })
        }

        hidePreloaderInstantly()
        markPreloaderPlayedInRuntime()
        onFinished?.()
      },
    })

    if (splits.logoChars?.chars?.length) {
      tl.to(splits.logoChars.chars, {
        x: '0%',
        stagger: 0.05,
        duration: 1,
      })
    }

    if (splits.footerLines?.lines?.length) {
      tl.to(
        splits.footerLines.lines,
        {
          y: '0%',
          stagger: 0.1,
          duration: 1,
        },
        '0.25'
      )
    }

    tl.add(animateProgress(), '<')

    tl.set('.preloader-progress', {
      backgroundColor: '#fff',
    })

    if (splits.logoChars?.chars?.length) {
      tl.to(
        splits.logoChars.chars,
        {
          x: '-100%',
          stagger: 0.05,
          duration: 1,
        },
        '-=0.5'
      )
    }

    if (splits.footerLines?.lines?.length) {
      tl.to(
        splits.footerLines.lines,
        {
          y: '-100%',
          stagger: 0.1,
          duration: 1,
        },
        '<'
      )
    }

    tl.to(
      '.preloader-progress',
      {
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
      },
      '-=0.25'
    )

    tl.to(
      '.preloader-content',
      {
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
      },
      '<'
    )

    tl.to(
      '.preloader-mask',
      {
        scale: 10,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
      },
      '<'
    )

    tl.to(
      '.site-shell',
      {
        scale: 1,
        duration: 1.2,
        ease: 'power3.out',
      },
      '<-0.6'
    )

    // 关键：
    // 在遮罩快结束时就提前放行 hero
    // 这样视觉上是遮罩退场中，首页 hero 同步进入
    tl.call(
      () => {
        openHeroGateOnce()
      },
      [],
      '-=0.9'
    )

    return tl
  }

  function revertSplitTexts() {
    Object.values(splits).forEach((split) => split.revert())
  }

  function cleanup() {
    tl?.kill()
    tl = null
    revertSplitTexts()
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    playHomeReveal,
    cleanup,
  }
}