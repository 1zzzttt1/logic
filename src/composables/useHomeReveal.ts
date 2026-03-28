import { nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

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
  let isInitialized = false

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

  function setInitialStates() {
    if (splits.logoChars?.chars?.length) {
      gsap.set(splits.logoChars.chars, { x: '100%' })
    }

    const verticalTargets = [
      ...(splits.footerLines?.lines ?? []),
      ...(splits.headerChars?.chars ?? []),
      ...(splits.heroFooterH3?.lines ?? []),
      ...(splits.heroFooterP?.lines ?? []),
      ...(splits.btnLabels?.lines ?? []),
    ]

    if (verticalTargets.length) {
      gsap.set(verticalTargets, { y: '100%' })
    }



    if (document.querySelector('.preloader-progress-bar')) {
      gsap.set('.preloader-progress-bar', {
        scaleX: 0,
        transformOrigin: 'left center',
      })
    }

    if (document.querySelector('.preloader-progress')) {
      gsap.set('.preloader-progress', { opacity: 1 })
    }

    if (document.querySelector('.preloader-mask')) {
      gsap.set('.preloader-mask', { scale: 1 })
    }
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

  async function initHomeReveal() {

 


    if (isInitialized) return tl

    await nextTick()
    await document.fonts.ready

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

    if (document.querySelector('.preloader-progress')) {
      tl.set('.preloader-progress', { backgroundColor: '#fff' })
    }

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

    if (document.querySelector('.preloader-progress')) {
      tl.to(
        '.preloader-progress',
        {
          opacity: 0,
          duration: 0.5,
          ease: 'power3.out',
        },
        '-=0.25'
      )
    }

    if (document.querySelector('.preloader-mask')) {
      tl.to(
        '.preloader-mask',
        {
          scale: 6,
          duration: 2.5,
          ease: 'power3.out',
        },
        '<'
      )
    }


    isInitialized = true

 
    return tl
  }

  function revertSplitTexts() {
    Object.values(splits).forEach((split) => {
      split.revert()
    })
  }

  function cleanup() {
    tl?.kill()
    tl = null
    revertSplitTexts()
    isInitialized = false
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    initHomeReveal,
    cleanup,
    splits,
  }
}