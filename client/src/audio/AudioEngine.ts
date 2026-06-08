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

interface Loop {
  src: AudioBufferSourceNode
  gain: GainNode
  target: number // base volume from the manifest, scaled by ramps
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
  // preloading. Safe to call repeatedly.
  async unlock(): Promise<void> {
    const ctx = this.ensureCtx()
    if (ctx.state === 'suspended') { try { await ctx.resume() } catch { /* ignore */ } }
    this.unlocked = true
    this.preload()
  }

  get muted() { return this._muted }
  get volume() { return this._volume }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v))
    if (this.master && !this._muted) this.master.gain.value = this._volume
  }

  setMuted(m: boolean) {
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
      if ((SOUNDS[name] as { preload?: boolean }).preload) void this.load(name)
    }
  }

  // --- one-shots --------------------------------------------------------------

  // Fire and forget. opts.gain scales the manifest volume (e.g. by distance/intensity);
  // opts.rate overrides pitch (else manifest pitchVar applies a small random wobble).
  playOneShot(name: SoundName, opts: { gain?: number; rate?: number } = {}) {
    if (!this.unlocked || this._muted) return
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
    if (this.loops.has(name)) return
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
    this.loops.set(name, { src, gain, target })
  }

  // Ramp a loop to a new gain (relative to nothing — absolute 0..1) over fadeSec.
  // Used to modulate the breath loop's intensity, or duck a bed.
  setLoopGain(name: SoundName, gain: number, fadeSec = 0.2) {
    const loop = this.loops.get(name)
    if (!loop || !this.ctx) return
    const t = this.ctx.currentTime
    loop.gain.gain.cancelScheduledValues(t)
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, t)
    loop.gain.gain.linearRampToValueAtTime(Math.max(0, gain), t + Math.max(0.001, fadeSec))
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

  // Fade a loop out over fadeSec then stop+dispose it.
  stopLoop(name: SoundName, fadeSec = 1.2) {
    const loop = this.loops.get(name)
    if (!loop || !this.ctx) return
    const t = this.ctx.currentTime
    loop.gain.gain.cancelScheduledValues(t)
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, t)
    loop.gain.gain.linearRampToValueAtTime(0, t + fadeSec)
    const src = loop.src
    try { src.stop(t + fadeSec + 0.05) } catch { /* already stopped */ }
    this.loops.delete(name)
    src.onended = () => { try { src.disconnect(); loop.gain.disconnect() } catch { /* noop */ } }
  }

  // Stop everything (e.g. leaving the game screen).
  stopAll(fadeSec = 0.6) {
    for (const name of [...this.loops.keys()]) this.stopLoop(name, fadeSec)
  }
}
