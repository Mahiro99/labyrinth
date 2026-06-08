// useAudio.ts — owns the AudioEngine's lifetime. Constructs one engine, unlocks it on
// the first user gesture (browser autoplay policy), and disposes it on unmount. Mute
// and volume are NOT handled here — they live in the Tweaks state and the game loop
// pushes them to the engine each frame (see useGame + audio.md). The engine is returned
// so the loop can fire one-shots imperatively (React never sees per-frame audio events).

import { useEffect, useState } from 'react'
import { AudioEngine } from './AudioEngine'

export function useAudio() {
  // one engine per mount — the lazy useState initializer runs exactly once
  const [engine] = useState(() => new AudioEngine())

  // Unlock the audio context on a user gesture. Without a gesture the context stays
  // suspended and nothing plays (autoplay policy). This is retry-friendly, NOT
  // once-only: a single gesture's resume() can come back still-suspended (it loses the
  // race with the synchronous first keypress, or the policy refuses it), so we keep
  // listening until unlock() reports the context is genuinely running, then detach.
  // (The old `{ once:true }` fire-and-forget detached after the first gesture even when
  // resume() hadn't taken — leaving the in-game engine permanently silent.)
  // On unmount (leaving the game screen) dispose the engine so its AudioContext is
  // closed, not orphaned — browsers cap concurrent contexts and a fresh engine is built
  // next mount.
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchstart'] as const
    const opts = { passive: true } as const
    const detach = () => { for (const e of events) window.removeEventListener(e, unlock) }
    const unlock = () => { void engine.unlock().then(ok => { if (ok) detach() }) }
    for (const e of events) window.addEventListener(e, unlock, opts)
    return () => { detach(); engine.dispose() }
  }, [engine])

  return { engine }
}
