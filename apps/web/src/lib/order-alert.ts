/** In-page alert sound + local notifications (works while the orders tab is open). */

let audioCtx: AudioContext | null = null

export function primeOrderAlertSound() {
  if (typeof window === 'undefined') return
  audioCtx = audioCtx ?? new AudioContext()
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
}

/** Two-tone chime — no mp3 file; unlocked after a user gesture (e.g. Enable notifications). */
export function playOrderAlertSound() {
  if (typeof window === 'undefined') return
  try {
    const ctx = audioCtx ?? new AudioContext()
    audioCtx = ctx
    void ctx.resume()

    const now = ctx.currentTime
    const tones = [
      { freq: 880, start: 0, dur: 0.14 },
      { freq: 1174, start: 0.16, dur: 0.22 },
    ]

    for (const tone of tones) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(tone.freq, now + tone.start)
      gain.gain.setValueAtTime(0.0001, now + tone.start)
      gain.gain.exponentialRampToValueAtTime(0.4, now + tone.start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.dur)
      osc.start(now + tone.start)
      osc.stop(now + tone.start + tone.dur + 0.05)
    }
  } catch {
    /* ignore */
  }
}

export function showLocalOrderAlert(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/vercel.svg',
      tag: `eatery-alert-${Date.now()}`,
    })
  } catch {
    /* ignore */
  }
}

export function alertNewOrder(message: string) {
  playOrderAlertSound()
  showLocalOrderAlert('New order', message)
}

export function alertServiceRequest(message: string) {
  playOrderAlertSound()
  showLocalOrderAlert('Table request', message)
}
