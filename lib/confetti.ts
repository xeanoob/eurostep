import confetti from 'canvas-confetti'
import { playSuccess } from './sound'

export function triggerExactScoreConfetti() {
  if (typeof window === 'undefined') return

  // Only trigger once per session to avoid spamming
  if (sessionStorage.getItem('exact-score-seen')) return
  sessionStorage.setItem('exact-score-seen', 'true')

  // Play sound
  playSuccess()

  // Confetti explosion
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: any) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }))
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })
  fire(0.2, {
    spread: 60,
  })
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}
