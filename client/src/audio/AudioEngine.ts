// AudioEngine.ts — a small, framework-agnostic audio core over the Web Audio API.
// No React inside; it's a plain class the game loop calls imperatively. See audio.md.
//
// Responsibilities:
//  - own one AudioContext + a master GainNode (global volume / mute)
//  - load + decode each asset to an AudioBuffer once (cached, deduped in-flight)
//  - playOneShot: fresh BufferSourceNode per call, so overlaps "just work"
//  - beds + the breath loop: one looping source each, behind their own GainNode,
//    with sample-accurate gain ramps for fades / crossfades
//  - unlock(): resume() the context on the first user gesture (autoplay policy)

import { SOUNDS, defOf, type SoundName } from './sounds'
import { clamp01 } from '../lib/num'

interface Loop {
  src: AudioBufferSourceNode
  gain: GainNode
  target: number // base volume from the manifest (the fade-in ceiling on startLoop)
  // change-gating: the last gain handed to setLoopGain. NaN forces the next call to
  // (re)apply — seeded on start and on revive — so a restarted bed always ramps once
  // instead of being skipped as "already at target".
  requested: number
  // a pending teardown (fade-out then stop+dispose), kept cancelable so a quick
  // re-start within the fade can revive this source instead of spawning a second one.
  stopTimer: ReturnType<typeof setTimeout> | null
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private buffers = new Map<SoundName, AudioBuffer>()
  private loading = new Map<SoundName, Promise<AudioBuffer | null>>()
  private loops = new Map<SoundName, Loop>() // active beds + breath, keyed by name
  private _muted = false
  private _volume = 0.8
  private unlocked = false
  private disposed = false
  private _warnedLocked = false // dev: one-shot "audio dropped while locked" breadcrumb

