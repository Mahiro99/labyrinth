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

import { clamp01 } from '../lib/num'

const MUSIC_URLS = [
  '/sounds/music/atlasaudio-suspense-tension-511877.mp3',
  '/sounds/music/atlasaudio-tension-documentary-519912.mp3',
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
  private started = false
  private stopped = false
  // consecutive track-load failures; caps the skip-on-error retry so a run of dead
  // URLs can't loop forever. Reset to 0 whenever a track actually plays.
  private fails = 0

  // Detach a finished/failed element WITHOUT the `el.src = ''` footgun: an empty src
  // re-resolves against the document base URL, so the browser tries to load the SPA's
  // index.html as media ("No decoders for text/html"). removeAttribute + load() is the
  // spec-correct way to release the source cleanly. Also drops our end-of-track listeners.
  private release(el: HTMLAudioElement) {
    try { el.pause() } catch { /* noop */ }
    el.removeAttribute('src')
    try { el.load() } catch { /* noop */ }
  }

  // A track failed to load/decode (e.g. a deleted file the dev server answers with
  // index.html, or a real 404 in prod). Skip it and try another, so one missing track
  // never silences the bed — bounded by `fails` so an all-dead playlist gives up cleanly.
  // Keeps `started` true throughout (we're still playing, just swapping the source) and
  // replaces `current` in place rather than going through the crossfade path.
  private onTrackError(el: HTMLAudioElement) {
    if (import.meta.env.DEV) console.warn('[music] track failed, skipping:', el.currentSrc || el.src, 'err', el.error?.code)
    if (this.stopped) return
    if (el === this.next) this.next = null
    if (el !== this.current) { this.release(el); return } // a stale/superseded element — just free it
    this.release(el)
    this.current = null
    if (this.fails++ >= MUSIC_URLS.length) { this.started = false; return } // all tracks dead — give up, allow a future restart
    const repl = this.makeEl(this.pickIndex()) // pickIndex avoids lastIndex → a different track
    this.current = repl
    this.bindEndOfTrack(repl) // CRUCIAL: the start()/advance() paths bind this; the error-skip
    // path forgot to — without it the replacement plays once and nothing ever crossfades again,
    // so the bed goes permanently silent after a single failed track (the case this path exists for).
    repl.play().then(() => {
      if (this.stopped || this.current !== repl) { this.release(repl); return }
      this.fails = 0
      this.fadeTo(repl, this.maxVol, CROSSFADE_SEC)
    }).catch(() => { /* its own 'error' listener re-enters here, bounded by `fails` */ })
  }

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
    // a dead/undecodable track (deleted file → SPA index.html, or a real 404) skips to
    // another instead of logging "playing" while silent
    el.addEventListener('error', () => this.onTrackError(el), { once: true })
    return el
  }

  // Begin playback. Idempotent — safe to call from the first-gesture handler even if it
  // fires more than once. Returns true once the track is actually playing, false if the
  // browser blocked it (no gesture yet) so the caller can keep its listeners attached
  // and retry on the next gesture.
  async start(): Promise<boolean> {
    if (this.started) return true
    // A prior stop() does NOT permanently kill this instance: being asked to start
    // again means the music is wanted, so clear the flag and play. This is what lets
    // the bed survive React StrictMode's mount→cleanup→mount probe in dev (cleanup
    // calls stop() on the throwaway first mount, but useState keeps the SAME instance
    // for the real one) and any real remount (landing → game → landing). Without this,
    // start() stayed a permanent no-op and the music never played.
    this.stopped = false
    this.started = true
    const el = this.makeEl(this.pickIndex())
    this.current = el
    this.bindEndOfTrack(el)
    try { await el.play() } catch (e) {
      // superseded while pending (its 'error' fired → onTrackError swapped in a
      // replacement that owns `current`/`started`): bail without disturbing that state.
      if (this.current !== el) return false
      this.started = false // genuinely blocked (autoplay) → retry on the next gesture
      if (import.meta.env.DEV) console.warn('[music] play() blocked, will retry on next gesture', e)
      return false
    }
    // stop() may have landed while play() was pending (StrictMode cleanup, or a fast
    // dive) and disposed `el` — don't fade in a dead element or claim success. Treat it
    // as not-started so the next gesture rebuilds cleanly.
    if (this.stopped) { this.started = false; return false }
    // `el` was superseded while play() was pending — e.g. its 'error' fired and
    // onTrackError swapped `current` to a replacement. Don't fade in or reset on the
    // dead element; the replacement path owns `current`/`started` now.
    if (this.current !== el) return true
    this.fails = 0 // a real play() resolved — clear the skip-on-error budget
    if (import.meta.env.DEV) console.log('[music] playing — maxVol', this.maxVol.toFixed(2))
    this.fadeTo(el, this.maxVol, CROSSFADE_SEC)
    return true
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
    // safety net: if timeupdate stalls, still advance at 'ended'. Guard on `el === current`:
    // after a NORMAL crossfade the outgoing element is no longer `current` (advance() swapped
    // in the next track), so its natural 'ended' — which lands ~right as the 4s fade finishes —
    // must NOT advance again (that double-advance killed every other track after ~8s). Only a
    // stalled track that never crossfaded is still `current` here, so the net still catches it.
    el.addEventListener('ended', () => { if (el === this.current && !this.next) this.advance() }, { once: true })
  }

  // Start the next track and crossfade current → next.
  private advance() {
    if (this.stopped) return
    const nextEl = this.makeEl(this.pickIndex())
    this.next = nextEl
    this.bindEndOfTrack(nextEl)
    nextEl.play().then(() => {
      // stop() may have landed while play() was pending — don't resurrect the track
      if (this.stopped) { this.release(nextEl); this.next = null; return }
      this.fails = 0 // the next track is genuinely playing — clear the skip budget
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
      el.volume = clamp01(from + (to - from) * (step / steps))
      if (step >= steps) {
        clearInterval(tag._fade!); tag._fade = undefined
        if (disposeAtEnd) this.release(el)
      }
    }, TICK_MS)
  }

  // Master volume / mute for the bed (0..1). Scales the active ramp ceiling.
  setVolume(v: number) {
    this.maxVol = clamp01(v)
    if (this.current) this.fadeTo(this.current, this.maxVol, 0.3)
  }

  // Fade everything out and tear down (landing unmount / dive). NOT permanent — a later
  // start() clears `stopped`/`started` and revives the instance (so it survives
  // StrictMode's speculative cleanup and real remounts). After a genuine unmount no
  // gesture reaches start() (listeners detached), so it stays stopped as intended.
  //
  // CRUCIAL: reset `started` too. StrictMode's dev probe is mount → start() (sets
  // started=true, play() pending) → cleanup stop() (disposes that very element) →
  // remount. If `started` stayed true, the next real gesture's start() would hit the
  // `if (this.started) return true` fast-path and never create a fresh element — so the
  // music was permanently silent on a direct game load (but fine via the landing, whose
  // own instance absorbed the probe). Clearing it here lets the real start() rebuild.
  stop(fadeSec = 1.2) {
    this.stopped = true
    this.started = false
    for (const el of [this.current, this.next]) {
      if (el) this.fadeTo(el, 0, fadeSec, /*disposeAtEnd*/ true)
    }
    this.current = this.next = null
  }
}
