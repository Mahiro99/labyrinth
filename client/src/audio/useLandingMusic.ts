// useLandingMusic.ts — owns a LandingMusic shuffle bed for a screen. Starts it on
// the player's first gesture (autoplay policy) and fades it out on unmount. Used on
// the landing page (its own ♪ toggle + persisted volume) and in-game (a quieter bed
// driven by a Tweak). See audio.md / landingMusic.ts.

import { useEffect, useState } from 'react'
import { LandingMusic } from './landingMusic'
import { clamp01 } from '../lib/num'

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

  // Start on the first user gesture. CRITICAL: only ACTIVATION gestures (pointerdown /
  // keydown / touchstart / click) — NOT pointermove. Browsers gate audio behind a real
  // user activation; mouse movement does NOT grant it. The old list included pointermove,
  // so on a fresh page load (direct/refresh into the game, no prior interaction) the first
  // mouse move fired start() before any activation existed → play() resolved into a
  // silent/suppressed state, latched started=true, detached the listeners, and never
  // retried = permanent silence. Coming FROM the landing it worked only because the page
  // already had "sticky activation" from earlier clicks. Dropping pointermove means the
  // first start() is always driven by a genuine activation (a click or the arrow keys you
  // press to play), so play() is allowed.
  useEffect(() => {
    // Every ACTIVATION gesture the player might make to start moving — a click, a key
    // (arrow / WASD → keydown), or a touch/swipe (touchstart/touchend) — so the music
    // kicks in the moment they interact, however they move. pointerup/keyup/touchend are
    // here because some browsers grant the audio activation on the release, not the press.
    // STILL no pointermove: mouse movement is not a user activation, so it can't start
    // audio and listening for it just re-introduces the silent-on-refresh bug.
    const events = ['pointerdown', 'pointerup', 'keydown', 'keyup', 'touchstart', 'touchend', 'click']
    const begin = (e?: Event) => {
      if (import.meta.env.DEV) {
        const ua = (navigator as Navigator & { userActivation?: { isActive: boolean; hasBeenActive: boolean } }).userActivation
        console.log('[music] gesture', e?.type, '→ start() (off:', effOff, 'vol:', effVol, '| activation active:', ua?.isActive, 'hasBeenActive:', ua?.hasBeenActive, ')')
      }
      void music.start().then(ok => { if (ok) removeAll() })
    }
    const removeAll = () => { for (const e of events) window.removeEventListener(e, begin) }
    const o = { passive: true } as const
    for (const e of events) window.addEventListener(e, begin, o)
    if (import.meta.env.DEV) console.log('[music] listeners attached, waiting for ACTIVATION gesture (click/key, not mousemove)')
    return () => { removeAll(); music.stop() } // screen unmounting → fade the bed out
  }, [music])

  return {
    volume: effVol,
    off: effOff,
    setVolume: (v: number) => setVolumeState(clamp01(v)),
    toggleOff: () => setOffState(o => !o),
  }
}