  // Lazily create the context — must happen inside / after a user gesture or some
  // browsers create it 'suspended' and never start it. unlock() handles resume().
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this._muted ? 0 : this._volume
      this.master.connect(this.ctx.destination)
    }
    return this.ctx
  }

  // Call from the first click/keydown. Resumes a suspended context and kicks off
  // preloading. Safe to call repeatedly. Returns true once the context is actually
  // running — the caller keeps re-firing on gestures until then, because a single
  // gesture's resume() can be refused (or still be pending) under the autoplay policy.
  //
  // A prior dispose() does NOT permanently kill the engine: if unlock() is being
  // called, this instance is in use again, so clear the disposed flag and let
  // ensureCtx() rebuild a fresh context. This is what makes the engine survive
  // React StrictMode's mount→cleanup→mount probe in dev (which fires dispose() on the
  // throwaway first mount, but useState keeps the SAME instance for the real one) and
  // any real remount (landing → game → landing → game).
  async unlock(): Promise<boolean> {
    this.disposed = false
    const ctx = this.ensureCtx()
    if (ctx.state === 'suspended') { try { await ctx.resume() } catch { /* ignore */ } }
    // only consider ourselves unlocked once the context is genuinely running; a
    // suspended context here means the gesture didn't take — let the caller retry.
    this.unlocked = ctx.state === 'running'
    if (this.unlocked) this.preload()
    return this.unlocked
  }

  get muted() { return this._muted }
  get volume() { return this._volume }

  // The game loop pushes these every frame; skip the redundant GainNode write unless
  // the value actually changed (it only moves on a mute toggle / volume drag).
  setVolume(v: number) {
    v = clamp01(v)
    if (v === this._volume) return
    this._volume = v
    if (this.master && !this._muted) this.master.gain.value = v
  }

  setMuted(m: boolean) {
    if (m === this._muted) return
    this._muted = m
    if (this.master) this.master.gain.value = m ? 0 : this._volume
  }

  // --- loading ----------------------------------------------------------------

  private async load(name: SoundName): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(name)
    if (cached) return cached
    const inflight = this.loading.get(name)
    if (inflight) return inflight
    const ctx = this.ensureCtx()
    const p = (async () => {
      try {
        const res = await fetch(defOf(name).url)
        const arr = await res.arrayBuffer()
        const buf = await ctx.decodeAudioData(arr)
        this.buffers.set(name, buf)
        return buf
      } catch (e) {
        console.warn(`[audio] failed to load ${name}`, e)
        return null
      } finally {
        this.loading.delete(name)
      }
    })()
    this.loading.set(name, p)
    return p
  }

  // fetch+decode everything flagged preload in the manifest, fire-and-forget
  private preload() {
    for (const name of Object.keys(SOUNDS) as SoundName[]) {
      if (defOf(name).preload) void this.load(name)
    }
  }

  // --- one-shots --------------------------------------------------------------

  // Fire and forget. opts.gain scales the manifest volume (e.g. by distance/intensity);
  // opts.rate overrides pitch (else manifest pitchVar applies a small random wobble).
  playOneShot(name: SoundName, opts: { gain?: number; rate?: number } = {}) {
    if (!this.unlocked || this._muted) {
      // dev-only breadcrumb: if movement is silent, this tells you WHY at a glance —
      // still locked (no successful unlock gesture) vs. muted. Remove once audio is happy.
      if (import.meta.env.DEV && !this._warnedLocked) {
        this._warnedLocked = true
        console.warn(`[audio] dropped "${name}" — ${this._muted ? 'muted' : 'context not unlocked yet'} (ctx: ${this.ctx?.state ?? 'none'})`)
      }
      return
    }
    const def = defOf(name)
    const buf = this.buffers.get(name)
    if (!buf) { void this.load(name); return } // not ready yet; skip this trigger
    const ctx = this.ensureCtx()
    const src = ctx.createBufferSource()
    src.buffer = buf
    const pv = def.pitchVar ?? 0
    src.playbackRate.value = opts.rate ?? (pv ? 1 + (Math.random() * 2 - 1) * pv : 1)
    const g = ctx.createGain()
    g.gain.value = def.volume * (opts.gain ?? 1)
    src.connect(g); g.connect(this.master!)
    src.start()
    src.onended = () => { src.disconnect(); g.disconnect() }
  }

  // --- looping beds + breath --------------------------------------------------

  // Start a loop (bed or the breath loop) if not already running. Begins at gain 0
  // and ramps to its manifest volume over fadeSec (0 = instant). Idempotent.
  startLoop(name: SoundName, fadeSec = 1.5) {
    if (!this.unlocked) return
    const existing = this.loops.get(name)
    if (existing) {
      // revive a loop caught mid-fade-out: cancel its pending teardown and let the
      // next setLoopGain ramp it back up (its source was never stopped). A loop that
      // isn't fading out is already running — nothing to do.
      if (existing.stopTimer) { clearTimeout(existing.stopTimer); existing.stopTimer = null; existing.requested = NaN }
      return
    }
    const buf = this.buffers.get(name)
    if (!buf) { void this.load(name); return }
    const ctx = this.ensureCtx()
    const src = ctx.createBufferSource()
    src.buffer = buf; src.loop = true
    const gain = ctx.createGain()
    const target = defOf(name).volume
    gain.gain.value = 0
    src.connect(gain); gain.connect(this.master!)
    src.start()
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + Math.max(0.001, fadeSec))
    this.loops.set(name, { src, gain, target, requested: NaN, stopTimer: null })
  }

  // Ramp a loop to a new gain (relative to nothing — absolute 0..1) over fadeSec.
  // Used to modulate the breath loop's intensity, or duck a bed.
  setLoopGain(name: SoundName, gain: number, fadeSec = 0.2) {
    const loop = this.loops.get(name)
    if (!loop || !this.ctx) return
    const g = Math.max(0, gain)
    // skip the reschedule when the target hasn't moved — the beds sit at a constant
    // gain for long stretches while this is called every frame. (Breath passes a new
    // value each frame, so it still ramps; that modulation is intentional.)
    if (Math.abs(g - loop.requested) < 1e-4) return
    loop.requested = g
    const t = this.ctx.currentTime
    loop.gain.gain.cancelScheduledValues(t)
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, t)
    loop.gain.gain.linearRampToValueAtTime(g, t + Math.max(0.001, fadeSec))
  }

  // Ramp a loop's playback RATE (pitch+speed) toward `rate` over fadeSec. Used to
  // speed the breath loop up as the player exerts. 1 = original speed. Clamped sane.
  setLoopRate(name: SoundName, rate: number, fadeSec = 0.3) {
    const loop = this.loops.get(name)
    if (!loop || !this.ctx) return
    const r = Math.max(0.5, Math.min(2.5, rate))
    const t = this.ctx.currentTime
    const p = loop.src.playbackRate
    p.cancelScheduledValues(t)
    p.setValueAtTime(p.value, t)
    p.linearRampToValueAtTime(r, t + Math.max(0.001, fadeSec))
  }

  // Fade a loop out over fadeSec then stop+dispose it. The stop is deferred on a
  // cancelable timer (not scheduled on the source) so a re-start within the fade can
  // revive the same source — see startLoop. Idempotent: a loop already fading is left be.
  stopLoop(name: SoundName, fadeSec = 1.2) {
    const loop = this.loops.get(name)
    if (!loop || !this.ctx || loop.stopTimer) return
    const t = this.ctx.currentTime
    loop.gain.gain.cancelScheduledValues(t)
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, t)
    loop.gain.gain.linearRampToValueAtTime(0, t + fadeSec)
    loop.stopTimer = setTimeout(() => {
      try { loop.src.stop() } catch { /* already stopped */ }
      try { loop.src.disconnect(); loop.gain.disconnect() } catch { /* noop */ }
      this.loops.delete(name)
    }, (fadeSec + 0.05) * 1000)
  }

  // Stop everything (e.g. leaving the game screen).
  stopAll(fadeSec = 0.6) {
    for (const name of [...this.loops.keys()]) this.stopLoop(name, fadeSec)
  }

  // Tear down: close the AudioContext and drop all nodes. Called on unmount so
  // contexts don't pile up (Chrome caps ~6 and then refuses new ones). NOT permanent —
  // a later unlock() clears `disposed` and ensureCtx() rebuilds, so the SAME instance
  // can be reused after React StrictMode's speculative cleanup→remount (and any real
  // remount). After a genuine unmount no gesture reaches unlock() (listeners detached),
  // so it stays disposed as intended.
  dispose() {
    this.disposed = true
    this.unlocked = false
    for (const loop of this.loops.values()) { if (loop.stopTimer) clearTimeout(loop.stopTimer) }
    this.loops.clear()
    void this.ctx?.close().catch(() => { /* already closed */ })
    this.ctx = null
    this.master = null
  }
}
