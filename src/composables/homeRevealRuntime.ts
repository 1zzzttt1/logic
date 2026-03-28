import { ref } from 'vue'

const preloaderPlayedInRuntime = ref(false)
const heroGateReady = ref(false)

export function useHomeRevealRuntime() {
  return {
    preloaderPlayedInRuntime,
    heroGateReady,
  }
}

export function markPreloaderPlayedInRuntime() {
  preloaderPlayedInRuntime.value = true
}

export function setHeroGateReady(value: boolean) {
  heroGateReady.value = value
}