// Game.tsx — Labyrinth exploration view. React owns the shell/HUD/tweaks;
// canvases (first-person, minimap) are drawn by useGame's rAF loop.

import { getWorld } from '../worlds'
import { theme } from '../theme'
import { useGame } from './useGame'
import { useAudio, useLandingMusic } from '../audio'
import { Hud } from './Hud'
import { Minimap } from './Minimap'
import { GameTweaks } from './GameTweaks'
import { AudioTweaks } from './AudioTweaks'

export default function Game({ onExit }: { onExit: () => void }) {
  // useAudio constructs the engine + unlocks it on first gesture; mute/volume now
  // flow through the Tweaks state (the loop pushes them to the engine each frame).
  const { engine } = useAudio();
  const { canvasRef, miniRef, hud, hint, touch, t, setTweak } = useGame(engine);
  // the same shuffle-music bed as the landing, but quiet (background, not the focus).
  // Controlled by the soundMusic/musicVolume tweaks; muting all audio mutes it too.
  useLandingMusic({ volume: t.musicVolume, off: !t.soundMusic || t.audioMuted });

  return (
    <div style={{ position: 'fixed', inset: 0, background: getWorld(t.world, t.mrTime, t.stainAmount, t.crackAmount).fogCss, color: theme.hud.secondary, fontFamily: theme.font.mono, overflow: 'hidden' }}>
      {/* touchAction:none so swipe-to-move isn't eaten by page scroll / pinch-zoom */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

      <Hud steps={hud.steps} charted={hud.charted} reached={hud.reached} hint={hint} touch={touch} onExit={onExit} />

      <Minimap miniRef={miniRef} show={t.showMinimap} />

      {/* mute toggle — bottom-left, ships to players; drives the audioMuted tweak */}
      <button
        onClick={() => setTweak('audioMuted', !t.audioMuted)}
        aria-label={t.audioMuted ? 'Unmute' : 'Mute'}
        style={{ position: 'absolute', left: 14, bottom: 14, width: 36, height: 36, display: 'grid', placeItems: 'center', background: 'transparent', border: `1px solid ${theme.hud.secondary}`, borderRadius: 6, color: theme.hud.secondary, fontFamily: theme.font.mono, cursor: 'pointer', opacity: 0.7 }}
      >
        {t.audioMuted ? '🔇' : '🔊'}
      </button>

      {/* dev-only tuning panels; gated like the landing's CorridorTweaks so they never ship to players */}
      {import.meta.env.DEV && <GameTweaks t={t} setTweak={setTweak} />}
      {import.meta.env.DEV && <AudioTweaks t={t} setTweak={setTweak} />}
    </div>
  );
}
