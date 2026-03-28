import { nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

// 关键：模块级变量
// 当前这次网页运行里，只要播过一次，就记住
let hasPlayedHeroRevealInRuntime = false

export function useHeroTitleReveal() {
  let split: SplitText | null = null
  let splitSubtitle: SplitText | null = null
  let splitCtaSpan: SplitText | null = null
  let tl: gsap.core.Timeline | null = null

  async function playHeroTitleReveal(force = false) {
    // 已经播过且不是强制播放，就直接跳过
    if (hasPlayedHeroRevealInRuntime && !force) {
      return
    }

    await nextTick()
    await document.fonts.ready

    const heroTitle = document.querySelector('.hero-title')
    const heroSubtitle = document.querySelector('.hero-subtitle')
    const ctaSpan = document.querySelector('.cta-btn span:nth-child(1)')

    if (!heroTitle || !heroSubtitle || !ctaSpan) return

    // 先还原，避免重复拆分
    split?.revert()
    splitSubtitle?.revert()
    splitCtaSpan?.revert()

    split = SplitText.create(heroTitle, {
      type: 'lines,chars',
      mask: 'lines',
      linesClass: 'line',
      charsClass: 'char',
    })

    splitSubtitle = SplitText.create(heroSubtitle, {
      type: 'chars',
      mask: 'chars',
      charsClass: 'char',
    })

    splitCtaSpan = SplitText.create(ctaSpan, {
      type: 'chars',
      mask: 'chars',
      charsClass: 'char',
    })

    if (!split.chars?.length || !splitSubtitle.chars?.length || !splitCtaSpan.chars?.length) {
      return
    }

    gsap.set(split.chars, {
      y: '-100%',
    })

    gsap.set(splitSubtitle.chars, {
      y: '100%',
    })

    gsap.set('.cta-btn', {
      scale: 0,
    })

    gsap.set(splitCtaSpan.chars, {
      x: '-100%',
    })

    gsap.set('.cta-btn span:last-child', {
      x: '-50%',
      opacity: 0,
    })

    tl?.kill()
    tl = gsap.timeline({
      onComplete: () => {
        hasPlayedHeroRevealInRuntime = true
      },
    })

    tl.to(
      split.chars,
      {
        y: '0%',
        duration: 1.5,
        ease: 'power4.out',
      },
      '+=5.25'
    )
      .to(
        splitSubtitle.chars,
        {
          y: '0%',
          duration: 1.5,
          ease: 'power4.out',
        },
        '<'
      )
      .to(
        '.cta-btn',
        {
          scale: 1,
          duration: 1.5,
          ease: 'power4.out',
        },
        '<'
      )
      .to(
        splitCtaSpan.chars,
        {
          x: '0%',
          stagger: 0.1,
          duration: 1,
          ease: 'power4.inOut',
        },
        '<'
      )
      .to(
        '.cta-btn span:last-child',
        {
          x: '0%',
          opacity: 1,
          duration: 1,
          ease: 'power4.inOut',
        },
        '-=0.8'
      )
      .add(() => {
        gsap.fromTo(
          '.cta-btn span:last-child',
          { x: '-10%', opacity: 0 },
          {
            x: '30%',
            opacity: 1,
            duration: 1.5,
            ease: 'power1.inOut',
            repeat: -1,
            repeatDelay: 0.4,
          }
        )
      })
  }

  function cleanup() {
    tl?.kill()
    tl = null

    split?.revert()
    splitSubtitle?.revert()
    splitCtaSpan?.revert()

    split = null
    splitSubtitle = null
    splitCtaSpan = null
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    playHeroTitleReveal,
    cleanup,
  }
}