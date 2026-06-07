// PlayView.tsx — the PLAY view: copy & the ENTER button over the corridor.
import { useState } from 'react';
import { DAY_NO } from '../data';
import { useMediaQuery } from '../../lib/useMediaQuery';

export function PlayView({ onEnter, mobile = false }: { onEnter: () => void; mobile?: boolean }) {
  const [hover, setHover] = useState(false);
  // no hover on touch, so give ENTER a visible filled-ish state by default there
  const coarse = useMediaQuery('(pointer: coarse)');
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      fontFamily: "'IBM Plex Mono', monospace", animation: 'lab-fade 0.5s ease both', padding: '0 24px' }}>
      <div style={{ color: 'var(--ink-soft)', fontSize: 12, letterSpacing: '0.4em', marginBottom: mobile ? 18 : 26,
        whiteSpace: 'nowrap' }}>
        NO. {DAY_NO}
      </div>
      <h1 style={{ margin: mobile ? '0 0 34px' : '0 0 46px', color: 'var(--ink)', fontFamily: "'Fraunces', serif", fontWeight: 400,
        fontSize: 'clamp(48px, 9vw, 96px)', letterSpacing: '0.03em', lineHeight: 1, whiteSpace: 'nowrap',
        textShadow: '0 2px 38px rgba(6,8,6,0.9), 0 1px 4px rgba(6,8,6,0.5)' }}>ESCAPE.</h1>
      <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onClick={() => onEnter()}
        style={{ cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, letterSpacing: '0.3em',
          padding: '18px 54px', color: hover ? '#1c2016' : 'var(--ink)',
          background: hover ? 'var(--accent)' : (coarse ? 'rgba(158,196,105,0.14)' : 'rgba(18,22,17,0.46)'),
          border: '1px solid var(--accent)', borderRadius: 2, transition: 'all 0.25s ease',
          display: 'inline-flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(2px)' }}>
        ENTER <span>→</span>
      </button>
      <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', flexWrap: 'wrap', justifyContent: 'center',
        alignItems: 'center', gap: mobile ? 6 : 22, marginTop: mobile ? 22 : 30,
        fontSize: 11.5, letterSpacing: '0.18em' }}>
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
