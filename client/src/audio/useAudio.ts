// useAudio.ts — the React seam that owns the AudioEngine's lifetime. Constructs one
// engine, unlocks it on the first user gesture (browser autoplay policy), and
// persists mute/volume in localStorage. The engine itself is returned so the game
// loop can fire one-shots imperatively (React never sees per-frame audio events).
//
// Usage: call once high in the tree (or in the game shell) and pass engine down to
// useGame. See audio.md.

import { useEffect, useState } from 'react'
import { AudioEngine } from './AudioEngine'

const MUTE_KEY = 'dm.audio.muted'
const VOL_KEY = 'dm.audio.volume'

function readBool(key: string, dflt: boolean) {
  try { const v = localStorage.getItem(key); return v == null ? dflt : v === '1' } catch { return dflt }
}
function readNum(key: string, dflt: number) {
  try { const v = localStorage.getItem(key); return v == null ? dflt : Number(v) } catch { return dflt }
}

export function useAudio() {
  // one engine for the app's lifetime — lazy useState initializer runs exactly once
  const [engine] = useState(() => new AudioEngine())

  const [muted, setMutedState] = useState(() => readBool(MUTE_KEY, false))
  const [volume, setVolumeState] = useState(() => readNum(VOL_KEY, 0.8))

  // push persisted prefs into the engine on mount + whenever they change
  useEffect(() => { engine.setMuted(muted); try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0') } catch { /* noop */ } }, [engine, muted])
  useEffect(() => { engine.setVolume(volume); try { localStorage.setItem(VOL_KEY, String(volume)) } catch { /* noop */ } }, [engine, volume])

  // unlock the audio context on the very first user gesture, then detach. Without a
  // gesture the context stays suspended and nothing plays (autoplay policy).
  useEffect(() => {
    const unlock = () => { void engine.unlock() }
    const opts = { once: true, passive: true } as const
    window.addEventListener('pointerdown', unlock, opts)
    window.addEventListener('keydown', unlock, opts)
    window.addEventListener('touchstart', unlock, opts)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [engine])

  const setMuted = (m: boolean) => setMutedState(m)
  const toggleMuted = () => setMutedState(m => !m)
  const setVolume = (v: number) => setVolumeState(Math.max(0, Math.min(1, v)))

  return { engine, muted, volume, setMuted, toggleMuted, setVolume }
}
