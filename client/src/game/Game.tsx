// Game.tsx — Labyrinth exploration view. React owns the shell/HUD/tweaks;
// canvases (first-person, minimap) are drawn by useGame's rAF loop.

import { getWorld } from '../worlds'
import { theme } from '../theme'
import { useGame } from './useGame'
import { Hud } from './Hud'
import { Minimap } from './Minimap'
import { GameTweaks } from './GameTweaks'

export default function Game({ onExit }: { onExit: () => void }) {
  const { canvasRef, miniRef, hud, hint, touch, t, setTweak } = useGame();

  return (
    <div style={{ position: 'fixed', inset: 0, background: getWorld(t.world, t.mrTime, t.stainAmount, t.crackAmount).fogCss, color: theme.hud.secondary, fontFamily: theme.font.mono, overflow: 'hidden' }}>
      {/* touchAction:none so swipe-to-move isn't eaten by page scroll / pinch-zoom */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

      <Hud steps={hud.steps} charted={hud.charted} reached={hud.reached} hint={hint} touch={touch} onExit={onExit} />

      <Minimap miniRef={miniRef} show={t.showMinimap} />

      {/* dev-only tuning panel; gated like the landing's CorridorTweaks so it never ships to players */}
      {import.meta.env.DEV && <GameTweaks t={t} setTweak={setTweak} />}
    </div>
  );
}
