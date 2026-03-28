import { nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

export function useHeroTitleReveal() {
  let split: SplitText | null = null
  let splitSubtitle: SplitText | null = null
  let splitCtaSpan: SplitText | null = null
  let tl: gsap.core.Timeline | null = null
  let arrowLoopTween: gsap.core.Tween | null = null

  async function playHeroTitleReveal() {
    await nextTick()
    await document.fonts.ready

    const heroContent = document.querySelector('.hero-content')
    const heroTitle = document.querySelector('.hero-title')
    const heroSubtitle = document.querySelector('.hero-subtitle')
    const ctaBtn = document.querySelector('.cta-btn')
    const ctaSpan = document.querySelector('.cta-btn span:nth-child(1)')
    const ctaArrow = document.querySelector('.cta-btn span:last-child')

    if (!heroContent || !heroTitle || !heroSubtitle || !ctaBtn || !ctaSpan || !ctaArrow) {
      return
    }

    tl?.kill()
    tl = null

    arrowLoopTween?.kill()
    arrowLoopTween = null

    split?.revert()
    splitSubtitle?.revert()
    splitCtaSpan?.revert()

    gsap.set(heroContent, {
      autoAlpha: 0,
    })

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
      gsap.set(heroContent, { autoAlpha: 1 })
      heroContent.classList.remove('hero-content--masked')
      return
    }

    gsap.set(split.chars, { y: '-100%' })
    gsap.set(splitSubtitle.chars, { y: '100%' })
    gsap.set(ctaBtn, { scale: 0 })
    gsap.set(splitCtaSpan.chars, { x: '-100%' })
    gsap.set(ctaArrow, { x: '-50%', opacity: 0 })

    heroContent.classList.remove('hero-content--masked')

    gsap.set(heroContent, {
      autoAlpha: 1,
      visibility: 'visible',
    })

    tl = gsap.timeline({
      onComplete: () => {
        arrowLoopTween = gsap.fromTo(
          ctaArrow,
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
      },
    })

    tl.to(split.chars, {
      y: '0%',
      duration: 1.5,
      ease: 'power4.out',
      stagger: 0.02,
    })
      .to(
        splitSubtitle.chars,
        {
          y: '0%',
          duration: 1.2,
          ease: 'power4.out',
          stagger: 0.02,
        },
        '<+0.1'
      )
      .to(
        ctaBtn,
        {
          scale: 1,
          duration: 1.2,
          ease: 'power4.out',
        },
        '<+0.1'
      )
      .to(
        splitCtaSpan.chars,
        {
          x: '0%',
          stagger: 0.06,
          duration: 0.8,
          ease: 'power4.out',
        },
        '<+0.1'
      )
      .to(
        ctaArrow,
        {
          x: '0%',
          opacity: 1,
          duration: 0.8,
          ease: 'power4.out',
        },
        '-=0.45'
      )
  }

  function cleanup() {
    tl?.kill()
    tl = null

    arrowLoopTween?.kill()
    arrowLoopTween = null

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