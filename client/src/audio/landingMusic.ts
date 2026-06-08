// landingMusic.ts — sequential-shuffle background score for the landing page.
//
// Why this is separate from AudioEngine: the in-game engine decodes whole files
// into AudioBuffers (right for short, overlapping SFX). These are 1.5–4 min stereo
// score tracks — decoding them all to buffers would hold tens of MB and block. So
// music STREAMS through plain HTMLAudioElements; we just automate their .volume for
// crossfades. No Web Audio graph needed.
//
// Playback model (see audio.md): pick a random track, play it fully, then crossfade
// into another random track (never the same one twice in a row), forever. One track
// audible at a time. Starts on the first user gesture (autoplay policy), fades out
// when the landing unmounts / the player dives.

const MUSIC_URLS = [
  '/sounds/music/atlasaudio-suspense-tension-511877.mp3',
  '/sounds/music/atlasaudio-tension-documentary-519912.mp3',
  '/sounds/music/texanspaniard-running-355737.mp3',
  '/sounds/music/the_mountain-drama-mystery-375985.mp3',
]

const CROSSFADE_SEC = 4 // overlap when swapping tracks
const TARGET_VOL = 0.45 // ceiling for the bed (music sits under the UI, not over it)
const TICK_MS = 100 // volume-ramp granularity

export class LandingMusic {
  private maxVol = TARGET_VOL
  private current: HTMLAudioElement | null = null
  private next: HTMLAudioElement | null = null
  private lastIndex = -1
  private fadeTimer: ReturnType<typeof setInterval> | null = null
  private started = false
  private stopped = false

  // pick a random track index that isn't the one we just played
  private pickIndex(): number {
    if (MUSIC_URLS.length === 1) return 0
    let i = this.lastIndex
    while (i === this.lastIndex) i = Math.floor(Math.random() * MUSIC_URLS.length)
    this.lastIndex = i
    return i
  }

  private makeEl(index: number): HTMLAudioElement {
    const el = new Audio(MUSIC_URLS[index])
    el.preload = 'auto'
    el.loop = false // we sequence manually so we can crossfade between *different* tracks
    el.volume = 0
    return el
  }

  // Begin playback. Idempotent — safe to call from the first-gesture handler even if
  // it fires more than once. Returns a promise that rejects if the browser blocks
  // playback (no gesture yet); callers can ignore.
  async start(): Promise<void> {
    if (this.started || this.stopped) return
    this.started = true
    const el = this.makeEl(this.pickIndex())
    this.current = el
    this.bindEndOfTrack(el)
    try { await el.play() } catch { this.started = false; return } // blocked → let next gesture retry
    this.fadeTo(el, this.maxVol, CROSSFADE_SEC)
  }

  // When a track nears its end, kick off the crossfade into the next one.
  private bindEndOfTrack(el: HTMLAudioElement) {
    const onTime = () => {
      if (!el.duration || this.next) return
      if (el.duration - el.currentTime <= CROSSFADE_SEC) {
        el.removeEventListener('timeupdate', onTime)
        this.advance()
      }
    }
    el.addEventListener('timeupdate', onTime)
    // safety net: if timeupdate stalls, still advance at 'ended'
    el.addEventListener('ended', () => { if (!this.next) this.advance() }, { once: true })
  }

  // Start the next track and crossfade current → next.
  private advance() {
    if (this.stopped) return
    const nextEl = this.makeEl(this.pickIndex())
    this.next = nextEl
    this.bindEndOfTrack(nextEl)
    nextEl.play().then(() => {
      this.fadeTo(nextEl, this.maxVol, CROSSFADE_SEC)
      if (this.current) this.fadeTo(this.current, 0, CROSSFADE_SEC, /*disposeAtEnd*/ true)
      this.current = nextEl
      this.next = null
    }).catch(() => { this.next = null })
  }

  // Linearly ramp one element's volume toward `to` over `sec`. Multiple concurrent
  // ramps (one per element) coexist; each element owns at most one timer via a tag.
  private fadeTo(el: HTMLAudioElement, to: number, sec: number, disposeAtEnd = false) {
    const from = el.volume
    const steps = Math.max(1, Math.round((sec * 1000) / TICK_MS))
    let step = 0
    const tag = (el as HTMLAudioElement & { _fade?: ReturnType<typeof setInterval> })
    if (tag._fade) clearInterval(tag._fade)
    tag._fade = setInterval(() => {
      step++
      const v = from + (to - from) * (step / steps)
      el.volume = Math.max(0, Math.min(1, v))
      if (step >= steps) {
        clearInterval(tag._fade!); tag._fade = undefined
        if (disposeAtEnd) { el.pause(); el.src = '' }
      }
    }, TICK_MS)
  }

  // Master volume / mute for the bed (0..1). Scales the active ramp ceiling.
  setVolume(v: number) {
    this.maxVol = Math.max(0, Math.min(1, v))
    if (this.current) this.fadeTo(this.current, this.maxVol, 0.3)
  }

  // Fade everything out and tear down (landing unmount / dive). After stop(), start()
  // is a no-op — this instance is done.
  stop(fadeSec = 1.2) {
    this.stopped = true
    if (this.fadeTimer) { clearInterval(this.fadeTimer); this.fadeTimer = null }
    for (const el of [this.current, this.next]) {
      if (el) this.fadeTo(el, 0, fadeSec, /*disposeAtEnd*/ true)
    }
    this.current = this.next = null
  }
}
