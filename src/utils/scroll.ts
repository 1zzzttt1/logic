interface LenisInstance {
  scrollTo(
    target: number | string | HTMLElement,
    options?: { duration?: number; easing?: (t: number) => number },
  ): void
}

// 类型安全获取 Lenis 实例
export function getLenis(): LenisInstance | undefined {
  return (window as any).__lenis as LenisInstance | undefined
}

// 滚动到顶部：Lenis 优先，fallback 到原生
export function scrollToTop(options?: { duration?: number; easing?: (t: number) => number }): void {
  const lenis = getLenis()

  if (lenis) {
    lenis.scrollTo(0, {
      duration: options?.duration ?? 1.2,
      easing: options?.easing ?? ((t: number) => 1 - Math.pow(1 - t, 3)),
    })
    return
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// 滚动到指定元素
export function scrollToAnchor(
  element: HTMLElement,
  offset = 0,
  duration = 1,
): void {
  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - offset

  const lenis = getLenis()

  if (lenis) {
    lenis.scrollTo(offsetPosition, {
      duration,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    })
  } else {
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })
  }
}

// 阻止嵌套滚动容器事件冒泡：当容器内部还可滚动时不冒泡到外层
export function stopWheelPropagationWhenScrollable(e: WheelEvent): void {
  const currentTarget = e.currentTarget as HTMLElement | null
  if (!currentTarget) return

  const { scrollTop, scrollHeight, clientHeight } = currentTarget
  const delta = e.deltaY
  const canScroll = scrollHeight > clientHeight + 1

  if (!canScroll) return

  const isScrollingUp = delta < 0
  const isScrollingDown = delta > 0
  const atTop = scrollTop <= 0
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1

  if ((isScrollingUp && !atTop) || (isScrollingDown && !atBottom)) {
    e.stopPropagation()
  }
}
