// Hud.tsx — the top HUD bar, the exit-reached banner, and the movement hint.
// Purely presentational; reads throttled stats from useGame via props. Colours,
// fonts, and the legibility shadow all come from the central theme.

import { theme } from '../theme'

const hud = theme.hud

export function Hud({ steps, charted, reached, hint }: { steps: number; charted: number; reached: boolean; hint: boolean }) {
  return (
    <>
      {/* top HUD bar — text shadowed so it stays readable over a bright daytime view */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 22px', pointerEvents: 'none', background: hud.scrim, textShadow: hud.shadow }}>
        <div style={{ lineHeight: 1.4 }}>
          <div style={{ fontSize: 13, letterSpacing: '0.38em', color: hud.title, fontWeight: 700 }}>LABYRINTH</div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: hud.dim }}>DAILY MAZE · 2026-06-02</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.28em', color: hud.secondary }}>FIND THE EXIT</div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: hud.dim }}>NO ONE HAS YET</div>
        </div>
        {/* dropped clear of the top-right Tweaks button */}
        <div style={{ textAlign: 'right', lineHeight: 1.5, marginTop: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: hud.secondary }}>{steps} STEPS · {charted}% CHARTED</div>
        </div>
      </div>

      {/* exit-reached banner */}
      {reached && (
        <div style={{ position: 'absolute', top: 74, left: '50%', transform: 'translateX(-50%)', padding: '7px 18px', background: theme.accent.successBg, border: `1px solid ${theme.accent.successBorder}`, color: theme.accent.success, fontSize: 12, letterSpacing: '0.22em', borderRadius: 3, textShadow: hud.shadow }}>
          EXIT REACHED · {steps} STEPS
        </div>
      )}

      {/* movement hint */}
      {hint && (
        <div style={{ position: 'absolute', bottom: 34, left: '50%', transform: 'translateX(-50%)', padding: '9px 18px', background: hud.pillBg, border: `1px solid ${hud.pillBorder}`, borderRadius: 4, fontSize: 12, letterSpacing: '0.16em', color: hud.pillText, pointerEvents: 'none' }}>
          ↑ ← ↓ → &nbsp;/&nbsp; W A S D &nbsp;—&nbsp; EXPLORE THE MAZE
        </div>
      )}
    </>
  );
}
