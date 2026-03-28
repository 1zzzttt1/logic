let playedInCurrentRuntime = false

export function hasHomeRevealPlayedInRuntime() {
  return playedInCurrentRuntime
}

export function markHomeRevealPlayedInRuntime() {
  playedInCurrentRuntime = true
}

export function resetHomeRevealPlayedInRuntime() {
  playedInCurrentRuntime = false
}