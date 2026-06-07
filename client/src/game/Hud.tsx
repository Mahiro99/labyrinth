// Hud.tsx — the top HUD bar, the exit-reached banner, and the movement hint.
// Purely presentational; reads throttled stats from useGame via props. Colours,
// fonts, and the legibility shadow all come from the central theme. The left
// "‹ LABYRINTH" block doubles as the back-to-menu control so a touch player (no
// keyboard, no URL bar) is never trapped on the game screen. Control hints adapt
// to a coarse pointer (swipe copy instead of arrow/WASD keys).

import { theme } from '../theme'

const hud = theme.hud

export function Hud(
  { steps, charted, reached, hint, touch, onExit }:
  { steps: number; charted: number; reached: boolean; hint: boolean; touch: boolean; onExit: () => void },
) {
  return (
    <>
      {/* top HUD bar — text shadowed so it stays readable over a bright daytime view */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: 'calc(16px + env(safe-area-inset-top)) calc(22px + env(safe-area-inset-right)) 16px calc(22px + env(safe-area-inset-left))',
        pointerEvents: 'none', background: hud.scrim, textShadow: hud.shadow }}>
        {/* clickable: back to the menu */}
        <button onClick={onExit} title="Back to menu"
          style={{ pointerEvents: 'auto', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
            textAlign: 'left', lineHeight: 1.4, font: 'inherit', color: 'inherit', textShadow: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, letterSpacing: '0.38em', color: hud.title, fontWeight: 700 }}>
            <span style={{ fontSize: 17, fontWeight: 400, letterSpacing: 0 }}>‹</span>LABYRINTH
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: hud.dim }}>DAILY MAZE · 2026-06-02</div>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.28em', color: hud.secondary }}>FIND THE EXIT</div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: hud.dim }}>NO ONE HAS YET</div>
        </div>
        {/* in dev the Tweaks FAB sits in this corner, so drop the stats clear of it; in prod the FAB is gated out */}
        <div style={{ textAlign: 'right', lineHeight: 1.5, marginTop: import.meta.env.DEV ? 40 : 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: hud.secondary }}>{steps} STEPS · {charted}% CHARTED</div>
        </div>
      </div>

      {/* exit-reached banner */}
      {reached && (
        <div style={{ position: 'absolute', top: 'calc(74px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', padding: '7px 18px', background: theme.accent.successBg, border: `1px solid ${theme.accent.successBorder}`, color: theme.accent.success, fontSize: 12, letterSpacing: '0.22em', borderRadius: 3, textShadow: hud.shadow }}>
          EXIT REACHED · {steps} STEPS
        </div>
      )}

      {/* movement hint — adapts to input modality */}
      {hint && (
        <div style={{ position: 'absolute', bottom: 'calc(34px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', padding: '9px 18px', background: hud.pillBg, border: `1px solid ${hud.pillBorder}`, borderRadius: 4, fontSize: 12, letterSpacing: '0.16em', color: hud.pillText, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {touch
            ? <>SWIPE TO MOVE&nbsp;—&nbsp;SWIPE&nbsp;←&nbsp;→&nbsp;TO TURN</>
            : <>↑ ← ↓ → &nbsp;/&nbsp; W A S D &nbsp;—&nbsp; EXPLORE THE MAZE</>}
        </div>
      )}
    </>
  );
}
