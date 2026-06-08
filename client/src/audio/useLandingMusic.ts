// useLandingMusic.ts — owns a LandingMusic shuffle bed for a screen. Starts it on
// the player's first gesture (autoplay policy) and fades it out on unmount. Used on
// the landing page (its own ♪ toggle + persisted volume) and in-game (a quieter bed
// driven by a Tweak). See audio.md / landingMusic.ts.

import { useEffect, useState } from 'react'
import { LandingMusic } from './landingMusic'

const VOL_KEY = 'dm.music.volume'
const OFF_KEY = 'dm.music.off'

function readNum(key: string, dflt: number) {
  try { const v = localStorage.getItem(key); return v == null ? dflt : Number(v) } catch { return dflt }
}
function readBool(key: string, dflt: boolean) {
  try { const v = localStorage.getItem(key); return v == null ? dflt : v === '1' } catch { return dflt }
}

interface MusicOpts {
  // Fixed volume + on/off, driven externally (e.g. game Tweaks). When omitted, the
  // hook self-manages volume + an on/off toggle, persisted to localStorage (landing).
  volume?: number
  off?: boolean
}

export function useLandingMusic(opts?: MusicOpts) {
  const controlled = opts !== undefined
  // one instance per mount; lazy useState initializer runs once
  const [music] = useState(() => new LandingMusic())
  // self-managed (landing) state — ignored when controlled
  const [volume, setVolumeState] = useState(() => readNum(VOL_KEY, 0.45))
  const [off, setOffState] = useState(() => readBool(OFF_KEY, false))

  const effVol = controlled ? (opts!.volume ?? 0.2) : volume
  const effOff = controlled ? (opts!.off ?? false) : off

  // push volume/off into the bed (off = volume 0; the bed keeps running so toggling
  // back on is instant). Persist only when self-managed.
  useEffect(() => {
    music.setVolume(effOff ? 0 : effVol)
    if (!controlled) {
      try { localStorage.setItem(VOL_KEY, String(volume)); localStorage.setItem(OFF_KEY, off ? '1' : '0') } catch { /* noop */ }
    }
  }, [music, effVol, effOff, controlled, volume, off])

  // start on the first user gesture; retry-friendly (start() is idempotent and
  // self-resets if the browser blocks the play() call).
  useEffect(() => {
    const begin = () => { void music.start() }
    const o = { passive: true } as const
    window.addEventListener('pointerdown', begin, o)
    window.addEventListener('keydown', begin, o)
    window.addEventListener('touchstart', begin, o)
    window.addEventListener('pointermove', begin, o)
    return () => {
      window.removeEventListener('pointerdown', begin)
      window.removeEventListener('keydown', begin)
      window.removeEventListener('touchstart', begin)
      window.removeEventListener('pointermove', begin)
      music.stop() // screen unmounting → fade the bed out
    }
  }, [music])

  return {
    volume: effVol,
    off: effOff,
    setVolume: (v: number) => setVolumeState(Math.max(0, Math.min(1, v))),
    toggleOff: () => setOffState(o => !o),
  }
}
