'use client'

export function playTick() {
  if (typeof window === 'undefined') return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05)
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  } catch (e) {
    // Ignore errors on devices without audio support
  }
}

export function playSuccess() {
  if (typeof window === 'undefined') return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    // Play a nice two-tone chord (like a swish or level up)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, startTime)
      
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    
    const now = ctx.currentTime
    playNote(440, now, 0.3) // A4
    playNote(554.37, now + 0.1, 0.4) // C#5
    playNote(659.25, now + 0.2, 0.5) // E5
  } catch (e) {
    // Ignore
  }
}
