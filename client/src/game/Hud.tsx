// Hud.tsx — the top HUD bar, the exit-reached banner, and the movement hint.
// Purely presentational; reads throttled stats from useGame via props. Colours,
// fonts, and the legibility shadow all come from the central theme. The left
// "‹ LABYRINTH" block doubles as the back-to-menu control so a touch player (no
// keyboard, no URL bar) is never trapped on the game screen. Control hints adapt
// to a coarse pointer (swipe copy instead of arrow/WASD keys).
//
// Legibility: every readout is light text + theme.hud.shadow, sitting on the top
// `scrim` gradient (or the pill capsule), so it reads on BOTH the bright daytime
// sky and the dark night view without needing to know which is on screen.

import { theme } from '../theme'
import { useMediaQuery } from '../lib/useMediaQuery'

const hud = theme.hud

export function Hud(
  { steps, charted, reached, facing, hint, touch, onExit }:
  { steps: number; charted: number; reached: boolean; facing: string; hint: boolean; touch: boolean; onExit: () => void },
) {
  // narrow phones: the three letter-spaced columns collide, so shed the center
  // flavor text and the date line, leaving just back (left) + score (right).
  const compact = useMediaQuery('(max-width: 560px)');
  // in dev the Audio/Tweaks FABs live in the top-right corner; nudge the stats
  // down just enough to clear them (used to be a heavy 40px that detached the row).
  const devNudge = import.meta.env.DEV ? 30 : 0;

  return (
    <>
      {/* top HUD bar — light text on the scrim gradient so it stays readable over a
          bright daytime sky as well as a dark night view */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12,
        padding: 'calc(15px + env(safe-area-inset-top)) calc(clamp(16px, 4vw, 26px) + env(safe-area-inset-right)) 22px calc(clamp(16px, 4vw, 26px) + env(safe-area-inset-left))',
        pointerEvents: 'none', background: hud.scrim, textShadow: hud.shadow }}>

        {/* LEFT — title doubles as the back-to-menu control */}
        <button onClick={onExit} title="Back to menu"
          style={{ pointerEvents: 'auto', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
            textAlign: 'left', lineHeight: 1.45, font: 'inherit', color: 'inherit', textShadow: 'inherit', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'clamp(12px, 3vw, 14px)',
            letterSpacing: compact ? '0.2em' : '0.34em', color: hud.title, fontWeight: 700 }}>
            <span style={{ fontSize: '1.3em', fontWeight: 400, letterSpacing: 0, opacity: 0.85 }}>‹</span>LABYRINTH
          </div>
          {!compact && <div style={{ fontSize: 11, letterSpacing: '0.2em', color: hud.dim, marginTop: 2 }}>DAILY MAZE · 2026-06-02</div>}
        </button>

        {/* CENTER — flavor only; first to go on narrow screens */}
        {!compact && (
          <div style={{ textAlign: 'center', flexShrink: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.3em', color: hud.secondary }}>FIND THE EXIT</div>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', color: hud.faint, marginTop: 3 }}>NO ONE HAS YET</div>
          </div>
        )}

        {/* RIGHT — the live stats, promoted: big number, small label, so the eye
            catches the count rather than a flat letter-spaced run */}
        <div style={{ display: 'flex', gap: 'clamp(14px, 4vw, 22px)', flexShrink: 0, marginTop: devNudge }}>
          <Stat value={steps} label="STEPS" />
          <Stat value={`${charted}%`} label="CHARTED" />
        </div>
      </div>

      {/* exit-reached banner */}
      {reached && (
        <div style={{ position: 'absolute', top: 'calc(78px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)',
          padding: '8px 20px', background: theme.accent.successBg, border: `1px solid ${theme.accent.successBorder}`,
          color: theme.accent.success, fontSize: 12, letterSpacing: '0.22em', borderRadius: 999, textShadow: hud.shadow,
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          EXIT REACHED · {steps} STEPS
        </div>
      )}

      {/* movement hint — one capsule that owns BOTH the live facing readout and the
          control legend (the on-canvas compass that used to duplicate this is gone) */}
      {hint && (
        <div style={{ position: 'absolute', bottom: 'calc(30px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)',
          maxWidth: 'calc(100vw - 32px)',
          display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2.4vw, 14px)',
          padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3.6vw, 20px)',
          background: hud.pillBg, border: `1px solid ${hud.pillBorder}`, borderRadius: 999,
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          fontSize: 'clamp(10.5px, 2.7vw, 12px)', letterSpacing: '0.14em', color: hud.pillText,
          textShadow: hud.shadow, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {/* live facing — warm accent so it reads as the "you" indicator, distinct from the controls */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: hud.pillAccent, fontWeight: 600 }}>
            <span aria-hidden="true" style={{ fontSize: '0.85em' }}>▲</span>{facing}
          </span>
          <span aria-hidden="true" style={{ width: 1, height: 13, background: hud.pillBorder }} />
          <span>
            {touch
              ? <>SWIPE TO MOVE&nbsp;·&nbsp;←&nbsp;→&nbsp;TO TURN</>
              : <>↑ ← ↓ →&nbsp;/&nbsp;W A S D&nbsp;·&nbsp;MOVE</>}
          </span>
        </div>
      )}
    </>
  );
}

// one stat cell: a prominent value over a quiet label. Right-aligned so the
// numbers line up tidily against the screen edge in the top-right cluster.
function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
      <div style={{ fontSize: 'clamp(15px, 4vw, 19px)', fontWeight: 600, color: hud.title, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 9.5, letterSpacing: '0.2em', color: hud.dim, marginTop: 3 }}>{label}</div>
    </div>
  );
}
