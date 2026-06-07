// Game.tsx — Labyrinth exploration view. React owns the shell/HUD/tweaks;
// canvases (first-person, minimap) are drawn by useGame's rAF loop.

import { getWorld } from '../worlds'
import { useGame } from './useGame'
import { Hud } from './Hud'
import { Minimap } from './Minimap'
import { GameTweaks } from './GameTweaks'

const mono = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export default function Game() {
  const { canvasRef, miniRef, hud, hint, t, setTweak } = useGame();

  return (
    <div style={{ position: 'fixed', inset: 0, background: getWorld(t.world, t.mrTime, t.stainAmount, t.crackAmount).fogCss, color: '#cdd6e3', fontFamily: mono, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      <Hud steps={hud.steps} charted={hud.charted} reached={hud.reached} hint={hint} />

      <Minimap miniRef={miniRef} show={t.showMinimap} />

      <GameTweaks t={t} setTweak={setTweak} />
    </div>
  );
}
