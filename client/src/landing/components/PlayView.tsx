// PlayView.tsx — the PLAY view: the ESCAPE call-to-action over the corridor.
// ESCAPE itself is the button (an arrow replaces the old period; clicking it dives
// into the maze), so there's no separate ENTER — the title IS the action.
import { DAY_NO } from '../data';

export function PlayView({ onEnter, onArm, mobile = false }:
  { onEnter: () => void; onArm?: () => void; mobile?: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      fontFamily: "'IBM Plex Mono', monospace", animation: 'lab-fade 0.5s ease both', padding: '0 24px' }}>
      <div style={{ color: 'var(--ink-soft)', fontSize: 'clamp(10px, 2.6vw, 12px)', letterSpacing: '0.4em',
        marginBottom: 'clamp(16px, 3.5vw, 26px)', whiteSpace: 'nowrap' }}>
        NO. {DAY_NO}
      </div>
      <h1 style={{ margin: '0 0 clamp(30px, 6vw, 46px)' }}>
        <button className="lab-escape" onClick={() => onEnter()}
          onPointerEnter={() => onArm?.()} onPointerDown={() => onArm?.()}
          aria-label="Escape — enter the maze"
          style={{ fontSize: 'clamp(44px, 11vw, 96px)' }}>
          ESCAPE<span className="lab-escape-arrow" aria-hidden="true">→</span>
        </button>
      </h1>
      <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', flexWrap: 'wrap', justifyContent: 'center',
        alignItems: 'center', gap: mobile ? 6 : 'clamp(12px, 3vw, 22px)', marginTop: 'clamp(20px, 4vw, 30px)',
        fontSize: 'clamp(10.5px, 2.6vw, 11.5px)', letterSpacing: '0.18em' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-soft)',
          whiteSpace: 'nowrap' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--you)',
            boxShadow: '0 0 8px rgba(194,96,58,0.5)', animation: 'lab-breathe 2.4s ease-in-out infinite' }}></span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>1,238</span>&nbsp;IN THE DARK
        </span>
        {!mobile && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ink-faint)' }}></span>}
        <span style={{ color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}><span style={{ color: 'var(--ink)', fontWeight: 500 }}>4,067</span>&nbsp;ESCAPED</span>
      </div>
    </div>
  );
}
