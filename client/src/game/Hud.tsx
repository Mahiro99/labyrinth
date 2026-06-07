// Hud.tsx — the top HUD bar, the exit-reached banner, and the movement hint.
// Purely presentational; reads throttled stats from useGame via props.

export function Hud({ steps, charted, reached, hint }: { steps: number; charted: number; reached: boolean; hint: boolean }) {
  return (
    <>
      {/* top HUD bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))' }}>
        <div style={{ lineHeight: 1.35 }}>
          <div style={{ fontSize: 13, letterSpacing: '0.38em', color: '#e7edf6', fontWeight: 600 }}>LABYRINTH</div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#6b7787' }}>DAILY MAZE · 2026-06-02</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.28em', color: '#6b7787' }}>FIND THE EXIT</div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#4f5a69' }}>NO ONE HAS YET</div>
        </div>
        <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#6b7787' }}>{steps} STEPS · {charted}% CHARTED</div>
        </div>
      </div>

      {/* exit-reached banner */}
      {reached && (
        <div style={{ position: 'absolute', top: 74, left: '50%', transform: 'translateX(-50%)', padding: '7px 18px', background: 'rgba(122,240,216,0.12)', border: '1px solid rgba(122,240,216,0.5)', color: '#9af2dc', fontSize: 12, letterSpacing: '0.22em', borderRadius: 3 }}>
          EXIT REACHED · {steps} STEPS
        </div>
      )}

      {/* movement hint */}
      {hint && (
        <div style={{ position: 'absolute', bottom: 34, left: '50%', transform: 'translateX(-50%)', padding: '9px 18px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, fontSize: 12, letterSpacing: '0.16em', color: '#9aa6b6', pointerEvents: 'none' }}>
          ↑ ← ↓ → &nbsp;/&nbsp; W A S D &nbsp;—&nbsp; EXPLORE THE MAZE
        </div>
      )}
    </>
  );
}
